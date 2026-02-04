import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { ProfileCreatedPayload } from '../types';

const formatTimestamp = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffInSeconds < 60) return 'Ahora mismo';
  if (diffInSeconds < 3600) return `hace ${Math.floor(diffInSeconds / 60)} minutos`;
  if (diffInSeconds < 86400) return `hace ${Math.floor(diffInSeconds / 3600)} horas`;
  if (diffInSeconds < 604800) return `hace ${Math.floor(diffInSeconds / 86400)} días`;
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
};

interface AgoraCardProfileCreatedProps {
  payload: ProfileCreatedPayload;
}

export const AgoraCardProfileCreated: React.FC<AgoraCardProfileCreatedProps> = ({ payload }) => {
  const navigate = useNavigate();
  const { name, username, avatar, createdAt } = payload;

  const handleClick = () => {
    navigate(`/p/${username}`);
  };

  return (
    <div
      className="bg-terreta-card border border-terreta-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow mb-4 cursor-pointer"
      onClick={handleClick}
      role="article"
      aria-label={`Nuevo miembro: ${name}`}
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-terreta-accent/10 text-terreta-accent text-[10px] font-bold uppercase tracking-wide rounded-full border border-terreta-accent/30">
            <UserPlus size={10} />
            Nuevo miembro
          </span>
          <span className="text-xs text-terreta-secondary font-sans">{formatTimestamp(createdAt)}</span>
        </div>
      </div>
      <div className="flex items-center gap-4 mt-4">
        <img
          src={avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`}
          alt={name}
          className="w-14 h-14 rounded-full bg-terreta-bg object-cover border border-terreta-border"
        />
        <div>
          <h3 className="font-bold text-terreta-dark">{name}</h3>
          <p className="text-sm text-terreta-accent font-bold uppercase tracking-wide">@{username}</p>
        </div>
        <span className="ml-auto text-sm text-terreta-secondary">Ver perfil →</span>
      </div>
    </div>
  );
};
