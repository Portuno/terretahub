import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AuthUser } from '../types';
import { DOMAINS } from '../lib/domains';
import { DomainCard } from './DomainCard';
import { LayoutGrid, List } from 'lucide-react';

interface DominioPageProps {
  user: AuthUser | null;
  onOpenAuth: (referrerUsername?: string) => void;
}

type DomainViewMode = 'cards' | 'list';

export const DominioPage: React.FC<DominioPageProps> = ({ user: _user, onOpenAuth: _onOpenAuth }) => {
  const [viewMode, setViewMode] = useState<DomainViewMode>('cards');
  const navigate = useNavigate();

  const handleViewModeChange = (mode: DomainViewMode) => {
    if (mode === viewMode) {
      return;
    }
    setViewMode(mode);
  };

  const handleDomainClick = (routePath: string) => {
    if (!routePath) {
      return;
    }
    navigate(routePath);
  };

  return (
    <section className="flex flex-col gap-6 py-4">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-2xl md:text-3xl font-serif font-semibold text-terreta-dark">
            Dominios
          </h1>
          <p className="mt-1 text-sm md:text-base text-terreta-dark/70">
            Explora los dominios estratégicos de Terreta Hub. Cada dominio agrupa
            funcionalidades, productos y experimentos alrededor de un área concreta.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-terreta-border bg-terreta-card/60 p-1">
          <button
            type="button"
            onClick={() => handleViewModeChange('cards')}
            aria-pressed={viewMode === 'cards'}
            className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs md:text-sm font-medium transition-colors ${
              viewMode === 'cards'
                ? 'bg-terreta-accent text-white'
                : 'text-terreta-dark/70 hover:bg-terreta-card'
            }`}
          >
            <LayoutGrid size={16} />
            <span>Cards</span>
          </button>
          <button
            type="button"
            onClick={() => handleViewModeChange('list')}
            aria-pressed={viewMode === 'list'}
            className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs md:text-sm font-medium transition-colors ${
              viewMode === 'list'
                ? 'bg-terreta-accent text-white'
                : 'text-terreta-dark/70 hover:bg-terreta-card'
            }`}
          >
            <List size={16} />
            <span>Lista</span>
          </button>
        </div>
      </header>

      {viewMode === 'cards' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DOMAINS.map((domain) => (
            <DomainCard
              key={domain.id}
              domain={domain}
              onClick={() => handleDomainClick(domain.routePath)}
            />
          ))}
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {DOMAINS.map((domain) => (
            <li key={domain.id}>
              <button
                type="button"
                onClick={() => handleDomainClick(domain.routePath)}
                className="flex w-full items-start justify-between gap-3 rounded-xl border border-terreta-border bg-terreta-card/40 px-4 py-3 text-left hover:bg-terreta-card focus:outline-none focus:ring-2 focus:ring-terreta-accent transition-colors"
              >
                <div>
                  <p className="text-sm font-semibold text-terreta-dark">
                    {domain.name}
                  </p>
                  <p className="mt-1 text-xs text-terreta-dark/70">
                    {domain.description}
                  </p>
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-wide text-terreta-accent/80">
                  Ir al dominio
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

