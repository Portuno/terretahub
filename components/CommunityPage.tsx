import React, { useState, useEffect, useMemo } from 'react';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, UserPlus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { executeQueryWithRetry } from '../lib/supabaseHelpers';
import { AuthUser, UserProfile } from '../types';
import { UserCard } from './UserCard';
import { useProfileNavigation } from '../hooks/useProfileNavigation';
import { ReferralInviteModal } from './ReferralInviteModal';

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
          hasLinkBio: hasLinkBioSet.has(profile.id),
          createdAt: profile.created_at,
          profileViewsCount: 0
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

      const viewsCount = Number(profile.profile_views_count) || 0;
      
      return {
        id: profile.id,
        name: profile.name,
        role: displayRole,
        handle: `@${profile.username}`,
        avatar: finalAvatar,
        tags: tags.length > 0 ? tags : ['Terreta Hub'],
        hasLinkBio: profile.has_link_bio || false,
        createdAt: profile.created_at,
        profileViewsCount: viewsCount
      };
    });

    return usersWithTags;
  } catch (error) {
    console.error('[CommunityPage] Error al cargar usuarios:', error);
    return [];
  }
};

type SortType = 'registration' | 'views';
type SortOrder = 'asc' | 'desc';

interface CommunityPageProps {
  user: AuthUser | null;
  onOpenAuth: (referrerUsername?: string) => void;
}

export const CommunityPage: React.FC<CommunityPageProps> = ({ user, onOpenAuth }) => {
  const navigateToProfile = useProfileNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [communityUsers, setCommunityUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [sortType, setSortType] = useState<SortType>('registration');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const referralLink = useMemo(() => {
    if (!user?.username) return '';
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.terretahub.com';
    return `${origin}/?invitacion=${user.username}`;
  }, [user?.username]);

  useEffect(() => {
    const loadUsers = async () => {
      setLoadingUsers(true);
      const users = await loadUsersFromSupabase();
      setCommunityUsers(users);
      setLoadingUsers(false);
    };
    loadUsers();
  }, []);

  // Filtrar y ordenar usuarios
  const filteredUsers = communityUsers
    .filter(user => 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.handle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => {
      // Primero: perfiles con link in bio primero (mantener este orden siempre)
      const aHasLinkBio = a.hasLinkBio ? 1 : 0;
      const bHasLinkBio = b.hasLinkBio ? 1 : 0;
      const linkBioDiff = bHasLinkBio - aHasLinkBio;
      
      if (linkBioDiff !== 0) {
        return linkBioDiff;
      }
      
      // Segundo: ordenar según el filtro seleccionado
      let comparison = 0;
      
      if (sortType === 'registration') {
        const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        comparison = aDate - bDate;
      } else if (sortType === 'views') {
        // Asegurar que los valores sean números
        const aViews = Number(a.profileViewsCount) || 0;
        const bViews = Number(b.profileViewsCount) || 0;
        comparison = aViews - bViews;
      }
      
      // Si hay empate, usar un criterio de desempate para mantener orden estable
      if (comparison === 0) {
        // Desempate por fecha de creación (más reciente primero si descendente, más antiguo primero si ascendente)
        const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        comparison = aDate - bDate;
      }
      
      // Aplicar orden ascendente/descendente
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  
  const handleSortTypeChange = (newSortType: SortType) => {
    setSortType(newSortType);
  };
  
  const handleSortOrderToggle = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const handleViewProfile = (handle: string) => {
    navigateToProfile(handle);
  };

  return (
    <div className="w-full py-2">
      <div className="w-full animate-fade-in">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="font-serif text-2xl text-terreta-dark">Comunidad</h2>
            <p className="text-sm text-terreta-secondary">Descubre talento y comparte tu link de invitación.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (!user) {
                onOpenAuth();
                return;
              }
              setIsInviteOpen(true);
            }}
            className="flex items-center gap-2 bg-terreta-dark text-terreta-bg px-4 py-2 rounded-full text-sm font-bold hover:bg-opacity-90 transition-colors"
            aria-label="Invitar a la comunidad"
          >
            <UserPlus size={16} />
            Invitar
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6 group">
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

        {/* Filtros de Ordenamiento */}
        <div className="mb-10 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-terreta-dark">Ordenar por:</span>
            <div className="flex gap-2">
              <button
                onClick={() => handleSortTypeChange('registration')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  sortType === 'registration'
                    ? 'bg-terreta-accent text-white shadow-md'
                    : 'bg-terreta-card text-terreta-secondary border border-terreta-border hover:border-terreta-accent'
                }`}
              >
                Fecha de registro
              </button>
              <button
                onClick={() => handleSortTypeChange('views')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  sortType === 'views'
                    ? 'bg-terreta-accent text-white shadow-md'
                    : 'bg-terreta-card text-terreta-secondary border border-terreta-border hover:border-terreta-accent'
                }`}
              >
                Visitas al perfil
              </button>
            </div>
          </div>
          
          <button
            onClick={handleSortOrderToggle}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-terreta-card text-terreta-secondary border border-terreta-border hover:border-terreta-accent transition-all"
            aria-label={`Orden ${sortOrder === 'asc' ? 'ascendente' : 'descendente'}`}
          >
            {sortOrder === 'asc' ? (
              <>
                <ArrowUp size={16} />
                <span>Ascendente</span>
              </>
            ) : (
              <>
                <ArrowDown size={16} />
                <span>Descendente</span>
              </>
            )}
          </button>
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

      {user && (
        <ReferralInviteModal
          isOpen={isInviteOpen}
          onClose={() => setIsInviteOpen(false)}
          referralLink={referralLink}
          referralCode={user.username}
        />
      )}
    </div>
  );
};

