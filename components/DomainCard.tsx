import React from 'react';
import type { DomainDefinition } from '../types';

interface DomainCardProps {
  domain: DomainDefinition;
  onClick: () => void;
}

export const DomainCard: React.FC<DomainCardProps> = ({ domain, onClick }) => {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={domain.comingSoon ? `${domain.name} (próximamente)` : domain.name}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className="flex flex-col gap-2 rounded-xl border border-terreta-border bg-terreta-card/60 p-4 cursor-pointer hover:bg-terreta-card focus:outline-none focus:ring-2 focus:ring-terreta-accent transition-colors"
    >
      <div className="flex items-center gap-3">
        {domain.icon ? (
          <span className="text-terreta-accent">
            {domain.icon}
          </span>
        ) : null}
        <h2 className="min-w-0 text-lg font-semibold text-terreta-dark">
          {domain.name}
        </h2>
        {domain.comingSoon ? (
          <span className="ml-auto shrink-0 rounded-full bg-terreta-accent/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-terreta-accent">
            Próximamente
          </span>
        ) : null}
      </div>
      <p className="text-sm text-terreta-dark/70">
        {domain.description}
      </p>
    </div>
  );
};

