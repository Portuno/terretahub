import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { executeQueryWithRetry } from '../lib/supabaseHelpers';
import { UserProfile } from '../types';
import { UserCard } from './UserCard';
import { useProfileNavigation } from '../hooks/useProfileNavigation';

// Función para cargar usuarios reales desde Supabase (optimizada)
const loadUsersFromSupabase = async (): Promise<UserProfile[]> => {
  try {
    // Optimized: Use RPC function to get community profiles with optimized avatars
    // This reduces payload from 5+ MB to < 100 KB by limiting avatar sizes
    const { data: profiles, error: profilesError } = await executeQueryWithRetry(
      async () => await supabase.rpc('get_community_profiles', { limit_count: 50 }),
      'load community profiles'
    );

    if (profilesError) {
      console.error('[CommunityPage] Error al cargar perfiles:', profilesError);
      // Fallback to old method if RPC function doesn't exist
      console.warn('[CommunityPage] RPC function not available, using fallback method');
      const fallbackResult = await executeQueryWithRetry(
        async () => await supabase
          .from('profiles')
          .select('id, name, username, avatar, role')
          .eq('show_in_community', true)
          .order('created_at', { ascending: false })
          .limit(50),
        'load community profiles (fallback)'
      );
      
      if (fallbackResult.error || !fallbackResult.data) {
        return [];
      }
      
      // Use fallback profiles
      const fallbackProfiles = fallbackResult.data;
      const profileIds = fallbackProfiles.map((p: any) => p.id);
      
      // Load tags using RPC or fallback
      const tagsResult = await executeQueryWithRetry(
        async () => await supabase.rpc('get_user_tags', { user_ids: profileIds }),
        'load community tags'
      );
      
      const tagsByUser = new Map<string, string[]>();
      if (tagsResult.data && !tagsResult.error) {
        tagsResult.data.forEach((item: { author_id: string; tags: string[] }) => {
          if (item.tags && item.tags.length > 0) {
            tagsByUser.set(item.author_id, item.tags);
          }
        });
      }
      
      // Verificar si tienen link_bio_profile para el fallback
      const profileIdsForLinkBio = fallbackProfiles.map((p: any) => p.id);
      const linkBioResult = await executeQueryWithRetry(
        async () => await supabase
          .from('link_bio_profiles')
          .select('user_id')
          .in('user_id', profileIdsForLinkBio),
        'load link bio profiles (fallback)'
      );
      
      const hasLinkBioSet = new Set<string>();
      if (linkBioResult.data && !linkBioResult.error) {
        linkBioResult.data.forEach((item: { user_id: string }) => {
          hasLinkBioSet.add(item.user_id);
        });
      }
      
      return fallbackProfiles.map((profile: any) => {
        const tags = (tagsByUser.get(profile.id) || []).slice(0, 5);
        const displayRole = profile.role === 'admin' ? 'ADMIN' : 'MIEMBRO';
        return {
          id: profile.id,
          name: profile.name,
          role: displayRole,
          handle: `@${profile.username}`,
          avatar: profile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`,
          tags: tags.length > 0 ? tags : ['Terreta Hub'],
          hasLinkBio: hasLinkBioSet.has(profile.id)
        };
      });
    }

    if (!profiles || profiles.length === 0) {
      return [];
    }

    // Cargar tags de forma optimizada
    const profileIds = profiles.map(p => p.id);
    
    // Optimized: Use database function to get aggregated tags instead of all projects
    // This reduces payload from 5+ MB to < 100 KB
    const tagsResult = await executeQueryWithRetry(
      async () => await supabase.rpc('get_user_tags', { user_ids: profileIds }),
      'load community tags'
    );

    const tagsByUser = new Map<string, string[]>();
    
    // If RPC function exists and returned data, use it
    if (tagsResult.data && !tagsResult.error) {
      tagsResult.data.forEach((item: { author_id: string; tags: string[] }) => {
        if (item.tags && item.tags.length > 0) {
          tagsByUser.set(item.author_id, item.tags);
        }
      });
    } else if (tagsResult.error) {
      // Fallback: if function doesn't exist, fetch projects with limit
      console.warn('[CommunityPage] Tags RPC function not available, using fallback method');
      const fallbackResult = await executeQueryWithRetry(
        async () => await supabase
          .from('projects')
          .select('author_id, categories, technologies')
          .in('author_id', profileIds)
          .eq('status', 'published')
          .limit(500), // Limit to reduce payload
        'load community projects (fallback)'
      );
      
      if (fallbackResult.data) {
        const projectsByUser = new Map<string, Set<string>>();
        fallbackResult.data.forEach((project: any) => {
          if (!projectsByUser.has(project.author_id)) {
            projectsByUser.set(project.author_id, new Set());
          }
          const tagSet = projectsByUser.get(project.author_id)!;
          if (project.categories) {
            project.categories.forEach((tag: string) => tagSet.add(tag));
          }
          if (project.technologies) {
            project.technologies.forEach((tag: string) => tagSet.add(tag));
          }
        });
        projectsByUser.forEach((tagSet, authorId) => {
          tagsByUser.set(authorId, Array.from(tagSet));
        });
      }
    }

    // Procesar usuarios con los datos ya cargados
    // Note: get_community_profiles already returns optimized avatars and has_link_bio flag
    const usersWithTags = profiles.map((profile: any) => {
      // Obtener tags agregados directamente de la función
      const tags = (tagsByUser.get(profile.id) || []).slice(0, 5); // Limitar a 5 tags

      // Avatar ya viene optimizado de get_community_profiles
      const finalAvatar = profile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`;

      // Formatear role para mostrar
      const displayRole = profile.role === 'admin' ? 'ADMIN' : 'MIEMBRO';

      return {
        id: profile.id,
        name: profile.name,
        role: displayRole,
        handle: `@${profile.username}`,
        avatar: finalAvatar,
        tags: tags.length > 0 ? tags : ['Terreta Hub'],
        hasLinkBio: profile.has_link_bio || false
      };
    });

    return usersWithTags;
  } catch (error) {
    console.error('[CommunityPage] Error al cargar usuarios:', error);
    return [];
  }
};

export const CommunityPage: React.FC = () => {
  const navigateToProfile = useProfileNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [communityUsers, setCommunityUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    const loadUsers = async () => {
      setLoadingUsers(true);
      const users = await loadUsersFromSupabase();
      setCommunityUsers(users);
      setLoadingUsers(false);
    };
    loadUsers();
  }, []);

  // Filtrar usuarios manteniendo el orden: primero los que tienen link in bio
  const filteredUsers = communityUsers
    .filter(user => 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.handle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    // Mantener el orden: perfiles con link in bio primero
    .sort((a, b) => {
      const aHasLinkBio = a.hasLinkBio ? 1 : 0;
      const bHasLinkBio = b.hasLinkBio ? 1 : 0;
      return bHasLinkBio - aHasLinkBio; // TRUE (1) primero, FALSE (0) después
    });

  const handleViewProfile = (handle: string) => {
    navigateToProfile(handle);
  };

  return (
    <div className="w-full py-2">
      <div className="w-full animate-fade-in">
        {/* Search Bar */}
        <div className="relative mb-10 group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="text-terreta-secondary/60 group-focus-within:text-terreta-accent transition-colors" size={20} />
          </div>
          <input 
            type="text"
            placeholder="Buscar talento por nombre, rol, usuario o tags..."
            className="w-full pl-12 pr-4 py-4 rounded-xl border border-terreta-border focus:border-terreta-accent focus:ring-1 focus:ring-terreta-accent outline-none transition-all bg-terreta-card shadow-sm hover:shadow-md text-terreta-dark font-sans placeholder-terreta-secondary/50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Loading State */}
        {loadingUsers ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-terreta-accent"></div>
            <p className="mt-4 text-terreta-secondary">Cargando comunidad...</p>
          </div>
        ) : (
          <>
            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredUsers.map((user) => (
                <UserCard key={user.id} user={user} onViewProfile={handleViewProfile} />
              ))}
            </div>
            
            {filteredUsers.length === 0 && !loadingUsers && (
              <div className="text-center py-20 opacity-50">
                {searchQuery ? (
                  <p>No se encontraron resultados para "{searchQuery}"</p>
                ) : (
                  <p>No hay usuarios en la comunidad aún</p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

