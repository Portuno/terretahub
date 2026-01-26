import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { AuthUser, LinkBioProfile } from '../types';
import { ProfileRenderer } from './ProfileEditor';
import { NotFound404 } from './NotFound404';
import { trackProfileView } from '../lib/analytics';
import { useDynamicMetaTags } from '../hooks/useDynamicMetaTags';

interface PublicLinkBioProps {
  user: AuthUser | null;
  onOpenAuth: (referrerUsername?: string) => void;
}

export const PublicLinkBio: React.FC<PublicLinkBioProps> = ({ user, onOpenAuth }) => {
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
        
        // Función helper para ejecutar query con retry
        const executeQueryWithRetry = async (
          queryFn: () => Promise<{ data: any; error: any }>,
          queryName: string,
          retryCount = 0
        ): Promise<{ data: any; error: any }> => {
          const MAX_RETRIES = 2;
          const TIMEOUT = 10000; // 10 segundos por intento
          
          try {
            const queryStart = Date.now();
            console.log(`[PublicLinkBio] ${queryName} attempt ${retryCount + 1}/${MAX_RETRIES + 1}`);
            
            const queryPromise = queryFn();
            const timeoutPromise = new Promise<never>((_, reject) => {
              setTimeout(() => {
                reject(new Error(`Query timeout: ${queryName} after ${TIMEOUT}ms`));
              }, TIMEOUT);
            });
            
            const result = await Promise.race([queryPromise, timeoutPromise]) as { data: any; error: any };
            const queryDuration = Date.now() - queryStart;
            
            console.log(`[PublicLinkBio] ${queryName} completed`, {
              duration: `${queryDuration}ms`,
              hasData: !!result.data,
              hasError: !!result.error,
              retryCount
            });
            
            // Si hay error y es retryable, intentar de nuevo
            if (result.error && retryCount < MAX_RETRIES) {
              const isRetryable = !['PGRST116', '23505', '42501'].includes(result.error.code || '');
              if (isRetryable && !result.error.message?.includes('timeout')) {
                console.log(`[PublicLinkBio] Retrying ${queryName}...`);
                await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
                return executeQueryWithRetry(queryFn, queryName, retryCount + 1);
              }
            }
            
            return result;
          } catch (err: any) {
            if (err.message?.includes('timeout') && retryCount < MAX_RETRIES) {
              console.log(`[PublicLinkBio] Timeout on ${queryName}, retrying...`);
              await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
              return executeQueryWithRetry(queryFn, queryName, retryCount + 1);
            }
            throw err;
          }
        };
        
        // Primero intentar buscar por custom_slug, luego por username
        let data = null;
        let queryError = null;

        try {
          // Optimized: Try custom_slug first (uses unique index), then username as fallback
          // This is faster than OR queries because each query can use its optimal index
          console.log('[PublicLinkBio] Querying by custom_slug first:', customSlugLower);
          
          // First try custom_slug (most selective, has unique index)
          let result = await executeQueryWithRetry(
            () => supabase
              .from('link_bio_profiles')
              .select('user_id, username, display_name, bio, avatar, socials, blocks, theme, updated_at, is_published')
              .eq('custom_slug', customSlugLower)
              .eq('is_published', true)
              .maybeSingle(),
            'link_bio_profile query (custom_slug)'
          );
          
          // If not found by custom_slug, try username
          if (!result.data && !result.error) {
            console.log('[PublicLinkBio] Not found by custom_slug, trying username:', customSlugLower);
            result = await executeQueryWithRetry(
              () => supabase
                .from('link_bio_profiles')
                .select('user_id, username, display_name, bio, avatar, socials, blocks, theme, updated_at, is_published')
                .eq('username', customSlugLower)
                .eq('is_published', true)
                .maybeSingle(),
              'link_bio_profile query (username)'
            );
          }
          
          if (result.data) {
            data = result.data;
            console.log('[PublicLinkBio] Profile found');
            
            // Fetch CV URL (optimized: only fetch cv_url column)
            // Done separately to keep main query simple and fast
            try {
              const { data: userProfile } = await supabase
                .from('profiles')
                .select('cv_url')
                .eq('id', data.user_id)
                .maybeSingle();
              
              if (userProfile?.cv_url) {
                (data as any).cv_url = userProfile.cv_url;
              }
            } catch (cvError) {
              console.warn('[PublicLinkBio] Error fetching CV URL (non-critical):', cvError);
              // Don't fail the whole query if CV URL fetch fails
            }
          } else {
            queryError = result.error;
          }
        } catch (queryErr: any) {
          console.error('[PublicLinkBio] Query error caught:', queryErr);
          queryError = queryErr;
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
            console.error('[PublicLinkBio] Query timeout error after all retries');
            // Después de todos los reintentos, mostrar mensaje más útil
            setError('El perfil está tardando en cargar. Por favor, intenta recargar la página o verifica tu conexión.');
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
          cvUrl: (data as any).cv_url, // Add CV URL
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
        setProfileUserId(data.user_id);
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

  // Función helper para obtener URL pública del avatar (no base64)
  const getPublicAvatarUrl = (avatar: string | null | undefined, userId: string | null): string => {
    if (!avatar) {
      return `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId || 'user'}`;
    }

    // Si es base64, no es útil para Open Graph (los bots no pueden acceder)
    if (avatar.startsWith('data:image')) {
      // Intentar obtener de Storage si tenemos userId
      if (userId) {
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(`${userId}/avatar.jpg`);
        return publicUrl;
      }
      // Si no hay userId, usar default
      return `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId || 'user'}`;
    }

    // Si es una URL válida, usarla directamente
    if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
      return avatar;
    }

    // Si es una ruta relativa o algo inesperado, intentar Storage
    if (userId) {
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(`${userId}/avatar.jpg`);
      return publicUrl;
    }

    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId || 'user'}`;
  };

  // Actualizar meta tags dinámicamente cuando el perfil se carga
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const avatarUrl = profile ? getPublicAvatarUrl(profile.avatar, profileUserId) : '';
  const profileTitle = profile 
    ? `${profile.displayName || profile.username} | Terreta Hub`
    : 'Terreta Hub';
  const profileDescription = profile?.bio 
    ? profile.bio.substring(0, 160) // Limitar a 160 caracteres para meta description
    : `Perfil de ${profile?.displayName || profile?.username || 'usuario'} en Terreta Hub`;

  useDynamicMetaTags({
    title: profile ? profileTitle : undefined,
    description: profile ? profileDescription : undefined,
    image: profile && avatarUrl ? avatarUrl : undefined,
    url: currentUrl || undefined
  });

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
      <div className="fixed top-6 left-6 z-20 hidden md:block">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2.5 bg-white/90 backdrop-blur-sm px-4 py-2.5 rounded-lg hover:bg-white transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 group"
        >
          <img 
            src="/logo.png" 
            alt="Terreta Hub" 
            className="w-7 h-7 object-contain group-hover:scale-105 transition-transform"
          />
          <span className="font-sans text-lg text-terreta-dark font-bold tracking-tight group-hover:text-[#D97706] transition-colors">
            Terreta Hub
          </span>
        </button>
      </div>

      <div className="max-w-md mx-auto min-h-screen overflow-hidden flex flex-col">
        <div className="flex-1">
          <ProfileRenderer
            profile={profile}
            profileUserId={profileUserId || undefined}
            viewerUserId={user?.id}
            onOpenAuth={onOpenAuth}
          />
        </div>
        
        {/* Footer */}
        <div className="pb-6 pt-4 text-center">
          <p className="text-xs opacity-70" style={{ color: profile.theme.textColor }}>
            Perfil de miembro de{' '}
            <button
              onClick={() => navigate('/')}
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
