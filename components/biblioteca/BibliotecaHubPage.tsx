import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, TowerControl } from 'lucide-react';

const LIBRARIES = [
  {
    id: 'docs',
    name: 'Docs',
    description: 'Documentación de Terreta Hub y asistente interactivo para resolver dudas.',
    path: '/docs',
    icon: <BookOpen size={24} className="text-terreta-accent" aria-hidden />,
  },
  {
    id: 'torre',
    name: 'La Torre del Semás',
    description: 'Espacio vivo de contenido nativo para la plataforma y creador de páginas para motores de búsqueda.',
    path: '/biblioteca/torre-del-semas',
    icon: <TowerControl size={24} className="text-terreta-accent" aria-hidden />,
  },
];

export const BibliotecaHubPage: React.FC = () => {
  return (
    <section className="flex flex-col gap-6">
      <p className="text-sm text-terreta-dark/70">
        Elige una biblioteca para explorar documentación, asistentes o el contenido de La Torre del Semás.
      </p>
      <ul className="grid gap-4 sm:grid-cols-2" role="list">
        {LIBRARIES.map((lib) => (
          <li key={lib.id}>
            <Link
              to={lib.path}
              className="flex flex-col gap-3 rounded-xl border border-terreta-border bg-terreta-card/60 p-5 text-left shadow-sm transition-colors hover:bg-terreta-card hover:border-terreta-accent/30 focus:outline-none focus:ring-2 focus:ring-terreta-accent"
              aria-label={`Ir a ${lib.name}: ${lib.description}`}
            >
              <span className="flex items-center gap-2">
                {lib.icon}
                <h2 className="text-lg font-serif font-semibold text-terreta-dark">
                  {lib.name}
                </h2>
              </span>
              <p className="text-sm text-terreta-dark/70 leading-relaxed">
                {lib.description}
              </p>
              <span className="text-xs font-semibold uppercase tracking-wide text-terreta-accent/80">
                Entrar
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
};
