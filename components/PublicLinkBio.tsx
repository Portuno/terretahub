import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LinkBioProfile } from '../types';
import { ProfileRenderer } from './ProfileEditor';

export const PublicLinkBio: React.FC = () => {
  const { username, extension } = useParams<{ username: string; extension?: string }>();
  const [profile, setProfile] = useState<LinkBioProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!username) {
        setError('Username no proporcionado');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        let linkBioProfile = null;
        let linkBioError = null;

        // Si hay extensión, buscar por custom_slug y username
        if (extension) {
          const result = await supabase
            .from('link_bio_profiles')
            .select('*')
            .eq('custom_slug', extension.toLowerCase())
            .eq('username', username.toLowerCase())
            .eq('is_published', true)
            .maybeSingle();
          
          linkBioProfile = result.data;
          linkBioError = result.error;
        } else {
          // Si no hay extensión, buscar por username (perfil publicado, puede tener o no custom_slug)
          const result = await supabase
            .from('link_bio_profiles')
            .select('*')
            .eq('username', username.toLowerCase())
            .eq('is_published', true)
            .maybeSingle();
          
          linkBioProfile = result.data;
          linkBioError = result.error;
        }

        if (linkBioError && linkBioError.code !== 'PGRST116') {
          // Error diferente a "no encontrado"
          console.error('Error al buscar perfil:', linkBioError);
          setError('Error al cargar el perfil');
          setLoading(false);
          return;
        }

        if (!linkBioProfile) {
          // No se encontró perfil publicado, intentar obtener perfil básico
          const { data: basicProfile, error: basicError } = await supabase
            .from('profiles')
            .select('*')
            .eq('username', username.toLowerCase())
            .single();

          if (basicError || !basicProfile) {
            setError('Perfil no encontrado o no está publicado');
            setLoading(false);
            return;
          }

          // Si hay extensión pero no se encontró perfil, el perfil no está publicado con esa extensión
          if (extension) {
            setError('Perfil no encontrado con esa extensión');
            setLoading(false);
            return;
          }

          // Si no hay extensión y no hay perfil publicado, mostrar mensaje
          setError('Este perfil aún no está publicado');
          setLoading(false);
          return;
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
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username]);

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

