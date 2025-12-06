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
  const lastUpdatedAtRef = useRef<string | null>(null);

  useEffect(() => {
    console.log('[PublicLinkBio] useEffect triggered', { extension, lastExtension: lastExtensionRef.current, isLoading: isLoadingRef.current });
    
    const fetchProfile = async () => {
      console.log('[PublicLinkBio] fetchProfile started', { extension });
      
      if (!extension) {
        console.error('[PublicLinkBio] No extension provided');
        setError('Extensión no proporcionada');
        setLoading(false);
        return;
      }

      // Evitar múltiples cargas simultáneas
      if (isLoadingRef.current) {
        console.warn('[PublicLinkBio] Already loading, skipping');
        return;
      }

      // Resetear refs al cambiar de extensión
      if (lastExtensionRef.current !== extension) {
        console.log('[PublicLinkBio] Extension changed, resetting refs', { 
          old: lastExtensionRef.current, 
          new: extension 
        });
        lastExtensionRef.current = null;
        lastUpdatedAtRef.current = null;
      }

      // Si es la misma extensión que ya cargamos, no recargar
      if (lastExtensionRef.current === extension && lastExtensionRef.current !== null) {
        console.log('[PublicLinkBio] Same extension, skipping reload');
        return;
      }

      lastExtensionRef.current = extension;
      isLoadingRef.current = true;

      // Timeout de seguridad (10 segundos)
      const timeoutId = setTimeout(() => {
        if (isLoadingRef.current) {
          console.error('[PublicLinkBio] Timeout: Loading took too long');
          setError('Tiempo de espera agotado. Por favor, recarga la página.');
          setLoading(false);
          isLoadingRef.current = false;
        }
      }, 10000);

      try {
        console.log('[PublicLinkBio] Setting loading to true');
        setLoading(true);
        setError(null);

        console.log('[PublicLinkBio] Querying Supabase', { 
          custom_slug: extension.toLowerCase(),
          timestamp: Date.now()
        });

        // Buscar perfil por custom_slug (extensión)
        const { data: linkBioProfile, error: linkBioError } = await supabase
          .from('link_bio_profiles')
          .select('*, updated_at')
          .eq('custom_slug', extension.toLowerCase())
          .eq('is_published', true)
          .maybeSingle();

        clearTimeout(timeoutId);

        console.log('[PublicLinkBio] Supabase response', { 
          hasData: !!linkBioProfile, 
          error: linkBioError,
          errorCode: linkBioError?.code 
        });

        if (linkBioError && linkBioError.code !== 'PGRST116') {
          // Error diferente a "no encontrado"
          console.error('[PublicLinkBio] Error al buscar perfil:', linkBioError);
          setError('Error al cargar el perfil: ' + (linkBioError.message || 'Error desconocido'));
          setLoading(false);
          isLoadingRef.current = false;
          return;
        }

        if (!linkBioProfile) {
          console.warn('[PublicLinkBio] Profile not found or not published');
          setError('Perfil no encontrado o no está publicado');
          setLoading(false);
          isLoadingRef.current = false;
          return;
        }

        console.log('[PublicLinkBio] Profile found', { 
          username: linkBioProfile.username,
          displayName: linkBioProfile.display_name,
          updatedAt: linkBioProfile.updated_at
        });

        // Guardar el updated_at para futuras comparaciones
        if (linkBioProfile.updated_at) {
          lastUpdatedAtRef.current = linkBioProfile.updated_at;
        }

        // Si encontramos el perfil de link-in-bio, convertir al formato esperado
        const formattedProfile: LinkBioProfile = {
          username: linkBioProfile.username,
          displayName: linkBioProfile.display_name,
          bio: linkBioProfile.bio || '',
          avatar: linkBioProfile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${linkBioProfile.username}`,
          socials: (linkBioProfile.socials as any) || {},
          blocks: (linkBioProfile.blocks as any) || [],
          theme: (linkBioProfile.theme as any) || {
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
        console.log('[PublicLinkBio] Profile set successfully');
      } catch (err: any) {
        clearTimeout(timeoutId);
        console.error('[PublicLinkBio] Exception caught:', err);
        setError(err.message || 'Error al cargar el perfil');
        setLoading(false);
        isLoadingRef.current = false;
      } finally {
        console.log('[PublicLinkBio] Finally block - setting loading to false');
        setLoading(false);
        isLoadingRef.current = false;
      }
    };

    fetchProfile();

    // Cleanup: resetear refs al desmontar o cambiar extensión
    return () => {
      console.log('[PublicLinkBio] Cleanup: resetting refs');
      isLoadingRef.current = false;
    };
  }, [extension]); // Solo ejecutar cuando cambie la extensión

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D97706] mb-4"></div>
        <p className="text-gray-500">Cargando perfil...</p>
        <p className="text-xs text-gray-400 mt-2">Extensión: {extension}</p>
        <button
          onClick={() => {
            console.log('[PublicLinkBio] Manual reset triggered by user');
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

