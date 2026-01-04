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
    // Cargar solo perfiles que quieren aparecer en la comunidad con retry
    const { data: profiles, error: profilesError } = await executeQueryWithRetry(
      async () => await supabase
        .from('profiles')
        .select('id, name, username, avatar, role')
        .eq('show_in_community', true)
        .order('created_at', { ascending: false })
        .limit(50), // Limitar a 50 usuarios para mejor performance
      'load community profiles'
    );

    if (profilesError) {
      console.error('[CommunityPage] Error al cargar perfiles:', profilesError);
      // Si es un error de red después de todos los reintentos, mostrar mensaje útil
      if (profilesError.message?.includes('Failed to fetch') || 
          profilesError.message?.includes('connection') ||
          profilesError.message?.includes('network')) {
        console.warn('[CommunityPage] Network error after retries, returning empty array');
      }
      return [];
    }

    if (!profiles || profiles.length === 0) {
      return [];
    }

    // Cargar todos los proyectos de una vez (más eficiente) con retry
    const profileIds = profiles.map(p => p.id);
    const { data: allProjects } = await executeQueryWithRetry(
      async () => await supabase
        .from('projects')
        .select('author_id, categories, technologies')
        .in('author_id', profileIds),
      'load community projects'
    );

    // Cargar todos los avatares de link_bio_profiles de una vez con retry
    const { data: linkBioProfiles } = await executeQueryWithRetry(
      async () => await supabase
        .from('link_bio_profiles')
        .select('user_id, avatar')
        .in('user_id', profileIds),
      'load community link bio avatars'
    );

    // Crear mapas para acceso rápido
    const projectsByUser = new Map<string, any[]>();
    if (allProjects) {
      allProjects.forEach(project => {
        if (!projectsByUser.has(project.author_id)) {
          projectsByUser.set(project.author_id, []);
        }
        projectsByUser.get(project.author_id)!.push(project);
      });
    }

    const avatarsByUser = new Map<string, string>();
    if (linkBioProfiles) {
      linkBioProfiles.forEach(lbp => {
        if (lbp.avatar) {
          avatarsByUser.set(lbp.user_id, lbp.avatar);
        }
      });
    }

    // Procesar usuarios con los datos ya cargados
    const usersWithTags = profiles.map((profile) => {
      // Extraer tags únicos de categorías y tecnologías
      const tagsSet = new Set<string>();
      const userProjects = projectsByUser.get(profile.id) || [];
      userProjects.forEach((project) => {
        if (project.categories) {
          project.categories.forEach((tag: string) => tagsSet.add(tag));
        }
        if (project.technologies) {
          project.technologies.forEach((tag: string) => tagsSet.add(tag));
        }
      });
      const tags = Array.from(tagsSet).slice(0, 5); // Limitar a 5 tags

      // Obtener avatar actualizado de link_bio_profiles si existe
      const finalAvatar = avatarsByUser.get(profile.id) || profile.avatar;

      // Formatear role para mostrar
      const displayRole = profile.role === 'admin' ? 'ADMIN' : 'MIEMBRO';

      return {
        id: profile.id,
        name: profile.name,
        role: displayRole,
        handle: `@${profile.username}`,
        avatar: finalAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`,
        tags: tags.length > 0 ? tags : ['Terreta Hub']
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

  const filteredUsers = communityUsers.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.handle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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

