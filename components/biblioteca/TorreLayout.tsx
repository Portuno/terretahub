import React from 'react';
import { Link, Outlet, NavLink, useLocation } from 'react-router-dom';
import { TowerControl, BookOpen, Library } from 'lucide-react';

const TORRE_NAV = [
  { path: 'que-es', label: 'Qué es', icon: <BookOpen size={16} aria-hidden /> },
  { path: 'creador', label: 'Creador de librerías', icon: <Library size={16} aria-hidden /> },
];

export const TorreLayout: React.FC = () => {
  const location = useLocation();
  const isQueEsActive =
    location.pathname.endsWith('torre-del-semas') ||
    location.pathname.endsWith('torre-del-semas/') ||
    location.pathname.includes('torre-del-semas/que-es');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Link
          to="/biblioteca"
          className="text-xs font-semibold uppercase tracking-wide text-terreta-secondary hover:text-terreta-accent transition-colors"
          aria-label="Volver a Biblioteca"
        >
          ← Biblioteca
        </Link>
        <div className="flex items-center gap-2 mt-1">
          <TowerControl size={22} className="text-terreta-accent" aria-hidden />
          <h1 className="text-xl md:text-2xl font-serif font-bold text-terreta-dark">
            La Torre del Semás
          </h1>
        </div>
        <p className="text-sm text-terreta-dark/70">
          Espacio vivo de contenido nativo para la plataforma.
        </p>
      </div>

      <nav className="flex flex-wrap gap-2 border-b border-terreta-border pb-3" aria-label="Secciones de La Torre">
        {TORRE_NAV.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={false}
            className={({ isActive: navActive }) => {
              const active = item.path === 'que-es' ? isQueEsActive : navActive;
              return `inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-terreta-accent ${
                active
                  ? 'border-terreta-accent bg-terreta-accent/10 text-terreta-accent'
                  : 'border-terreta-border bg-terreta-card/60 text-terreta-dark hover:bg-terreta-card'
              }`;
            }}
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      <Outlet />
    </div>
  );
};
