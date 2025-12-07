import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LinkBioProfile } from '../types';
import { ProfileRenderer } from './ProfileEditor';
import { NotFound404 } from './NotFound404';
import { trackProfileView } from '../lib/analytics';

export const PublicLinkBio: React.FC = () => {
  const { extension } = useParams<{ extension: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<LinkBioProfile | null>(null);
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastExtensionRef = useRef<string | null>(null);
  const isLoadingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    console.log('[PublicLinkBio] useEffect triggered', { 
      extension, 
      lastExtension: lastExtensionRef.current,
      isLoading: isLoadingRef.current 
    });
    
    const fetchProfile = async () => {
      console.log('[PublicLinkBio] fetchProfile started', { extension });
      
      if (!extension) {
        console.error('[PublicLinkBio] No extension provided');
        setError('Extensión no proporcionada');
        setLoading(false);
        return;
      }

      // Prevenir múltiples cargas simultáneas
      if (isLoadingRef.current && lastExtensionRef.current === extension) {
        console.warn('[PublicLinkBio] Already loading this extension, skipping');
        return;
      }

      // Resetear si cambió la extensión
      if (lastExtensionRef.current !== extension) {
        console.log('[PublicLinkBio] Extension changed, resetting', { 
          old: lastExtensionRef.current, 
          new: extension 
        });
        lastExtensionRef.current = null;
        setProfile(null);
        setError(null);
      }

      lastExtensionRef.current = extension;
      isLoadingRef.current = true;
      setLoading(true);
      setError(null);

      // Limpiar timeout anterior si existe
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // Timeout de seguridad (15 segundos)
      timeoutRef.current = setTimeout(() => {
        if (isLoadingRef.current) {
          console.error('[PublicLinkBio] Timeout: Loading took more than 15 seconds');
          console.error('[PublicLinkBio] This suggests a network or Supabase connection issue');
          setError('Tiempo de espera agotado. Por favor, recarga la página.');
          setLoading(false);
          isLoadingRef.current = false;
        }
      }, 15000);

      try {
        const customSlugLower = extension.toLowerCase();
        console.log('[PublicLinkBio] Querying Supabase', { 
          extension: customSlugLower,
          timestamp: new Date().toISOString()
        });
        
        // Verificar cliente de Supabase
        if (!supabase) {
          throw new Error('Cliente de Supabase no disponible');
        }

        // Verificar que las variables de entorno estén configuradas
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
          console.error('[PublicLinkBio] Supabase configuration missing', {
            hasUrl: !!supabaseUrl,
            hasKey: !!supabaseKey
          });
          throw new Error('Configuración de Supabase incompleta. Verifica las variables de entorno.');
        }

        console.log('[PublicLinkBio] Supabase client available, executing query...', {
          urlConfigured: !!supabaseUrl,
          keyConfigured: !!supabaseKey
        });
        const queryStartTime = Date.now();
        
        // Crear AbortController para timeout de consultas individuales
        const abortController = new AbortController();
        const queryTimeout = setTimeout(() => {
          console.warn('[PublicLinkBio] Individual query timeout (5s), aborting...');
          abortController.abort();
        }, 5000);
        
        // Primero intentar buscar por custom_slug, luego por username
        let data = null;
        let queryError = null;

        try {
          // Intentar buscar por custom_slug primero
          console.log('[PublicLinkBio] Querying by custom_slug:', customSlugLower);
          const slugQueryStart = Date.now();
          
          const slugQuery = supabase
            .from('link_bio_profiles')
            .select('user_id, username, display_name, bio, avatar, socials, blocks, theme, updated_at, is_published')
            .eq('custom_slug', customSlugLower)
            .eq('is_published', true)
            .maybeSingle();
          
          // Agregar timeout a la promesa
          const slugQueryWithTimeout = Promise.race([
            slugQuery,
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Query timeout: custom_slug')), 5000)
            )
          ]) as Promise<{ data: any; error: any }>;
          
          const { data: slugData, error: slugError } = await slugQueryWithTimeout;
          const slugQueryDuration = Date.now() - slugQueryStart;
          console.log('[PublicLinkBio] Slug query completed', {
            duration: `${slugQueryDuration}ms`,
            hasData: !!slugData,
            hasError: !!slugError
          });

          if (slugData) {
            data = slugData;
            clearTimeout(queryTimeout);
          } else if (!slugError || slugError.code === 'PGRST116') {
            // Si no se encuentra por custom_slug, buscar por username
            console.log('[PublicLinkBio] Not found by slug, querying by username:', customSlugLower);
            const usernameQueryStart = Date.now();
            
            const usernameQuery = supabase
              .from('link_bio_profiles')
              .select('user_id, username, display_name, bio, avatar, socials, blocks, theme, updated_at, is_published')
              .eq('username', customSlugLower)
              .eq('is_published', true)
              .maybeSingle();
            
            // Agregar timeout a la promesa
            const usernameQueryWithTimeout = Promise.race([
              usernameQuery,
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Query timeout: username')), 5000)
              )
            ]) as Promise<{ data: any; error: any }>;
            
            const { data: usernameData, error: usernameError } = await usernameQueryWithTimeout;
            const usernameQueryDuration = Date.now() - usernameQueryStart;
            console.log('[PublicLinkBio] Username query completed', {
              duration: `${usernameQueryDuration}ms`,
              hasData: !!usernameData,
              hasError: !!usernameError
            });

            if (usernameData) {
              data = usernameData;
            } else {
              queryError = usernameError || slugError;
            }
            clearTimeout(queryTimeout);
          } else {
            queryError = slugError;
            clearTimeout(queryTimeout);
          }
        } catch (queryErr: any) {
          console.error('[PublicLinkBio] Query error caught:', queryErr);
          queryError = queryErr;
          clearTimeout(queryTimeout);
        }
        
        const queryDuration = Date.now() - queryStartTime;
        console.log('[PublicLinkBio] Query completed', {
          duration: `${queryDuration}ms`,
          hasData: !!data,
          hasError: !!queryError,
          errorCode: queryError?.code,
          errorMessage: queryError?.message,
          timestamp: new Date().toISOString()
        });

        // Limpiar timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }

        if (queryError) {
          console.error('[PublicLinkBio] Supabase error:', queryError);
          
          // PGRST116 = "no rows returned" - esto es normal si no existe
          if (queryError.code === 'PGRST116') {
            console.warn('[PublicLinkBio] Profile not found');
            setError('Perfil no encontrado o no está publicado');
          } else if (queryError.message?.includes('timeout') || queryError.message?.includes('Query timeout')) {
            console.error('[PublicLinkBio] Query timeout error');
            setError('La consulta tardó demasiado. Por favor, verifica tu conexión e intenta de nuevo.');
          } else {
            console.error('[PublicLinkBio] Unexpected error:', queryError);
            setError('Error al cargar el perfil: ' + (queryError.message || 'Error desconocido'));
          }
          setLoading(false);
          isLoadingRef.current = false;
          return;
        }

        if (!data) {
          console.warn('[PublicLinkBio] No profile data returned');
          setError('Perfil no encontrado o no está publicado');
          setLoading(false);
          isLoadingRef.current = false;
          return;
        }

        console.log('[PublicLinkBio] Profile found', { 
          username: data.username,
          displayName: data.display_name,
          updatedAt: data.updated_at,
          isPublished: data.is_published
        });

        // Convertir al formato esperado
        const formattedProfile: LinkBioProfile = {
          username: data.username,
          displayName: data.display_name,
          bio: data.bio || '',
          avatar: data.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.username}`,
          socials: (data.socials as any) || {},
          blocks: (data.blocks as any) || [],
          theme: (data.theme as any) || {
            id: 'terreta',
            name: 'Terreta Original',
            bgType: 'color',
            bgColor: '#F9F6F0',
            textColor: '#3E2723',
            buttonStyle: 'solid',
            buttonColor: '#3E2723',
            buttonTextColor: '#FFFFFF',
            font: 'serif'
          }
        };

        console.log('[PublicLinkBio] Setting profile', { 
          blocksCount: formattedProfile.blocks.length,
          hasTheme: !!formattedProfile.theme
        });
        
        setProfile(formattedProfile);
        setLoading(false);
        isLoadingRef.current = false;
        
        // Registrar vista de perfil
        if (data.user_id) {
          trackProfileView(data.user_id).catch(err => {
            console.warn('[PublicLinkBio] Failed to track profile view:', err);
          });
        }
        
        console.log('[PublicLinkBio] Profile loaded successfully');
      } catch (err: any) {
        console.error('[PublicLinkBio] Exception caught:', err);
        console.error('[PublicLinkBio] Error details:', {
          name: err.name,
          message: err.message,
          stack: err.stack,
          timestamp: new Date().toISOString()
        });
        
        // Limpiar timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        
        setError(err.message || 'Error al cargar el perfil');
        setLoading(false);
        isLoadingRef.current = false;
      }
    };

    fetchProfile();

    // Cleanup
    return () => {
      console.log('[PublicLinkBio] Cleanup');
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      isLoadingRef.current = false;
    };
  }, [extension]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D97706] mb-4"></div>
        <p className="text-gray-500">Cargando perfil...</p>
        <p className="text-xs text-gray-400 mt-2">Extensión: {extension}</p>
        <button
          onClick={() => {
            console.log('[PublicLinkBio] Manual reset triggered by user');
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
            }
            isLoadingRef.current = false;
            lastExtensionRef.current = null;
            setLoading(false);
            setError('Recarga cancelada. Por favor, recarga la página.');
          }}
          className="mt-4 text-sm text-[#D97706] hover:underline"
        >
          Cancelar carga
        </button>
      </div>
    );
  }

  if (error || !profile) {
    return <NotFound404 variant="profile" profileName={extension || undefined} />;
  }

  return (
    <div 
      className="w-full min-h-screen overflow-y-auto relative"
      style={{ 
        background: profile.theme.bgType === 'gradient' ? profile.theme.bgColor : undefined,
        backgroundColor: profile.theme.bgType === 'color' ? profile.theme.bgColor : undefined,
      }}
    >
      {/* Logo Button - Arriba a la izquierda */}
      <div className="fixed top-6 left-6 z-20">
        <button
          onClick={() => navigate('/app')}
          className="flex items-center gap-2.5 bg-white/90 backdrop-blur-sm px-4 py-2.5 rounded-lg hover:bg-white transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 group"
        >
          <div className="w-7 h-7 rounded-full bg-[#D97706] flex items-center justify-center text-white font-serif font-bold text-base group-hover:scale-105 transition-transform">
            T
          </div>
          <span className="font-serif text-lg text-terreta-dark font-bold tracking-tight group-hover:text-[#D97706] transition-colors">
            Terreta Hub
          </span>
        </button>
      </div>

      <div className="max-w-md mx-auto min-h-screen overflow-hidden flex flex-col">
        <div className="flex-1">
          <ProfileRenderer profile={profile} profileUserId={profileUserId || undefined} />
        </div>
        
        {/* Footer */}
        <div className="pb-6 pt-4 text-center">
          <p className="text-xs opacity-70" style={{ color: profile.theme.textColor }}>
            Perfil de miembro de{' '}
            <button
              onClick={() => navigate('/app')}
              className="font-bold hover:underline transition-opacity hover:opacity-100"
              style={{ color: profile.theme.textColor }}
            >
              Terreta Hub
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
