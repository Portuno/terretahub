import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useOutletContext } from 'react-router-dom';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import { divIcon } from 'leaflet';
import { ArrowLeft, Bookmark, Heart, CheckCircle2, ExternalLink } from 'lucide-react';
import { QueryState } from './QueryState';
import { Toast } from './Toast';
import {
  getEntityById,
  getEventById,
  listUserFlags,
  resolveEntityIdByName,
  setUserFlag,
} from '../lib/directoryApi';
import type { DirectoryEntity, DirectoryEvent, DirectoryFlagKind } from '../lib/directoryTypes';
import {
  AMBITO_LABELS,
  CATEGORY_LABELS,
  CONF_LABELS,
  TIPO_LABELS,
} from '../lib/directoryTypes';
import { formatDirectoryAddress, geoPrecisionBadgeClass } from '../lib/geoPrecision';
import { useDynamicMetaTags } from '../hooks/useDynamicMetaTags';
import type { AuthUser } from '../types';

interface OutletCtx {
  user: AuthUser | null;
  onOpenAuth: () => void;
}

const miniIcon = divIcon({
  className: 'custom-map-marker',
  html: `<div style="width:28px;height:28px;border-radius:9999px;background:#C0573E;border:2px solid white;"></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

const FlagButtons: React.FC<{
  user: AuthUser | null;
  onOpenAuth: () => void;
  targetType: 'entity' | 'event';
  targetId: string;
  active: Set<DirectoryFlagKind>;
  onChange: () => void;
}> = ({ user, onOpenAuth, targetType, targetId, active, onChange }) => {
  const [busy, setBusy] = useState<DirectoryFlagKind | null>(null);
  const [toast, setToast] = useState('');

  const toggle = async (flag: DirectoryFlagKind) => {
    if (!user) {
      onOpenAuth();
      return;
    }
    setBusy(flag);
    const enabled = !active.has(flag);
    const error = await setUserFlag({
      userId: user.id,
      targetType,
      targetId,
      flag,
      enabled,
    });
    setBusy(null);
    if (error) {
      setToast(error);
      return;
    }
    onChange();
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {(
          [
            ['saved', 'Guardar', Bookmark],
            ['interested', 'Me interesa', Heart],
            ['contacted', 'Contactado', CheckCircle2],
          ] as const
        ).map(([flag, label, Icon]) => (
          <button
            key={flag}
            type="button"
            disabled={busy === flag}
            onClick={() => toggle(flag)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${
              active.has(flag)
                ? 'border-terreta-accent bg-terreta-accent text-white'
                : 'border-terreta-border bg-terreta-card text-terreta-dark'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>
      {toast ? <Toast message={toast} onClose={() => setToast('')} variant="error" /> : null}
    </>
  );
};

export const DirectoryEntityPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, onOpenAuth } = useOutletContext<OutletCtx>();
  const [entity, setEntity] = useState<DirectoryEntity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [relLinks, setRelLinks] = useState<Record<string, string | null>>({});
  const [flags, setFlags] = useState<Set<DirectoryFlagKind>>(new Set());

  const loadFlags = async () => {
    if (!user || !id) {
      setFlags(new Set());
      return;
    }
    const result = await listUserFlags(user.id);
    setFlags(
      new Set(
        result.data
          .filter((f) => f.targetType === 'entity' && f.targetId === id)
          .map((f) => f.flag)
      )
    );
  };

  const load = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    const { data, error: loadError } = await getEntityById(id);
    if (loadError) {
      setError(loadError);
      setEntity(null);
    } else if (!data || data.visibility !== 'published') {
      setError('Ficha no encontrada.');
      setEntity(null);
    } else {
      setEntity(data);
      const resolved: Record<string, string | null> = {};
      await Promise.all(
        (data.rel || []).slice(0, 12).map(async (name) => {
          resolved[name] = await resolveEntityIdByName(name);
        })
      );
      setRelLinks(resolved);
    }
    setLoading(false);
    await loadFlags();
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.id]);

  useDynamicMetaTags(
    entity
      ? {
          title: `${entity.name} · Directorio · Terreta Hub`,
          description: entity.description || `${entity.name} en el directorio vivo de Valencia.`,
          url: `/directorio/${entity.id}`,
        }
      : { title: 'Ficha · Directorio · Terreta Hub', url: id ? `/directorio/${id}` : '/directorio' }
  );

  const address = useMemo(
    () =>
      formatDirectoryAddress({
        dir: entity?.dir,
        geoPrecision: entity?.geoPrecision,
      }),
    [entity]
  );

  return (
    <section className="mx-auto max-w-3xl space-y-5 py-4">
      <button
        type="button"
        onClick={() => navigate('/directorio')}
        className="inline-flex items-center gap-2 text-sm text-terreta-dark/70 hover:text-terreta-accent"
      >
        <ArrowLeft size={16} /> Volver al directorio
      </button>

      <QueryState loading={loading} error={error} onRetry={load} />

      {entity && !loading ? (
        <>
          <header className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-terreta-sidebar px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                {TIPO_LABELS[entity.tipo]}
              </span>
              <span className="rounded-full bg-terreta-sidebar px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                {AMBITO_LABELS[entity.ambito]}
              </span>
              {entity.cats.map((cat) => (
                <span
                  key={cat}
                  className="rounded-full bg-terreta-accent/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-terreta-accent"
                >
                  {CATEGORY_LABELS[cat]}
                </span>
              ))}
            </div>
            <h1 className="font-serif text-3xl font-bold text-terreta-dark">{entity.name}</h1>
            <p className="text-sm text-terreta-dark/70">
              {[entity.rol, entity.org].filter(Boolean).join(' · ')}
            </p>
            <p className="text-xs text-terreta-dark/55">
              {CONF_LABELS[entity.conf]}
              {entity.sourceUpdatedAt ? ` · Verificado / fuente: ${entity.sourceUpdatedAt}` : ''}
            </p>
          </header>

          <FlagButtons
            user={user}
            onOpenAuth={onOpenAuth}
            targetType="entity"
            targetId={entity.id}
            active={flags}
            onChange={loadFlags}
          />

          {entity.description ? (
            <p className="leading-relaxed text-terreta-dark/80">{entity.description}</p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            {entity.geoPrecision ? (
              <span
                className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${geoPrecisionBadgeClass(
                  entity.geoPrecision
                )}`}
              >
                {address.badge}
              </span>
            ) : null}
            {address.primary ? <span className="text-sm text-terreta-dark/70">{address.primary}</span> : null}
          </div>

          {entity.tags.length ? (
            <div className="flex flex-wrap gap-1.5">
              {entity.tags.map((tag) => (
                <span key={tag} className="rounded-md bg-terreta-sidebar px-2 py-0.5 text-xs text-terreta-dark/70">
                  {tag}
                </span>
              ))}
            </div>
          ) : null}

          {entity.soc.length ? (
            <div className="space-y-1">
              <h2 className="text-sm font-bold uppercase tracking-wide text-terreta-dark/50">Redes</h2>
              <ul className="flex flex-wrap gap-2">
                {entity.soc.map((s) => (
                  <li key={`${s.k}-${s.u}`}>
                    <a
                      href={s.u}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-full border border-terreta-border px-3 py-1 text-xs font-semibold text-terreta-accent hover:border-terreta-accent"
                    >
                      {s.k} <ExternalLink size={12} />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {entity.url ? (
            <a
              href={entity.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm font-semibold text-terreta-accent"
            >
              Sitio web <ExternalLink size={14} />
            </a>
          ) : null}

          {entity.fuentes.length ? (
            <div className="space-y-1">
              <h2 className="text-sm font-bold uppercase tracking-wide text-terreta-dark/50">Fuentes</h2>
              <ul className="space-y-1 text-sm">
                {entity.fuentes.map((f) => (
                  <li key={f}>
                    <a href={f} target="_blank" rel="noopener noreferrer" className="text-terreta-accent underline-offset-2 hover:underline">
                      {f}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {entity.rel.length ? (
            <div className="space-y-1">
              <h2 className="text-sm font-bold uppercase tracking-wide text-terreta-dark/50">Relaciones</h2>
              <ul className="flex flex-wrap gap-2">
                {entity.rel.map((name) => {
                  const relId = relLinks[name];
                  return relId ? (
                    <Link
                      key={name}
                      to={`/directorio/${relId}`}
                      className="rounded-full border border-terreta-accent/40 bg-terreta-accent/5 px-3 py-1 text-xs font-semibold text-terreta-accent"
                    >
                      {name}
                    </Link>
                  ) : (
                    <span
                      key={name}
                      className="rounded-full border border-dashed border-terreta-border px-3 py-1 text-xs text-terreta-dark/50"
                      title="Sin ficha en el directorio"
                    >
                      {name}
                    </span>
                  );
                })}
              </ul>
            </div>
          ) : null}

          {entity.lat != null && entity.lon != null ? (
            <div className="overflow-hidden rounded-2xl border border-terreta-border">
              <MapContainer
                center={{ lat: entity.lat, lng: entity.lon }}
                zoom={entity.geoPrecision === 'sede' ? 15 : 13}
                className="h-56 w-full"
                scrollWheelZoom={false}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={{ lat: entity.lat, lng: entity.lon }} icon={miniIcon} />
              </MapContainer>
              <div className="border-t border-terreta-border bg-terreta-card px-3 py-2 text-xs text-terreta-dark/60">
                <Link to="/mapa" className="font-semibold text-terreta-accent">
                  Abrir en el mapa
                </Link>
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
};

export const DirectoryEventPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, onOpenAuth } = useOutletContext<OutletCtx>();
  const [event, setEvent] = useState<DirectoryEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flags, setFlags] = useState<Set<DirectoryFlagKind>>(new Set());

  const loadFlags = async () => {
    if (!user || !id) {
      setFlags(new Set());
      return;
    }
    const result = await listUserFlags(user.id);
    setFlags(
      new Set(
        result.data
          .filter((f) => f.targetType === 'event' && f.targetId === id)
          .map((f) => f.flag)
      )
    );
  };

  const load = async () => {
    if (!id) return;
    setLoading(true);
    const { data, error: loadError } = await getEventById(id);
    if (loadError) {
      setError(loadError);
      setEvent(null);
    } else if (!data || data.visibility !== 'published') {
      setError('Cita no encontrada.');
      setEvent(null);
    } else {
      setEvent(data);
      setError(null);
    }
    setLoading(false);
    await loadFlags();
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.id]);

  useDynamicMetaTags(
    event
      ? {
          title: `${event.name} · Cita del directorio · Terreta Hub`,
          description: event.description || `${event.name} en el directorio de Valencia.`,
          url: `/directorio/evento/${event.id}`,
        }
      : {}
  );

  const address = formatDirectoryAddress({
    dir: event?.dir,
    lugar: event?.lugar,
    geoPrecision: event?.geoPrecision,
  });

  return (
    <section className="mx-auto max-w-3xl space-y-5 py-4">
      <button
        type="button"
        onClick={() => navigate('/directorio')}
        className="inline-flex items-center gap-2 text-sm text-terreta-dark/70 hover:text-terreta-accent"
      >
        <ArrowLeft size={16} /> Volver al directorio
      </button>
      <QueryState loading={loading} error={error} onRetry={load} />
      {event && !loading ? (
        <>
          <p className="text-xs font-bold uppercase tracking-widest text-amber-700">Cita del directorio</p>
          <p className="text-xs text-terreta-dark/55">
            No es una quedada de la comunidad. Las quedadas viven en{' '}
            <Link to="/eventos" className="text-terreta-accent underline">
              /eventos
            </Link>
            .
          </p>
          <h1 className="font-serif text-3xl font-bold text-terreta-dark">{event.name}</h1>
          <p className="text-sm text-terreta-dark/70">
            {[event.ini, event.fin && event.fin !== event.ini ? `→ ${event.fin}` : null, event.lugar]
              .filter(Boolean)
              .join(' · ')}
          </p>
          <p className="text-xs text-terreta-dark/55">{CONF_LABELS[event.conf]}</p>
          <FlagButtons
            user={user}
            onOpenAuth={onOpenAuth}
            targetType="event"
            targetId={event.id}
            active={flags}
            onChange={loadFlags}
          />
          {event.description ? <p className="leading-relaxed text-terreta-dark/80">{event.description}</p> : null}
          {address.badge || address.primary ? (
            <p className="text-sm text-terreta-dark/70">
              {[address.primary, address.badge].filter(Boolean).join(' · ')}
            </p>
          ) : null}
          {event.url ? (
            <a href={event.url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-terreta-accent">
              Más info
            </a>
          ) : null}
          {event.fuentes.length ? (
            <ul className="space-y-1 text-sm">
              {event.fuentes.map((f) => (
                <li key={f}>
                  <a href={f} target="_blank" rel="noopener noreferrer" className="text-terreta-accent">
                    {f}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
          {event.lat != null && event.lon != null ? (
            <div className="overflow-hidden rounded-2xl border border-terreta-border">
              <MapContainer center={{ lat: event.lat, lng: event.lon }} zoom={14} className="h-56 w-full" scrollWheelZoom={false}>
                <TileLayer
                  attribution='&copy; OpenStreetMap'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={{ lat: event.lat, lng: event.lon }} icon={miniIcon} />
              </MapContainer>
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
};
