import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { User } from 'lucide-react';
import { FeedbackModal } from './FeedbackModal';
import { Notifications } from './Notifications';
import { Footer } from './Footer';
import { supabase } from '../lib/supabase';
import { AuthUser } from '../types';

interface DashboardProps {
  user: AuthUser | null;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onOpenAuth, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(user);
  
  // Feedback Modal State
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

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

    // Refrescar cada 5 minutos
    const interval = setInterval(refreshUserProfile, 300000);
    
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

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/agora': return 'Ágora Comunitario';
      case '/comunidad': return 'Explorar Comunidad';
      case '/proyectos': return 'Proyectos Destacados';
      case '/recursos': return 'Biblioteca de Recursos';
      case '/eventos': return 'Próximos Eventos';
      case '/perfil': return 'Editor de Perfil';
      case '/admin': return 'Panel de Administración';
      case '/admin/eventos': return 'Panel de Administración - Eventos';
      case '/': return ''; // Landing has its own hero
      default: return 'Terreta Hub';
    }
  };

  const title = getPageTitle();

  return (
  <div className="flex h-screen overflow-hidden bg-terreta-bg transition-colors duration-500">
      
      {/* Sidebar - Fixed */}
      <Sidebar 
        user={user}
        onOpenAuth={onOpenAuth}
        onLogout={onLogout}
        onOpenFeedback={() => setIsFeedbackOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden transition-all duration-300">
        
        {/* Top Navbar - Only show if not on Landing Page (index) */}
        {location.pathname !== '/' && (
          <header className="bg-terreta-nav border-b border-terreta-border h-14 md:h-16 px-4 md:px-8 flex items-center justify-between sticky top-0 z-10 transition-colors duration-500">
              <h2 className="font-serif text-lg md:text-2xl text-terreta-dark truncate">
                  {title}
              </h2>

              {/* Right Actions */}
              <div className="flex items-center gap-3 md:gap-6 ml-auto">
                  <div className="flex flex-col items-end mr-2 hidden sm:flex">
                      <span className="text-xs font-bold text-terreta-dark/40 uppercase tracking-wide">
                        {currentUser ? `Hola, ${currentUser.name}` : 'Hola, Turista'}
                      </span>
                      <span className="text-sm font-bold text-terreta-accent uppercase tracking-wider">
                        {currentUser ? 'MIEMBRO' : 'EXPLORADOR'}
                      </span>
                  </div>
                  
                  {currentUser ? (
                    <Notifications userId={currentUser.id} />
                  ) : null}

                  <div 
                    onClick={currentUser ? () => navigate('/perfil') : onOpenAuth}
                    className="w-10 h-10 rounded-full bg-terreta-sidebar flex items-center justify-center text-terreta-dark hover:bg-terreta-border/50 transition-colors cursor-pointer border border-terreta-border overflow-hidden"
                  >
                      {currentUser ? <img src={currentUser.avatar} alt="Avatar" className="w-full h-full object-cover" /> : <User size={20} />}
                  </div>
              </div>
          </header>
        )}

        {/* Content Area */}
        <div className={`flex-1 overflow-y-auto ${location.pathname !== '/' ? 'px-4 md:px-8 pb-4' : ''}`}>
          <Outlet />
        </div>

        {/* Footer - Only show when not on policy pages or docs */}
        {location.pathname !== '/terminos-y-condiciones' && location.pathname !== '/politica-de-privacidad' && location.pathname !== '/docs' && (
          <Footer />
        )}
      </main>

      <FeedbackModal 
        isOpen={isFeedbackOpen} 
        onClose={() => setIsFeedbackOpen(false)} 
      />
    </div>
  );
};
