import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useDynamicMetaTags } from '../hooks/useDynamicMetaTags';
import { renderMarkdown, normalizeUrl } from '../lib/utils';
import { MapPin, Home, Euro, Image as ImageIcon, ExternalLink, ArrowLeft } from 'lucide-react';

interface PropertyFromDB {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  operation_type: 'rent' | 'sale' | 'roomshare';
  property_type: 'room' | 'apartment' | 'house' | 'studio' | 'office' | 'other';
  status: 'draft' | 'published' | 'archived';
  price: number;
  currency: string;
  price_period: 'per_month' | 'per_week' | 'per_night' | 'total';
  deposit_amount: number | null;
  bills_included: boolean;
  bedrooms: number | null;
  bathrooms: number | null;
  size_m2: number | null;
  floor: number | null;
  furnished: boolean;
  pets_allowed: boolean;
  address: string | null;
  neighborhood: string | null;
  city: string | null;
  country: string | null;
  images: string[];
  video_url: string | null;
  video_urls: string[] | null;
  external_link: string | null;
  slug: string;
  created_at: string;
  updated_at: string;
}

interface PropertyWithOwner extends PropertyFromDB {
  owner: {
    id: string;
    name: string;
    username: string;
    avatar: string;
  };
}

export const PublicProperty: React.FC = () => {
  const { username, slug } = useParams<{ username: string; slug: string }>();
  const navigate = useNavigate();
  const [property, setProperty] = useState<PropertyWithOwner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<'not-found' | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Hook de meta tags SIEMPRE al principio para no romper el orden de hooks
  const publicPath =
    username && slug ? `/propiedad/${username}/${slug}` : '/propiedad';
  const propertyImageUrl =
    property && property.images && property.images.length > 0
      ? property.images[0]
      : '/logo.png';
  const propertyDescription = property?.description
    ? property.description.substring(0, 200)
    : 'Propiedad disponible en Terreta Hub';

  useDynamicMetaTags({
    title: property
      ? `${property.title} | Espacio en Terreta Hub`
      : 'Espacio en Terreta Hub',
    description: propertyDescription,
    image: propertyImageUrl,
    url: publicPath,
    type: 'product',
    author: property
      ? `${property.owner.name} (@${property.owner.username})`
      : undefined,
    publishedTime: property?.created_at,
    modifiedTime: property?.updated_at,
    structuredData: property
      ? {
          '@context': 'https://schema.org',
          '@type': 'Product',
          '@id': `https://terretahub.com${publicPath}`,
          name: property.title,
          description: property.description,
          image: propertyImageUrl.startsWith('http')
            ? propertyImageUrl
            : `https://terretahub.com${propertyImageUrl}`,
          offers: {
            '@type': 'Offer',
            price: property.price,
            priceCurrency: property.currency,
            availability: 'https://schema.org/InStock',
          },
          areaServed: property.city || undefined,
        }
      : undefined,
  });

  useEffect(() => {
    if (!username || !slug) {
      setError('not-found');
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, name, username, avatar')
          .eq('username', username)
          .single();

        if (profileError || !profile) {
          setError('not-found');
          setLoading(false);
          return;
        }

        const { data: propertyRow, error: propertyError } = await supabase
          .from('properties')
          .select('*')
          .eq('owner_id', profile.id)
          .eq('slug', slug)
          .eq('status', 'published')
          .single<PropertyFromDB>();

        if (propertyError || !propertyRow) {
          setError('not-found');
          setLoading(false);
          return;
        }

        const { data: linkBioProfile } = await supabase
          .from('link_bio_profiles')
          .select('avatar')
          .eq('user_id', profile.id)
          .maybeSingle();

        const finalAvatar =
          linkBioProfile?.avatar ||
          profile.avatar ||
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username || 'user'}`;

        const imagesArray = Array.isArray(propertyRow.images)
          ? propertyRow.images.filter((image) => !!image)
          : [];
        const videosArray = Array.isArray(propertyRow.video_urls)
          ? propertyRow.video_urls.filter((url) => !!url)
          : propertyRow.video_url
          ? [propertyRow.video_url]
          : [];

        const withOwner: PropertyWithOwner = {
          ...propertyRow,
          images: imagesArray,
          video_urls: videosArray,
          owner: {
            id: profile.id,
            name: profile.name || 'Propietario',
            username: profile.username || username,
            avatar: finalAvatar,
          },
        };

        setProperty(withOwner);
      } catch (err) {
        console.error('[PublicProperty] Error al cargar propiedad:', err);
        setError('not-found');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [username, slug]);

  const nextImage = () => {
    if (property?.images && property.images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % property.images.length);
    }
  };

  const prevImage = () => {
    if (property?.images && property.images.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + property.images.length) % property.images.length);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-terreta-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-terreta-accent mb-4" />
        <p className="text-terreta-secondary">Cargando propiedad...</p>
      </div>
    );
  }

  if (error === 'not-found' || !property) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-terreta-bg px-4">
        <Home size={40} className="text-terreta-accent mb-4" />
        <h1 className="font-serif text-2xl font-bold text-terreta-dark mb-2">
          Propiedad no encontrada
        </h1>
        <p className="text-terreta-secondary mb-4 max-w-md text-center">
          Puede que el enlace haya expirado, que la propiedad ya no esté publicada o que nunca
          existiera.
        </p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="bg-terreta-accent text-white px-6 py-2 rounded-full font-bold hover:opacity-90 transition-colors"
        >
          Volver a Terreta Hub
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-terreta-bg relative py-8 px-4">
      {/* Logo */}
      <div className="fixed top-6 left-6 z-20">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center gap-2.5 bg-white/90 backdrop-blur-sm px-4 py-2.5 rounded-lg hover:bg-white transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 group"
        >
          <img
            src="/logo.png"
            alt="Terreta Hub"
            className="w-7 h-7 object-contain group-hover:scale-105 transition-transform"
          />
          <span className="font-sans text-lg text-terreta-dark font-bold tracking-tight group-hover:text-terreta-accent transition-colors">
            Terreta Hub
          </span>
        </button>
      </div>

      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Hero */}
        {property.images && property.images.length > 0 ? (
          <div className="relative w-full h-56 bg-gray-50 overflow-hidden">
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
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm text-terreta-dark p-2 rounded-full hover:bg-white transition-colors shadow-lg"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={nextImage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm text-terreta-dark p-2 rounded-full hover:bg-white transition-colors shadow-lg"
                >
                  →
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                  {property.images.map((_, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setCurrentImageIndex(index)}
                      className={`h-2 rounded-full transition-all ${
                        index === currentImageIndex ? 'bg-white w-8' : 'bg-white/50 w-2'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="relative w-full h-56 bg-gradient-to-br from-terreta-bg to-terreta-sidebar flex items-center justify-center">
            <ImageIcon size={56} className="text-terreta-accent/30" />
          </div>
        )}

        <div className="px-6 py-6">
          {/* Header */}
          <div className="mb-5">
            <div className="flex items-start justify-between mb-3 flex-wrap gap-3">
              <div className="flex-1">
                <h1 className="font-serif text-2xl md:text-3xl text-terreta-dark mb-1.5">
                  {property.title}
                </h1>
                {(property.neighborhood || property.city) && (
                  <div className="flex items-center gap-1.5 text-sm text-terreta-secondary">
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
              </div>
            </div>

            {/* Owner & date */}
            <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-terreta-border">
              <div className="flex items-center gap-2.5">
                <img
                  src={property.owner.avatar}
                  alt={property.owner.name}
                  className="w-9 h-9 rounded-full object-cover border border-terreta-border"
                />
                <div>
                  <p className="font-bold text-sm text-terreta-dark">
                    {property.owner.name}
                  </p>
                  <p className="text-xs text-terreta-secondary">
                    @{property.owner.username}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-terreta-secondary">
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
          <div className="mb-5">
            <h2 className="font-serif text-lg md:text-xl text-terreta-dark mb-2.5">
              Sobre el espacio
            </h2>
            <div className="text-gray-700 text-sm md:text-base">
              {renderMarkdown(property.description)}
            </div>
          </div>

          {/* Videos */}
          {property.video_urls && property.video_urls.length > 0 && (
            <div className="mb-5">
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

          {/* Details */}
          <div className="grid md:grid-cols-2 gap-5 mb-5">
            <div>
              <h3 className="font-bold text-terreta-dark mb-2 uppercase text-xs tracking-wide">
                Detalles
              </h3>
              <div className="flex flex-wrap gap-1.5 text-xs text-terreta-secondary">
                {property.bedrooms !== null && property.bedrooms !== undefined && (
                  <span className="px-2.5 py-0.5 bg-terreta-bg text-terreta-dark rounded-full border border-terreta-border">
                    {property.bedrooms} hab.
                  </span>
                )}
                {property.bathrooms !== null && property.bathrooms !== undefined && (
                  <span className="px-2.5 py-0.5 bg-terreta-bg text-terreta-dark rounded-full border border-terreta-border">
                    {property.bathrooms} baños
                  </span>
                )}
                {property.size_m2 !== null && property.size_m2 !== undefined && (
                  <span className="px-2.5 py-0.5 bg-terreta-bg text-terreta-dark rounded-full border border-terreta-border">
                    {property.size_m2} m²
                  </span>
                )}
                {property.floor !== null && property.floor !== undefined && (
                  <span className="px-2.5 py-0.5 bg-terreta-bg text-terreta-dark rounded-full border border-terreta-border">
                    Planta {property.floor}
                  </span>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-bold text-terreta-dark mb-2 uppercase text-xs tracking-wide">
                Amenities
              </h3>
              <div className="flex flex-wrap gap-1.5 text-xs text-terreta-secondary">
                {property.furnished && (
                  <span className="px-2.5 py-0.5 bg-terreta-accent/10 text-terreta-accent rounded-full border border-terreta-accent/30">
                    Amueblado
                  </span>
                )}
                {property.bills_included && (
                  <span className="px-2.5 py-0.5 bg-terreta-accent/10 text-terreta-accent rounded-full border border-terreta-accent/30">
                    Gastos incluidos
                  </span>
                )}
                {property.pets_allowed && (
                  <span className="px-2.5 py-0.5 bg-terreta-accent/10 text-terreta-accent rounded-full border border-terreta-accent/30">
                    Mascotas permitidas
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* External link */}
          {property.external_link && (
            <div className="mb-5">
              <a
                href={normalizeUrl(property.external_link)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-terreta-accent text-white rounded-lg hover:bg-terreta-dark transition-colors font-bold text-sm shadow-sm"
              >
                <ExternalLink size={16} />
                Ver más detalles
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Volver */}
      <div className="fixed bottom-6 left-6 z-20">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-4 py-2.5 bg-terreta-dark text-terreta-bg rounded-lg hover:bg-terreta-accent transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 font-bold text-sm"
        >
          <ArrowLeft size={18} />
          Volver
        </button>
      </div>
    </div>
  );
};

