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
import { useRouteMeta } from '../hooks/useRouteMeta';

interface DashboardProps {
  user: AuthUser | null;
  onOpenAuth: (referrerUsername?: string) => void;
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onOpenAuth, onLogout }) => {
  const location = useLocation();
  useRouteMeta();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(user);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isGruposModalOpen, setIsGruposModalOpen] = useState(false);
  const [totesBalance, setTotesBalance] = useState(0);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

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

    const handleTerrisUpdate = (event: Event) => {
      const custom = event as CustomEvent<{ balance?: number }>;
      if (typeof custom.detail?.balance === 'number') {
        setTotesBalance(custom.detail.balance);
      } else {
        loadBalance();
      }
    };

    window.addEventListener('terrisBalanceUpdated', handleTerrisUpdate);
    return () => window.removeEventListener('terrisBalanceUpdated', handleTerrisUpdate);
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

  const getPageMeta = () => {
    switch (location.pathname) {
      case '/':
      case '/explorar':
        return { title: '', description: '' };
      case '/agora':
        return { title: 'Ágora', description: 'El muro de la comunidad en Valencia.' };
      case '/comunidad':
        return { title: 'Comunidad', description: 'Miembros, proyectos y espacios de Terreta Hub.' };
      case '/grupos':
        return { title: 'Grupos', description: 'Grupos de la comunidad. Aún no hay producto público.' };
      case '/miembros':
        return { title: 'Miembros', description: 'Personas y perfiles de Terreta Hub en Valencia.' };
      case '/proyectos':
        return { title: 'Proyectos', description: 'Ideas y productos que se están construyendo en Valencia.' };
      case '/dominio':
        return { title: 'Dominios', description: 'Áreas y experimentos de Terreta Hub.' };
      case '/mapa':
        return { title: 'Mapa', description: 'Valencia en vivo: negocios, eventos y acontecimientos de la comunidad.' };
      case '/propiedades':
        return { title: 'Espacios', description: 'Espacios e inmuebles de la comunidad Terreta Hub en Valencia.' };
      case '/framehack':
        return { title: 'FrameHack', description: 'Dominio experimental. Aún no hay producto público.' };
      case '/chatbot':
        return { title: 'Explorar la Comunidad', description: 'Asistente para explorar recursos y resolver dudas.' };
      case '/terreta':
      case '/unfinde':
        return { title: 'Un Finde', description: 'Archivo de Un Finde en la Terreta.' };
      case '/recursos':
        return { title: "L'Almoina", description: 'Pedí y ofrecé ayuda dentro de la comunidad.' };
      case '/eventos':
        return { title: 'Quedadas', description: 'Quedadas y encuentros de la comunidad en Valencia.' };
      case '/blogs':
        return { title: 'Blogs', description: 'Artículos e historias de la comunidad.' };
      case '/qr':
        return { title: 'Creador de QR', description: 'Genera códigos QR para compartir enlaces y recursos.' };
      case '/terris':
        return { title: 'Terris', description: 'La moneda nativa y local de la Terreta.' };
      case '/perfil':
        return { title: 'Perfil', description: 'Gestiona tu información y configuración personal.' };
      case '/admin':
        return { title: 'Panel de Administración', description: 'Gestión interna de contenido y comunidad.' };
      case '/admin/blogs':
        return { title: 'Admin Blogs', description: 'Administración de publicaciones del blog.' };
      default:
        return { title: 'Terreta Hub', description: '' };
    }
  };

  const { title, description } = getPageMeta();

  return (
  <div className="flex h-screen max-w-[100vw] overflow-hidden bg-terreta-bg transition-colors duration-500">
      
      {/* Sidebar - Fixed */}
      <Sidebar 
        user={user}
        onOpenAuth={onOpenAuth}
        onLogout={onLogout}
        onOpenFeedback={() => setIsFeedbackOpen(true)}
        onOpenGruposModal={() => setIsGruposModalOpen(true)}
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <main className="flex min-w-0 flex-1 flex-col h-screen overflow-hidden transition-all duration-300">
        <Navbar
          user={currentUser}
          title={title}
          description={description}
          totesBalance={totesBalance}
          onOpenAuth={onOpenAuth}
          onLogout={onLogout}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          rightSlot={currentUser ? <Notifications userId={currentUser.id} /> : null}
        />

        {/* Content Area */}
        <div className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-4 pb-4 md:px-8">
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
