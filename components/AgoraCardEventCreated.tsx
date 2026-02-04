import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import { EventCreatedPayload } from '../types';

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

const formatEventDate = (isoDate: string): string => {
  const d = new Date(isoDate);
  return d.toLocaleDateString('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

interface AgoraCardEventCreatedProps {
  payload: EventCreatedPayload;
}

export const AgoraCardEventCreated: React.FC<AgoraCardEventCreatedProps> = ({ payload }) => {
  const navigate = useNavigate();
  const { id, title, slug, startDate, imageUrl, createdAt, organizer } = payload;

  const handleOrganizerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/p/${organizer.username}`);
  };

  const handleCardClick = () => {
    if (slug && organizer.username) {
      navigate(`/evento/${organizer.username}/${slug}`);
    } else {
      navigate('/eventos');
    }
  };

  return (
    <div
      className="bg-terreta-card border border-terreta-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow mb-4 cursor-pointer"
      onClick={handleCardClick}
      role="article"
      aria-label={`Evento: ${title}`}
    >
      <div className="p-6">
        {imageUrl && (
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-terreta-bg border border-terreta-border shrink-0 mb-3">
            <img
              src={imageUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wide rounded-full border border-amber-200">
            <Calendar size={10} />
            Evento creado
          </span>
          <span className="text-xs text-terreta-secondary font-sans">{formatTimestamp(createdAt)}</span>
        </div>
        <h3 className="font-bold text-terreta-dark text-lg mb-2">{title}</h3>
        <div className="flex items-center gap-2 text-sm text-terreta-secondary mb-3">
          <Calendar size={14} className="shrink-0" />
          <span>{formatEventDate(startDate)}</span>
        </div>
        <div className="flex items-center justify-between">
          <div
            className="flex items-center gap-2 cursor-pointer hover:opacity-80"
            onClick={handleOrganizerClick}
          >
            <img
              src={organizer.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${organizer.username}`}
              alt={organizer.name}
              className="w-8 h-8 rounded-full bg-terreta-bg object-cover border border-terreta-border"
            />
            <span className="text-sm text-terreta-dark font-medium">Organizado por {organizer.name}</span>
          </div>
          <span className="text-sm text-terreta-accent font-semibold">Ver evento →</span>
        </div>
      </div>
    </div>
  );
};
