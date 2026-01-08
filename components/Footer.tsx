import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export const Footer: React.FC = () => {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <footer className="w-full py-3 px-4 md:px-8 border-t border-terreta-border bg-terreta-nav/50">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 md:gap-4 text-xs md:text-sm text-terreta-dark/60">
          {isHome && (
            <>
              <Link 
                to="/terminos-y-condiciones" 
                className="hover:text-terreta-accent transition-colors text-terreta-dark/70 hover:text-terreta-accent"
              >
                Términos y Condiciones
              </Link>
              <span className="text-terreta-border/50">|</span>
            </>
          )}
          <Link 
            to="/politica-de-privacidad" 
            className="hover:text-terreta-accent transition-colors text-terreta-dark/70 hover:text-terreta-accent"
          >
            Política de Privacidad
          </Link>
          <span className="text-terreta-border/50">|</span>
          <Link 
            to="/docs" 
            className="hover:text-terreta-accent transition-colors text-terreta-dark/70 hover:text-terreta-accent"
          >
            Documentación
          </Link>
        </div>
        <div className="text-xs md:text-sm text-terreta-dark/60">
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
    </footer>
  );
};
