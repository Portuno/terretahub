import React, { useState, useEffect } from 'react';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { AuthModal } from './components/AuthModal';
import { AppView, AuthUser } from './types';
import { supabase } from './lib/supabase';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Check for session persistence on mount
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Obtener perfil del usuario
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (!error && profile) {
          const safeUser: AuthUser = {
            id: profile.id,
            name: profile.name,
            username: profile.username,
            email: profile.email,
            avatar: profile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`,
          };
          setUser(safeUser);
        }
      }
    };

    checkSession();

    // Escuchar cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null);
        setCurrentView('landing');
      } else if (event === 'SIGNED_IN' && session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          const safeUser: AuthUser = {
            id: profile.id,
            name: profile.name,
            username: profile.username,
            email: profile.email,
            avatar: profile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`,
          };
          setUser(safeUser);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLoginSuccess = (loggedInUser: AuthUser) => {
    setUser(loggedInUser);
    setIsAuthModalOpen(false);
    setCurrentView('app'); // Redirect to app if logging in from landing
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCurrentView('landing');
  };

  return (
    <>
      {currentView === 'landing' ? (
        <LandingPage onEnterApp={() => setCurrentView('app')} />
      ) : (
        <Dashboard 
          user={user} 
          onOpenAuth={() => setIsAuthModalOpen(true)} 
          onLogout={handleLogout}
        />
      )}

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </>
  );
}
