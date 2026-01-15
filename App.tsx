import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
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
import { AdminEventsPanel } from './components/AdminEventsPanel';
import { AdminBlogsPanel } from './components/AdminBlogsPanel';
import { ProfileEditor } from './components/ProfileEditor';
import { PlaceholderPage } from './components/PlaceholderPage';
import { EventsPage } from './components/EventsPage';
import { TermsAndConditions } from './components/TermsAndConditions';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { Documentation } from './components/Documentation';
import { AgoraPostPage } from './components/AgoraPostPage';
import { BlogsPage } from './components/BlogsPage';
import { BlogPostPage } from './components/BlogPostPage';
import { isAdmin } from './lib/userRoles';
import { ThemeProvider } from './context/ThemeContext';
import { OnboardingFlow } from './components/OnboardingFlow';

const AppContent: React.FC = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);
  const [authReferrerUsername, setAuthReferrerUsername] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const userRef = useRef<AuthUser | null>(null); // Ref para verificar usuario sin causar re-renders

  // Función helper para cargar el perfil del usuario (con retry y mejor manejo de timeout)
  const loadUserProfile = async (userId: string, retryCount = 0): Promise<AuthUser | null> => {
    const MAX_RETRIES = 2;
    const INITIAL_TIMEOUT = 8000; // 8 segundos iniciales
    const RETRY_TIMEOUT = 10000; // 10 segundos en retries
    
    try {
      console.log('[App] Loading profile for user:', userId, retryCount > 0 ? `(retry ${retryCount}/${MAX_RETRIES})` : '');
      const queryStartTime = Date.now();
      
      // Usar timeout más corto con retries en lugar de un timeout largo
      const timeoutDuration = retryCount === 0 ? INITIAL_TIMEOUT : RETRY_TIMEOUT;
      
      // Optimized: Select only needed columns instead of *
      const profileQuery = supabase
        .from('profiles')
        .select('id, name, username, email, avatar, role, onboarding_completed')
        .eq('id', userId)
        .single();
      
      // Crear una promesa con timeout que puede ser cancelada
      let timeoutId: NodeJS.Timeout | null = null;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(`Profile query timeout after ${timeoutDuration}ms`));
        }, timeoutDuration);
      });
      
      try {
        const { data: profile, error: profileError } = await Promise.race([
          profileQuery,
          timeoutPromise
        ]) as { data: any; error: any };
        
        // Limpiar timeout si la query completó
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        
        const queryDuration = Date.now() - queryStartTime;
        console.log('[App] Profile query completed', { duration: `${queryDuration}ms`, hasError: !!profileError, retryCount });

        if (profileError) {
          // Errores que no deberían retry (errores de autenticación, no encontrado, etc.)
          const nonRetryableErrors = ['PGRST116', '23505', '42501'];
          const isRetryable = !nonRetryableErrors.some(code => 
            profileError.code === code || profileError.message?.includes(code)
          );
          
          if (isRetryable && retryCount < MAX_RETRIES) {
            console.log('[App] Retryable error, attempting retry...', { 
              error: profileError.message, 
              code: profileError.code,
              retryCount: retryCount + 1 
            });
            // Esperar un poco antes de retry (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
            return loadUserProfile(userId, retryCount + 1);
          }
          
          console.error('[App] Error al cargar perfil:', profileError);
          // Verificar si la sesión aún es válida
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            console.log('[App] Session expired during profile load');
            return null;
          }
          // Si la sesión sigue válida pero hay error, retornar null pero no perder la sesión
          return null;
        }

        if (profile) {
          const loadedUser = {
            id: profile.id,
            name: profile.name,
            username: profile.username,
            email: profile.email,
            avatar: profile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`,
            role: (profile.role as 'normal' | 'admin') || 'normal',
          };
          
          // Actualizar estado de onboarding
          setOnboardingCompleted(profile.onboarding_completed ?? false);
          
          return loadedUser;
        }
        return null;
      } catch (raceError: any) {
        // Limpiar timeout si aún está activo
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        throw raceError;
      }
    } catch (err: any) {
      console.error('[App] Error en loadUserProfile:', err);
      
        if (err.message?.includes('timeout')) {
        console.error(`[App] Profile query timed out after ${retryCount === 0 ? INITIAL_TIMEOUT : RETRY_TIMEOUT}ms`);
        
        // Intentar retry si aún tenemos intentos disponibles
        if (retryCount < MAX_RETRIES) {
          console.log('[App] Timeout occurred, attempting retry...', { retryCount: retryCount + 1 });
          // Esperar un poco antes de retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
          return loadUserProfile(userId, retryCount + 1);
        }
        
        // Si ya agotamos los retries, verificar si la sesión aún es válida
        // NO perder la sesión solo por un timeout de query
        try {
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          if (sessionError) {
            console.error('[App] Error checking session after timeout:', sessionError);
            // Si hay error al verificar sesión, podría ser un problema de red
            // Mantener el usuario si ya estaba cargado
            return userRef.current;
          }
          
          if (session?.user?.id === userId) {
            console.log('[App] Session still valid despite timeout, keeping user');
            // La sesión sigue válida, no perder el usuario si ya estaba cargado
            return userRef.current; // Retornar el usuario actual si existe
          } else {
            // La sesión expiró realmente
            console.log('[App] Session expired, returning null');
            return null;
          }
        } catch (sessionErr) {
          console.error('[App] Error checking session after timeout:', sessionErr);
          // En caso de error, mantener el usuario si existe para no perder la sesión incorrectamente
          return userRef.current;
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
              // El estado de onboarding se actualiza en loadUserProfile
            } else if (!userRef.current) {
              // Solo establecer en null si no hay usuario previo
              setUser(null);
              userRef.current = null;
              setOnboardingCompleted(null);
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
            setOnboardingCompleted(null);
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
                // El estado de onboarding se actualiza en loadUserProfile
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

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const invitationParam = params.get('invitacion');

    if (invitationParam) {
      const normalizedReferrer = invitationParam.trim().toLowerCase();
      setAuthReferrerUsername(normalizedReferrer);
      try {
        localStorage.setItem('pending_referrer', normalizedReferrer);
      } catch (err) {
        console.warn('[App] Could not store pending referrer:', err);
      }
    }
  }, [location.search]);

  useEffect(() => {
    if (authReferrerUsername) return;
    try {
      const stored = localStorage.getItem('pending_referrer');
      if (stored) {
        setAuthReferrerUsername(stored);
      }
    } catch (err) {
      console.warn('[App] Could not read pending referrer:', err);
    }
  }, [authReferrerUsername]);

  const handleLoginSuccess = async (loggedInUser: AuthUser) => {
    setUser(loggedInUser);
    userRef.current = loggedInUser; // Actualizar ref
    setIsAuthModalOpen(false);
    
    // Verificar estado de onboarding
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', loggedInUser.id)
      .single();
    
    setOnboardingCompleted(profile?.onboarding_completed ?? false);
    navigate('/'); // Ir a home después de login
  };

  const handleOnboardingComplete = async () => {
    if (user) {
      // Recargar perfil para obtener el estado actualizado
      const loadedUser = await loadUserProfile(user.id);
      if (loadedUser) {
        setUser(loadedUser);
        userRef.current = loadedUser;
      }
      setOnboardingCompleted(true);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    userRef.current = null; // Actualizar ref
    navigate('/');
  };

  const handleOpenAuth = (referrerUsername?: string) => {
    if (typeof referrerUsername === 'string' && referrerUsername.trim()) {
      const normalizedReferrer = referrerUsername.trim().toLowerCase();
      setAuthReferrerUsername(normalizedReferrer);
      try {
        localStorage.setItem('pending_referrer', normalizedReferrer);
      } catch (err) {
        console.warn('[App] Could not store pending referrer:', err);
      }
    }
    setIsAuthModalOpen(true);
  };

  const handleReferralConsumed = () => {
    setAuthReferrerUsername(null);
    try {
      localStorage.removeItem('pending_referrer');
    } catch (err) {
      console.warn('[App] Could not clear pending referrer:', err);
    }
  };

  // Mostrar loading mientras se verifica la sesión
  if (isLoadingSession || (user && onboardingCompleted === null)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-terreta-bg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-terreta-accent mx-auto mb-4"></div>
          <p className="text-terreta-dark">Cargando...</p>
        </div>
      </div>
    );
  }

  // Mostrar onboarding si el usuario está logueado pero no ha completado el onboarding
  if (user && onboardingCompleted === false) {
    return (
      <>
        <OnboardingFlow user={user} onComplete={handleOnboardingComplete} />
        <Analytics />
        <SpeedInsights />
      </>
    );
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<Dashboard user={user} onOpenAuth={handleOpenAuth} onLogout={handleLogout} />}>
          <Route index element={<LandingPage />} />
          <Route path="agora" element={<AgoraFeed user={user} onOpenAuth={handleOpenAuth} />} />
          <Route path="comunidad" element={<CommunityPage user={user} onOpenAuth={handleOpenAuth} />} />
          <Route path="proyectos" element={<ProjectsPage user={user} onOpenAuth={handleOpenAuth} />} />
          <Route path="recursos" element={<ResourceCollabPanel user={user} onOpenAuth={handleOpenAuth} />} />
          <Route path="eventos" element={<EventsPage user={user} onOpenAuth={handleOpenAuth} />} />
          <Route path="blogs" element={<BlogsPage user={user} onOpenAuth={handleOpenAuth} />} />
          <Route path="perfil" element={
            user ? <ProfileEditor user={user} /> : <Navigate to="/" replace />
          } />
          <Route path="admin" element={
            user && isAdmin(user) ? <AdminProjectsPanel user={user} /> : <Navigate to="/" replace />
          } />
          <Route path="admin/blogs" element={
            user && isAdmin(user) ? <AdminBlogsPanel user={user} /> : <Navigate to="/" replace />
          } />
        </Route>

        <Route 
          path="/p/:extension" 
          element={<PublicLinkBio user={user} onOpenAuth={handleOpenAuth} />} 
        />
        <Route 
          path="/proyecto/:slug" 
          element={<PublicProject />} 
        />
        <Route 
          path="/terminos-y-condiciones" 
          element={<TermsAndConditions />} 
        />
        <Route 
          path="/politica-de-privacidad" 
          element={<PrivacyPolicy />} 
        />
        <Route 
          path="/docs" 
          element={<Documentation />} 
        />
        <Route 
          path="/agora/post/:id" 
          element={<AgoraPostPage user={user} onOpenAuth={handleOpenAuth} />} 
        />
        <Route 
          path="/blog/:username/:slug" 
          element={<BlogPostPage user={user} onOpenAuth={handleOpenAuth} />} 
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
        referrerUsername={authReferrerUsername}
        startInRegister={!!authReferrerUsername}
        onReferralConsumed={handleReferralConsumed}
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
