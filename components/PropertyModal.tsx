import React, { useEffect, useState } from 'react';
import { X, MapPin, Home, Euro, ExternalLink, Copy, Video } from 'lucide-react';
import { PropertyWithOwner } from './PropertiesGallery';
import { renderMarkdown, normalizeUrl } from '../lib/utils';

interface PropertyModalProps {
  property: PropertyWithOwner | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PropertyModal: React.FC<PropertyModalProps> = ({
  property,
  isOpen,
  onClose,
}) => {
  const [shouldRender, setShouldRender] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && property) {
      setShouldRender(true);
      requestAnimationFrame(() => {
        setTimeout(() => setIsVisible(true), 10);
      });
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
  }, [isOpen, property]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!shouldRender || !property) {
    return null;
  }

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const nextImage = () => {
    if (property.images && property.images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % property.images.length);
    }
  };

  const prevImage = () => {
    if (property.images && property.images.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + property.images.length) % property.images.length);
    }
  };

  const publicPath = `/propiedad/${property.owner.username}/${property.slug}`;
  const fullUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${publicPath}`
      : `https://terretahub.com${publicPath}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-[80] flex items-start justify-center p-4 overflow-y-auto transition-all duration-300 ease-in-out ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-terreta-dark/70 backdrop-blur-sm transition-opacity duration-300 ease-in-out pointer-events-none ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Modal */}
      <div
        className={`relative bg-terreta-card w-full max-w-3xl my-8 rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 ease-in-out flex flex-col ${
          isVisible
            ? 'scale-100 translate-y-0 opacity-100'
            : 'scale-95 translate-y-8 opacity-0'
        }`}
        onClick={(event) => event.stopPropagation()}
        style={{ maxHeight: 'calc(100vh - 4rem)' }}
      >
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-50 bg-terreta-card/95 backdrop-blur-sm text-terreta-dark/70 hover:text-terreta-dark p-2 rounded-full transition-colors shadow-lg border border-terreta-border hover:bg-terreta-card"
          aria-label="Cerrar detalle de propiedad"
        >
          <X size={20} />
        </button>

        <div className="overflow-y-auto flex-1 min-h-0">
          {/* Hero image */}
          {property.images && property.images.length > 0 ? (
            <div className="relative w-full h-52 md:h-64 bg-terreta-bg overflow-hidden">
              <img
                src={property.images[currentImageIndex]}
                alt={property.title}
                className="w-full h-full object-cover"
              />
              {property.images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-terreta-card/90 backdrop-blur-sm text-terreta-dark p-2 rounded-full hover:bg-terreta-card transition-colors border border-terreta-border"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-terreta-card/90 backdrop-blur-sm text-terreta-dark p-2 rounded-full hover:bg-terreta-card transition-colors border border-terreta-border"
                  >
                    →
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {property.images.map((_, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          index === currentImageIndex
                            ? 'bg-terreta-card w-6'
                            : 'bg-terreta-card/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="relative w-full h-64 bg-gradient-to-br from-terreta-bg to-terreta-sidebar flex items-center justify-center">
              <Home size={64} className="text-terreta-accent/30" />
            </div>
          )}

          {/* Content */}
          <div className="p-8">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-start justify-between mb-4 gap-4">
                <div className="flex-1">
                  <h1 className="font-serif text-3xl text-terreta-dark mb-2">
                    {property.title}
                  </h1>
                  {(property.neighborhood || property.city) && (
                    <div className="flex items-center gap-2 text-sm text-terreta-secondary">
                      <MapPin size={16} />
                      <span>
                        {property.neighborhood}
                        {property.neighborhood && property.city && ' · '}
                        {property.city}
                      </span>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="flex items-center justify-end gap-2 mb-1">
                    <Euro size={18} className="text-terreta-accent" />
                    <span className="text-xl font-bold text-terreta-accent">
                      {property.price.toLocaleString('es-ES')} {property.currency}
                    </span>
                  </div>
                  <p className="text-xs text-terreta-secondary">
                    {property.price_period === 'per_month'
                      ? 'al mes'
                      : property.price_period === 'per_week'
                      ? 'por semana'
                      : property.price_period === 'per_night'
                      ? 'por noche'
                      : 'precio total'}
                  </p>
                  <p className="mt-1 text-xs text-terreta-secondary/80">
                    {property.operation_type === 'rent'
                      ? 'Alquiler'
                      : property.operation_type === 'sale'
                      ? 'Venta'
                      : 'Habitación compartida'}
                  </p>
                </div>
              </div>

              {/* Owner */}
              <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-terreta-border">
                <div className="flex items-center gap-3">
                  <img
                    src={property.owner.avatar}
                    alt={property.owner.name}
                    className="w-10 h-10 rounded-full object-cover border border-terreta-border"
                    onError={(event) => {
                      const target = event.target as HTMLImageElement;
                      target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${property.owner.username}`;
                    }}
                  />
                  <div>
                    <p className="font-bold text-terreta-dark">
                      {property.owner.name}
                    </p>
                    <p className="text-sm text-terreta-secondary">
                      @{property.owner.username}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-terreta-secondary">
                  <span>
                    Publicado el{' '}
                    {new Date(property.created_at).toLocaleDateString('es-ES', {
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
              <h2 className="font-serif text-xl text-terreta-dark mb-3">
                Descripción del espacio
              </h2>
              <div className="text-terreta-dark">
                {renderMarkdown(property.description)}
              </div>
            </div>

            {/* Videos */}
            {property.video_urls && property.video_urls.length > 0 && (
              <div className="mb-6">
                <h3 className="font-bold text-terreta-dark mb-2 uppercase text-xs tracking-wide flex items-center gap-2">
                  <Video size={14} />
                  Vídeos del espacio
                </h3>
                <div className="grid md:grid-cols-2 gap-3">
                  {property.video_urls.slice(0, 2).map((url, index) => (
                    <video
                      key={index}
                      src={url}
                      controls
                      className="w-full max-h-64 rounded-lg border border-terreta-border bg-terreta-bg"
                    >
                      Tu navegador no soporta la reproducción de vídeo.
                    </video>
                  ))}
                </div>
              </div>
            )}

            {/* Details grid */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <h3 className="font-bold text-terreta-dark mb-1 uppercase text-xs tracking-wide">
                  Detalles
                </h3>
                <div className="flex flex-wrap gap-2 text-xs text-terreta-secondary">
                  {property.bedrooms !== null && property.bedrooms !== undefined && (
                    <span className="px-3 py-1 bg-terreta-bg text-terreta-dark rounded-full border border-terreta-border">
                      {property.bedrooms} hab.
                    </span>
                  )}
                  {property.bathrooms !== null &&
                    property.bathrooms !== undefined && (
                      <span className="px-3 py-1 bg-terreta-bg text-terreta-dark rounded-full border border-terreta-border">
                        {property.bathrooms} baños
                      </span>
                    )}
                  {property.size_m2 !== null && property.size_m2 !== undefined && (
                    <span className="px-3 py-1 bg-terreta-bg text-terreta-dark rounded-full border border-terreta-border">
                      {property.size_m2} m²
                    </span>
                  )}
                  {property.floor !== null && property.floor !== undefined && (
                    <span className="px-3 py-1 bg-terreta-bg text-terreta-dark rounded-full border border-terreta-border">
                      Planta {property.floor}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-terreta-dark mb-1 uppercase text-xs tracking-wide">
                  Amenities
                </h3>
                <div className="flex flex-wrap gap-2 text-xs text-terreta-secondary">
                  {property.furnished && (
                    <span className="px-3 py-1 bg-terreta-accent/15 text-terreta-accent rounded-full border border-terreta-accent/40">
                      Amueblado
                    </span>
                  )}
                  {property.bills_included && (
                    <span className="px-3 py-1 bg-terreta-accent/15 text-terreta-accent rounded-full border border-terreta-accent/40">
                      Gastos incluidos
                    </span>
                  )}
                  {property.pets_allowed && (
                    <span className="px-3 py-1 bg-terreta-accent/15 text-terreta-accent rounded-full border border-terreta-accent/40">
                      Mascotas permitidas
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* External link */}
            {property.external_link && (
              <div className="mb-6">
                <a
                  href={normalizeUrl(property.external_link)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-terreta-accent text-white rounded-lg hover:opacity-90 transition-colors font-bold text-sm shadow-sm"
                >
                  <ExternalLink size={16} />
                  Ver más detalles
                </a>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-3 pt-4 border-t border-terreta-border">
              <a
                href={publicPath}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-terreta-accent text-white font-bold py-3 rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-md"
              >
                <ExternalLink size={18} />
                Ver Página Pública
              </a>
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-4 py-3 bg-terreta-card text-terreta-dark font-bold rounded-lg hover:bg-terreta-bg transition-all flex items-center gap-2 border border-terreta-border"
                aria-label="Copiar enlace de la propiedad"
              >
                <Copy size={16} />
                {copied ? 'Copiado' : 'Copiar link'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

