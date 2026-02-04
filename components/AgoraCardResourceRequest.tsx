import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HandHeart, ArrowRight } from 'lucide-react';
import { ResourceRequestFeedPayload } from '../types';

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

const TRUNCATE_LENGTH = 160;

interface AgoraCardResourceRequestProps {
  payload: ResourceRequestFeedPayload;
}

export const AgoraCardResourceRequest: React.FC<AgoraCardResourceRequestProps> = ({ payload }) => {
  const navigate = useNavigate();
  const { author, details, verticals, formatTags, createdAt } = payload;
  const handle = `@${author.username}`;
  const truncatedDetails = details.length > TRUNCATE_LENGTH ? `${details.slice(0, TRUNCATE_LENGTH)}…` : details;

  const handleProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/p/${author.username}`);
  };

  const handleCardClick = () => {
    navigate('/recursos');
  };

  return (
    <div
      className="bg-terreta-card border border-terreta-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow mb-4 cursor-pointer"
      onClick={handleCardClick}
      role="article"
      aria-label={`Recurso solicitado por ${author.name}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex gap-3">
          <img
            src={author.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${author.username}`}
            alt={author.name}
            className="w-12 h-12 rounded-full bg-terreta-bg object-cover border border-terreta-border cursor-pointer"
            onClick={handleProfileClick}
          />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wide rounded-full border border-emerald-200">
                <HandHeart size={10} />
                Recurso solicitado
              </span>
              <span className="text-xs text-terreta-secondary font-sans">{formatTimestamp(createdAt)}</span>
            </div>
            <h3
              className="font-bold text-terreta-dark hover:underline cursor-pointer mt-1"
              onClick={handleProfileClick}
            >
              {author.name}
            </h3>
            <p
              className="text-xs text-terreta-accent font-bold uppercase tracking-wide cursor-pointer hover:text-terreta-accent/80"
              onClick={handleProfileClick}
            >
              {handle}
            </p>
          </div>
        </div>
      </div>
      <p className="text-terreta-dark text-sm leading-relaxed mb-4">{truncatedDetails}</p>
      {(verticals.length > 0 || formatTags.length > 0) && (
        <div className="flex flex-wrap gap-2 mb-4">
          {verticals.slice(0, 3).map((v) => (
            <span
              key={v}
              className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200"
            >
              {v}
            </span>
          ))}
          {formatTags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-1 text-xs font-medium rounded-full bg-terreta-bg text-terreta-secondary border border-terreta-border"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      <div className="flex items-center justify-end gap-2 text-terreta-accent text-sm font-semibold hover:text-terreta-accent/80">
        <span>Ver en Recursos</span>
        <ArrowRight size={16} />
      </div>
    </div>
  );
};
