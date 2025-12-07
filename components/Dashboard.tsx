import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { UserCard } from './UserCard';
import { UserProfile, AuthUser, Project } from '../types';
import { Search, Bell, User, FolderKanban, MessageSquareText, Plus } from 'lucide-react';
import { ProfileEditor } from './ProfileEditor';
import { AgoraFeed } from './AgoraFeed';
import { ProjectEditor } from './ProjectEditor';
import { FeedbackModal } from './FeedbackModal';
import { PublicProfile } from './PublicProfile';
import { AdminProjectsPanel } from './AdminProjectsPanel';
import { ProjectsGallery } from './ProjectsGallery';
import { Toast } from './Toast';
import { Notifications } from './Notifications';
import { supabase } from '../lib/supabase';
import { isAdmin } from '../lib/userRoles';

// Función para cargar usuarios reales desde Supabase
const loadUsersFromSupabase = async (): Promise<UserProfile[]> => {
  try {
    // Cargar todos los perfiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, username, avatar, role')
      .order('created_at', { ascending: false });

    if (profilesError) {
      console.error('Error al cargar perfiles:', profilesError);
      return [];
    }

    if (!profiles || profiles.length === 0) {
      return [];
    }

    // Para cada perfil, obtener sus tags desde sus proyectos
    const usersWithTags = await Promise.all(
      profiles.map(async (profile) => {
        // Obtener proyectos del usuario para extraer tags
        const { data: projects } = await supabase
          .from('projects')
          .select('categories, technologies')
          .eq('author_id', profile.id);

        // Extraer tags únicos de categorías y tecnologías
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
        const tags = Array.from(tagsSet).slice(0, 5); // Limitar a 5 tags

        // Obtener avatar actualizado de link_bio_profiles si existe
        let finalAvatar = profile.avatar;
        const { data: linkBioProfile } = await supabase
          .from('link_bio_profiles')
          .select('avatar')
          .eq('user_id', profile.id)
          .maybeSingle();

        if (linkBioProfile?.avatar) {
          finalAvatar = linkBioProfile.avatar;
        }

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
      })
    );

    return usersWithTags;
  } catch (error) {
    console.error('Error al cargar usuarios:', error);
    return [];
  }
};

interface DashboardProps {
  user: AuthUser | null;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onOpenAuth, onLogout }) => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('agora');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(user);
  
  // Public Profile State
  const [viewingProfileHandle, setViewingProfileHandle] = useState<string | null>(null);
  
  // Community Users State
  const [communityUsers, setCommunityUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  // Actualizar usuario cuando cambia el prop o cuando se actualiza el perfil
  useEffect(() => {
    setCurrentUser(user);
  }, [user]);

  // Escuchar cambios en el perfil del usuario para actualizar avatar
  useEffect(() => {
    if (!user) return;

    const refreshUserProfile = async () => {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!error && profile) {
        setCurrentUser({
          id: profile.id,
          name: profile.name,
          username: profile.username,
          email: profile.email,
          avatar: profile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`,
          role: (profile.role as 'normal' | 'admin') || 'normal',
        });
      }
    };

    // Refrescar cada 30 segundos para obtener avatares actualizados
    const interval = setInterval(refreshUserProfile, 30000);
    
    // Escuchar evento de actualización de avatar
    const handleAvatarUpdate = (event: CustomEvent) => {
      if (currentUser) {
        setCurrentUser({
          ...currentUser,
          avatar: event.detail.avatar
        });
      }
    };

    window.addEventListener('profileAvatarUpdated', handleAvatarUpdate as EventListener);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('profileAvatarUpdated', handleAvatarUpdate as EventListener);
    };
  }, [user, currentUser]);

  // Projects View State
  const [projectMode, setProjectMode] = useState<'gallery' | 'create'>('gallery');
  
  // Feedback Modal State
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  // Toast State
  const [showProjectToast, setShowProjectToast] = useState(false);

  // Cargar usuarios de la comunidad cuando se accede a la sección
  useEffect(() => {
    if (activeSection === 'comunidad') {
      const loadUsers = async () => {
        setLoadingUsers(true);
        const users = await loadUsersFromSupabase();
        setCommunityUsers(users);
        setLoadingUsers(false);
      };
      loadUsers();
    }
  }, [activeSection]);

  const filteredUsers = communityUsers.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.handle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  const handleProjectSave = async (project: Project) => {
    if (!currentUser) {
      console.error('[Dashboard] No user available to save project');
      return;
    }

    try {
      console.log('[Dashboard] Saving project to Supabase:', project);

      // Mapear el proyecto del frontend a la estructura de la base de datos
      const projectData = {
        author_id: currentUser.id, // El ID del usuario autenticado
        name: project.name,
        slogan: project.slogan || null,
        description: project.description,
        images: project.images || [],
        video_url: project.videoUrl || null,
        website: project.website || null,
        categories: project.categories || [],
        technologies: project.technologies || [],
        phase: project.phase,
        status: project.status
      };

      console.log('[Dashboard] Project data to insert:', projectData);

      // Insertar el proyecto en Supabase
      const { data, error } = await supabase
        .from('projects')
        .insert(projectData)
        .select()
        .single();

      if (error) {
        console.error('[Dashboard] Error saving project:', error);
        alert('Error al guardar el proyecto: ' + (error.message || 'Error desconocido'));
        return;
      }

      console.log('[Dashboard] Project saved successfully:', data);
      
      // Solo mostrar toast si el proyecto fue enviado (no si es borrador)
      if (project.status !== 'draft') {
        setShowProjectToast(true);
      } else {
        alert('Proyecto guardado como borrador exitosamente');
      }
      
      setProjectMode('gallery');
    } catch (err: any) {
      console.error('[Dashboard] Exception saving project:', err);
      alert('Error al guardar el proyecto: ' + (err.message || 'Error desconocido'));
    }
  };

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    // Reset internal section states when navigating away
    if (section !== 'proyectos') {
      setProjectMode('gallery');
    }
    // Clear profile view if navigating via menu
    if (section !== 'public_profile') {
      setViewingProfileHandle(null);
    }
  };

  const handleViewProfile = async (handle: string) => {
    // Limpiar el handle (quitar @ si existe)
    const cleanHandle = handle.replace('@', '').trim();
    
    // Buscar el perfil real en la base de datos para obtener el custom_slug o username
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', cleanHandle)
        .single();

      if (!error && profile) {
        // Buscar si tiene un link_bio_profile con custom_slug
        const { data: linkBioProfile } = await supabase
          .from('link_bio_profiles')
          .select('custom_slug, username')
          .eq('username', profile.username)
          .eq('is_published', true)
          .maybeSingle();

        // Usar custom_slug si existe, sino usar username
        const extension = linkBioProfile?.custom_slug || profile.username;
        
        // Navegar a la página pública del perfil usando react-router
        navigate(`/p/${extension}`);
      } else {
        // Si no existe el perfil, navegar de todas formas (mostrará 404)
        navigate(`/p/${cleanHandle}`);
      }
    } catch (err) {
      console.error('Error al buscar perfil:', err);
      // En caso de error, intentar navegar de todas formas (mostrará 404)
      navigate(`/p/${cleanHandle}`);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F9F9F9]">
      
      {/* Sidebar - Fixed */}
      <Sidebar 
        activeSection={activeSection} 
        onNavigate={handleSectionChange} 
        user={user}
        onOpenAuth={onOpenAuth}
        onLogout={onLogout}
        onOpenFeedback={() => setIsFeedbackOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 flex flex-col min-h-screen transition-all duration-300">
        
        {/* Top Navbar */}
        <header className="bg-white border-b border-gray-100 h-20 px-8 flex items-center justify-between sticky top-0 z-10">
            <h2 className="font-serif text-2xl text-terreta-dark hidden md:block">
                {activeSection === 'agora' && 'Ágora Comunitario'}
                {activeSection === 'comunidad' && 'Explorar Comunidad'}
                {activeSection === 'proyectos' && (projectMode === 'create' ? 'Nuevo Proyecto' : 'Proyectos Destacados')}
                {activeSection === 'recursos' && 'Biblioteca de Recursos'}
                {activeSection === 'eventos' && 'Próximos Eventos'}
                {activeSection === 'perfil' && 'Editor de Perfil'}
                {activeSection === 'admin' && 'Panel de Administración'}
                {activeSection === 'public_profile' && (
                  <span className="flex items-center gap-2">
                    <span 
                      className="text-gray-400 cursor-pointer hover:text-terreta-dark text-sm uppercase tracking-wider font-sans"
                      onClick={() => handleSectionChange('comunidad')}
                    >
                       Comunidad /
                    </span>
                    {viewingProfileHandle}
                  </span>
                )}
            </h2>

            {/* Right Actions */}
            <div className="flex items-center gap-6 ml-auto">
                <div className="flex flex-col items-end mr-2 hidden sm:flex">
                    <span className="text-xs font-bold text-terreta-dark/40 uppercase tracking-wide">
                      {currentUser ? `Hola, ${currentUser.name}` : 'Hola, Turista'}
                    </span>
                    <span className="text-sm font-bold text-[#D97706] uppercase tracking-wider">
                      {currentUser ? 'MIEMBRO' : 'EXPLORADOR'}
                    </span>
                </div>
                
                {currentUser ? (
                  <Notifications userId={currentUser.id} />
                ) : null}

                <div 
                  onClick={currentUser ? () => setActiveSection('perfil') : onOpenAuth}
                  className="w-10 h-10 rounded-full bg-[#EBE5DA] flex items-center justify-center text-terreta-dark hover:bg-[#D9CDB8] transition-colors cursor-pointer border border-[#D1C9BC] overflow-hidden"
                >
                    {currentUser ? <img src={currentUser.avatar} alt="Avatar" className="w-full h-full object-cover" /> : <User size={20} />}
                </div>
            </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          
          {activeSection === 'public_profile' && viewingProfileHandle ? (
             <PublicProfile handle={viewingProfileHandle} />
          ) : activeSection === 'perfil' && currentUser ? (
            <ProfileEditor user={currentUser} />
          ) : activeSection === 'perfil' && !user ? (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center p-10 animate-fade-in">
              <div className="w-16 h-16 bg-[#EBE5DA] rounded-full flex items-center justify-center mb-4">
                <User size={32} className="text-terreta-dark/50" />
              </div>
              <h3 className="font-serif text-2xl text-terreta-dark mb-2">Inicia sesión para editar tu perfil</h3>
              <p className="max-w-md mx-auto mb-6 text-gray-500">Necesitas una cuenta para personalizar tu página de link-in-bio.</p>
              <button 
                onClick={onOpenAuth}
                className="bg-[#D97706] text-white px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:bg-[#B45309] transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                Iniciar Sesión
              </button>
            </div>
          ) : activeSection === 'agora' ? (
            <AgoraFeed user={currentUser} onOpenAuth={onOpenAuth} onViewProfile={handleViewProfile} />
          ) : activeSection === 'proyectos' ? (
             projectMode === 'create' && currentUser ? (
               <ProjectEditor user={currentUser} onCancel={() => setProjectMode('gallery')} onSave={handleProjectSave} />
             ) : (
                <ProjectsGallery 
                  onViewProfile={handleViewProfile}
                  onCreateProject={currentUser ? () => setProjectMode('create') : onOpenAuth}
                  user={currentUser}
                />
             )
          ) : activeSection === 'admin' && currentUser && isAdmin(currentUser) ? (
            <AdminProjectsPanel user={currentUser} />
          ) : activeSection === 'admin' && (!currentUser || !isAdmin(currentUser)) ? (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center p-10 animate-fade-in">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <User size={32} className="text-red-500" />
              </div>
              <h3 className="font-serif text-2xl text-terreta-dark mb-2">Acceso Denegado</h3>
              <p className="max-w-md mx-auto text-gray-500">No tienes permisos de administrador para acceder a esta sección.</p>
            </div>
          ) : activeSection === 'comunidad' ? (
            <div className="p-6 md:p-10">
              <div className="max-w-7xl mx-auto animate-fade-in">
                  {/* Search Bar */}
                  <div className="relative mb-10 group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Search className="text-gray-400 group-focus-within:text-[#D97706] transition-colors" size={20} />
                      </div>
                      <input 
                          type="text"
                          placeholder="Buscar talento por nombre, rol, usuario o tags..."
                          className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706] outline-none transition-all bg-white shadow-sm hover:shadow-md text-terreta-dark font-sans placeholder-gray-400"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                      />
                  </div>

                  {/* Loading State */}
                  {loadingUsers ? (
                    <div className="text-center py-20">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#D97706]"></div>
                      <p className="mt-4 text-gray-500">Cargando comunidad...</p>
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
          ) : (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center animate-fade-in opacity-50 p-10">
                <div className="w-16 h-16 bg-[#EBE5DA] rounded-full flex items-center justify-center mb-4">
                    <FolderKanban size={32} className="text-terreta-dark/50" />
                </div>
                <h3 className="font-serif text-2xl text-terreta-dark mb-2">Próximamente</h3>
                <p className="max-w-md mx-auto">La sección de <span className="font-bold capitalize">{activeSection}</span> está en construcción. ¡Mantente atento!</p>
            </div>
          )}

        </div>
      </main>

      <FeedbackModal 
        isOpen={isFeedbackOpen} 
        onClose={() => setIsFeedbackOpen(false)} 
      />

      {/* Project Submission Toast */}
      {showProjectToast && (
        <Toast
          message="¡Proyecto enviado!"
          secondaryMessage="Tu proyecto fue enviado y será revisado. Espera una respuesta pronto de parte de la administración."
          onClose={() => setShowProjectToast(false)}
          duration={6000}
          variant="terreta"
        />
      )}

    </div>
  );
};