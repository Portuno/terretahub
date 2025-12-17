import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { Users, FolderKanban, BookOpen, CalendarDays, LogIn, Layout, MessageSquareText, MessageCircle, Shield, Menu, X, Mountain, Wind, Flame, Droplets } from 'lucide-react';
import { AuthUser } from '../types';
import { isAdmin } from '../lib/userRoles';
import { useTheme, Theme } from '../context/ThemeContext';

interface SidebarProps {
  user: AuthUser | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenFeedback?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  user, 
  onOpenAuth,
  onLogout,
  onOpenFeedback
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  
  // Close mobile menu when location changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const menuItems = [
    { id: 'agora', path: '/agora', label: 'Ágora', icon: <MessageSquareText size={20} /> },
    { id: 'comunidad', path: '/comunidad', label: 'Comunidad', icon: <Users size={20} /> },
    { id: 'proyectos', path: '/proyectos', label: 'Proyectos', icon: <FolderKanban size={20} /> },
    { id: 'recursos', path: '/recursos', label: 'Recursos', icon: <BookOpen size={20} /> },
    { id: 'eventos', path: '/eventos', label: 'Eventos', icon: <CalendarDays size={20} /> },
  ];

  // Agregar sección Admin si el usuario es admin
  if (user && isAdmin(user)) {
    menuItems.push({ id: 'admin', path: '/admin', label: 'Admin', icon: <Shield size={20} /> });
  }

  const themes: { id: Theme; color: string; icon: React.ReactNode; label: string }[] = [
    { id: 'tierra', color: 'bg-[#D97706]', icon: <Mountain size={14} />, label: 'Tierra' },
    { id: 'aire', color: 'bg-[#0EA5E9]', icon: <Wind size={14} />, label: 'Aire' },
    { id: 'fuego', color: 'bg-[#F97316]', icon: <Flame size={14} />, label: 'Fuego' },
    { id: 'agua', color: 'bg-[#22D3EE]', icon: <Droplets size={14} />, label: 'Agua' },
  ];

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
        className="px-6 py-4 flex items-center gap-3 cursor-pointer group relative h-14 md:h-16"
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
        <div className="w-8 h-8 rounded-full bg-terreta-accent flex items-center justify-center text-white font-serif font-bold text-lg group-hover:scale-105 transition-transform">
          T
        </div>
        <h1 className="font-serif text-2xl text-terreta-dark font-bold tracking-tight group-hover:text-terreta-accent transition-colors">
          Terreta Hub
        </h1>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
        
        {/* User's "Mi Página" Link - Only if logged in */}
        {user && (
          <div className="mb-6">
             <NavLink
              to="/perfil"
              className={({ isActive }) => `w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group border border-terreta-accent/20 ${
                isActive
                  ? 'bg-terreta-card shadow-md' 
                  : 'bg-terreta-card/40 hover:bg-terreta-card'
              }`}
            >
              <span className="text-terreta-accent">
                <Layout size={20} />
              </span>
              <span className="font-sans font-bold text-sm tracking-wide text-terreta-dark">
                Mi Página
              </span>
            </NavLink>
            <div className="h-px bg-terreta-dark/5 mx-2 mt-4"></div>
          </div>
        )}

        {menuItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            className={({ isActive }) => `w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group ${
              isActive 
                ? 'bg-terreta-dark text-white shadow-lg' 
                : 'text-terreta-dark/70 hover:bg-terreta-card/40 hover:text-terreta-dark'
            }`}
          >
            {({ isActive }) => (
              <>
                <span className={isActive ? 'text-terreta-accent' : 'text-current opacity-70 group-hover:opacity-100'}>
                  {item.icon}
                </span>
                <span className={`font-sans font-medium text-sm tracking-wide ${isActive ? 'font-bold' : ''}`}>
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer / User Auth */}
      <div className="p-4 bg-terreta-bg/50 border-t border-terreta-border">
         
         {/* Theme Selector */}
         <div className="flex items-center justify-center gap-3 mb-6 p-2 bg-terreta-card/30 rounded-full border border-terreta-border/50">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300
                  ${theme === t.id ? 'scale-110 shadow-md ring-2 ring-terreta-dark ring-offset-1' : 'opacity-60 hover:opacity-100 hover:scale-105'}
                  ${t.color} text-white
                `}
                title={`Tema ${t.label}`}
                aria-label={`Cambiar a tema ${t.label}`}
              >
                {t.icon}
              </button>
            ))}
         </div>

         {/* Feedback Section */}
         <button
           type="button"
           onClick={() => {
             setIsMobileMenuOpen(false);
             onOpenFeedback?.();
           }}
           className="mb-4 px-2 w-full text-left rounded-lg hover:bg-terreta-card/40 transition-colors focus:outline-none focus:ring-2 focus:ring-terreta-accent focus:ring-offset-2 focus:ring-offset-terreta-sidebar"
           aria-label="Abrir feedback"
         >
           <h4 className="text-[10px] font-bold uppercase tracking-widest text-terreta-accent mb-1 flex items-center gap-1">
             <MessageCircle size={10} /> Feedback
           </h4>
           <p className="text-[11px] text-terreta-dark/60 leading-tight">
             Tu opinión importa. Ayúdanos a hacer de Terreta Hub el mejor hogar digital.
           </p>
         </button>

         {user ? (
            <div className="flex items-center gap-3 p-2 rounded-lg bg-terreta-card/50 border border-terreta-card/40">
               <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full bg-terreta-card" />
               <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-terreta-dark truncate">{user.name}</p>
                  <p className="text-xs text-terreta-dark/70 truncate">@{user.username}</p>
               </div>
               <button 
                  onClick={onLogout}
                  className="text-xs text-red-400 hover:text-red-600 font-bold px-2 py-1"
                >
                  Salir
               </button>
            </div>
         ) : (
            <button 
              onClick={onOpenAuth}
              className="w-full flex items-center justify-center gap-2 bg-terreta-dark text-white py-3 rounded-lg hover:bg-opacity-90 transition-colors shadow-sm"
            >
               <LogIn size={16} />
               <span className="text-xs font-bold uppercase tracking-wider">Ingresar</span>
            </button>
         )}
         
         <div className="text-center mt-4">
            <p className="text-[10px] uppercase tracking-widest text-terreta-dark/40 font-bold">
               Terreta Hub v1.0
            </p>
         </div>
      </div>
    </aside>
    </>
  );
};
