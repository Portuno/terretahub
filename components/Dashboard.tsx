import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { UserCard } from './UserCard';
import { UserProfile, AuthUser, Project } from '../types';
import { Search, Bell, User, FolderKanban, MessageSquareText, Plus } from 'lucide-react';
import { ProfileEditor } from './ProfileEditor';
import { AgoraFeed } from './AgoraFeed';
import { ProjectEditor } from './ProjectEditor';
import { FeedbackModal } from './FeedbackModal';
import { PublicProfile } from './PublicProfile';

// Mock Data
const MOCK_USERS: UserProfile[] = [
  {
    id: '1',
    name: 'Lucía Valero',
    role: 'ARQUITECTA',
    handle: '@lucia_arch',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lucia',
    tags: ['Diseño', 'Sostenibilidad']
  },
  {
    id: '2',
    name: 'Marc Soler',
    role: 'DESARROLLADOR',
    handle: '@marcsoler',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marc',
    tags: ['React', 'NodeJS', 'Web3']
  },
  {
    id: '3',
    name: 'Elena Giner',
    role: 'ARTISTA DIGITAL',
    handle: '@elenaart',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elena',
    tags: ['3D', 'NFT', 'Ilustración']
  },
  {
    id: '4',
    name: 'Pablo Mir',
    role: 'GASTRONOMÍA',
    handle: '@chefpablo',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Pablo',
    tags: ['Chef', 'Innovación']
  },
  {
    id: '5',
    name: 'Sofía Roig',
    role: 'MARKETING',
    handle: '@sofiaroig',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sofia',
    tags: ['Growth', 'Ads']
  },
  {
    id: '6',
    name: 'Javi Moltó',
    role: 'VIDEO',
    handle: '@javimolto',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Javi',
    tags: ['Edición', 'Dirección']
  }
];

interface DashboardProps {
  user: AuthUser | null;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onOpenAuth, onLogout }) => {
  const [activeSection, setActiveSection] = useState('agora');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Public Profile State
  const [viewingProfileHandle, setViewingProfileHandle] = useState<string | null>(null);

  // Projects View State
  const [projectMode, setProjectMode] = useState<'gallery' | 'create'>('gallery');
  
  // Feedback Modal State
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  const filteredUsers = MOCK_USERS.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleProjectSave = (project: Project) => {
    console.log("Project Saved:", project);
    // Here we would save to backend/storage
    setProjectMode('gallery');
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

  const handleViewProfile = (handle: string) => {
    setViewingProfileHandle(handle);
    setActiveSection('public_profile');
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
                      {user ? `Hola, ${user.name}` : 'Hola, Turista'}
                    </span>
                    <span className="text-sm font-bold text-[#D97706] uppercase tracking-wider">
                      {user ? 'MIEMBRO' : 'EXPLORADOR'}
                    </span>
                </div>
                
                {user ? (
                   <button className="relative text-terreta-dark/60 hover:text-terreta-dark transition-colors">
                      <Bell size={20} />
                      <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                  </button>
                ) : null}

                <div 
                  onClick={user ? () => setActiveSection('perfil') : onOpenAuth}
                  className="w-10 h-10 rounded-full bg-[#EBE5DA] flex items-center justify-center text-terreta-dark hover:bg-[#D9CDB8] transition-colors cursor-pointer border border-[#D1C9BC] overflow-hidden"
                >
                    {user ? <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" /> : <User size={20} />}
                </div>
            </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          
          {activeSection === 'public_profile' && viewingProfileHandle ? (
             <PublicProfile handle={viewingProfileHandle} mockUsers={MOCK_USERS} />
          ) : activeSection === 'perfil' && user ? (
            <ProfileEditor user={user} />
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
            <AgoraFeed user={user} onOpenAuth={onOpenAuth} onViewProfile={handleViewProfile} />
          ) : activeSection === 'proyectos' ? (
             projectMode === 'create' && user ? (
               <ProjectEditor user={user} onCancel={() => setProjectMode('gallery')} onSave={handleProjectSave} />
             ) : (
                /* Projects Gallery Placeholder View */
                <div className="p-6 md:p-10 animate-fade-in">
                   <div className="flex justify-between items-center mb-10 max-w-7xl mx-auto">
                      <h3 className="font-serif text-3xl text-terreta-dark">Galería de Innovación</h3>
                      <button 
                        onClick={user ? () => setProjectMode('create') : onOpenAuth}
                        className="bg-[#D97706] text-white px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:bg-[#B45309] transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                      >
                         <Plus size={20} /> <span className="hidden sm:inline">Subir Proyecto</span>
                      </button>
                   </div>
                   
                   <div className="flex flex-col items-center justify-center h-[40vh] text-center opacity-60">
                      <div className="w-20 h-20 bg-[#F5F0E6] rounded-full flex items-center justify-center mb-6">
                        <FolderKanban size={40} className="text-[#D97706]" />
                      </div>
                      <h4 className="font-serif text-2xl text-terreta-dark mb-2">Aún no hay proyectos públicos</h4>
                      <p className="max-w-md">Sé el primero en compartir tu idea con la comunidad. Los proyectos aprobados aparecerán aquí.</p>
                   </div>
                </div>
             )
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
                          placeholder="Buscar talento por nombre, rol o usuario..."
                          className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706] outline-none transition-all bg-white shadow-sm hover:shadow-md text-terreta-dark font-sans placeholder-gray-400"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                      />
                  </div>

                  {/* Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {filteredUsers.map((user) => (
                          <UserCard key={user.id} user={user} onViewProfile={handleViewProfile} />
                      ))}
                  </div>
                  
                  {filteredUsers.length === 0 && (
                      <div className="text-center py-20 opacity-50">
                          <p>No se encontraron resultados para "{searchQuery}"</p>
                      </div>
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

    </div>
  );
};