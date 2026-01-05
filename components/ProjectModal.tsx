import React, { useEffect, useState } from 'react';
import { X, Calendar, User, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { ProjectWithAuthor } from './ProjectsGallery';
import { generateSlug, normalizeUrl } from '../lib/utils';

interface ProjectModalProps {
  project: ProjectWithAuthor | null;
  isOpen: boolean;
  onClose: () => void;
  onViewProfile?: (handle: string) => void;
}

// Helper to convert YouTube/Vimeo URLs to embed format
const getEmbedUrl = (url: string): string => {
  if (!url) return '';
  
  // If already in embed format, return as is
  if (url.includes('/embed/') || url.includes('player.vimeo.com')) {
    return url;
  }
  
  // YouTube: watch?v= format
  if (url.includes('youtube.com/watch?v=')) {
    return url.replace('watch?v=', 'embed/');
  }
  
  // YouTube: youtu.be/ format
  if (url.includes('youtu.be/')) {
    const videoId = url.split('youtu.be/')[1]?.split('?')[0]?.split('&')[0];
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
  }
  
  // Vimeo
  if (url.includes('vimeo.com/')) {
    const matches = url.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)/);
    if (matches && matches[1]) {
      return `https://player.vimeo.com/video/${matches[1]}`;
    }
  }
  
  return url;
};

export const ProjectModal: React.FC<ProjectModalProps> = ({ project, isOpen, onClose, onViewProfile }) => {
  const [shouldRender, setShouldRender] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (isOpen && project) {
      setShouldRender(true);
      // Pequeño delay para permitir que el DOM se actualice antes de la animación
      requestAnimationFrame(() => {
        setTimeout(() => setIsVisible(true), 10);
      });
      document.body.style.overflow = 'hidden';
      setCurrentImageIndex(0);
    } else {
      setIsVisible(false);
      // Esperar a que termine la animación antes de desmontar (300ms coincide con la duración de la animación)
      const timer = setTimeout(() => {
        setShouldRender(false);
        document.body.style.overflow = 'unset';
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, project]);

  // Cerrar con tecla Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!shouldRender || !project) return null;

  const projectSlug = generateSlug(project.name);
  const projectUrl = `/proyecto/${projectSlug}`;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const nextImage = () => {
    if (project.images && project.images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % project.images.length);
    }
  };

  const prevImage = () => {
    if (project.images && project.images.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + project.images.length) % project.images.length);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-[80] flex items-center justify-center p-4 transition-all duration-300 ease-in-out ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-terreta-dark/70 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Modal Content */}
      <div
        className={`relative bg-terreta-card w-full max-w-4xl max-h-[95vh] rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 ease-in-out flex flex-col ${
          isVisible 
            ? 'scale-100 translate-y-0 opacity-100' 
            : 'scale-95 translate-y-8 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-terreta-card/90 backdrop-blur-sm text-terreta-dark/60 hover:text-terreta-dark p-2 rounded-full transition-colors shadow-lg border border-terreta-border"
        >
          <X size={20} />
        </button>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 min-h-0">
          {/* Hero Image - Always use image as cover, never video */}
          {project.images && project.images.length > 0 ? (
            <div className="relative w-full h-64 bg-terreta-bg overflow-hidden">
              <img
                src={project.images[currentImageIndex]}
                alt={project.name}
                className="w-full h-full object-cover"
              />
              {project.images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-terreta-card/90 backdrop-blur-sm text-terreta-dark p-2 rounded-full hover:bg-terreta-card transition-colors border border-terreta-border"
                  >
                    ←
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-terreta-card/90 backdrop-blur-sm text-terreta-dark p-2 rounded-full hover:bg-terreta-card transition-colors border border-terreta-border"
                  >
                    →
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {project.images.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImageIndex(idx)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          idx === currentImageIndex ? 'bg-terreta-card w-6' : 'bg-terreta-card/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="relative w-full h-64 bg-gradient-to-br from-terreta-bg to-terreta-sidebar flex items-center justify-center">
              <ImageIcon size={64} className="text-terreta-accent/30" />
            </div>
          )}

          {/* Content */}
          <div className="p-8">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="font-serif text-3xl text-terreta-dark mb-2">{project.name}</h1>
                  {project.slogan && (
                    <p className="text-lg text-terreta-secondary italic mb-4">{project.slogan}</p>
                  )}
                </div>
                <span className="px-4 py-2 bg-terreta-accent text-white text-sm font-bold rounded-full whitespace-nowrap ml-4">
                  {project.phase}
                </span>
              </div>

              {/* Author & Date */}
              <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-terreta-border">
                <div
                  className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => {
                    if (onViewProfile) {
                      onViewProfile(project.author.username);
                      onClose();
                    }
                  }}
                >
                  <img
                    src={project.author.avatar}
                    alt={project.author.name}
                    className="w-10 h-10 rounded-full object-cover border border-terreta-border"
                    onError={(e) => {
                      // Si falla la carga, usar el fallback de dicebear
                      const target = e.target as HTMLImageElement;
                      target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${project.author.username}`;
                    }}
                  />
                  <div>
                    <p className="font-bold text-terreta-dark">{project.author.name}</p>
                    <p className="text-sm text-terreta-secondary">@{project.author.username}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-terreta-secondary">
                  <Calendar size={16} />
                  <span>
                    {new Date(project.created_at).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h2 className="font-serif text-xl text-terreta-dark mb-3">Sobre el Proyecto</h2>
              <p className="text-terreta-dark leading-relaxed whitespace-pre-line mb-4">{project.description}</p>
              
              {/* Video - Show video inside content, not as cover */}
              {project.video_url && (
                <div className="mb-4">
                  <h3 className="font-bold text-terreta-dark mb-2 uppercase text-sm tracking-wide">
                    Video
                  </h3>
                  <div className="relative w-full aspect-video bg-gray-900 rounded-lg overflow-hidden">
                    <iframe
                      src={getEmbedUrl(project.video_url)}
                      className="w-full h-full"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}
              
              {/* Website Link */}
              {project.website && (
                <div className="mt-4">
                  <a
                    href={normalizeUrl(project.website)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-terreta-accent text-white rounded-lg hover:opacity-90 transition-colors font-bold text-sm shadow-sm"
                  >
                    <ExternalLink size={16} />
                    Visitar Sitio Web
                  </a>
                </div>
              )}
            </div>

            {/* Categories & Technologies */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {project.categories.length > 0 && (
                <div>
                  <h3 className="font-bold text-terreta-dark mb-2 uppercase text-sm tracking-wide">
                    Categorías
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {project.categories.map((cat, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-terreta-bg text-terreta-dark text-sm rounded-full border border-terreta-border"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {project.technologies.length > 0 && (
                <div>
                  <h3 className="font-bold text-terreta-dark mb-2 uppercase text-sm tracking-wide">
                    Tecnologías
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {project.technologies.map((tech, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-terreta-accent/20 text-terreta-accent text-sm rounded-full border border-terreta-accent/30"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Gallery */}
            {project.images && project.images.length > 1 && (
              <div className="mb-6">
                <h3 className="font-bold text-terreta-dark mb-3 uppercase text-sm tracking-wide">
                  Galería
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {project.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                        idx === currentImageIndex
                          ? 'border-terreta-accent ring-2 ring-terreta-accent/20'
                          : 'border-terreta-border hover:border-terreta-accent/50'
                      }`}
                    >
                      <img src={img} alt={`${project.name} ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-6 border-t border-terreta-border">
              <a
                href={projectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-terreta-accent text-white font-bold py-3 rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-md"
              >
                <ExternalLink size={18} />
                Ver Página Pública
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
