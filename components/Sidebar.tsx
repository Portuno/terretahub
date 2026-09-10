import React, { useEffect } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { Users, FolderKanban, BookOpen, CalendarDays, LogIn, MessageSquareText, MessageCircle, Shield, X, FileText, MapPin } from 'lucide-react';
import { AuthUser } from '../types';
import { isAdmin } from '../lib/userRoles';
import { ThemeOracle } from './ThemeOracle';

interface SidebarProps {
  user: AuthUser | null;
  onOpenAuth: (referrerUsername?: string) => void;
  onLogout: () => void;
  onOpenFeedback?: () => void;
  onOpenGruposModal?: () => void;
  isMobileMenuOpen?: boolean;
  onCloseMobileMenu?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  onOpenAuth,
  onLogout,
  onOpenFeedback,
  onOpenGruposModal: _onOpenGruposModal,
  isMobileMenuOpen = false,
  onCloseMobileMenu,
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const closeMobileMenu = () => {
    onCloseMobileMenu?.();
  };

  useEffect(() => {
    closeMobileMenu();
  }, [location.pathname]);

  const menuItems = [
    { id: 'agora', path: '/agora', label: 'Ágora', icon: <MessageSquareText size={20} /> },
    { id: 'comunidad', path: '/comunidad', label: 'Comunidad', icon: <Users size={20} /> },
    { id: 'proyectos', path: '/proyectos', label: 'Proyectos', icon: <FolderKanban size={20} /> },
    { id: 'eventos', path: '/eventos', label: 'Quedadas', icon: <CalendarDays size={20} /> },
    { id: 'mapa', path: '/propiedades', label: 'Mapa', icon: <MapPin size={20} /> },
    { id: 'recursos', path: '/recursos', label: 'Recursos', icon: <BookOpen size={20} /> },
    { id: 'dominio', path: '/dominio', label: 'Dominios', icon: <FolderKanban size={20} /> },
    { id: 'blogs', path: '/blogs', label: 'Blogs', icon: <FileText size={20} /> },
  ];

  if (user && isAdmin(user)) {
    menuItems.push({ id: 'admin', path: '/admin', label: 'Admin', icon: <Shield size={20} /> });
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={closeMobileMenu}
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
            closeMobileMenu();
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
        {menuItems.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              onClick={closeMobileMenu}
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
        ))}
      </nav>

      {/* Footer / User Auth */}
      <div className="p-4 bg-terreta-bg/50 border-t border-terreta-border">
         
         {/* Theme Oracle */}
         <ThemeOracle />

         {user ? (
            <div 
              onClick={() => {
                closeMobileMenu();
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
             closeMobileMenu();
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
