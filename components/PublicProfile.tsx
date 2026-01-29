import React, { useState, useEffect } from 'react';
import { LinkBioProfile } from '../types';
import { ProfileRenderer, THEMES } from './ProfileEditor';
import { supabase } from '../lib/supabase';
import { trackProfileView } from '../lib/analytics';
import { useFollow } from '../hooks/useFollow';
import { UserPlus, Users } from 'lucide-react';
import { useDynamicMetaTags } from '../hooks/useDynamicMetaTags';

interface PublicProfileProps {
  handle: string;
}

export const PublicProfile: React.FC<PublicProfileProps> = ({ handle }) => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<LinkBioProfile | null>(null);
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  // Limpiar el handle (quitar @ si existe)
  const cleanHandle = handle.replace('@', '').trim();

  // Hook para seguir/dejar de seguir
  const followHook = useFollow({
    userId: currentUserId,
    targetUserId: profileUserId || '',
    initialIsFollowing: false,
    initialFollowersCount: followersCount
  });

  // Obtener usuario actual
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    getCurrentUser();
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        // Optimized: Try to find by custom_slug or username in a single query
        let profileData = null;
        let username = cleanHandle;
        let userProfile = null;
        let profileUserId: string | null = null;

        // First, try to find link_bio_profile by custom_slug or username (single query)
        const { data: linkBioProfile } = await supabase
          .from('link_bio_profiles')
          .select('user_id, username, display_name, bio, avatar, socials, blocks, theme, updated_at, is_published')
          .or(`custom_slug.eq.${cleanHandle},username.eq.${cleanHandle}`)
          .eq('is_published', true)
          .maybeSingle();

        if (linkBioProfile) {
          // Found by custom_slug or username in link_bio_profiles
          profileData = linkBioProfile;
          profileUserId = linkBioProfile.user_id;
          
          // Fetch username, cv_url, followers_count, following_count from profiles
          const { data: profileFromDb } = await supabase
            .from('profiles')
            .select('username, cv_url, followers_count, following_count')
            .eq('id', linkBioProfile.user_id)
            .maybeSingle();
          
          if (profileFromDb) {
            username = profileFromDb.username;
            if (profileFromDb.cv_url) {
              (profileData as any).cv_url = profileFromDb.cv_url;
            }
            setFollowersCount(profileFromDb.followers_count || 0);
            setFollowingCount(profileFromDb.following_count || 0);
          }
        } else {
          // If not found, search by username in profiles
          const { data: profileFromDb } = await supabase
            .from('profiles')
            .select('id, name, username, email, avatar, cv_url, role, followers_count, following_count')
            .eq('username', cleanHandle)
            .single();

          if (!profileFromDb) {
            setError('Usuario no encontrado');
            setLoading(false);
            return;
          }

          userProfile = profileFromDb;
          username = profileFromDb.username;
          profileUserId = profileFromDb.id;
          setFollowersCount(profileFromDb.followers_count || 0);
          setFollowingCount(profileFromDb.following_count || 0);

          // Try to get link_bio_profile for this user (optimized: only needed columns)
          const { data: linkBioByUsername } = await supabase
            .from('link_bio_profiles')
            .select('user_id, username, display_name, bio, avatar, socials, blocks, theme, updated_at, is_published')
            .eq('user_id', profileFromDb.id)
            .eq('username', username)
            .eq('is_published', true)
            .maybeSingle();

          if (linkBioByUsername) {
            profileData = linkBioByUsername;
            // Add cv_url from userProfile (which comes from profiles table)
            if (userProfile && userProfile.cv_url) {
              (profileData as any).cv_url = userProfile.cv_url;
            }
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
              cvUrl: userProfile.cv_url, // Add CV URL
              socials: {},
              blocks: [
                { id: '1', type: 'header', title: 'Sobre Mí', isVisible: true },
                { id: '2', type: 'text', content: `Hola, soy ${userProfile.name}. Miembro de Terreta Hub.`, isVisible: true },
              ],
              theme: theme
            });
            setProfileUserId(profileUserId);
            
            // Registrar vista de perfil
            if (profileUserId) {
              trackProfileView(profileUserId).catch(err => {
                console.warn('Failed to track profile view:', err);
              });
            }
            
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
            cvUrl: (profileData as any).cv_url, // Add CV URL
            socials: (profileData.socials as any) || {},
            blocks: (profileData.blocks as any) || [],
            theme: (profileData.theme as any) || THEMES[0]
          });
          setProfileUserId(profileUserId);
          
          // Registrar vista de perfil
          if (profileUserId) {
            trackProfileView(profileUserId).catch(err => {
              console.warn('Failed to track profile view:', err);
            });
          }
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

  // Actualizar contadores cuando cambia el estado de follow
  useEffect(() => {
    if (followHook.followersCount !== followersCount) {
      setFollowersCount(followHook.followersCount);
    }
  }, [followHook.followersCount]);

  // Meta tags dinámicos y structured data para SEO
  const profileUrl = `/p/${cleanHandle}`;
  const profileName = profile?.displayName || cleanHandle;
  const profileBio = profile?.bio || `Perfil de ${profileName} en Terreta Hub`;

  useDynamicMetaTags({
    title: profile ? `${profileName} (@${cleanHandle}) | Terreta Hub` : 'Perfil | Terreta Hub',
    description: profileBio,
    image: profile?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanHandle}`,
    url: profileUrl,
    type: 'profile',
    structuredData: profile && profileUserId ? {
      '@context': 'https://schema.org',
      '@type': 'Person',
      '@id': `https://terretahub.com${profileUrl}`,
      'name': profileName,
      'alternateName': `@${cleanHandle}`,
      'description': profileBio,
      'image': profile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanHandle}`,
      'url': `https://terretahub.com${profileUrl}`,
      'sameAs': profile.socials ? Object.values(profile.socials).filter((url: any) => url && typeof url === 'string') : [],
      'knowsAbout': profile.blocks
        ?.filter((block: any) => block.type === 'text' || block.type === 'header')
        .map((block: any) => block.title || block.content)
        .slice(0, 5) || [],
      'memberOf': {
        '@type': 'Organization',
        'name': 'Terreta Hub',
        'url': 'https://terretahub.com'
      },
      'followers': {
        '@type': 'Integer',
        'value': followersCount
      }
    } : undefined
  });

  return (
      <div className="w-full h-full bg-white overflow-y-auto">
       {/* We reuse the ProfileRenderer but wrap it to look good on desktop full-width */}
       <div className="max-w-md mx-auto min-h-screen shadow-2xl overflow-hidden">
          {/* Follow Button and Stats */}
          {profileUserId && currentUserId && currentUserId !== profileUserId && (
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={followHook.toggleFollow}
                  disabled={followHook.isToggling}
                  className={`px-4 py-2 rounded-full font-medium text-sm transition-colors flex items-center gap-2 ${
                    followHook.isFollowing
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      : 'bg-terreta-accent text-white hover:bg-opacity-90'
                  }`}
                >
                  <UserPlus size={16} />
                  {followHook.isFollowing ? 'Siguiendo' : 'Seguir'}
                </button>
                
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Users size={16} />
                    <span className="font-medium">{followersCount}</span>
                    <span className="text-gray-500">seguidores</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">{followingCount}</span>
                    <span className="text-gray-500">siguiendo</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {profileUserId && (!currentUserId || currentUserId === profileUserId) && (
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Users size={16} />
                  <span className="font-medium">{followersCount}</span>
                  <span className="text-gray-500">seguidores</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-medium">{followingCount}</span>
                  <span className="text-gray-500">siguiendo</span>
                </div>
              </div>
            </div>
          )}
          
          <ProfileRenderer profile={profile} profileUserId={profileUserId || undefined} />
       </div>
    </div>
  );
};