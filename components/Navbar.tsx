import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Coins, LogIn, User, ChevronDown } from 'lucide-react';
import { AuthUser } from '../types';

interface NavbarProps {
  user: AuthUser | null;
  title: string;
  totesBalance: number;
  onOpenAuth: (referrerUsername?: string) => void;
  onLogout: () => void;
  rightSlot?: React.ReactNode;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  title,
  totesBalance,
  onOpenAuth,
  onLogout,
  rightSlot
}) => {
  const navigate = useNavigate();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const sectionLabel = useMemo(() => {
    if (!title) {
      return 'Explorar';
    }
    return title;
  }, [title]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleProfileAction = () => {
    setIsProfileMenuOpen(false);
    if (!user) {
      onOpenAuth();
      return;
    }
    navigate('/perfil');
  };

  const handleLogoutAction = () => {
    setIsProfileMenuOpen(false);
    onLogout();
  };

  return (
    <header className="sticky top-0 z-30 border-b border-gray-100 bg-terreta-nav/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center justify-between gap-3 px-4 md:px-6">
        <Link
          to="/explorar"
          className="inline-flex min-w-0 items-center gap-3 rounded-full px-2 py-1 transition-colors hover:bg-terreta-bg/70"
          aria-label="Ir a explorar en Terreta Hub"
        >
          <img src="/logo.png" alt="Faro de Terreta Hub" className="h-9 w-9 rounded-full object-cover" />
          <span className="hidden font-serif text-xl font-semibold tracking-tight text-terreta-dark sm:inline">
            Terreta Hub
          </span>
        </Link>

        <div className="hidden flex-1 justify-center md:flex">
          <span className="rounded-full border border-terreta-border bg-terreta-card/70 px-4 py-1 text-xs font-bold uppercase tracking-[0.2em] text-terreta-dark/80">
            ✦ {sectionLabel}
          </span>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          {rightSlot}
          <div className="inline-flex items-center gap-2 rounded-full border border-terreta-border bg-terreta-card/80 px-3 py-2 text-terreta-dark shadow-sm">
            <Coins size={15} className="text-amber-500" />
            <span className="text-sm font-black leading-none">{totesBalance}</span>
          </div>

          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setIsProfileMenuOpen((prev) => !prev)}
              className="inline-flex h-10 items-center gap-1 rounded-full border border-terreta-border bg-terreta-sidebar px-1 pr-2 text-terreta-dark transition-colors hover:bg-terreta-border/50"
              aria-label={user ? 'Abrir menú de usuario' : 'Abrir opciones de acceso'}
              aria-expanded={isProfileMenuOpen}
            >
              <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-terreta-card">
                {user ? (
                  <img src={user.avatar} alt={`Avatar de ${user.name}`} className="h-full w-full object-cover" />
                ) : (
                  <User size={16} />
                )}
              </span>
              <ChevronDown size={14} className="hidden sm:block" />
            </button>

            {isProfileMenuOpen ? (
              <div className="absolute right-0 top-[calc(100%+8px)] z-40 w-52 rounded-xl border border-terreta-border bg-terreta-card p-2 shadow-xl">
                <button
                  type="button"
                  onClick={handleProfileAction}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-terreta-dark transition-colors hover:bg-terreta-bg"
                  aria-label={user ? 'Ir a tu perfil' : 'Iniciar sesión o registrarte'}
                >
                  {user ? <User size={14} /> : <LogIn size={14} />}
                  {user ? 'Mi perfil' : 'Ingresar o crear cuenta'}
                </button>
                {user ? (
                  <button
                    type="button"
                    onClick={handleLogoutAction}
                    className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-red-500 transition-colors hover:bg-red-50"
                    aria-label="Cerrar sesión"
                  >
                    Salir
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
};
