import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { AuthModal } from './components/AuthModal';
import { PublicLinkBio } from './components/PublicLinkBio';
import { AuthUser } from './types';
import { supabase } from './lib/supabase';

const AppContent: React.FC = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const navigate = useNavigate();

  // Check for session persistence on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error al obtener sesión:', sessionError);
          return;
        }
        
        if (session?.user) {
          // Obtener perfil del usuario
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError) {
            console.error('Error al cargar perfil:', profileError);
            return;
          }

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
      } catch (err) {
        console.error('Error en checkSession:', err);
      }
    };

    checkSession();

    // Escuchar cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (event === 'SIGNED_OUT' || !session) {
          setUser(null);
          // No redirigir automáticamente, permitir que el usuario se quede en /app
        } else if (event === 'SIGNED_IN' && session?.user) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError) {
            console.error('Error al cargar perfil en onAuthStateChange:', profileError);
            return;
          }

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
      } catch (err) {
        console.error('Error en onAuthStateChange:', err);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleLoginSuccess = (loggedInUser: AuthUser) => {
    setUser(loggedInUser);
    setIsAuthModalOpen(false);
    navigate('/app');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    navigate('/');
  };

  const handleEnterApp = () => {
    // Permitir acceso a /app sin necesidad de estar logueado
    navigate('/app');
  };

  return (
    <>
      <Routes>
        <Route 
          path="/" 
          element={<LandingPage onEnterApp={handleEnterApp} />} 
        />
        <Route 
          path="/app" 
          element={
            <Dashboard 
              user={user} 
              onOpenAuth={() => setIsAuthModalOpen(true)} 
              onLogout={handleLogout}
            />
          } 
        />
        <Route 
          path="/p/:username/:extension?" 
          element={<PublicLinkBio />} 
        />
        <Route 
          path="*" 
          element={<Navigate to="/" replace />} 
        />
      </Routes>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
