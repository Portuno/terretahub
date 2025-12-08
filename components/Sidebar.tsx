import React, { useState } from 'react';
import { Users, FolderKanban, BookOpen, CalendarDays, LogIn, Layout, MessageSquareText, MessageCircle, Shield, Menu, X } from 'lucide-react';
import { AuthUser } from '../types';
import { isAdmin } from '../lib/userRoles';

interface SidebarProps {
  activeSection: string;
  onNavigate: (section: string) => void;
  user: AuthUser | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenFeedback?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeSection, 
  onNavigate, 
  user, 
  onOpenAuth,
  onLogout,
  onOpenFeedback
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuItems = [
    { id: 'agora', label: 'Ágora', icon: <MessageSquareText size={20} /> },
    { id: 'comunidad', label: 'Comunidad', icon: <Users size={20} /> },
    { id: 'proyectos', label: 'Proyectos', icon: <FolderKanban size={20} /> },
    { id: 'recursos', label: 'Recursos', icon: <BookOpen size={20} /> },
    { id: 'eventos', label: 'Eventos', icon: <CalendarDays size={20} /> },
  ];

  // Agregar sección Admin si el usuario es admin
  if (user && isAdmin(user)) {
    menuItems.push({ id: 'admin', label: 'Admin', icon: <Shield size={20} /> });
  }

  const handleNavigate = (section: string) => {
    onNavigate(section);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden fixed top-4 left-4 z-50 bg-[#EBE5DA] p-3 rounded-lg shadow-lg border border-[#D1C9BC]/30"
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
        w-64 lg:w-52 bg-[#EBE5DA] h-screen fixed left-0 top-0 flex flex-col border-r border-[#D1C9BC]/30 z-40
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:relative md:z-20
        transition-transform duration-300 ease-in-out
      `}>
      {/* Logo Area */}
      <div 
        className="p-8 pb-10 flex items-center gap-3 cursor-pointer group relative"
        onClick={() => handleNavigate('agora')}
      >
        {/* Close button for mobile */}
        <button
          onClick={() => setIsMobileMenuOpen(false)}
          className="md:hidden absolute top-4 right-4 p-2 rounded-lg hover:bg-white/40"
          aria-label="Close menu"
        >
          <X size={20} className="text-terreta-dark" />
        </button>
        <div className="w-8 h-8 rounded-full bg-[#D97706] flex items-center justify-center text-white font-serif font-bold text-lg group-hover:scale-105 transition-transform">
          T
        </div>
        <h1 className="font-serif text-2xl text-terreta-dark font-bold tracking-tight group-hover:text-[#D97706] transition-colors">
          Terreta Hub
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
        
        {/* User's "Mi Página" Link - Only if logged in */}
        {user && (
          <div className="mb-6">
             <button
              onClick={() => onNavigate('perfil')}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-xl transition-all duration-200 group border border-[#D97706]/20 ${
                activeSection === 'perfil'
                  ? 'bg-white shadow-md' 
                  : 'bg-white/40 hover:bg-white'
              }`}
            >
              <span className="text-[#D97706]">
                <Layout size={20} />
              </span>
              <span className="font-sans font-bold text-sm tracking-wide text-terreta-dark">
                Mi Página
              </span>
            </button>
            <div className="h-px bg-terreta-dark/5 mx-2 mt-4"></div>
          </div>
        )}

        {menuItems.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? 'bg-terreta-dark text-white shadow-lg' 
                  : 'text-terreta-dark/70 hover:bg-white/40 hover:text-terreta-dark'
              }`}
            >
              <span className={isActive ? 'text-[#D97706]' : 'text-current opacity-70 group-hover:opacity-100'}>
                {item.icon}
              </span>
              <span className={`font-sans font-medium text-sm tracking-wide ${isActive ? 'font-bold' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Footer / User Auth */}
      <div className="p-4 bg-[#E3DDD0]">
         
         {/* Feedback Section */}
         <div className="mb-4 px-2">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#D97706] mb-1 flex items-center gap-1">
              <MessageCircle size={10} /> Feedback
            </h4>
            <p className="text-[11px] text-terreta-dark/60 leading-tight">
              Tu opinión importa. Ayúdanos a hacer de Terreta Hub el mejor hogar digital.
            </p>
         </div>

         {user ? (
            <div className="flex items-center gap-3 p-2 rounded-lg bg-white/50 border border-white/40">
               <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full bg-white" />
               <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-terreta-dark truncate">{user.name}</p>
                  <p className="text-xs text-gray-500 truncate">@{user.username}</p>
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
              className="w-full flex items-center justify-center gap-2 bg-terreta-dark text-white py-3 rounded-lg hover:bg-[#2C1E1A] transition-colors shadow-sm"
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