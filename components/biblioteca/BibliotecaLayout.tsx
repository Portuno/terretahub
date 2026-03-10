import React from 'react';
import { Link, Outlet } from 'react-router-dom';

export const BibliotecaLayout: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-terreta-bg text-terreta-dark">
      <header className="border-b border-terreta-border bg-terreta-card/90 backdrop-blur-md flex-shrink-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <p className="text-[10px] uppercase tracking-[0.22em] text-terreta-secondary mb-0.5">
            <Link
              to="/"
              className="font-semibold text-terreta-dark hover:text-terreta-accent transition-colors"
              aria-label="Volver a Terreta Hub"
            >
              Terreta Hub
            </Link>
          </p>
          <h1 className="text-xl md:text-2xl font-serif font-bold tracking-tight text-terreta-dark">
            Biblioteca
          </h1>
          <p className="text-xs text-terreta-dark/70">
            Documentación, asistentes y contenido nativo de la plataforma.
          </p>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
};
