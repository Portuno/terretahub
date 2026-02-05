import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { BlogPublishedPayload } from '../types';

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

interface AgoraCardBlogPublishedProps {
  payload: BlogPublishedPayload;
}

export const AgoraCardBlogPublished: React.FC<AgoraCardBlogPublishedProps> = ({ payload }) => {
  const navigate = useNavigate();
  const { title, slug, excerpt, cardImageUrl, primaryTag, createdAt, author } = payload;

  const handleAuthorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/p/${author.username}`);
  };

  const handleCardClick = () => {
    navigate(`/blog/${author.username}/${slug}`);
  };

  const imageUrl = cardImageUrl || 'https://via.placeholder.com/400x200?text=Blog';

  return (
    <div
      className="bg-terreta-card border border-terreta-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow mb-4 cursor-pointer"
      onClick={handleCardClick}
      role="article"
      aria-label={`Blog: ${title}`}
    >
      <div className="p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-violet-100 text-violet-800 text-[10px] font-bold uppercase tracking-wide rounded-full border border-violet-200">
            <FileText size={10} />
            Blog publicado
          </span>
          <span className="text-xs text-terreta-secondary font-sans">{formatTimestamp(createdAt)}</span>
        </div>

        <div className="flex gap-4">
          {cardImageUrl && (
            <div className="w-24 h-24 rounded-lg overflow-hidden bg-terreta-bg border border-terreta-border shrink-0">
              <img
                src={imageUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-terreta-dark text-lg mb-1 line-clamp-2">{title}</h3>
            {primaryTag && (
              <span className="inline-block px-2 py-0.5 text-[10px] font-semibold rounded-full bg-terreta-accent/10 text-terreta-accent border border-terreta-accent/20 mb-2">
                {primaryTag}
              </span>
            )}
            {excerpt && (
              <p className="text-sm text-terreta-secondary line-clamp-2 mb-3">{excerpt}</p>
            )}
            <div
              className="flex items-center gap-2 cursor-pointer hover:opacity-80 w-fit"
              onClick={handleAuthorClick}
            >
              <img
                src={author.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${author.username}`}
                alt={author.name}
                className="w-8 h-8 rounded-full bg-terreta-bg object-cover border border-terreta-border"
              />
              <span className="text-sm text-terreta-dark font-medium">{author.name}</span>
              <span className="text-xs text-terreta-secondary">@{author.username}</span>
            </div>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-terreta-border/50 flex justify-end">
          <span className="text-sm text-terreta-accent font-semibold">Leer blog →</span>
        </div>
      </div>
    </div>
  );
};
