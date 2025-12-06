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
    const fetchProfile = async () => {
      if (!extension) {
        setError('Extensión no proporcionada');
        setLoading(false);
        return;
      }

      // Evitar múltiples cargas simultáneas
      if (isLoadingRef.current) {
        return;
      }

      // Si es la misma extensión que ya cargamos, no recargar a menos que sea un refresh
      // (cuando el componente se monta de nuevo, lastExtensionRef será null, así que cargará)
      if (lastExtensionRef.current === extension && lastExtensionRef.current !== null) {
        return;
      }

      lastExtensionRef.current = extension;
      isLoadingRef.current = true;

      try {
        setLoading(true);
        setError(null);

        // Buscar perfil por custom_slug (extensión)
        // Incluir updated_at para detectar cambios y forzar recarga si es necesario
        const { data: linkBioProfile, error: linkBioError } = await supabase
          .from('link_bio_profiles')
          .select('*, updated_at')
          .eq('custom_slug', extension.toLowerCase())
          .eq('is_published', true)
          .maybeSingle();

        if (linkBioError && linkBioError.code !== 'PGRST116') {
          // Error diferente a "no encontrado"
          console.error('Error al buscar perfil:', linkBioError);
          setError('Error al cargar el perfil');
          setLoading(false);
          isLoadingRef.current = false;
          return;
        }

        if (!linkBioProfile) {
          setError('Perfil no encontrado o no está publicado');
          setLoading(false);
          isLoadingRef.current = false;
          return;
        }

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

        setProfile(formattedProfile);
      } catch (err: any) {
        setError(err.message || 'Error al cargar el perfil');
        setLoading(false);
      } finally {
        setLoading(false);
        isLoadingRef.current = false;
      }
    };

    fetchProfile();
  }, [extension]); // Solo ejecutar cuando cambie la extensión

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D97706] mb-4"></div>
        <p className="text-gray-500">Cargando perfil...</p>
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

