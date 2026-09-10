import React from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { FolderKanban, Users, UsersRound } from 'lucide-react';
import { AuthUser } from '../types';

interface DashboardOutletContext {
  user: AuthUser | null;
  onOpenAuth: () => void;
}

interface CommunityHubCard {
  id: 'miembros' | 'proyectos' | 'grupos';
  title: string;
  description: string;
  icon: React.ReactNode;
  handleClick: () => void;
  badge?: string;
}

export const CommunityHubPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, onOpenAuth } = useOutletContext<DashboardOutletContext>();

  const handleRequireAuth = (callback: () => void) => {
    if (!user) {
      onOpenAuth();
      return;
    }

    callback();
  };

  const cards: CommunityHubCard[] = [
    {
      id: 'miembros',
      title: 'Miembros',
      description: 'Descubre perfiles, talento local y nuevas conexiones.',
      icon: <Users size={20} />,
      handleClick: () => handleRequireAuth(() => navigate('/miembros'))
    },
    {
      id: 'proyectos',
      title: 'Proyectos',
      description: 'Explora ideas y productos que están construyendo en la comunidad.',
      icon: <FolderKanban size={20} />,
      handleClick: () => handleRequireAuth(() => navigate('/proyectos'))
    },
    {
      id: 'grupos',
      title: 'Grupos',
      description: 'Espacios temáticos en preparación. Dejá tu interés: no hay listado todavía.',
      icon: <UsersRound size={20} />,
      handleClick: () => navigate('/grupos'),
      badge: 'Próximamente'
    }
  ];

  return (
    <div className="w-full py-3">
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-bold text-terreta-dark">Comunidad</h1>
        <p className="mt-2 text-sm text-terreta-dark/70">
          Elige cómo quieres interactuar con la comunidad de Terreta Hub.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <button
            key={card.id}
            type="button"
            onClick={card.handleClick}
            className="w-full rounded-2xl border border-terreta-border bg-terreta-card p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-terreta-accent/40 hover:shadow-md"
            aria-label={`Abrir sección ${card.title}`}
          >
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-terreta-accent/10 text-terreta-accent">
              {card.icon}
            </div>
            <h2 className="text-lg font-bold text-terreta-dark">{card.title}</h2>
            {card.badge ? (
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-terreta-accent">{card.badge}</p>
            ) : null}
            <p className="mt-2 text-sm leading-relaxed text-terreta-dark/70">{card.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
};
