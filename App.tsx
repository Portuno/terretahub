import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from "@vercel/speed-insights/react";
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { AuthModal } from './components/AuthModal';
import { PublicLinkBio } from './components/PublicLinkBio';
import { PublicProject } from './components/PublicProject';
import { NotFound404 } from './components/NotFound404';
import { AuthUser } from './types';
import { supabase } from './lib/supabase';
import { AgoraFeed } from './components/AgoraFeed';
import { CommunityPage } from './components/CommunityPage';
import { ProjectsPage } from './components/ProjectsPage';
import { ResourceCollabPanel } from './components/ResourceCollabPanel';
import { AdminProjectsPanel } from './components/AdminProjectsPanel';
import { ProfileEditor } from './components/ProfileEditor';
import { PlaceholderPage } from './components/PlaceholderPage';
import { isAdmin } from './lib/userRoles';
import { ThemeProvider } from './context/ThemeContext';

const AppContent: React.FC = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const navigate = useNavigate();
  const userRef = useRef<AuthUser | null>(null); // Ref para verificar usuario sin causar re-renders

  // Función helper para cargar el perfil del usuario (con timeout aumentado)
  const loadUserProfile = async (userId: string): Promise<AuthUser | null> => {
    try {
      console.log('[App] Loading profile for user:', userId);
      const queryStartTime = Date.now();
      
      // Agregar timeout a la consulta (aumentado a 15 segundos para conexiones lentas)
      const profileQuery = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      const profileQueryWithTimeout = Promise.race([
        profileQuery,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Profile query timeout')), 15000)
        )
      ]) as Promise<{ data: any; error: any }>;
      
      const { data: profile, error: profileError } = await profileQueryWithTimeout;
      const queryDuration = Date.now() - queryStartTime;
      console.log('[App] Profile query completed', { duration: `${queryDuration}ms`, hasError: !!profileError });

      if (profileError) {
        console.error('[App] Error al cargar perfil:', profileError);
        // No retornar null inmediatamente - verificar si la sesión aún es válida
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.log('[App] Session expired during profile load');
          return null;
        }
        // Si la sesión sigue válida pero hay error, retornar null pero no perder la sesión
        return null;
      }

      if (profile) {
        return {
          id: profile.id,
          name: profile.name,
          username: profile.username,
          email: profile.email,
          avatar: profile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`,
          role: (profile.role as 'normal' | 'admin') || 'normal',
        };
      }
      return null;
    } catch (err: any) {
      console.error('[App] Error en loadUserProfile:', err);
      if (err.message?.includes('timeout')) {
        console.error('[App] Profile query timed out after 15 seconds');
        // Verificar si la sesión aún es válida antes de retornar null
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user?.id === userId) {
            console.log('[App] Session still valid despite timeout, keeping user');
            // La sesión sigue válida, no perder el usuario si ya estaba cargado
            return userRef.current; // Retornar el usuario actual si existe
          }
        } catch (sessionErr) {
          console.error('[App] Error checking session after timeout:', sessionErr);
        }
      }
      return null;
    }
  };

  // Check for session persistence on mount
  useEffect(() => {
    let isMounted = true;
    let sessionChecked = false;
    let isCheckingSession = false;
    let isLoadingProfile = false; // Prevenir múltiples cargas simultáneas

    // Timeout de seguridad: si después de 10 segundos no se ha verificado la sesión, continuar
    const safetyTimeout = setTimeout(() => {
      if (isMounted && !sessionChecked) {
        console.warn('[App] Safety timeout: forcing session check to complete');
        setIsLoadingSession(false);
        sessionChecked = true;
        isCheckingSession = false;
      }
    }, 10000);

    const checkSession = async () => {
      if (isCheckingSession) {
        console.log('[App] checkSession already in progress, skipping');
        return;
      }
      
      isCheckingSession = true;
      
      try {
        console.log('[App] Checking session...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('[App] Error al obtener sesión:', sessionError);
          if (isMounted) {
            setIsLoadingSession(false);
            setUser(null);
            sessionChecked = true;
            isCheckingSession = false;
          }
          return;
        }
        
        if (session?.user) {
          console.log('[App] Session found, loading profile...', { userId: session.user.id });
          isLoadingProfile = true;
          const loadedUser = await loadUserProfile(session.user.id);
          isLoadingProfile = false;
          if (isMounted) {
            // Solo actualizar si se cargó el perfil exitosamente
            // Si hay un error pero la sesión sigue válida, mantener el usuario actual si existe
            if (loadedUser) {
              setUser(loadedUser);
              userRef.current = loadedUser; // Actualizar ref
            } else if (!userRef.current) {
              // Solo establecer en null si no hay usuario previo
              setUser(null);
              userRef.current = null;
            }
            setIsLoadingSession(false);
            sessionChecked = true;
            isCheckingSession = false;
            console.log('[App] Session restored', { hasUser: !!loadedUser || !!userRef.current });
          }
        } else {
          console.log('[App] No session found');
          if (isMounted) {
            setUser(null);
            userRef.current = null; // Actualizar ref
            setIsLoadingSession(false);
            sessionChecked = true;
            isCheckingSession = false;
          }
        }
        } catch (err) {
        console.error('[App] Error en checkSession:', err);
        isLoadingProfile = false;
        if (isMounted) {
          setIsLoadingSession(false);
          setUser(null);
          userRef.current = null; // Actualizar ref
          sessionChecked = true;
          isCheckingSession = false;
        }
      }
    };

    checkSession();

    // Escuchar cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[App] Auth state changed', { event, hasSession: !!session, sessionChecked, isCheckingSession, isLoadingProfile });
      
      // Ignorar eventos durante la inicialización - checkSession ya los maneja
      if (!sessionChecked && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
        console.log('[App] Ignoring', event, 'event during initial session check');
        return;
      }
      
      try {
        if (event === 'SIGNED_OUT' || !session) {
          console.log('[App] User signed out');
          if (isMounted) {
            setUser(null);
            userRef.current = null; // Actualizar ref
            setIsLoadingSession(false);
            sessionChecked = true;
            isLoadingProfile = false;
          }
        } else if (event === 'SIGNED_IN') {
          // Solo manejar SIGNED_IN si:
          // 1. Ya se completó la verificación inicial
          // 2. No hay un usuario cargado actualmente
          // 3. No hay una carga de perfil en progreso
          if (session?.user && sessionChecked && !isLoadingProfile) {
            // Verificar si ya tenemos un usuario cargado con el mismo ID usando el ref
            // Si es así, no recargar (evita recargas innecesarias al volver a la pestaña)
            if (isMounted && userRef.current && userRef.current.id === session.user.id) {
              console.log('[App] User already loaded, ignoring SIGNED_IN event');
              return;
            }
            
            console.log('[App] User signed in after initial check, loading profile...', { userId: session.user.id });
            isLoadingProfile = true;
            const loadedUser = await loadUserProfile(session.user.id);
            isLoadingProfile = false;
            if (isMounted) {
              // Solo actualizar si se cargó el perfil exitosamente
              if (loadedUser) {
                setUser(loadedUser);
                userRef.current = loadedUser; // Actualizar ref
              }
              // Si hay error pero la sesión sigue válida, mantener el usuario actual si existe
              setIsLoadingSession(false);
              console.log('[App] User profile loaded', { hasUser: !!loadedUser || !!userRef.current });
            }
          } else {
            console.log('[App] Ignoring SIGNED_IN event', { 
              sessionChecked, 
              isLoadingProfile, 
              hasUser: !!userRef.current,
              userId: userRef.current?.id,
              sessionUserId: session?.user?.id
            });
          }
        } else if (event === 'TOKEN_REFRESHED') {
          // Token refresh no requiere recargar el perfil
          // Solo actualizar el estado si aún no se ha verificado la sesión
          console.log('[App] Token refreshed');
          if (isMounted && !sessionChecked) {
            setIsLoadingSession(false);
            sessionChecked = true;
          }
          // Si ya hay un usuario cargado, no hacer nada más
        }
      } catch (err) {
        console.error('[App] Error en onAuthStateChange:', err);
        isLoadingProfile = false;
        if (isMounted && !sessionChecked) {
          setIsLoadingSession(false);
          sessionChecked = true;
        }
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []); // Sin dependencias - el ref se actualiza cuando cambia user

  const handleLoginSuccess = (loggedInUser: AuthUser) => {
    setUser(loggedInUser);
    userRef.current = loggedInUser; // Actualizar ref
    setIsAuthModalOpen(false);
    navigate('/'); // Ir a home después de login
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    userRef.current = null; // Actualizar ref
    navigate('/');
  };

  // Mostrar loading mientras se verifica la sesión
  if (isLoadingSession) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-terreta-bg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-terreta-accent mx-auto mb-4"></div>
          <p className="text-terreta-dark">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<Dashboard user={user} onOpenAuth={() => setIsAuthModalOpen(true)} onLogout={handleLogout} />}>
          <Route index element={<LandingPage />} />
          <Route path="agora" element={<AgoraFeed user={user} onOpenAuth={() => setIsAuthModalOpen(true)} />} />
          <Route path="comunidad" element={<CommunityPage />} />
          <Route path="proyectos" element={<ProjectsPage user={user} onOpenAuth={() => setIsAuthModalOpen(true)} />} />
          <Route path="recursos" element={<ResourceCollabPanel user={user} />} />
          <Route path="eventos" element={<PlaceholderPage title="Eventos" />} />
          <Route path="perfil" element={
            user ? <ProfileEditor user={user} /> : <Navigate to="/" replace />
          } />
          <Route path="admin" element={
            user && isAdmin(user) ? <AdminProjectsPanel user={user} /> : <Navigate to="/" replace />
          } />
        </Route>

        <Route 
          path="/p/:extension" 
          element={<PublicLinkBio />} 
        />
        <Route 
          path="/proyecto/:slug" 
          element={<PublicProject />} 
        />
        <Route 
          path="*" 
          element={<NotFound404 variant="generic" />} 
        />
      </Routes>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
      
      <Analytics />
      <SpeedInsights />
    </>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </BrowserRouter>
  );
}
