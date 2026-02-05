import React, { useEffect, useMemo, useState } from 'react';
import { Search, Filter, X, MapPin, Home, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { PropertyOperationType, PropertyType } from '../types';
import { executeQueryWithRetry } from '../lib/supabaseHelpers';
import { PropertyModal } from './PropertyModal';

interface PropertyFromDB {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  operation_type: PropertyOperationType;
  property_type: PropertyType;
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

export interface PropertyWithOwner extends PropertyFromDB {
  owner: {
    id: string;
    name: string;
    username: string;
    avatar: string;
  };
}

interface PropertiesGalleryProps {
  user: { id: string } | null;
  onCreateProperty?: () => void;
}

export const PropertiesGallery: React.FC<PropertiesGalleryProps> = ({
  user,
  onCreateProperty,
}) => {
  const [properties, setProperties] = useState<PropertyWithOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOperation, setSelectedOperation] = useState<PropertyOperationType | null>(null);
  const [selectedPropertyType, setSelectedPropertyType] = useState<PropertyType | null>(null);
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [onlyFurnished, setOnlyFurnished] = useState(false);
  const [onlyBillsIncluded, setOnlyBillsIncluded] = useState(false);
  const [onlyPetsAllowed, setOnlyPetsAllowed] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<PropertyWithOwner | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const loadProperties = async () => {
      try {
        setLoading(true);

        const { data, error } = await executeQueryWithRetry(
          async () =>
            await supabase
              .from('properties')
              .select(
                `
              *,
              owner:profiles!properties_owner_id_fkey (
                id,
                name,
                username,
                avatar
              )
            `
              )
              .eq('status', 'published')
              .order('created_at', { ascending: false }),
          'load properties with owners'
        );

        if (error) {
          console.error('[PropertiesGallery] Error al cargar propiedades:', error);
          setProperties([]);
          return;
        }

        if (!data || data.length === 0) {
          setProperties([]);
          return;
        }

        const mapped: PropertyWithOwner[] = data.map((row: any) => {
          const imagesArray = Array.isArray(row.images)
            ? row.images.filter((image: string | null) => !!image)
            : [];
          const videosArray = Array.isArray(row.video_urls)
            ? row.video_urls.filter((url: string | null) => !!url)
            : row.video_url
            ? [row.video_url]
            : [];

          return {
            ...row,
            images: imagesArray,
            video_urls: videosArray,
            owner: {
              id: row.owner?.id || row.owner_id,
              name: row.owner?.name || 'Propietario',
              username: row.owner?.username || 'usuario',
              avatar:
                row.owner?.avatar ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${row.owner?.username || 'user'}`,
            },
          };
        });

        setProperties(mapped);
      } catch (error) {
        console.error('[PropertiesGallery] Error inesperado:', error);
        setProperties([]);
      } finally {
        setLoading(false);
      }
    };

    loadProperties();
  }, []);

  const allCities = useMemo(() => {
    const cities = new Set<string>();
    properties.forEach((property) => {
      if (property.city) {
        cities.add(property.city);
      }
    });
    return Array.from(cities).sort();
  }, [properties]);

  const hasActiveFilters =
    searchQuery ||
    selectedOperation ||
    selectedPropertyType ||
    minPrice ||
    maxPrice ||
    onlyFurnished ||
    onlyBillsIncluded ||
    onlyPetsAllowed;

  const filteredProperties = useMemo(() => {
    const min = minPrice ? Number(minPrice) : null;
    const max = maxPrice ? Number(maxPrice) : null;

    return properties.filter((property) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        property.title.toLowerCase().includes(searchLower) ||
        property.description.toLowerCase().includes(searchLower) ||
        (property.neighborhood || '').toLowerCase().includes(searchLower) ||
        (property.city || '').toLowerCase().includes(searchLower);

      const matchesOperation =
        !selectedOperation || property.operation_type === selectedOperation;

      const matchesPropertyType =
        !selectedPropertyType || property.property_type === selectedPropertyType;

      const matchesPrice =
        (min === null || property.price >= min) &&
        (max === null || property.price <= max);

      const matchesFurnished = !onlyFurnished || property.furnished;
      const matchesBills = !onlyBillsIncluded || property.bills_included;
      const matchesPets = !onlyPetsAllowed || property.pets_allowed;

      return (
        matchesSearch &&
        matchesOperation &&
        matchesPropertyType &&
        matchesPrice &&
        matchesFurnished &&
        matchesBills &&
        matchesPets
      );
    });
  }, [
    properties,
    searchQuery,
    selectedOperation,
    selectedPropertyType,
    minPrice,
    maxPrice,
    onlyFurnished,
    onlyBillsIncluded,
    onlyPetsAllowed,
  ]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedOperation(null);
    setSelectedPropertyType(null);
    setMinPrice('');
    setMaxPrice('');
    setOnlyFurnished(false);
    setOnlyBillsIncluded(false);
    setOnlyPetsAllowed(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-terreta-accent mb-4" />
        <p className="text-terreta-secondary">Cargando propiedades...</p>
      </div>
    );
  }

  return (
    <div className="w-full px-3 lg:px-4 py-4 animate-fade-in">
      <div className="w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h3 className="font-sans text-3xl text-terreta-dark mb-1">
              Espacios en la Terreta
            </h3>
            <p className="text-terreta-secondary">
              {filteredProperties.length}{' '}
              {filteredProperties.length === 1
                ? 'espacio disponible'
                : 'espacios disponibles'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-terreta-card border border-terreta-border rounded-lg hover:bg-terreta-bg transition-colors text-terreta-dark"
            >
              <Filter size={18} />
              <span>Filtros</span>
              {hasActiveFilters && (
                <span className="w-5 h-5 bg-terreta-accent text-white text-xs rounded-full flex items-center justify-center">
                  1
                </span>
              )}
            </button>
            {onCreateProperty && (
              <button
                type="button"
                onClick={onCreateProperty}
                className="bg-terreta-accent text-white px-6 py-2 rounded-full font-bold flex items-center gap-2 hover:brightness-90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                <Plus size={20} />
                <span className="hidden sm:inline">Publicar Propiedad</span>
              </button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6 group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search
              className="text-terreta-secondary/50 group-focus-within:text-terreta-accent transition-colors"
              size={20}
            />
          </div>
          <input
            type="text"
            placeholder="Busca por título, descripción, barrio o ciudad..."
            className="w-full pl-12 pr-4 py-4 rounded-xl border border-terreta-border focus:border-terreta-accent focus:ring-1 focus:ring-terreta-accent outline-none transition-all bg-terreta-card shadow-sm hover:shadow-md text-terreta-dark font-sans placeholder-terreta-secondary/50"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-terreta-secondary hover:text-terreta-dark"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Filters panel */}
        {showFilters && (
          <div className="bg-terreta-card rounded-[12px] p-6 mb-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-bold text-terreta-dark">Refinar búsqueda</h4>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-sm text-terreta-accent hover:text-terreta-accent/80 font-bold"
                >
                  Limpiar filtros
                </button>
              )}
            </div>

            <div className="space-y-6">
              {/* Operation type */}
              <div>
                <span className="block text-sm font-bold text-terreta-dark mb-2 uppercase tracking-wide">
                  Operación
                </span>
                <div className="flex flex-wrap gap-2">
                  {(['rent', 'sale', 'roomshare'] as PropertyOperationType[]).map((value) => {
                    const isActive = selectedOperation === value;
                    const label =
                      value === 'rent'
                        ? 'Alquiler'
                        : value === 'sale'
                        ? 'Venta'
                        : 'Habitación compartida';
                    const buttonClassName = isActive
                      ? 'px-4 py-2 rounded-full text-xs font-bold bg-terreta-accent text-white'
                      : 'px-4 py-2 rounded-full text-xs font-bold bg-terreta-bg text-terreta-secondary hover:bg-terreta-border';
                    return (
                      <button
                        key={value}
                        type="button"
                        className={buttonClassName}
                        onClick={() =>
                          setSelectedOperation(isActive ? null : value)
                        }
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Property type */}
              <div>
                <span className="block text-sm font-bold text-terreta-dark mb-2 uppercase tracking-wide">
                  Tipo de propiedad
                </span>
                <div className="flex flex-wrap gap-2">
                  {(['room', 'apartment', 'house', 'studio', 'office', 'other'] as PropertyType[]).map(
                    (value) => {
                      const isActive = selectedPropertyType === value;
                      const labelMap: Record<PropertyType, string> = {
                        room: 'Habitación',
                        apartment: 'Piso / Apartamento',
                        house: 'Casa',
                        studio: 'Estudio',
                        office: 'Oficina / Cowork',
                        other: 'Otro',
                      };
                      const buttonClassName = isActive
                        ? 'px-4 py-2 rounded-full text-xs font-bold bg-terreta-dark text-terreta-bg'
                        : 'px-4 py-2 rounded-full text-xs font-bold bg-terreta-bg text-terreta-secondary hover:bg-terreta-border';
                      return (
                        <button
                          key={value}
                          type="button"
                          className={buttonClassName}
                          onClick={() =>
                            setSelectedPropertyType(isActive ? null : value)
                          }
                        >
                          {labelMap[value]}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              {/* Price range */}
              <div className="grid md:grid-cols-3 gap-4 items-end">
                <div>
                  <label className="block text-sm font-bold text-terreta-dark mb-1">
                    Precio mínimo
                  </label>
                  <input
                    type="number"
                    min={0}
                    className="w-full bg-terreta-bg border border-terreta-border rounded-xl px-3 py-2 text-sm text-terreta-dark focus:border-terreta-accent focus:ring-1 focus:ring-terreta-accent outline-none"
                    value={minPrice}
                    onChange={(event) => setMinPrice(event.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-terreta-dark mb-1">
                    Precio máximo
                  </label>
                  <input
                    type="number"
                    min={0}
                    className="w-full bg-terreta-bg border border-terreta-border rounded-xl px-3 py-2 text-sm text-terreta-dark focus:border-terreta-accent focus:ring-1 focus:ring-terreta-accent outline-none"
                    value={maxPrice}
                    onChange={(event) => setMaxPrice(event.target.value)}
                  />
                </div>
                {allCities.length > 0 && (
                  <div className="hidden md:flex items-center gap-2 text-xs text-terreta-secondary">
                    <MapPin size={14} />
                    <span>
                      Ciudades más frecuentes:{' '}
                      {allCities.slice(0, 3).join(', ')}
                    </span>
                  </div>
                )}
              </div>

              {/* Amenities */}
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setOnlyFurnished(!onlyFurnished)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                    onlyFurnished
                      ? 'bg-terreta-accent text-white border-terreta-accent'
                      : 'bg-terreta-bg text-terreta-secondary border-terreta-border hover:bg-terreta-border'
                  }`}
                >
                  Amueblado
                </button>
                <button
                  type="button"
                  onClick={() => setOnlyBillsIncluded(!onlyBillsIncluded)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                    onlyBillsIncluded
                      ? 'bg-terreta-accent text-white border-terreta-accent'
                      : 'bg-terreta-bg text-terreta-secondary border-terreta-border hover:bg-terreta-border'
                  }`}
                >
                  Gastos incluidos
                </button>
                <button
                  type="button"
                  onClick={() => setOnlyPetsAllowed(!onlyPetsAllowed)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                    onlyPetsAllowed
                      ? 'bg-terreta-accent text-white border-terreta-accent'
                      : 'bg-terreta-bg text-terreta-secondary border-terreta-border hover:bg-terreta-border'
                  }`}
                >
                  Se aceptan mascotas
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Grid */}
        {filteredProperties.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Home size={40} className="text-terreta-accent mb-4" />
            <h4 className="font-sans text-2xl text-terreta-dark mb-2">
              No encontramos espacios con esos filtros
            </h4>
            <p className="max-w-md text-terreta-secondary mb-4">
              Ajusta la búsqueda o elimina filtros para descubrir más propiedades en
              la comunidad.
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-terreta-accent hover:text-terreta-accent/80 font-bold"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map((property) => (
              <button
                key={property.id}
                type="button"
                className="bg-terreta-card rounded-[12px] shadow-[0_2px_8px_rgba(0,0,0,0.06)] overflow-hidden hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-all duration-300 hover:-translate-y-1 cursor-pointer text-left"
                onClick={() => {
                  setSelectedProperty(property);
                  setIsModalOpen(true);
                }}
              >
                {/* Image */}
                {property.images && property.images.length > 0 ? (
                  <div className="relative h-44 bg-terreta-bg overflow-hidden">
                    <img
                      src={property.images[0]}
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/60 text-white text-xs font-bold flex items-center gap-1">
                      <Home size={14} />
                      <span>
                        {property.operation_type === 'rent'
                          ? 'Alquiler'
                          : property.operation_type === 'sale'
                          ? 'Venta'
                          : 'Habitación compartida'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="relative h-44 bg-gradient-to-br from-terreta-bg to-terreta-sidebar flex items-center justify-center">
                    <Home size={36} className="text-terreta-accent/40" />
                  </div>
                )}

                {/* Content */}
                <div className="p-5 space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-sans text-lg text-terreta-dark line-clamp-2">
                      {property.title}
                    </h3>
                    <div className="text-right">
                      <div className="font-bold text-terreta-accent text-sm">
                        {property.price.toLocaleString('es-ES')} {property.currency}
                      </div>
                      <div className="text-xs text-terreta-secondary">
                        {property.price_period === 'per_month'
                          ? 'al mes'
                          : property.price_period === 'per_week'
                          ? 'por semana'
                          : property.price_period === 'per_night'
                          ? 'por noche'
                          : 'total'}
                      </div>
                    </div>
                  </div>

                  {(property.neighborhood || property.city) && (
                    <div className="flex items-center gap-1.5 text-xs text-terreta-secondary">
                      <MapPin size={14} />
                      <span className="truncate">
                        {property.neighborhood}
                        {property.neighborhood && property.city && ' · '}
                        {property.city}
                      </span>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {property.furnished && (
                      <span className="px-2 py-0.5 bg-terreta-accent/10 text-terreta-accent text-[11px] rounded-full">
                        Amueblado
                      </span>
                    )}
                    {property.bills_included && (
                      <span className="px-2 py-0.5 bg-terreta-accent/10 text-terreta-accent text-[11px] rounded-full">
                        Gastos incluidos
                      </span>
                    )}
                    {property.pets_allowed && (
                      <span className="px-2 py-0.5 bg-terreta-accent/10 text-terreta-accent text-[11px] rounded-full">
                        Mascotas OK
                      </span>
                    )}
                    {property.video_urls && property.video_urls.length > 0 && (
                      <span className="px-2 py-0.5 bg-terreta-accent/10 text-terreta-accent text-[11px] rounded-full">
                        {property.video_urls.length} vídeo
                        {property.video_urls.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Modal de detalle */}
      <PropertyModal
        property={selectedProperty}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProperty(null);
        }}
      />
    </div>
  );
};

