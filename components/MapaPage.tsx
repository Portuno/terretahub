import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { divIcon, LatLngLiteral } from 'leaflet';
import { BriefcaseBusiness, CalendarClock, MapPin, Plus, StickyNote, Search } from 'lucide-react';
import { AuthUser } from '../types';
import { supabase } from '../lib/supabase';
import {
  EventTimeFilter,
  filterMapItems,
  getEventTimeBucket,
  MapItem,
  MapItemType,
  MAP_TYPE_LABELS,
} from '../lib/mapUtils';
import { executeQueryWithRetry } from '../lib/supabaseHelpers';
import { QueryState } from './QueryState';
import { Toast } from './Toast';
import { listEntities, listEvents, listZones } from '../lib/directoryApi';
import type { DirectoryCategory, DirectoryZone } from '../lib/directoryTypes';
import { CATEGORY_LABELS, DIRECTORY_CATEGORIES } from '../lib/directoryTypes';
import { formatDirectoryAddress } from '../lib/geoPrecision';

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

const DEFAULT_TYPES: MapItemType[] = [
  'dir_entity',
  'dir_person',
  'dir_event',
  'business',
  'event',
  'note',
];

const markerColor = (item: MapItem): string => {
  if (item.source === 'directory') {
    if (item.type === 'dir_person') return '#1B4A9B';
    if (item.type === 'dir_event') return '#A4670C';
    return '#0A6D60';
  }
  if (item.type === 'business') return '#1f8a70';
  if (item.type === 'event') return '#ff7f50';
  return '#6b5b95';
};

const markerLetter = (item: MapItem | { type: MapItemType; source?: string }): string => {
  const type = item.type;
  if (type === 'dir_person') return 'P';
  if (type === 'dir_entity') return 'O';
  if (type === 'dir_event') return 'C';
  if (type === 'business') return 'N';
  if (type === 'event') return 'E';
  return 'A';
};

const markerIcon = (item: MapItem | { type: MapItemType; source?: 'ugc' | 'directory' }) =>
  divIcon({
    className: 'custom-map-marker',
    html: `<div style="width:34px;height:34px;border-radius:9999px;display:flex;align-items:center;justify-content:center;color:white;font-size:14px;font-weight:700;border:2px solid ${
      item.source === 'directory' ? '#C0573E' : 'white'
    };box-shadow:0 4px 10px rgba(0,0,0,0.25);background:${markerColor(item as MapItem)};">${markerLetter(item)}</div>`,
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

const FlyToZone: React.FC<{ target: LatLngLiteral | null; zoom?: number }> = ({ target, zoom = 12 }) => {
  const map = useMap();
  useEffect(() => {
    if (target) {
      map.flyTo(target, zoom, { duration: 0.8 });
    }
  }, [map, target, zoom]);
  return null;
};

export const MapaPage: React.FC<MapaPageProps> = ({ user, onOpenAuth }) => {
  const [items, setItems] = useState<MapItem[]>([]);
  const [zones, setZones] = useState<DirectoryZone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTypes, setActiveTypes] = useState<MapItemType[]>(DEFAULT_TYPES);
  const [eventFilter, setEventFilter] = useState<EventTimeFilter>('future');
  const [selectedPosition, setSelectedPosition] = useState<LatLngLiteral | null>(null);
  const [activeCreate, setActiveCreate] = useState<MapItemType>('business');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [cats, setCats] = useState<DirectoryCategory[]>([]);
  const [zoneId, setZoneId] = useState<number | null>(null);
  const [subzoneId, setSubzoneId] = useState<number | null>(null);
  const [flyTarget, setFlyTarget] = useState<LatLngLiteral | null>(null);
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' | 'terreta' } | null>(null);

  const [businessForm, setBusinessForm] = useState<BusinessFormState>({
    name: '',
    description: '',
    tags: '',
    contact: '',
  });
  const [noteForm, setNoteForm] = useState<NoteFormState>({ title: '', note: '', category: '' });
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
      const [businessesResult, notesResult, eventsResult, dirEntities, dirEvents, zonesResult] =
        await Promise.all([
          executeQueryWithRetry(
            async () =>
              await supabase
                .from('map_businesses')
                .select('id, name, description, tags, latitude, longitude, created_at'),
            'load map businesses'
          ),
          executeQueryWithRetry(
            async () =>
              await supabase
                .from('map_notes')
                .select('id, title, note, category, latitude, longitude, created_at'),
            'load map notes'
          ),
          executeQueryWithRetry(
            async () =>
              await supabase
                .from('events')
                .select('id, title, description, category, start_date, location, latitude, longitude, status')
                .eq('status', 'published'),
            'load map events'
          ),
          listEntities({ geolocated: true, limit: 500 }),
          listEvents({ geolocated: true, limit: 500 }),
          listZones(),
        ]);

      const zoneName = (z?: number | null) =>
        zonesResult.data.find((zone) => zone.id === z)?.name || null;

      const businessItems: MapItem[] =
        businessesResult.data?.map((business: any) => ({
          id: business.id,
          type: 'business' as const,
          source: 'ugc' as const,
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
          type: 'note' as const,
          source: 'ugc' as const,
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
            type: 'event' as const,
            source: 'ugc' as const,
            title: event.title,
            description: event.description || event.location,
            tags: event.category ? [event.category] : [],
            latitude: Number(event.latitude),
            longitude: Number(event.longitude),
            eventStartDate: event.start_date,
          })) || [];

      const dirEntityItems: MapItem[] = dirEntities.data
        .filter((e) => e.lat != null && e.lon != null)
        .map((e) => ({
          id: e.id,
          type: (e.tipo === 'fisica' ? 'dir_person' : 'dir_entity') as MapItemType,
          source: 'directory' as const,
          title: e.name,
          description: e.description,
          latitude: e.lat!,
          longitude: e.lon!,
          geoPrecision: e.geoPrecision,
          zoneName: zoneName(e.zoneId),
          cats: e.cats,
          tipo: e.tipo,
          url: e.url,
          directoryPath: `/directorio/${e.id}`,
          tags: e.tags,
        }));

      const dirEventItems: MapItem[] = dirEvents.data
        .filter((e) => e.lat != null && e.lon != null)
        .map((e) => ({
          id: e.id,
          type: 'dir_event' as const,
          source: 'directory' as const,
          title: e.name,
          description: e.description || e.lugar,
          latitude: e.lat!,
          longitude: e.lon!,
          geoPrecision: e.geoPrecision,
          zoneName: zoneName(e.zoneId),
          cats: e.cats,
          eventStartDate: e.ini || undefined,
          url: e.url,
          directoryPath: `/directorio/evento/${e.id}`,
        }));

      // Attach zone/subzone ids on directory items via filter later using original data
      const withZoneMeta = (list: MapItem[], source: typeof dirEntities.data | typeof dirEvents.data) =>
        list.map((item) => {
          const raw = source.find((s) => s.id === item.id);
          return {
            ...item,
            // stash for filtering
            tags: [
              ...(item.tags || []),
              raw?.zoneId != null ? `__zone:${raw.zoneId}` : '',
              raw && 'subzoneId' in raw && raw.subzoneId != null ? `__sz:${raw.subzoneId}` : '',
            ].filter(Boolean),
          };
        });

      setItems([
        ...businessItems,
        ...eventItems,
        ...noteItems,
        ...withZoneMeta(dirEntityItems, dirEntities.data),
        ...withZoneMeta(dirEventItems, dirEvents.data),
      ]);
      setZones(zonesResult.data);
      setErrorMessage('');
    } catch {
      setErrorMessage('No se pudo cargar el mapa. Probá de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const visibleItems = useMemo(() => {
    let list = filterMapItems(items, activeTypes, eventFilter, {
      search,
      cats: cats.length ? cats : undefined,
    });
    if (zoneId != null) {
      list = list.filter(
        (item) => item.source !== 'directory' || (item.tags || []).includes(`__zone:${zoneId}`)
      );
    }
    if (subzoneId != null) {
      list = list.filter(
        (item) => item.source !== 'directory' || (item.tags || []).includes(`__sz:${subzoneId}`)
      );
    }
    return list;
  }, [items, activeTypes, eventFilter, search, cats, zoneId, subzoneId]);

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
      setToast({ message: 'Error al guardar negocio.', variant: 'error' });
      return;
    }

    setToast({ message: 'Negocio publicado en el mapa.', variant: 'success' });
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
      setToast({ message: 'Error al guardar acontecimiento.', variant: 'error' });
      return;
    }

    setToast({ message: 'Nota publicada.', variant: 'success' });
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
      setToast({ message: 'Error al crear evento.', variant: 'error' });
      return;
    }

    setToast({
      message: 'Quedada creada como borrador. Aparecerá en el mapa cuando se publique.',
      variant: 'terreta',
    });
    setEventForm({ title: '', description: '', location: '', startDate: '', endDate: '', category: '' });
    setSelectedPosition(null);
    loadData();
  };

  const selectedZone = zones.find((z) => z.id === zoneId) || null;

  return (
    <section className="mx-auto max-w-7xl space-y-4 overflow-x-hidden py-6">
      <header className="space-y-1 px-1">
        <h1 className="font-serif text-2xl font-bold text-terreta-dark md:text-3xl">Mapa de Valencia</h1>
        <p className="text-sm text-terreta-dark/70">
          Directorio curado + lo que publica la comunidad.{' '}
          <Link to="/directorio" className="font-semibold text-terreta-accent">
            Ver listado
          </Link>
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="overflow-hidden rounded-2xl border border-terreta-border xl:col-span-2">
          <MapContainer center={valenciaCenter} zoom={13} className="h-[580px] w-full max-w-[100vw]" scrollWheelZoom>
            <ClickMapPicker onPick={setSelectedPosition} />
            <FlyToZone target={flyTarget} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {visibleItems.map((item) => {
              const address = formatDirectoryAddress({ geoPrecision: item.geoPrecision });
              return (
                <Marker
                  key={`${item.source}-${item.type}-${item.id}`}
                  position={{ lat: item.latitude, lng: item.longitude }}
                  icon={markerIcon(item)}
                >
                  <Popup>
                    <div className="max-w-[260px] space-y-1 font-serif">
                      <p className="font-semibold">{item.title}</p>
                      {item.description ? (
                        <p className="text-sm leading-snug">{String(item.description).slice(0, 140)}</p>
                      ) : null}
                      {item.geoPrecision ? (
                        <p className="text-xs text-terreta-dark/60">Precisión: {address.badge}</p>
                      ) : null}
                      {item.zoneName ? <p className="text-xs">Zona: {item.zoneName}</p> : null}
                      <p className="text-[10px] uppercase tracking-wide text-terreta-dark/50">
                        {item.source === 'directory' ? 'Directorio curado' : 'Publicado por la comunidad'}
                      </p>
                      {item.directoryPath ? (
                        <Link to={item.directoryPath} className="text-sm font-bold text-terreta-accent">
                          Ver ficha
                        </Link>
                      ) : null}
                      {item.type === 'event' || item.type === 'dir_event' ? (
                        <p className="text-xs">
                          Estado:{' '}
                          {getEventTimeBucket(item.eventStartDate) === 'future'
                            ? 'Futuro'
                            : getEventTimeBucket(item.eventStartDate) === 'today'
                              ? 'Hoy'
                              : 'Pasado'}
                        </p>
                      ) : null}
                    </div>
                  </Popup>
                </Marker>
              );
            })}
            {selectedPosition ? (
              <Marker
                position={selectedPosition}
                icon={markerIcon({ type: activeCreate, source: 'ugc' })}
              />
            ) : null}
          </MapContainer>
        </div>

        <aside className="max-h-[80vh] space-y-4 overflow-y-auto rounded-2xl border border-terreta-border bg-terreta-card p-4">
          <label className="relative block">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-terreta-dark/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre…"
              className="w-full rounded-lg border border-terreta-border bg-terreta-bg py-2 pl-8 pr-3 text-sm"
            />
          </label>

          <div>
            <p className="mb-2 text-sm font-semibold text-terreta-dark">Capas</p>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(MAP_TYPE_LABELS) as MapItemType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleToggleType(type)}
                  className={`rounded-full px-2.5 py-1 text-xs ${
                    activeTypes.includes(type)
                      ? 'bg-terreta-accent text-white'
                      : 'bg-terreta-sidebar text-terreta-dark'
                  }`}
                >
                  {MAP_TYPE_LABELS[type]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-terreta-dark">Categorías (directorio)</p>
            <div className="flex flex-wrap gap-1.5">
              {DIRECTORY_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() =>
                    setCats((prev) =>
                      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
                    )
                  }
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                    cats.includes(cat)
                      ? 'border-terreta-accent bg-terreta-accent/10 text-terreta-accent'
                      : 'border-terreta-border text-terreta-dark/60'
                  }`}
                >
                  {CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-terreta-dark">Índice territorial</p>
            <div className="max-h-48 space-y-1 overflow-y-auto">
              {zones.map((zone) => (
                <div key={zone.id} className="rounded-lg border border-terreta-border/70">
                  <button
                    type="button"
                    className={`flex w-full items-center justify-between px-2 py-1.5 text-left text-sm ${
                      zoneId === zone.id ? 'bg-terreta-sidebar font-semibold' : ''
                    }`}
                    onClick={() => {
                      setZoneId(zone.id);
                      setSubzoneId(null);
                      if (zone.centroidLat != null && zone.centroidLon != null) {
                        setFlyTarget({ lat: zone.centroidLat, lng: zone.centroidLon });
                      }
                    }}
                  >
                    <span>{zone.name}</span>
                    <span className="text-[10px] text-terreta-dark/50">Z{zone.id}</span>
                  </button>
                  {zoneId === zone.id && zone.subzones.length ? (
                    <div className="space-y-0.5 border-t border-terreta-border px-2 py-1">
                      {zone.subzones.map((sz) => (
                        <button
                          key={sz.idx}
                          type="button"
                          onClick={() => {
                            setSubzoneId(sz.idx);
                            if (sz.centroidLat != null && sz.centroidLon != null) {
                              setFlyTarget({ lat: sz.centroidLat, lng: sz.centroidLon });
                            }
                          }}
                          className={`block w-full rounded px-1 py-1 text-left text-xs ${
                            subzoneId === sz.idx ? 'bg-terreta-accent/10 text-terreta-accent' : 'text-terreta-dark/70'
                          }`}
                        >
                          {sz.name}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
              {(zoneId != null || subzoneId != null) && (
                <button
                  type="button"
                  className="text-xs text-terreta-accent"
                  onClick={() => {
                    setZoneId(null);
                    setSubzoneId(null);
                  }}
                >
                  Limpiar zona
                </button>
              )}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-terreta-dark">Filtro temporal de eventos</p>
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

          <p className="text-xs text-terreta-dark/55">
            Visibles: {visibleItems.length}
            {selectedZone ? ` · ${selectedZone.name}` : ''}
          </p>

          <div className="space-y-3 border-t border-terreta-border pt-4">
            <p className="text-sm font-semibold text-terreta-dark">Agregar (comunidad)</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setActiveCreate('business')}
                className={`flex-1 rounded-lg px-2 py-2 text-xs ${
                  activeCreate === 'business' ? 'bg-terreta-accent text-white' : 'bg-terreta-sidebar text-terreta-dark'
                }`}
              >
                <BriefcaseBusiness className="mr-1 inline" size={14} /> Negocio
              </button>
              <button
                type="button"
                onClick={() => setActiveCreate('event')}
                className={`flex-1 rounded-lg px-2 py-2 text-xs ${
                  activeCreate === 'event' ? 'bg-terreta-accent text-white' : 'bg-terreta-sidebar text-terreta-dark'
                }`}
              >
                <CalendarClock className="mr-1 inline" size={14} /> Evento
              </button>
              <button
                type="button"
                onClick={() => setActiveCreate('note')}
                className={`flex-1 rounded-lg px-2 py-2 text-xs ${
                  activeCreate === 'note' ? 'bg-terreta-accent text-white' : 'bg-terreta-sidebar text-terreta-dark'
                }`}
              >
                <StickyNote className="mr-1 inline" size={14} /> Nota
              </button>
            </div>

            <p className="flex items-center gap-1 text-xs text-terreta-dark/70">
              <MapPin size={14} /> Click en el mapa para fijar ubicación.
            </p>

            {activeCreate === 'business' ? (
              <div className="space-y-2">
                <input
                  className="w-full rounded-lg border border-terreta-border bg-terreta-bg px-3 py-2 text-sm"
                  placeholder="Nombre del negocio"
                  value={businessForm.name}
                  onChange={(e) => setBusinessForm((f) => ({ ...f, name: e.target.value }))}
                />
                <textarea
                  className="w-full rounded-lg border border-terreta-border bg-terreta-bg px-3 py-2 text-sm"
                  placeholder="Descripción"
                  value={businessForm.description}
                  onChange={(e) => setBusinessForm((f) => ({ ...f, description: e.target.value }))}
                />
                <button
                  disabled={isSubmitting}
                  onClick={handleSubmitBusiness}
                  className="w-full rounded-lg bg-terreta-accent px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  <Plus size={14} className="mr-1 inline" /> Publicar negocio
                </button>
              </div>
            ) : null}

            {activeCreate === 'event' ? (
              <div className="space-y-2">
                <input
                  className="w-full rounded-lg border border-terreta-border bg-terreta-bg px-3 py-2 text-sm"
                  placeholder="Título del evento"
                  value={eventForm.title}
                  onChange={(e) => setEventForm((f) => ({ ...f, title: e.target.value }))}
                />
                <input
                  type="datetime-local"
                  className="w-full rounded-lg border border-terreta-border bg-terreta-bg px-3 py-2 text-sm"
                  value={eventForm.startDate}
                  onChange={(e) => setEventForm((f) => ({ ...f, startDate: e.target.value }))}
                />
                <input
                  type="datetime-local"
                  className="w-full rounded-lg border border-terreta-border bg-terreta-bg px-3 py-2 text-sm"
                  value={eventForm.endDate}
                  onChange={(e) => setEventForm((f) => ({ ...f, endDate: e.target.value }))}
                />
                <button
                  disabled={isSubmitting}
                  onClick={handleSubmitEvent}
                  className="w-full rounded-lg bg-terreta-accent px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  <Plus size={14} className="mr-1 inline" /> Crear evento (borrador)
                </button>
              </div>
            ) : null}

            {activeCreate === 'note' ? (
              <div className="space-y-2">
                <input
                  className="w-full rounded-lg border border-terreta-border bg-terreta-bg px-3 py-2 text-sm"
                  placeholder="Título"
                  value={noteForm.title}
                  onChange={(e) => setNoteForm((f) => ({ ...f, title: e.target.value }))}
                />
                <textarea
                  className="w-full rounded-lg border border-terreta-border bg-terreta-bg px-3 py-2 text-sm"
                  placeholder="Nota"
                  value={noteForm.note}
                  onChange={(e) => setNoteForm((f) => ({ ...f, note: e.target.value }))}
                />
                <button
                  disabled={isSubmitting}
                  onClick={handleSubmitNote}
                  className="w-full rounded-lg bg-terreta-accent px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  <Plus size={14} className="mr-1 inline" /> Publicar nota
                </button>
              </div>
            ) : null}
          </div>

          {isLoading || errorMessage ? (
            <QueryState
              loading={isLoading}
              error={errorMessage || null}
              onRetry={loadData}
              loadingLabel="Cargando mapa..."
            />
          ) : null}
        </aside>
      </div>

      {toast ? (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      ) : null}
    </section>
  );
};
