import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export const Footer: React.FC = () => {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <footer className="w-full py-3 px-4 md:px-8 border-t border-terreta-border bg-terreta-nav/50">
      <div className="flex items-center justify-start">
        <div className="flex items-center gap-4 text-xs md:text-sm text-terreta-dark/60">
          {isHome && (
            <>
              <Link 
                to="/terminos-y-condiciones" 
                className="hover:text-terreta-accent transition-colors"
              >
                Términos y Condiciones
              </Link>
              <span className="text-terreta-border">|</span>
            </>
          )}
          <Link 
            to="/politica-de-privacidad" 
            className="hover:text-terreta-accent transition-colors"
          >
            Política de Privacidad
          </Link>
          <span className="text-terreta-border">|</span>
          <Link 
            to="/docs" 
            className="hover:text-terreta-accent transition-colors"
          >
            Documentación
          </Link>
        </div>
      </div>
    </footer>
  );
};
