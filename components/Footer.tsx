import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full py-3 px-4 md:px-8 border-t border-terreta-border bg-terreta-nav/50">
      <div className="flex items-center justify-between gap-3">
        <div className="w-full overflow-x-auto">
          <div className="flex min-w-max items-center justify-center gap-2 whitespace-nowrap text-xs text-terreta-dark/70 md:text-sm">
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
          </div>
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
    </footer>
  );
};
