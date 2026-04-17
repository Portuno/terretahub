import React, { useState, useEffect } from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { FeedbackModal } from './FeedbackModal';
import { GruposComingModal } from './GruposComingModal';
import { Notifications } from './Notifications';
import { Footer } from './Footer';
import { supabase } from '../lib/supabase';
import { AuthUser } from '../types';
import { Navbar } from './Navbar';
import { fetchUserTotesSummary } from '../lib/totes';

interface DashboardProps {
  user: AuthUser | null;
  onOpenAuth: (referrerUsername?: string) => void;
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onOpenAuth, onLogout }) => {
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(user);
  
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isGruposModalOpen, setIsGruposModalOpen] = useState(false);
  const [totesBalance, setTotesBalance] = useState(0);

  useEffect(() => {
    if (!currentUser) {
      setTotesBalance(0);
      return;
    }

    const loadBalance = async () => {
      const summary = await fetchUserTotesSummary(currentUser.id);
      setTotesBalance(summary.balance);
    };

    loadBalance();
  }, [currentUser]);

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
      case '/comunidad': return 'Miembros';
      case '/miembros': return 'Miembros';
      case '/proyectos': return 'Proyectos Destacados';
      case '/dominio': return 'Dominios';
      case '/framehack': return 'FrameHack';
      case '/chatbot': return 'Explorar la Comunidad';
      case '/terreta': return 'Finde en la Terreta';
      case '/recursos': return "L'Almoina";
      case '/eventos': return 'Próximas Quedadas';
      case '/blogs': return 'Blogs';
      case '/qr': return 'Creador de QR';
      case '/perfil': return 'Editor de Perfil';
      case '/admin': return 'Panel de Administración';
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
        onOpenGruposModal={() => setIsGruposModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden transition-all duration-300">
        <Navbar
          user={currentUser}
          title={title}
          totesBalance={totesBalance}
          onOpenAuth={onOpenAuth}
          onLogout={onLogout}
          rightSlot={currentUser ? <Notifications userId={currentUser.id} /> : null}
        />

        {/* Content Area */}
        <div className={`flex-1 overflow-y-auto px-4 pb-4 md:px-8`}>
          <Outlet
            context={{
              user: currentUser ?? user,
              onOpenAuth,
              onOpenFeedback: () => setIsFeedbackOpen(true),
              onOpenGruposModal: () => setIsGruposModalOpen(true)
            }}
          />
        </div>

        {/* Footer - Only show on home page */}
        {location.pathname === '/' && (
          <Footer />
        )}
      </main>

      <FeedbackModal 
        isOpen={isFeedbackOpen} 
        onClose={() => setIsFeedbackOpen(false)} 
      />
      <GruposComingModal 
        isOpen={isGruposModalOpen} 
        onClose={() => setIsGruposModalOpen(false)} 
        user={user} 
        onOpenAuth={onOpenAuth} 
      />
    </div>
  );
};
