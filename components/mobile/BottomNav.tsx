import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { CalendarDays, FolderKanban, MessageSquareText, Plus, User } from 'lucide-react';
import type { AuthUser } from '../../types';

interface BottomNavProps {
  user: AuthUser | null;
  onOpenAuth: () => void;
  onOpenCreate: () => void;
}

const destinations = [
  { to: '/agora', label: 'Ágora', icon: MessageSquareText },
  { to: '/eventos', label: 'Quedadas', icon: CalendarDays },
  { to: '/proyectos', label: 'Proyectos', icon: FolderKanban },
] as const;

export const BottomNav: React.FC<BottomNavProps> = ({ user, onOpenAuth, onOpenCreate }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const profileActive = location.pathname === '/perfil';

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-terreta-border bg-terreta-nav shadow-shell md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Navegación principal"
    >
      <div className="grid h-16 grid-cols-5">
        {destinations.slice(0, 2).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex min-w-0 flex-col items-center justify-center gap-1 text-m-sm ${
                isActive ? 'text-terreta-accent' : 'text-terreta-dark/70'
              }`
            }
          >
            <item.icon size={20} aria-hidden />
            <span className="truncate">{item.label}</span>
          </NavLink>
        ))}
        <button
          type="button"
          onClick={onOpenCreate}
          className="flex flex-col items-center justify-center text-terreta-accent"
          aria-label="Abrir acciones"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-terreta-accent text-white shadow-raised">
            <Plus size={22} aria-hidden />
          </span>
        </button>
        <NavLink
          to="/proyectos"
          className={({ isActive }) =>
            `flex min-w-0 flex-col items-center justify-center gap-1 text-m-sm ${
              isActive ? 'text-terreta-accent' : 'text-terreta-dark/70'
            }`
          }
        >
          <FolderKanban size={20} aria-hidden />
          <span className="truncate">Proyectos</span>
        </NavLink>
        <button
          type="button"
          onClick={() => {
            if (!user) {
              onOpenAuth();
              return;
            }
            navigate('/perfil');
          }}
          className={`flex min-w-0 flex-col items-center justify-center gap-1 text-m-sm ${
            profileActive ? 'text-terreta-accent' : 'text-terreta-dark/70'
          }`}
          aria-label={user ? 'Perfil' : 'Crear perfil'}
          aria-current={profileActive ? 'page' : undefined}
        >
          <User size={20} aria-hidden />
          <span className="truncate">Perfil</span>
        </button>
      </div>
    </nav>
  );
};
