import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LinkBioProfile } from '../types';
import { ProfileRenderer } from './ProfileEditor';

export const PublicLinkBio: React.FC = () => {
  const { extension } = useParams<{ extension: string }>();
  const [profile, setProfile] = useState<LinkBioProfile | null>(null);
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

        console.log('[PublicLinkBio] Supabase client available, executing query...');
        const queryStartTime = Date.now();
        
        // Query DIRECTA sin Promise.race ni test de conectividad
        const { data, error: queryError } = await supabase
          .from('link_bio_profiles')
          .select('username, display_name, bio, avatar, socials, blocks, theme, updated_at, is_published')
          .eq('custom_slug', customSlugLower)
          .eq('is_published', true)
          .maybeSingle();
        
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
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-10 text-center">
        <h2 className="text-2xl font-serif text-terreta-dark mb-2">Perfil no encontrado</h2>
        <p className="text-gray-500 mb-4">{error || 'El perfil que buscas no existe o ha sido eliminado.'}</p>
        <a 
          href="/" 
          className="text-[#D97706] hover:underline font-bold"
        >
          Volver al inicio
        </a>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50 overflow-y-auto">
      <div className="max-w-md mx-auto min-h-screen shadow-2xl overflow-hidden bg-white">
        <ProfileRenderer profile={profile} />
      </div>
    </div>
  );
};
