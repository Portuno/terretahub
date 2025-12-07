import React, { useEffect, useState } from 'react';
import { X, Calendar, User, ExternalLink, Video, Image as ImageIcon } from 'lucide-react';
import { ProjectWithAuthor } from './ProjectsGallery';
import { generateSlug } from '../lib/utils';

interface ProjectModalProps {
  project: ProjectWithAuthor | null;
  isOpen: boolean;
  onClose: () => void;
  onViewProfile?: (handle: string) => void;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({ project, isOpen, onClose, onViewProfile }) => {
  const [shouldRender, setShouldRender] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (isOpen && project) {
      setShouldRender(true);
      setTimeout(() => setIsVisible(true), 50);
      document.body.style.overflow = 'hidden';
      setCurrentImageIndex(0);
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => {
        setShouldRender(false);
        document.body.style.overflow = 'unset';
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, project]);

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
      className={`fixed inset-0 z-[80] flex items-center justify-center p-4 transition-all duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-terreta-dark/70 backdrop-blur-sm transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Modal Content */}
      <div
        className={`relative bg-[#F9F6F0] w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 ${
          isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-sm text-terreta-dark/60 hover:text-terreta-dark p-2 rounded-full transition-colors shadow-lg"
        >
          <X size={20} />
        </button>

        {/* Scrollable Content */}
        <div className="overflow-y-auto max-h-[90vh]">
          {/* Hero Image/Video */}
          {project.video_url ? (
            <div className="relative w-full h-64 bg-gray-900">
              <iframe
                src={project.video_url}
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : project.images && project.images.length > 0 ? (
            <div className="relative w-full h-64 bg-gray-100 overflow-hidden">
              <img
                src={project.images[currentImageIndex]}
                alt={project.name}
                className="w-full h-full object-cover"
              />
              {project.images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm text-terreta-dark p-2 rounded-full hover:bg-white transition-colors"
                  >
                    ←
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm text-terreta-dark p-2 rounded-full hover:bg-white transition-colors"
                  >
                    →
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {project.images.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImageIndex(idx)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          idx === currentImageIndex ? 'bg-white w-6' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="relative w-full h-64 bg-gradient-to-br from-[#F5F0E6] to-[#EBE5DA] flex items-center justify-center">
              <ImageIcon size={64} className="text-[#D97706]/30" />
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
                    <p className="text-lg text-gray-600 italic mb-4">{project.slogan}</p>
                  )}
                </div>
                <span className="px-4 py-2 bg-[#D97706] text-white text-sm font-bold rounded-full whitespace-nowrap ml-4">
                  {project.phase}
                </span>
              </div>

              {/* Author & Date */}
              <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-gray-200">
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
                    className="w-10 h-10 rounded-full object-cover border border-gray-200"
                    onError={(e) => {
                      // Si falla la carga, usar el fallback de dicebear
                      const target = e.target as HTMLImageElement;
                      target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${project.author.username}`;
                    }}
                  />
                  <div>
                    <p className="font-bold text-terreta-dark">{project.author.name}</p>
                    <p className="text-sm text-gray-500">@{project.author.username}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
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
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">{project.description}</p>
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
                        className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
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
                        className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full"
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
                          ? 'border-[#D97706] ring-2 ring-[#D97706]/20'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <img src={img} alt={`${project.name} ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-6 border-t border-gray-200">
              <a
                href={projectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-terreta-dark text-white font-bold py-3 rounded-lg hover:bg-[#2C1E1A] transition-all flex items-center justify-center gap-2"
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
