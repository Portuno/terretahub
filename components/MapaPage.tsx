import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMapEvents } from 'react-leaflet';
import { divIcon, LatLngLiteral } from 'leaflet';
import { BriefcaseBusiness, CalendarClock, MapPin, Plus, StickyNote } from 'lucide-react';
import { AuthUser } from '../types';
import { supabase } from '../lib/supabase';
import { EventTimeFilter, filterMapItems, getEventTimeBucket, MapItem, MapItemType } from '../lib/mapUtils';

interface MapaPageProps {
  user: AuthUser | null;
  onOpenAuth: (referrerUsername?: string) => void;
}

interface BusinessFormState {
  name: string;
  description: string;
  tags: string;
  contact: string;
}

interface NoteFormState {
  title: string;
  note: string;
  category: string;
}

interface EventFormState {
  title: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  category: string;
}

const valenciaCenter: LatLngLiteral = { lat: 39.4699, lng: -0.3763 };

const markerIcon = (type: MapItemType) =>
  divIcon({
    className: 'custom-map-marker',
    html: `<div style="width:34px;height:34px;border-radius:9999px;display:flex;align-items:center;justify-content:center;color:white;font-size:16px;font-weight:700;border:2px solid white;box-shadow:0 4px 10px rgba(0,0,0,0.25);background:${
      type === 'business' ? '#1f8a70' : type === 'event' ? '#ff7f50' : '#6b5b95'
    };">${type === 'business' ? 'N' : type === 'event' ? 'E' : 'A'}</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -30],
  });

const ClickMapPicker: React.FC<{ onPick: (position: LatLngLiteral) => void }> = ({ onPick }) => {
  useMapEvents({
    click(event) {
      onPick(event.latlng);
    },
  });

  return null;
};

export const MapaPage: React.FC<MapaPageProps> = ({ user, onOpenAuth }) => {
  const [items, setItems] = useState<MapItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTypes, setActiveTypes] = useState<MapItemType[]>(['business', 'event', 'note']);
  const [eventFilter, setEventFilter] = useState<EventTimeFilter>('future');
  const [selectedPosition, setSelectedPosition] = useState<LatLngLiteral | null>(null);
  const [activeCreate, setActiveCreate] = useState<MapItemType>('business');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [businessForm, setBusinessForm] = useState<BusinessFormState>({
    name: '',
    description: '',
    tags: '',
    contact: '',
  });
  const [noteForm, setNoteForm] = useState<NoteFormState>({
    title: '',
    note: '',
    category: '',
  });
  const [eventForm, setEventForm] = useState<EventFormState>({
    title: '',
    description: '',
    location: '',
    startDate: '',
    endDate: '',
    category: '',
  });
  const [errorMessage, setErrorMessage] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [businessesResult, notesResult, eventsResult] = await Promise.all([
        supabase.from('map_businesses').select('id, name, description, tags, latitude, longitude, created_at'),
        supabase.from('map_notes').select('id, title, note, category, latitude, longitude, created_at'),
        supabase
          .from('events')
          .select('id, title, description, category, start_date, location, latitude, longitude, status')
          .eq('status', 'published'),
      ]);

      const businessItems: MapItem[] =
        businessesResult.data?.map((business: any) => ({
          id: business.id,
          type: 'business',
          title: business.name,
          description: business.description,
          tags: business.tags || [],
          latitude: Number(business.latitude),
          longitude: Number(business.longitude),
          createdAt: business.created_at,
        })) || [];

      const noteItems: MapItem[] =
        notesResult.data?.map((note: any) => ({
          id: note.id,
          type: 'note',
          title: note.title,
          description: note.note,
          tags: note.category ? [note.category] : [],
          latitude: Number(note.latitude),
          longitude: Number(note.longitude),
          createdAt: note.created_at,
        })) || [];

      const eventItems: MapItem[] =
        eventsResult.data
          ?.filter((event: any) => event.latitude !== null && event.longitude !== null)
          .map((event: any) => ({
            id: event.id,
            type: 'event',
            title: event.title,
            description: event.description || event.location,
            tags: event.category ? [event.category] : [],
            latitude: Number(event.latitude),
            longitude: Number(event.longitude),
            eventStartDate: event.start_date,
          })) || [];

      setItems([...businessItems, ...eventItems, ...noteItems]);
      setErrorMessage('');
    } catch (error) {
      setErrorMessage('No se pudo cargar el mapa. Ejecuta primero los SQL de MAPA y recarga.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const visibleItems = useMemo(() => filterMapItems(items, activeTypes, eventFilter), [items, activeTypes, eventFilter]);

  const handleToggleType = (type: MapItemType) => {
    setActiveTypes((currentTypes) => {
      if (currentTypes.includes(type)) {
        if (currentTypes.length === 1) return currentTypes;
        return currentTypes.filter((currentType) => currentType !== type);
      }
      return [...currentTypes, type];
    });
  };

  const handleRequireAuth = () => {
    if (user) return true;
    onOpenAuth();
    return false;
  };

  const handleSubmitBusiness = async () => {
    if (!handleRequireAuth()) return;
    if (!selectedPosition || !businessForm.name.trim()) {
      setErrorMessage('Selecciona un punto del mapa y completa el nombre del negocio.');
      return;
    }
    setIsSubmitting(true);
    const tags = businessForm.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

    const { error } = await supabase.from('map_businesses').insert({
      owner_id: user!.id,
      name: businessForm.name.trim(),
      description: businessForm.description.trim() || null,
      tags,
      contact: businessForm.contact.trim() || null,
      latitude: selectedPosition.lat,
      longitude: selectedPosition.lng,
    });

    setIsSubmitting(false);
    if (error) {
      setErrorMessage('Error al guardar negocio.');
      return;
    }

    setBusinessForm({ name: '', description: '', tags: '', contact: '' });
    setSelectedPosition(null);
    loadData();
  };

  const handleSubmitNote = async () => {
    if (!handleRequireAuth()) return;
    if (!selectedPosition || !noteForm.title.trim() || !noteForm.note.trim()) {
      setErrorMessage('Selecciona un punto del mapa y completa título + nota.');
      return;
    }
    setIsSubmitting(true);
    const { error } = await supabase.from('map_notes').insert({
      owner_id: user!.id,
      title: noteForm.title.trim(),
      note: noteForm.note.trim(),
      category: noteForm.category.trim() || null,
      latitude: selectedPosition.lat,
      longitude: selectedPosition.lng,
    });
    setIsSubmitting(false);

    if (error) {
      setErrorMessage('Error al guardar acontecimiento.');
      return;
    }

    setNoteForm({ title: '', note: '', category: '' });
    setSelectedPosition(null);
    loadData();
  };

  const handleSubmitEvent = async () => {
    if (!handleRequireAuth()) return;
    if (!selectedPosition || !eventForm.title.trim() || !eventForm.startDate || !eventForm.endDate) {
      setErrorMessage('Selecciona punto de mapa, título y fechas válidas.');
      return;
    }

    const startDate = new Date(eventForm.startDate);
    const endDate = new Date(eventForm.endDate);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || endDate <= startDate) {
      setErrorMessage('La fecha de fin debe ser mayor que la fecha de inicio.');
      return;
    }

    setIsSubmitting(true);
    const slugBase = eventForm.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const { error } = await supabase.from('events').insert({
      organizer_id: user!.id,
      title: eventForm.title.trim(),
      slug: `${slugBase}-${Date.now()}`,
      description: eventForm.description.trim() || null,
      location: eventForm.location.trim() || 'Valencia',
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      category: eventForm.category.trim() || null,
      status: 'draft',
      latitude: selectedPosition.lat,
      longitude: selectedPosition.lng,
      map_icon_type: 'event',
    });
    setIsSubmitting(false);

    if (error) {
      setErrorMessage('Error al crear evento.');
      return;
    }

    setEventForm({ title: '', description: '', location: '', startDate: '', endDate: '', category: '' });
    setSelectedPosition(null);
    loadData();
  };

  return (
    <section className="max-w-7xl mx-auto py-6 space-y-4">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 rounded-2xl border border-terreta-border overflow-hidden">
          <MapContainer center={valenciaCenter} zoom={13} className="h-[580px] w-full" scrollWheelZoom>
            <ClickMapPicker onPick={setSelectedPosition} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {visibleItems.map((item) => (
              <Marker
                key={`${item.type}-${item.id}`}
                position={{ lat: item.latitude, lng: item.longitude }}
                icon={markerIcon(item.type)}
              >
                <Popup>
                  <div className="space-y-1">
                    <p className="font-semibold">{item.title}</p>
                    {item.description ? <p className="text-sm">{item.description}</p> : null}
                    {item.type === 'event' ? (
                      <p className="text-xs">Estado: {getEventTimeBucket(item.eventStartDate) === 'future' ? 'Futuro' : getEventTimeBucket(item.eventStartDate) === 'today' ? 'Hoy' : 'Pasado'}</p>
                    ) : null}
                    {item.tags && item.tags.length > 0 ? <p className="text-xs">Tags: {item.tags.join(', ')}</p> : null}
                  </div>
                </Popup>
              </Marker>
            ))}
            {selectedPosition ? <Marker position={selectedPosition} icon={markerIcon(activeCreate)} /> : null}
          </MapContainer>
        </div>

        <aside className="rounded-2xl border border-terreta-border bg-terreta-card p-4 space-y-4">
          <div>
            <p className="text-sm font-semibold text-terreta-dark mb-2">Tipos visibles</p>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => handleToggleType('business')} className={`px-3 py-1.5 rounded-full text-sm ${activeTypes.includes('business') ? 'bg-terreta-accent text-white' : 'bg-terreta-sidebar text-terreta-dark'}`}>
                Negocios
              </button>
              <button onClick={() => handleToggleType('event')} className={`px-3 py-1.5 rounded-full text-sm ${activeTypes.includes('event') ? 'bg-terreta-accent text-white' : 'bg-terreta-sidebar text-terreta-dark'}`}>
                Eventos
              </button>
              <button onClick={() => handleToggleType('note')} className={`px-3 py-1.5 rounded-full text-sm ${activeTypes.includes('note') ? 'bg-terreta-accent text-white' : 'bg-terreta-sidebar text-terreta-dark'}`}>
                Acontecimientos
              </button>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-terreta-dark mb-2">Filtro temporal de eventos</p>
            <select
              className="w-full rounded-lg border border-terreta-border bg-terreta-bg px-3 py-2 text-sm"
              value={eventFilter}
              onChange={(event) => setEventFilter(event.target.value as EventTimeFilter)}
            >
              <option value="future">Futuros</option>
              <option value="today">Hoy</option>
              <option value="past">Pasados</option>
              <option value="all">Todos</option>
            </select>
          </div>

          <div className="border-t border-terreta-border pt-4 space-y-3">
            <p className="text-sm font-semibold text-terreta-dark">Agregar al mapa</p>
            <div className="flex gap-2">
              <button onClick={() => setActiveCreate('business')} className={`flex-1 px-3 py-2 rounded-lg text-sm ${activeCreate === 'business' ? 'bg-terreta-accent text-white' : 'bg-terreta-sidebar text-terreta-dark'}`}>
                <BriefcaseBusiness className="inline mr-1" size={14} /> Negocio
              </button>
              <button onClick={() => setActiveCreate('event')} className={`flex-1 px-3 py-2 rounded-lg text-sm ${activeCreate === 'event' ? 'bg-terreta-accent text-white' : 'bg-terreta-sidebar text-terreta-dark'}`}>
                <CalendarClock className="inline mr-1" size={14} /> Evento
              </button>
              <button onClick={() => setActiveCreate('note')} className={`flex-1 px-3 py-2 rounded-lg text-sm ${activeCreate === 'note' ? 'bg-terreta-accent text-white' : 'bg-terreta-sidebar text-terreta-dark'}`}>
                <StickyNote className="inline mr-1" size={14} /> Nota
              </button>
            </div>

            <p className="text-xs text-terreta-dark/70 flex items-center gap-1">
              <MapPin size={14} /> Haz click en el mapa para fijar la ubicación.
            </p>
            {selectedPosition ? (
              <p className="text-xs text-terreta-dark/70">
                Punto seleccionado: {selectedPosition.lat.toFixed(5)}, {selectedPosition.lng.toFixed(5)}
              </p>
            ) : null}

            {activeCreate === 'business' ? (
              <div className="space-y-2">
                <input className="w-full rounded-lg border border-terreta-border bg-terreta-bg px-3 py-2 text-sm" placeholder="Nombre del negocio" value={businessForm.name} onChange={(event) => setBusinessForm((currentForm) => ({ ...currentForm, name: event.target.value }))} />
                <textarea className="w-full rounded-lg border border-terreta-border bg-terreta-bg px-3 py-2 text-sm" placeholder="Descripción" value={businessForm.description} onChange={(event) => setBusinessForm((currentForm) => ({ ...currentForm, description: event.target.value }))} />
                <input className="w-full rounded-lg border border-terreta-border bg-terreta-bg px-3 py-2 text-sm" placeholder="Tags separados por coma" value={businessForm.tags} onChange={(event) => setBusinessForm((currentForm) => ({ ...currentForm, tags: event.target.value }))} />
                <input className="w-full rounded-lg border border-terreta-border bg-terreta-bg px-3 py-2 text-sm" placeholder="Contacto (opcional)" value={businessForm.contact} onChange={(event) => setBusinessForm((currentForm) => ({ ...currentForm, contact: event.target.value }))} />
                <button disabled={isSubmitting} onClick={handleSubmitBusiness} className="w-full rounded-lg bg-terreta-accent text-white px-3 py-2 text-sm font-semibold disabled:opacity-50">
                  <Plus size={14} className="inline mr-1" /> Publicar negocio
                </button>
              </div>
            ) : null}

            {activeCreate === 'event' ? (
              <div className="space-y-2">
                <input className="w-full rounded-lg border border-terreta-border bg-terreta-bg px-3 py-2 text-sm" placeholder="Título del evento" value={eventForm.title} onChange={(event) => setEventForm((currentForm) => ({ ...currentForm, title: event.target.value }))} />
                <textarea className="w-full rounded-lg border border-terreta-border bg-terreta-bg px-3 py-2 text-sm" placeholder="Descripción" value={eventForm.description} onChange={(event) => setEventForm((currentForm) => ({ ...currentForm, description: event.target.value }))} />
                <input className="w-full rounded-lg border border-terreta-border bg-terreta-bg px-3 py-2 text-sm" placeholder="Ubicación textual" value={eventForm.location} onChange={(event) => setEventForm((currentForm) => ({ ...currentForm, location: event.target.value }))} />
                <input type="datetime-local" className="w-full rounded-lg border border-terreta-border bg-terreta-bg px-3 py-2 text-sm" value={eventForm.startDate} onChange={(event) => setEventForm((currentForm) => ({ ...currentForm, startDate: event.target.value }))} />
                <input type="datetime-local" className="w-full rounded-lg border border-terreta-border bg-terreta-bg px-3 py-2 text-sm" value={eventForm.endDate} onChange={(event) => setEventForm((currentForm) => ({ ...currentForm, endDate: event.target.value }))} />
                <input className="w-full rounded-lg border border-terreta-border bg-terreta-bg px-3 py-2 text-sm" placeholder="Categoría (opcional)" value={eventForm.category} onChange={(event) => setEventForm((currentForm) => ({ ...currentForm, category: event.target.value }))} />
                <button disabled={isSubmitting} onClick={handleSubmitEvent} className="w-full rounded-lg bg-terreta-accent text-white px-3 py-2 text-sm font-semibold disabled:opacity-50">
                  <Plus size={14} className="inline mr-1" /> Crear evento
                </button>
              </div>
            ) : null}

            {activeCreate === 'note' ? (
              <div className="space-y-2">
                <input className="w-full rounded-lg border border-terreta-border bg-terreta-bg px-3 py-2 text-sm" placeholder="Título del acontecimiento" value={noteForm.title} onChange={(event) => setNoteForm((currentForm) => ({ ...currentForm, title: event.target.value }))} />
                <textarea className="w-full rounded-lg border border-terreta-border bg-terreta-bg px-3 py-2 text-sm" placeholder="Nota" value={noteForm.note} onChange={(event) => setNoteForm((currentForm) => ({ ...currentForm, note: event.target.value }))} />
                <input className="w-full rounded-lg border border-terreta-border bg-terreta-bg px-3 py-2 text-sm" placeholder="Categoría (opcional)" value={noteForm.category} onChange={(event) => setNoteForm((currentForm) => ({ ...currentForm, category: event.target.value }))} />
                <button disabled={isSubmitting} onClick={handleSubmitNote} className="w-full rounded-lg bg-terreta-accent text-white px-3 py-2 text-sm font-semibold disabled:opacity-50">
                  <Plus size={14} className="inline mr-1" /> Publicar nota
                </button>
              </div>
            ) : null}
          </div>

          {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}
          {isLoading ? <p className="text-sm text-terreta-dark/70">Cargando mapa...</p> : null}
        </aside>
      </div>
    </section>
  );
};
