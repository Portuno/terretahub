import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { Users, FolderKanban, BookOpen, CalendarDays, LogIn, MessageSquareText, MessageCircle, Shield, Menu, X, Mountain, Wind, Flame, Droplets, FileText, ChevronDown, ChevronUp, User, UsersRound } from 'lucide-react';
import { AuthUser } from '../types';
import { isAdmin } from '../lib/userRoles';
import { useTheme, THEMES, Theme } from '../context/ThemeContext';

interface SidebarProps {
  user: AuthUser | null;
  onOpenAuth: (referrerUsername?: string) => void;
  onLogout: () => void;
  onOpenFeedback?: () => void;
  onOpenGruposModal?: () => void;
}

const ThemeOracle = () => {
  const { theme, setTheme } = useTheme();
  
  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    // Visual feedback/vibration if supported
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center my-8 relative group/oracle">
       {/* Rotating Ring */}
       <div className="absolute w-40 h-40 border border-terreta-dark/5 rounded-full animate-spin-slow pointer-events-none"></div>

       {/* Glassmorphic Container */}
       <div className="relative w-32 h-32 flex items-center justify-center backdrop-blur-sm bg-white/5 rounded-full border border-white/10 shadow-inner">
          
          {/* Central Diamond */}
          <div className="absolute w-16 h-16 border border-terreta-dark/10 rotate-45 transition-all duration-500 bg-white/5 backdrop-blur-md"></div>

          {/* Icons */}
          
          {/* AIRE (Top) */}
          <button
             onClick={() => handleThemeChange('aire')}
             className="absolute -top-1 left-1/2 -translate-x-1/2 p-2 focus:outline-none group/icon transition-all duration-300"
             aria-label="Tema Aire"
          >
             <Wind 
                size={20} 
                className={`transition-all duration-500 ${theme === 'aire' ? 'text-cyan-500 opacity-100 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] scale-110' : 'text-terreta-dark opacity-30 group-hover/icon:opacity-100'}`}
             />
             <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-serif font-bold text-cyan-600 opacity-0 group-hover/icon:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap">Aire</span>
          </button>

          {/* TIERRA (Bottom) */}
          <button
             onClick={() => handleThemeChange('tierra')}
             className="absolute -bottom-1 left-1/2 -translate-x-1/2 p-2 focus:outline-none group/icon transition-all duration-300"
             aria-label="Tema Tierra"
          >
             <Mountain 
                size={20} 
                className={`transition-all duration-500 ${theme === 'tierra' ? 'text-orange-600 opacity-100 drop-shadow-[0_0_8px_rgba(217,119,6,0.8)] scale-110' : 'text-terreta-dark opacity-30 group-hover/icon:opacity-100'}`}
             />
             <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-serif font-bold text-orange-700 opacity-0 group-hover/icon:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap">Tierra</span>
          </button>

          {/* AGUA (Left) */}
          <button
             onClick={() => handleThemeChange('agua')}
             className="absolute top-1/2 -left-1 -translate-y-1/2 p-2 focus:outline-none group/icon transition-all duration-300"
             aria-label="Tema Agua"
          >
             <Droplets 
                size={20} 
                className={`transition-all duration-500 ${theme === 'agua' ? 'text-blue-500 opacity-100 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)] scale-110' : 'text-terreta-dark opacity-30 group-hover/icon:opacity-100'}`}
             />
             <span className="absolute top-1/2 -left-10 -translate-y-1/2 text-[10px] font-serif font-bold text-blue-600 opacity-0 group-hover/icon:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap">Agua</span>
          </button>

          {/* FUEGO (Right) */}
          <button
             onClick={() => handleThemeChange('fuego')}
             className="absolute top-1/2 -right-1 -translate-y-1/2 p-2 focus:outline-none group/icon transition-all duration-300"
             aria-label="Tema Fuego"
          >
             <Flame 
                size={20} 
                className={`transition-all duration-500 ${theme === 'fuego' ? 'text-red-500 opacity-100 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)] scale-110 animate-pulse-slow' : 'text-terreta-dark opacity-30 group-hover/icon:opacity-100'}`}
             />
             <span className="absolute top-1/2 -right-10 -translate-y-1/2 text-[10px] font-serif font-bold text-red-600 opacity-0 group-hover/icon:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap">Fuego</span>
          </button>

          {/* Center Element */}
          <div className={`w-2 h-2 rounded-full transition-colors duration-700 ${
             theme === 'aire' ? 'bg-cyan-200 shadow-[0_0_10px_2px_rgba(165,243,252,0.8)]' :
             theme === 'tierra' ? 'bg-orange-200 shadow-[0_0_10px_2px_rgba(254,215,170,0.8)]' :
             theme === 'agua' ? 'bg-blue-200 shadow-[0_0_10px_2px_rgba(191,219,254,0.8)]' :
             'bg-red-200 shadow-[0_0_10px_2px_rgba(254,202,202,0.8)]'
          }`}></div>

       </div>
    </div>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  onOpenAuth,
  onLogout,
  onOpenFeedback,
  onOpenGruposModal,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isComunidadOpen, setIsComunidadOpen] = useState(false);
  const comunidadRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const isComunidadActive = location.pathname === '/miembros' || location.pathname === '/proyectos';

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    setIsComunidadOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (comunidadRef.current && !comunidadRef.current.contains(event.target as Node)) {
        setIsComunidadOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const menuItems = [
    { id: 'agora', path: '/agora', label: 'Ágora', icon: <MessageSquareText size={20} /> },
    { id: 'comunidad', path: '/miembros', label: 'Comunidad', icon: <Users size={20} /> },
    { id: 'dominio', path: '/dominio', label: 'Dominios', icon: <FolderKanban size={20} /> },
    { id: 'recursos', path: '/recursos', label: 'Recursos', icon: <BookOpen size={20} /> },
    { id: 'eventos', path: '/eventos', label: 'Eventos', icon: <CalendarDays size={20} /> },
    { id: 'blogs', path: '/blogs', label: 'Blogs', icon: <FileText size={20} /> },
  ];

  if (user && isAdmin(user)) {
    menuItems.push({ id: 'admin', path: '/admin', label: 'Admin', icon: <Shield size={20} /> });
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden fixed top-4 left-4 z-50 bg-terreta-sidebar p-3 rounded-lg shadow-lg border border-terreta-border"
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? <X size={24} className="text-terreta-dark" /> : <Menu size={24} className="text-terreta-dark" />}
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Desktop & Mobile */}
      <aside className={`
        w-64 bg-terreta-sidebar h-screen fixed left-0 top-0 flex flex-col border-r border-terreta-border z-40
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:relative md:z-20
        transition-transform duration-300 ease-in-out
      `}>
      {/* Logo Area */}
      <Link 
        to="/"
        className="px-6 py-4 flex items-center gap-3 cursor-pointer group relative h-14 md:h-16 bg-transparent"
      >
        {/* Close button for mobile */}
        <button
          onClick={(e) => {
            e.preventDefault();
            setIsMobileMenuOpen(false);
          }}
          className="md:hidden absolute top-4 right-4 p-2 rounded-lg hover:bg-terreta-bg/40"
          aria-label="Close menu"
        >
          <X size={20} className="text-terreta-dark" />
        </button>
        <img 
          src="/logo.png" 
          alt="Terreta Hub" 
          className="w-14 h-14 rounded-full object-cover group-hover:scale-105 transition-transform"
        />
        <h1 className="font-sans text-2xl text-terreta-dark font-bold tracking-tight group-hover:text-terreta-accent transition-colors">
          Terreta Hub
        </h1>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          if (item.id === 'comunidad') {
            return (
              <div key={item.id} ref={comunidadRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsComunidadOpen((prev) => !prev)}
                  className={`w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl transition-all duration-200 group border ${
                    isComunidadActive
                      ? 'bg-terreta-card text-terreta-dark shadow-lg border-terreta-accent/40'
                      : 'text-terreta-dark/70 hover:bg-terreta-card/40 hover:text-terreta-dark border-transparent'
                  }`}
                  aria-expanded={isComunidadOpen}
                  aria-haspopup="true"
                  aria-label="Comunidad: Miembros, Proyectos, Grupos"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <span
                      className={
                        isComunidadActive
                          ? 'text-terreta-accent'
                          : 'text-current opacity-70 group-hover:opacity-100'
                      }
                    >
                      {item.icon}
                    </span>
                    <span
                      className={`font-sans font-medium text-sm tracking-wide truncate ${
                        isComunidadActive ? 'font-bold' : ''
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>
                  {isComunidadOpen ? (
                    <ChevronUp size={18} className="flex-shrink-0 text-terreta-dark/70" />
                  ) : (
                    <ChevronDown size={18} className="flex-shrink-0 text-terreta-dark/70" />
                  )}
                </button>
                {isComunidadOpen && (
                  <div className="mt-1 ml-4 pl-4 border-l-2 border-terreta-border space-y-1">
                    <NavLink
                      to="/miembros"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 border ${
                          isActive
                            ? 'bg-terreta-card text-terreta-dark border-terreta-accent/40'
                            : 'text-terreta-dark/70 hover:bg-terreta-card/40 border-transparent'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <User size={18} className={isActive ? 'text-terreta-accent' : 'opacity-70'} />
                          <span className="font-sans font-medium text-sm">Miembros</span>
                        </>
                      )}
                    </NavLink>
                    <NavLink
                      to="/proyectos"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 border ${
                          isActive
                            ? 'bg-terreta-card text-terreta-dark border-terreta-accent/40'
                            : 'text-terreta-dark/70 hover:bg-terreta-card/40 border-transparent'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <FolderKanban size={18} className={isActive ? 'text-terreta-accent' : 'opacity-70'} />
                          <span className="font-sans font-medium text-sm">Proyectos</span>
                        </>
                      )}
                    </NavLink>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onOpenGruposModal?.();
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 border border-transparent text-terreta-dark/70 hover:bg-terreta-card/40 hover:text-terreta-dark text-left"
                      aria-label="Grupos – Próximamente"
                    >
                      <UsersRound size={18} className="opacity-70" />
                      <span className="font-sans font-medium text-sm">Grupos</span>
                    </button>
                  </div>
                )}
              </div>
            );
          }
          return (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) =>
                `w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group border ${
                  isActive
                    ? 'bg-terreta-card text-terreta-dark shadow-lg border-terreta-accent/40'
                    : 'text-terreta-dark/70 hover:bg-terreta-card/40 hover:text-terreta-dark border-transparent'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={
                      isActive
                        ? 'text-terreta-accent'
                        : 'text-current opacity-70 group-hover:opacity-100'
                    }
                  >
                    {item.icon}
                  </span>
                  <span
                    className={`font-sans font-medium text-sm tracking-wide ${
                      isActive ? 'font-bold' : ''
                    }`}
                  >
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer / User Auth */}
      <div className="p-4 bg-terreta-bg/50 border-t border-terreta-border">
         
         {/* Theme Oracle */}
         <ThemeOracle />

         {user ? (
            <div 
              onClick={() => {
                setIsMobileMenuOpen(false);
                navigate('/perfil');
              }}
              className="flex items-center gap-3 p-2 rounded-lg bg-terreta-card/50 border border-terreta-card/40 cursor-pointer hover:bg-terreta-card/70 transition-colors mb-4"
            >
               <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full bg-terreta-card" />
               <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-terreta-dark truncate">{user.name}</p>
                  <p className="text-xs text-terreta-dark/70 truncate">@{user.username}</p>
               </div>
               <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onLogout();
                  }}
                  className="text-xs text-red-400 hover:text-red-600 font-bold px-2 py-1"
                >
                  Salir
               </button>
            </div>
         ) : (
            <button 
              onClick={onOpenAuth}
              className="w-full flex items-center justify-center gap-2 bg-terreta-accent text-white py-3 rounded-lg hover:opacity-90 transition-all shadow-md hover:shadow-lg font-bold mb-4"
            >
               <LogIn size={16} className="stroke-[2.5]" />
               <span className="text-xs font-bold uppercase tracking-wider">Ingresar</span>
            </button>
         )}

         {/* Feedback Section - Moved to bottom */}
         <button
           type="button"
           onClick={() => {
             setIsMobileMenuOpen(false);
             onOpenFeedback?.();
           }}
           className="w-full px-2 py-2 text-left rounded-lg hover:bg-terreta-card/40 transition-colors focus:outline-none focus:ring-2 focus:ring-terreta-accent focus:ring-offset-2 focus:ring-offset-terreta-sidebar"
           aria-label="Abrir feedback"
         >
           <h4 className="text-[10px] font-bold uppercase tracking-widest text-terreta-accent mb-1 flex items-center gap-1">
             <MessageCircle size={10} /> Feedback
           </h4>
           <p className="text-[11px] text-terreta-dark/60 leading-tight">
             Tu opinión importa. Ayúdanos a hacer de Terreta Hub el mejor hogar digital.
           </p>
         </button>
      </div>
    </aside>
    </>
  );
};
