import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Coins, LogIn, User, ChevronDown } from 'lucide-react';
import { AuthUser } from '../types';

const TERRIS_PANEL_ID = 'terris-hint-panel';
const HOVER_LEAVE_MS = 220;

interface NavbarProps {
  user: AuthUser | null;
  title: string;
  totesBalance: number;
  onOpenAuth: (referrerUsername?: string) => void;
  onLogout: () => void;
  rightSlot?: React.ReactNode;
  centerContent?: React.ReactNode;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  title,
  totesBalance,
  onOpenAuth,
  onLogout,
  rightSlot,
  centerContent
}) => {
  const navigate = useNavigate();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isTerrisMenuOpen, setIsTerrisMenuOpen] = useState(false);
  const [isTerrisHoverOpen, setIsTerrisHoverOpen] = useState(false);
  const [isTerrisFocusInside, setIsTerrisFocusInside] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const terrisRef = useRef<HTMLDivElement>(null);
  const terrisHoverLeaveTimerRef = useRef<number | null>(null);

  const sectionLabel = useMemo(() => {
    if (!title) {
      return 'Explorar';
    }
    return title;
  }, [title]);

  const showTerrisPanel = isTerrisMenuOpen || isTerrisHoverOpen || isTerrisFocusInside;

  useEffect(() => {
    const clearTerrisHoverTimer = () => {
      if (terrisHoverLeaveTimerRef.current !== null) {
        window.clearTimeout(terrisHoverLeaveTimerRef.current);
        terrisHoverLeaveTimerRef.current = null;
      }
    };

    const handlePointerOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) {
        setIsProfileMenuOpen(false);
      }
      if (terrisRef.current && !terrisRef.current.contains(target)) {
        setIsTerrisMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return;
      }
      if (!terrisRef.current?.contains(document.activeElement)) {
        return;
      }
      setIsTerrisMenuOpen(false);
      const active = document.activeElement;
      if (active instanceof HTMLElement) {
        active.blur();
      }
    };

    document.addEventListener('mousedown', handlePointerOutside);
    document.addEventListener('touchstart', handlePointerOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handlePointerOutside);
      document.removeEventListener('touchstart', handlePointerOutside);
      document.removeEventListener('keydown', handleEscape);
      clearTerrisHoverTimer();
    };
  }, []);

  useEffect(() => {
    const node = terrisRef.current;
    if (!node) {
      return;
    }

    const handleFocusOut = () => {
      window.requestAnimationFrame(() => {
        if (!node.contains(document.activeElement)) {
          setIsTerrisFocusInside(false);
        }
      });
    };

    const handleFocusIn = () => {
      setIsTerrisFocusInside(true);
    };

    node.addEventListener('focusin', handleFocusIn);
    node.addEventListener('focusout', handleFocusOut);
    return () => {
      node.removeEventListener('focusin', handleFocusIn);
      node.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  const handleTerrisWrapperMouseEnter = () => {
    if (terrisHoverLeaveTimerRef.current !== null) {
      window.clearTimeout(terrisHoverLeaveTimerRef.current);
      terrisHoverLeaveTimerRef.current = null;
    }
    setIsTerrisHoverOpen(true);
  };

  const handleTerrisWrapperMouseLeave = () => {
    terrisHoverLeaveTimerRef.current = window.setTimeout(() => {
      setIsTerrisHoverOpen(false);
      terrisHoverLeaveTimerRef.current = null;
    }, HOVER_LEAVE_MS);
  };

  const handleTerrisTriggerClick = () => {
    if (typeof window === 'undefined') {
      return;
    }
    if (window.matchMedia('(hover: none)').matches) {
      setIsTerrisMenuOpen((prev) => !prev);
    }
  };

  const handleTerrisNavigate = () => {
    setIsTerrisMenuOpen(false);
    setIsTerrisHoverOpen(false);
  };

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

        <div className="mx-2 flex min-w-0 flex-1 justify-center">
          {centerContent ? (
            <div className="w-full max-w-[460px] truncate text-center text-xs font-semibold text-terreta-dark/75 md:text-sm">
              {centerContent}
            </div>
          ) : (
            <span className="hidden rounded-full border border-terreta-border bg-terreta-card/70 px-4 py-1 text-xs font-bold uppercase tracking-[0.2em] text-terreta-dark/80 md:inline-flex">
              ✦ {sectionLabel}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          {rightSlot}
          <div
            ref={terrisRef}
            className="relative"
            onMouseEnter={handleTerrisWrapperMouseEnter}
            onMouseLeave={handleTerrisWrapperMouseLeave}
          >
            <button
              type="button"
              id="terris-balance-trigger"
              className="inline-flex items-center gap-2 rounded-full border border-terreta-border bg-terreta-card/80 px-3 py-2 text-terreta-dark shadow-sm transition-colors hover:border-terreta-accent/50"
              aria-label="Saldo de Terris. Abre información sobre la moneda."
              aria-expanded={showTerrisPanel}
              aria-haspopup="true"
              aria-controls={TERRIS_PANEL_ID}
              onClick={handleTerrisTriggerClick}
            >
              <Coins size={15} className="shrink-0 text-terreta-accent" aria-hidden />
              <span className="text-sm font-black leading-none">{totesBalance}</span>
            </button>

            {showTerrisPanel ? (
              <div
                id={TERRIS_PANEL_ID}
                role="region"
                aria-label="Información sobre los Terris"
                className="absolute right-0 top-[calc(100%+6px)] z-40 w-[min(18rem,calc(100vw-2rem))] rounded-xl border border-terreta-accent/45 bg-terreta-card p-3 text-left shadow-xl"
              >
                <p className="text-sm leading-snug text-terreta-dark">
                  Los Terris son la moneda nativa y local de la Terreta. Para más información, haz clic.
                </p>
                <Link
                  to="/terris"
                  className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-terreta-accent/15 px-3 py-2 text-center text-sm font-semibold text-terreta-accent ring-1 ring-terreta-accent/35 transition-colors hover:bg-terreta-accent/25"
                  onClick={handleTerrisNavigate}
                >
                  Ver qué son los Terris
                </Link>
              </div>
            ) : null}
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
