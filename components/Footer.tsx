import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full min-w-0 py-3 px-4 md:px-8 border-t border-terreta-border bg-terreta-nav/50">
      <div className="flex flex-col items-center justify-between gap-2 sm:flex-row sm:flex-wrap">
        <div className="flex w-full min-w-0 flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs text-terreta-dark/70 md:text-sm">
          <Link
            to="/terminos-y-condiciones"
            className="transition-colors hover:text-terreta-accent"
          >
            Términos
          </Link>
          <span className="text-terreta-border/70">|</span>
          <Link
            to="/politica-de-privacidad"
            className="transition-colors hover:text-terreta-accent"
          >
            Privacidad
          </Link>
          <span className="text-terreta-border/70">|</span>
          <Link
            to="/docs"
            className="transition-colors hover:text-terreta-accent"
          >
            Documentación
          </Link>
          <span className="text-terreta-border/70">|</span>
          <Link
            to="/unfinde"
            className="transition-colors hover:text-terreta-accent"
          >
            Un Finde en la Terreta
          </Link>
          <span className="text-terreta-border/70">|</span>
          <Link to="/que-es-terreta-hub" className="transition-colors hover:text-terreta-accent">
            Qué es
          </Link>
          <span className="text-terreta-border/70">|</span>
          <Link to="/faq" className="transition-colors hover:text-terreta-accent">
            FAQ
          </Link>
          <span className="text-terreta-border/70">|</span>
          <Link to="/fallas2026" className="transition-colors hover:text-terreta-accent">
            Fallas
          </Link>
        </div>
        <div className="hidden shrink-0 whitespace-nowrap text-xs text-terreta-dark/60 md:block md:text-sm">
          <span className="text-terreta-dark/50">Plataforma creada por </span>
          <a
            href="https://www.versaproducciones.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-terreta-dark/70 hover:text-terreta-accent transition-colors font-medium"
          >
            Versa Producciones
          </a>
        </div>
      </div>
      <p className="mt-2 text-center text-[10px] leading-relaxed text-terreta-dark/45 sm:text-xs">
        Terreta Hub no es Terreta Business Hub S.L. (otra empresa).
      </p>
    </footer>
  );
};
