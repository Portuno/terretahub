import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { QueryState } from './QueryState';
import { EmptyState } from './EmptyState';
import { listEntities, listEvents, listZones } from '../lib/directoryApi';
import type {
  DirectoryCategory,
  DirectoryEntity,
  DirectoryEvent,
  DirectoryListFilters,
  DirectoryZone,
} from '../lib/directoryTypes';
import {
  AMBITO_LABELS,
  CATEGORY_LABELS,
  DIRECTORY_CATEGORIES,
  TIPO_LABELS,
} from '../lib/directoryTypes';
import { formatDirectoryAddress } from '../lib/geoPrecision';
import { useDynamicMetaTags } from '../hooks/useDynamicMetaTags';

type Tab = 'entities' | 'events';

export const DirectoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('entities');
  const [entities, setEntities] = useState<DirectoryEntity[]>([]);
  const [events, setEvents] = useState<DirectoryEvent[]>([]);
  const [zones, setZones] = useState<DirectoryZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [cats, setCats] = useState<DirectoryCategory[]>([]);
  const [tipo, setTipo] = useState<DirectoryListFilters['tipo']>();
  const [ambito, setAmbito] = useState<DirectoryListFilters['ambito']>();
  const [zoneId, setZoneId] = useState<number | undefined>();
  const [subzoneId, setSubzoneId] = useState<number | undefined>();
  const [hasSoc, setHasSoc] = useState(false);
  const [geolocated, setGeolocated] = useState(false);

  useDynamicMetaTags({
    title: 'Directorio · Terreta Hub',
    description:
      'Directorio vivo del ecosistema de Valencia: personas, organizaciones, cultura y citas con fuentes y geo.',
    url: '/directorio',
  });

  const load = async () => {
    setLoading(true);
    setError(null);
    const filters: DirectoryListFilters = {
      search: search || undefined,
      cats: cats.length ? cats : undefined,
      tipo,
      ambito,
      zoneId,
      subzoneId,
      hasSoc: hasSoc || undefined,
      geolocated: geolocated || undefined,
      limit: 500,
    };
    const [entitiesResult, eventsResult, zonesResult] = await Promise.all([
      listEntities(filters),
      listEvents(filters),
      listZones(),
    ]);
    if (entitiesResult.error && eventsResult.error) {
      setError(entitiesResult.error || eventsResult.error);
    } else {
      setEntities(entitiesResult.data);
      setEvents(eventsResult.data);
      setZones(zonesResult.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, cats, tipo, ambito, zoneId, subzoneId, hasSoc, geolocated]);

  const selectedZone = useMemo(
    () => zones.find((z) => z.id === zoneId) || null,
    [zones, zoneId]
  );

  const toggleCat = (cat: DirectoryCategory) => {
    setCats((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));
  };

  const items = tab === 'entities' ? entities : events;

  return (
    <section className="mx-auto max-w-6xl space-y-5 py-4">
      <header className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-widest text-terreta-accent">Descubrimiento</p>
        <h1 className="font-serif text-3xl font-bold text-terreta-dark md:text-4xl">Directorio de Valencia</h1>
        <p className="max-w-2xl text-sm text-terreta-dark/70 md:text-base">
          Fichas verificables de personas, organizaciones y citas del ecosistema. Distinto de las quedadas y
          negocios que publica la comunidad.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTab('entities')}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
            tab === 'entities' ? 'bg-terreta-accent text-white' : 'bg-terreta-sidebar text-terreta-dark'
          }`}
        >
          Personas y orgs ({entities.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('events')}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
            tab === 'events' ? 'bg-terreta-accent text-white' : 'bg-terreta-sidebar text-terreta-dark'
          }`}
        >
          Citas del directorio ({events.length})
        </button>
        <Link
          to="/mapa"
          className="rounded-full border border-terreta-border px-4 py-1.5 text-sm font-semibold text-terreta-dark hover:border-terreta-accent"
        >
          Ver en mapa
        </Link>
      </div>

      <div className="grid gap-4 rounded-2xl border border-terreta-border bg-terreta-card p-4 md:grid-cols-[1fr_auto]">
        <label className="relative block">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-terreta-dark/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') load();
            }}
            placeholder="Buscar por nombre…"
            className="w-full rounded-xl border border-terreta-border bg-terreta-bg py-2.5 pl-9 pr-3 text-sm outline-none focus:border-terreta-accent"
          />
        </label>
        <button
          type="button"
          onClick={load}
          className="rounded-xl bg-terreta-accent px-4 py-2 text-sm font-bold text-white"
        >
          Buscar
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {DIRECTORY_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => toggleCat(cat)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
              cats.includes(cat)
                ? 'border-terreta-accent bg-terreta-accent/10 text-terreta-accent'
                : 'border-terreta-border text-terreta-dark/70'
            }`}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        {tab === 'entities' ? (
          <>
            <select
              value={tipo || ''}
              onChange={(e) => setTipo((e.target.value || undefined) as DirectoryListFilters['tipo'])}
              className="rounded-lg border border-terreta-border bg-terreta-bg px-2 py-1.5"
            >
              <option value="">Tipo</option>
              <option value="fisica">Persona</option>
              <option value="juridica">Organización</option>
            </select>
          </>
        ) : null}
        <select
          value={ambito || ''}
          onChange={(e) => setAmbito((e.target.value || undefined) as DirectoryListFilters['ambito'])}
          className="rounded-lg border border-terreta-border bg-terreta-bg px-2 py-1.5"
        >
          <option value="">Ámbito</option>
          <option value="ciudad">Ciudad</option>
          <option value="producto">Producto</option>
        </select>
        <select
          value={zoneId ?? ''}
          onChange={(e) => {
            const next = e.target.value ? Number(e.target.value) : undefined;
            setZoneId(next);
            setSubzoneId(undefined);
          }}
          className="rounded-lg border border-terreta-border bg-terreta-bg px-2 py-1.5"
        >
          <option value="">Zona</option>
          {zones.map((z) => (
            <option key={z.id} value={z.id}>
              {z.name}
            </option>
          ))}
        </select>
        <select
          value={subzoneId ?? ''}
          onChange={(e) => setSubzoneId(e.target.value ? Number(e.target.value) : undefined)}
          className="rounded-lg border border-terreta-border bg-terreta-bg px-2 py-1.5"
          disabled={!selectedZone?.subzones.length}
        >
          <option value="">Subzona</option>
          {selectedZone?.subzones.map((sz) => (
            <option key={sz.idx} value={sz.idx}>
              {sz.name}
            </option>
          ))}
        </select>
        {tab === 'entities' ? (
          <label className="inline-flex items-center gap-2 rounded-lg border border-terreta-border px-2 py-1.5">
            <input type="checkbox" checked={hasSoc} onChange={(e) => setHasSoc(e.target.checked)} />
            Tiene redes
          </label>
        ) : null}
        <label className="inline-flex items-center gap-2 rounded-lg border border-terreta-border px-2 py-1.5">
          <input type="checkbox" checked={geolocated} onChange={(e) => setGeolocated(e.target.checked)} />
          Geolocalizado
        </label>
      </div>

      <QueryState loading={loading} error={error} onRetry={load} loadingLabel="Cargando directorio…" />

      {!loading && !error && items.length === 0 ? (
        <EmptyState
          title="Nada con estos filtros"
          description="Probá otra categoría, zona o buscá por nombre."
          actionLabel="Limpiar filtros"
          onAction={() => {
            setCats([]);
            setTipo(undefined);
            setAmbito(undefined);
            setZoneId(undefined);
            setSubzoneId(undefined);
            setHasSoc(false);
            setGeolocated(false);
            setSearch('');
          }}
        />
      ) : null}

      {!loading && !error ? (
        <ul className="divide-y divide-terreta-border rounded-2xl border border-terreta-border bg-terreta-card">
          {tab === 'entities'
            ? entities.map((entity) => {
                const address = formatDirectoryAddress({
                  dir: entity.dir,
                  geoPrecision: entity.geoPrecision,
                });
                return (
                  <li key={entity.id}>
                    <button
                      type="button"
                      onClick={() => navigate(`/directorio/${entity.id}`)}
                      className="flex w-full flex-col gap-1 px-4 py-3 text-left hover:bg-terreta-sidebar/50"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-terreta-dark">{entity.name}</span>
                        <span className="rounded-full bg-terreta-sidebar px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-terreta-dark/60">
                          {TIPO_LABELS[entity.tipo]}
                        </span>
                        <span className="rounded-full bg-terreta-sidebar px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-terreta-dark/60">
                          {AMBITO_LABELS[entity.ambito]}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wide text-terreta-accent">
                          conf {entity.conf}
                        </span>
                      </div>
                      <p className="text-sm text-terreta-dark/70">
                        {[entity.rol, entity.org].filter(Boolean).join(' · ') ||
                          entity.description?.slice(0, 120) ||
                          'Sin descripción'}
                      </p>
                      {address.badge ? (
                        <p className="text-xs text-terreta-dark/50">{address.badge}</p>
                      ) : null}
                    </button>
                  </li>
                );
              })
            : events.map((event) => (
                <li key={event.id}>
                  <button
                    type="button"
                    onClick={() => navigate(`/directorio/evento/${event.id}`)}
                    className="flex w-full flex-col gap-1 px-4 py-3 text-left hover:bg-terreta-sidebar/50"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-terreta-dark">{event.name}</span>
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800">
                        Cita del directorio
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wide text-terreta-accent">
                        conf {event.conf}
                      </span>
                    </div>
                    <p className="text-sm text-terreta-dark/70">
                      {[event.ini, event.lugar].filter(Boolean).join(' · ') ||
                        event.description?.slice(0, 120) ||
                        'Sin detalle'}
                    </p>
                  </button>
                </li>
              ))}
        </ul>
      ) : null}
    </section>
  );
};
