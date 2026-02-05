import React, { useState, useRef } from 'react';
import {
  Image as ImageIcon,
  Video,
  MapPin,
  Euro,
  Home,
  Check,
  X,
} from 'lucide-react';
import { AuthUser, Property, PropertyOperationType, PropertyType } from '../types';

interface PropertyEditorProps {
  user: AuthUser;
  onCancel: () => void;
  onSave: (
    values: Omit<
      Property,
      | 'id'
      | 'ownerId'
      | 'slug'
      | 'status'
      | 'createdAt'
      | 'updatedAt'
      | 'videoUrls'
    > & {
      images: (File | string)[];
      videos: File[];
      contactEmail?: string | null;
      contactPhone?: string | null;
      contactWebsite?: string | null;
    }
  ) => void;
  isSaving?: boolean;
}

type OperationOption = {
  value: PropertyOperationType;
  label: string;
};

type PropertyTypeOption = {
  value: PropertyType;
  label: string;
};

const OPERATION_OPTIONS: OperationOption[] = [
  { value: 'rent', label: 'Alquiler' },
  { value: 'sale', label: 'Venta' },
  { value: 'roomshare', label: 'Habitación compartida' },
];

const PROPERTY_TYPE_OPTIONS: PropertyTypeOption[] = [
  { value: 'room', label: 'Habitación' },
  { value: 'apartment', label: 'Piso / Apartamento' },
  { value: 'house', label: 'Casa' },
  { value: 'studio', label: 'Estudio' },
  { value: 'office', label: 'Oficina / Cowork' },
  { value: 'other', label: 'Otro' },
];

export const PropertyEditor: React.FC<PropertyEditorProps> = ({
  user,
  onCancel,
  onSave,
  isSaving = false,
}) => {
  // Información básica
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [operationType, setOperationType] = useState<PropertyOperationType>('rent');
  const [propertyType, setPropertyType] = useState<PropertyType>('room');

  // Precio y condiciones
  const [price, setPrice] = useState<string>('');
  const [currency, setCurrency] = useState<string>('EUR');
  const [pricePeriod, setPricePeriod] = useState<'per_month' | 'per_week' | 'per_night' | 'total'>('per_month');
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [billsIncluded, setBillsIncluded] = useState<boolean>(false);

  // Características físicas
  const [bedrooms, setBedrooms] = useState<string>('');
  const [bathrooms, setBathrooms] = useState<string>('');
  const [sizeM2, setSizeM2] = useState<string>('');
  const [floor, setFloor] = useState<string>('');
  const [furnished, setFurnished] = useState<boolean>(true);
  const [petsAllowed, setPetsAllowed] = useState<boolean>(false);

  // Ubicación
  const [address, setAddress] = useState<string>('');
  const [neighborhood, setNeighborhood] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [country, setCountry] = useState<string>('España');

  // Media
  const [images, setImages] = useState<(File | string)[]>([]);
  const [videos, setVideos] = useState<File[]>([]);
  const [externalLink, setExternalLink] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Contacto
  const [contactEmail, setContactEmail] = useState<string>('');
  const [contactPhone, setContactPhone] = useState<string>('');
  const [contactWebsite, setContactWebsite] = useState<string>('');

  const handleToggleBoolean = (value: boolean, setter: (next: boolean) => void) => {
    setter(!value);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) {
      return;
    }

    const files = Array.from(event.target.files).slice(0, Math.max(0, 8 - images.length));
    if (files.length === 0) {
      return;
    }
    setImages((prev) => [...prev, ...files]);
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) {
      return;
    }
    const files = Array.from(event.target.files).filter((file) =>
      file.type.startsWith('video/')
    );
    const remainingSlots = Math.max(0, 2 - videos.length);
    const nextVideos = files.slice(0, remainingSlots);
    if (nextVideos.length === 0) {
      return;
    }
    setVideos((prev) => [...prev, ...nextVideos]);
  };

  const handleRemoveVideo = (index: number) => {
    setVideos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    const numericPrice = Number(price);
    if (!title.trim() || !description.trim() || Number.isNaN(numericPrice) || numericPrice <= 0) {
      alert('Completa al menos título, descripción y un precio válido.');
      return;
    }

    const numericDeposit = depositAmount ? Number(depositAmount) : null;
    const numericBedrooms = bedrooms ? Number(bedrooms) : null;
    const numericBathrooms = bathrooms ? Number(bathrooms) : null;
    const numericSizeM2 = sizeM2 ? Number(sizeM2) : null;
    const numericFloor = floor ? Number(floor) : null;

    const propertyPayload: Omit<
      Property,
      'id' | 'ownerId' | 'slug' | 'status' | 'createdAt' | 'updatedAt'
    > = {
      title: title.trim(),
      description: description.trim(),
      operationType,
      propertyType,
      price: numericPrice,
      currency: currency.trim().toUpperCase() || 'EUR',
      pricePeriod,
      depositAmount: Number.isNaN(numericDeposit || NaN) ? null : numericDeposit,
      billsIncluded,
      bedrooms: Number.isNaN(numericBedrooms || NaN) ? null : numericBedrooms,
      bathrooms: Number.isNaN(numericBathrooms || NaN) ? null : numericBathrooms,
      sizeM2: Number.isNaN(numericSizeM2 || NaN) ? null : numericSizeM2,
      floor: Number.isNaN(numericFloor || NaN) ? null : numericFloor,
      furnished,
      petsAllowed,
      address: address.trim() || null,
      neighborhood: neighborhood.trim() || null,
      city: city.trim() || null,
      country: country.trim() || null,
      images,
      videos,
      externalLink: externalLink.trim() || null,
      contactEmail: contactEmail.trim() || null,
      contactPhone: contactPhone.trim() || null,
      contactWebsite: contactWebsite.trim() || null,
    };

    onSave(propertyPayload);
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-80px)] overflow-hidden bg-terreta-bg">
      {/* Formulario */}
      <div className="flex-1 overflow-y-auto bg-white border-r border-terreta-border">
        <div className="max-w-3xl mx-auto px-6 py-8 pb-24">
          <div className="mb-8 border-b border-terreta-border pb-4">
            <h2 className="font-serif text-3xl text-terreta-dark mb-2">
              Publica tu espacio
            </h2>
            <p className="text-sm text-terreta-secondary font-sans">
              Comparte habitaciones, pisos o espacios con la comunidad. Cuanta más
              información des, mejor.
            </p>
          </div>

          <div className="space-y-8">
            {/* Información básica */}
            <section className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-terreta-secondary uppercase tracking-wide mb-1.5">
                  Título del anuncio
                </label>
                <input
                  type="text"
                  className="w-full bg-white border border-terreta-border rounded-xl px-4 py-3 text-lg font-bold text-terreta-dark focus:border-terreta-accent focus:ring-1 focus:ring-terreta-accent outline-none placeholder-terreta-secondary/40"
                  placeholder="Ej. Habitación luminosa en Ruzafa"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <span className="block text-xs font-bold text-terreta-secondary uppercase tracking-wide mb-1.5">
                    Operación
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {OPERATION_OPTIONS.map((option) => {
                      const isActive = operationType === option.value;
                      const buttonClassName = isActive
                        ? 'px-4 py-2 rounded-full text-xs font-bold bg-terreta-accent text-white'
                        : 'px-4 py-2 rounded-full text-xs font-bold bg-terreta-bg text-terreta-secondary hover:bg-terreta-border';

                      return (
                        <button
                          key={option.value}
                          type="button"
                          className={buttonClassName}
                          onClick={() => setOperationType(option.value)}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <span className="block text-xs font-bold text-terreta-secondary uppercase tracking-wide mb-1.5">
                    Tipo de propiedad
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {PROPERTY_TYPE_OPTIONS.map((option) => {
                      const isActive = propertyType === option.value;
                      const buttonClassName = isActive
                        ? 'px-4 py-2 rounded-full text-xs font-bold bg-terreta-dark text-terreta-bg'
                        : 'px-4 py-2 rounded-full text-xs font-bold bg-terreta-bg text-terreta-secondary hover:bg-terreta-border';

                      return (
                        <button
                          key={option.value}
                          type="button"
                          className={buttonClassName}
                          onClick={() => setPropertyType(option.value)}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>

            {/* Descripción */}
            <section className="space-y-2">
              <label className="block text-xs font-bold text-terreta-secondary uppercase tracking-wide mb-1.5">
                Descripción
              </label>
              <textarea
                className="w-full bg-white border border-terreta-border rounded-xl px-4 py-3 text-sm text-terreta-dark focus:border-terreta-accent focus:ring-1 focus:ring-terreta-accent outline-none placeholder-terreta-secondary/40 min-h-[160px] resize-y"
                placeholder="Cuenta cómo es el espacio, con quién se comparte, qué incluye, a qué distancia está del centro, etc."
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </section>

            {/* Precio y condiciones */}
            <section className="space-y-4 bg-terreta-bg/40 p-5 rounded-2xl border border-terreta-border">
              <h3 className="font-serif text-lg text-terreta-dark mb-2 flex items-center gap-2">
                <Euro size={18} />
                Precio y condiciones
              </h3>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-terreta-secondary uppercase tracking-wide mb-1.5">
                    Precio
                  </label>
                  <input
                    type="number"
                    min={0}
                    className="w-full bg-white border border-terreta-border rounded-xl px-4 py-2.5 text-sm text-terreta-dark focus:border-terreta-accent focus:ring-1 focus:ring-terreta-accent outline-none"
                    placeholder="Ej. 450"
                    value={price}
                    onChange={(event) => setPrice(event.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-terreta-secondary uppercase tracking-wide mb-1.5">
                    Moneda
                  </label>
                  <input
                    type="text"
                    className="w-full bg-white border border-terreta-border rounded-xl px-4 py-2.5 text-sm text-terreta-dark focus:border-terreta-accent focus:ring-1 focus:ring-terreta-accent outline-none"
                    placeholder="EUR"
                    value={currency}
                    onChange={(event) => setCurrency(event.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-terreta-secondary uppercase tracking-wide mb-1.5">
                    Periodo
                  </label>
                  <select
                    className="w-full bg-white border border-terreta-border rounded-xl px-4 py-2.5 text-sm text-terreta-dark focus:border-terreta-accent focus:ring-1 focus:ring-terreta-accent outline-none"
                    value={pricePeriod}
                    onChange={(event) =>
                      setPricePeriod(event.target.value as typeof pricePeriod)
                    }
                  >
                    <option value="per_month">al mes</option>
                    <option value="per_week">por semana</option>
                    <option value="per_night">por noche</option>
                    <option value="total">precio total</option>
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-terreta-secondary uppercase tracking-wide mb-1.5">
                    Fianza (opcional)
                  </label>
                  <input
                    type="number"
                    min={0}
                    className="w-full bg-white border border-terreta-border rounded-xl px-4 py-2.5 text-sm text-terreta-dark focus:border-terreta-accent focus:ring-1 focus:ring-terreta-accent outline-none"
                    placeholder="Ej. 450"
                    value={depositAmount}
                    onChange={(event) => setDepositAmount(event.target.value)}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleBoolean(billsIncluded, setBillsIncluded)}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm ${
                    billsIncluded
                      ? 'border-terreta-accent bg-terreta-accent/10 text-terreta-accent'
                      : 'border-terreta-border bg-white text-terreta-secondary'
                  }`}
                >
                  <span>Gastos incluidos</span>
                  {billsIncluded && <Check size={18} />}
                </button>
              </div>
            </section>

            {/* Características físicas */}
            <section className="space-y-4">
              <h3 className="font-serif text-lg text-terreta-dark mb-1 flex items-center gap-2">
                <Home size={18} />
                Detalles del espacio
              </h3>

              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-terreta-secondary uppercase tracking-wide mb-1.5">
                    Habitaciones
                  </label>
                  <input
                    type="number"
                    min={0}
                    className="w-full bg-white border border-terreta-border rounded-xl px-4 py-2.5 text-sm text-terreta-dark focus:border-terreta-accent focus:ring-1 focus:ring-terreta-accent outline-none"
                    value={bedrooms}
                    onChange={(event) => setBedrooms(event.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-terreta-secondary uppercase tracking-wide mb-1.5">
                    Baños
                  </label>
                  <input
                    type="number"
                    min={0}
                    className="w-full bg-white border border-terreta-border rounded-xl px-4 py-2.5 text-sm text-terreta-dark focus:border-terreta-accent focus:ring-1 focus:ring-terreta-accent outline-none"
                    value={bathrooms}
                    onChange={(event) => setBathrooms(event.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-terreta-secondary uppercase tracking-wide mb-1.5">
                    Metros cuadrados
                  </label>
                  <input
                    type="number"
                    min={0}
                    className="w-full bg-white border border-terreta-border rounded-xl px-4 py-2.5 text-sm text-terreta-dark focus:border-terreta-accent focus:ring-1 focus:ring-terreta-accent outline-none"
                    value={sizeM2}
                    onChange={(event) => setSizeM2(event.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-terreta-secondary uppercase tracking-wide mb-1.5">
                    Planta
                  </label>
                  <input
                    type="number"
                    className="w-full bg-white border border-terreta-border rounded-xl px-4 py-2.5 text-sm text-terreta-dark focus:border-terreta-accent focus:ring-1 focus:ring-terreta-accent outline-none"
                    value={floor}
                    onChange={(event) => setFloor(event.target.value)}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => handleToggleBoolean(furnished, setFurnished)}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm ${
                    furnished
                      ? 'border-terreta-accent bg-terreta-accent/10 text-terreta-accent'
                      : 'border-terreta-border bg-white text-terreta-secondary'
                  }`}
                >
                  <span>Amueblado</span>
                  {furnished && <Check size={18} />}
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleBoolean(petsAllowed, setPetsAllowed)}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm ${
                    petsAllowed
                      ? 'border-terreta-accent bg-terreta-accent/10 text-terreta-accent'
                      : 'border-terreta-border bg-white text-terreta-secondary'
                  }`}
                >
                  <span>Se aceptan mascotas</span>
                  {petsAllowed && <Check size={18} />}
                </button>
              </div>
            </section>

            {/* Ubicación */}
            <section className="space-y-4 bg-terreta-bg/40 p-5 rounded-2xl border border-terreta-border">
              <h3 className="font-serif text-lg text-terreta-dark mb-2 flex items-center gap-2">
                <MapPin size={18} />
                Ubicación
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-terreta-secondary uppercase tracking-wide mb-1.5">
                    Dirección (opcional)
                  </label>
                  <input
                    type="text"
                    className="w-full bg-white border border-terreta-border rounded-xl px-4 py-2.5 text-sm text-terreta-dark focus:border-terreta-accent focus:ring-1 focus:ring-terreta-accent outline-none"
                    placeholder="Calle, número, piso..."
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-terreta-secondary uppercase tracking-wide mb-1.5">
                      Barrio / zona
                    </label>
                    <input
                      type="text"
                      className="w-full bg-white border border-terreta-border rounded-xl px-4 py-2.5 text-sm text-terreta-dark focus:border-terreta-accent focus:ring-1 focus:ring-terreta-accent outline-none"
                      placeholder="Ruzafa, Benimaclet..."
                      value={neighborhood}
                      onChange={(event) => setNeighborhood(event.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-terreta-secondary uppercase tracking-wide mb-1.5">
                      Ciudad
                    </label>
                    <input
                      type="text"
                      className="w-full bg-white border border-terreta-border rounded-xl px-4 py-2.5 text-sm text-terreta-dark focus:border-terreta-accent focus:ring-1 focus:ring-terreta-accent outline-none"
                      placeholder="València"
                      value={city}
                      onChange={(event) => setCity(event.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-terreta-secondary uppercase tracking-wide mb-1.5">
                      País
                    </label>
                    <input
                      type="text"
                      className="w-full bg-white border border-terreta-border rounded-xl px-4 py-2.5 text-sm text-terreta-dark focus:border-terreta-accent focus:ring-1 focus:ring-terreta-accent outline-none"
                      value={country}
                      onChange={(event) => setCountry(event.target.value)}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Multimedia */}
            <section className="space-y-4 bg-terreta-bg/20 p-5 rounded-2xl border border-terreta-border">
              <h3 className="font-serif text-lg text-terreta-dark mb-2 flex items-center gap-2">
                <ImageIcon size={18} />
                Fotos y video
              </h3>

              <div>
                <label className="block text-xs font-bold text-terreta-secondary uppercase tracking-wide mb-2">
                  Fotografías del espacio
                </label>
                <div className="flex flex-wrap gap-3">
                  {images.map((image, index) => (
                    <div
                      key={index}
                      className="relative w-24 h-24 rounded-lg overflow-hidden group border border-terreta-border bg-terreta-bg"
                    >
                      <img
                        src={image instanceof File ? URL.createObjectURL(image) : image}
                        alt={`Imagen ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Eliminar imagen"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-24 h-24 border-2 border-dashed border-terreta-border rounded-lg flex flex-col items-center justify-center text-terreta-secondary hover:border-terreta-accent hover:text-terreta-accent transition-colors bg-white"
                  >
                    <ImageIcon size={22} />
                    <span className="text-[10px] font-bold mt-1">AÑADIR</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-terreta-secondary uppercase tracking-wide mb-1.5">
                  Vídeos (máx. 2)
                </label>
                <div className="flex flex-wrap gap-3">
                  {videos.map((video, index) => (
                    <div
                      key={index}
                      className="relative w-28 h-20 rounded-lg overflow-hidden group border border-terreta-border bg-terreta-bg flex items-center justify-center"
                    >
                      <Video size={24} className="text-terreta-secondary" />
                      <button
                        type="button"
                        onClick={() => handleRemoveVideo(index)}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Eliminar vídeo"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  {videos.length < 2 && (
                    <>
                      <label
                        htmlFor="property-video-input"
                        className="w-28 h-20 border-2 border-dashed border-terreta-border rounded-lg flex flex-col items-center justify-center text-terreta-secondary hover:border-terreta-accent hover:text-terreta-accent transition-colors bg-white cursor-pointer"
                      >
                        <Video size={22} />
                        <span className="text-[10px] font-bold mt-1">VÍDEO</span>
                      </label>
                      <input
                        id="property-video-input"
                        type="file"
                        accept="video/*"
                        multiple
                        className="hidden"
                        onChange={handleVideoUpload}
                      />
                    </>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-terreta-secondary uppercase tracking-wide mb-1.5">
                  Enlace externo (opcional)
                </label>
                <input
                  type="url"
                  className="w-full bg-white border border-terreta-border rounded-xl px-4 py-2.5 text-sm text-terreta-dark focus:border-terreta-accent focus:ring-1 focus:ring-terreta-accent outline-none placeholder-terreta-secondary/40"
                  placeholder="Enlace a otro portal o ficha"
                  value={externalLink}
                  onChange={(event) => setExternalLink(event.target.value)}
                />
              </div>
            </section>

            {/* Contacto */}
            <section className="space-y-4">
              <h3 className="font-serif text-lg text-terreta-dark mb-1">
                Cómo quieres que te contacten
              </h3>
              <p className="text-xs text-terreta-secondary mb-2">
                Deja al menos una forma de contacto para que personas interesadas puedan
                escribirte.
              </p>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-terreta-secondary uppercase tracking-wide mb-1.5">
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    className="w-full bg-white border border-terreta-border rounded-xl px-4 py-2.5 text-sm text-terreta-dark focus:border-terreta-accent focus:ring-1 focus:ring-terreta-accent outline-none placeholder-terreta-secondary/40"
                    placeholder="tucorreo@ejemplo.com"
                    value={contactEmail}
                    onChange={(event) => setContactEmail(event.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-terreta-secondary uppercase tracking-wide mb-1.5">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    className="w-full bg-white border border-terreta-border rounded-xl px-4 py-2.5 text-sm text-terreta-dark focus:border-terreta-accent focus:ring-1 focus:ring-terreta-accent outline-none placeholder-terreta-secondary/40"
                    placeholder="+34 ..."
                    value={contactPhone}
                    onChange={(event) => setContactPhone(event.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-terreta-secondary uppercase tracking-wide mb-1.5">
                    Sitio web
                  </label>
                  <input
                    type="url"
                    className="w-full bg-white border border-terreta-border rounded-xl px-4 py-2.5 text-sm text-terreta-dark focus:border-terreta-accent focus:ring-1 focus:ring-terreta-accent outline-none placeholder-terreta-secondary/40"
                    placeholder="https://tusitio.com"
                    value={contactWebsite}
                    onChange={(event) => setContactWebsite(event.target.value)}
                  />
                </div>
              </div>
            </section>

            {/* Acciones */}
            <section className="flex flex-col-reverse md:flex-row gap-4 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 py-3 border-2 border-terreta-border text-terreta-secondary font-bold rounded-xl hover:border-terreta-dark hover:text-terreta-dark transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSaving}
                className="flex-[2] py-3 bg-terreta-accent text-white font-bold rounded-xl hover:bg-terreta-dark shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Publicando...' : 'Publicar propiedad'}
              </button>
            </section>
          </div>
        </div>
      </div>

      {/* Columna derecha simple con contexto */}
      <div className="hidden lg:flex flex-1 bg-terreta-bg/80 items-center justify-center p-8">
        <div className="max-w-md text-center">
          <p className="text-sm text-terreta-secondary mb-3 uppercase tracking-[0.2em]">
            Espacios en la Terreta
          </p>
          <h3 className="font-serif text-3xl text-terreta-dark mb-3">
            Dale hogar a alguien de la comunidad
          </h3>
          <p className="text-sm text-terreta-secondary">
            Describe tu espacio con cariño y claridad. Piensa qué te gustaría saber
            a ti si fueras quien está buscando habitación o piso en València.
          </p>
        </div>
      </div>
    </div>
  );
};

