import React, { useState, useEffect } from 'react';
import { LinkBioProfile } from '../types';
import { ProfileRenderer, THEMES } from './ProfileEditor';
import { supabase } from '../lib/supabase';

interface PublicProfileProps {
  handle: string;
}

export const PublicProfile: React.FC<PublicProfileProps> = ({ handle }) => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<LinkBioProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Limpiar el handle (quitar @ si existe)
  const cleanHandle = handle.replace('@', '').trim();

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        // Primero intentar buscar por custom_slug en link_bio_profiles
        let profileData = null;
        let username = cleanHandle;
        let userProfile = null;

        const { data: linkBioBySlug } = await supabase
          .from('link_bio_profiles')
          .select('*')
          .eq('custom_slug', cleanHandle)
          .eq('is_published', true)
          .maybeSingle();

        if (linkBioBySlug) {
          // Si encontramos por custom_slug, obtener el perfil del usuario
          profileData = linkBioBySlug;
          const { data: profileFromDb } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', linkBioBySlug.user_id)
            .single();
          
          if (profileFromDb) {
            username = profileFromDb.username;
          }
        } else {
          // Si no, buscar por username en profiles
          const { data: profileFromDb } = await supabase
            .from('profiles')
            .select('*')
            .eq('username', cleanHandle)
            .single();

          if (!profileFromDb) {
            setError('Usuario no encontrado');
            setLoading(false);
            return;
          }

          userProfile = profileFromDb;
          username = profileFromDb.username;

          // Intentar obtener link_bio_profile del usuario
          const { data: linkBioByUsername } = await supabase
            .from('link_bio_profiles')
            .select('*')
            .eq('user_id', profileFromDb.id)
            .eq('username', username)
            .eq('is_published', true)
            .maybeSingle();

          if (linkBioByUsername) {
            profileData = linkBioByUsername;
          } else {
            // Si no tiene link_bio_profile, generar uno básico desde el perfil
            // Obtener tags desde proyectos
            const { data: projects } = await supabase
              .from('projects')
              .select('categories, technologies')
              .eq('author_id', userProfile.id);

            const tagsSet = new Set<string>();
            if (projects) {
              projects.forEach((project) => {
                if (project.categories) {
                  project.categories.forEach((tag: string) => tagsSet.add(tag));
                }
                if (project.technologies) {
                  project.technologies.forEach((tag: string) => tagsSet.add(tag));
                }
              });
            }
            const tags = Array.from(tagsSet).slice(0, 5);

            // Generar perfil básico
            const theme = THEMES[0]; // Tema por defecto
            const bio = tags.length > 0 
              ? `Experto en ${tags.join(', ')}. Conectando ideas en Terreta Hub.`
              : 'Miembro de Terreta Hub. Conectando ideas y proyectos.';

            setProfile({
              username: username,
              displayName: userProfile.name,
              bio: bio,
              avatar: userProfile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
              socials: {},
              blocks: [
                { id: '1', type: 'header', title: 'Sobre Mí', isVisible: true },
                { id: '2', type: 'text', content: `Hola, soy ${userProfile.name}. Miembro de Terreta Hub.`, isVisible: true },
              ],
              theme: theme
            });
            setLoading(false);
            return;
          }
        }

        // Si tenemos un link_bio_profile, usarlo
        if (profileData) {
          setProfile({
            username: profileData.username,
            displayName: profileData.display_name,
            bio: profileData.bio || '',
            avatar: profileData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
            socials: (profileData.socials as any) || {},
            blocks: (profileData.blocks as any) || [],
            theme: (profileData.theme as any) || THEMES[0]
          });
        }
      } catch (err: any) {
        console.error('Error al cargar perfil:', err);
        setError('Error al cargar el perfil');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [cleanHandle]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50 p-10 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#D97706] mb-4"></div>
        <p className="text-gray-500">Cargando perfil...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50 p-10 text-center">
        <h2 className="text-2xl font-serif text-terreta-dark mb-2">Usuario no encontrado</h2>
        <p className="text-gray-500">{error || 'El perfil que buscas no existe o ha sido eliminado.'}</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-white overflow-y-auto">
       {/* We reuse the ProfileRenderer but wrap it to look good on desktop full-width */}
       <div className="max-w-md mx-auto min-h-screen shadow-2xl overflow-hidden">
          <ProfileRenderer profile={profile} />
       </div>
    </div>
  );
};