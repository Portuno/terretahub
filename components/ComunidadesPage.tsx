import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { listEntities } from '../lib/directoryApi';
import type { DirectoryEntity } from '../lib/directoryTypes';
import { COMMUNITY_ROLE_HINTS, CATEGORY_LABELS } from '../lib/directoryTypes';
import { QueryState } from './QueryState';
import { EmptyState } from './EmptyState';
import { useDynamicMetaTags } from '../hooks/useDynamicMetaTags';

const matchesCommunity = (entity: DirectoryEntity): boolean => {
  const hay = `${entity.rol || ''} ${entity.tags.join(' ')} ${entity.name}`.toLowerCase();
  return COMMUNITY_ROLE_HINTS.some((hint) => hay.includes(hint));
};

export const ComunidadesPage: React.FC = () => {
  const [items, setItems] = useState<DirectoryEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoneFilter, setZoneFilter] = useState<number | 'all'>('all');
  const [catFilter, setCatFilter] = useState<string>('all');

  useDynamicMetaTags({
    title: 'Comunidades · Terreta Hub',
    description: 'Hubs, incubadoras, coworkings, universidades y colectivos del ecosistema valenciano.',
    url: '/comunidades',
  });

  const load = async () => {
    setLoading(true);
    const { data, error: loadError } = await listEntities({ tipo: 'juridica', limit: 500 });
    if (loadError) {
      setError(loadError);
      setItems([]);
    } else {
      setItems(data.filter(matchesCommunity));
      setError(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (zoneFilter !== 'all' && item.zoneId !== zoneFilter) return false;
      if (catFilter !== 'all' && !item.cats.includes(catFilter as never)) return false;
      return true;
    });
  }, [items, zoneFilter, catFilter]);

  const zones = useMemo(() => {
    const map = new Map<number, string>();
    items.forEach((item) => {
      if (item.zoneId != null) map.set(item.zoneId, `Zona ${item.zoneId}`);
    });
    return [...map.entries()];
  }, [items]);

  return (
    <section className="mx-auto max-w-5xl space-y-5 py-4">
      <header className="space-y-2">
        <h1 className="font-serif text-3xl font-bold text-terreta-dark">Comunidades</h1>
        <p className="text-sm text-terreta-dark/70">
          Subset del directorio: hubs, incubadoras, coworkings, universidades y colectivos.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        <select
          value={zoneFilter}
          onChange={(e) => setZoneFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          className="rounded-lg border border-terreta-border bg-terreta-bg px-3 py-2 text-sm"
        >
          <option value="all">Todas las zonas</option>
          {zones.map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="rounded-lg border border-terreta-border bg-terreta-bg px-3 py-2 text-sm"
        >
          <option value="all">Todas las categorías</option>
          {Object.entries(CATEGORY_LABELS).map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
        <Link to="/mapa" className="rounded-lg border border-terreta-border px-3 py-2 text-sm font-semibold text-terreta-accent">
          Ver en mapa
        </Link>
      </div>

      <QueryState loading={loading} error={error} onRetry={load} />

      {!loading && !error && filtered.length === 0 ? (
        <EmptyState
          title="Sin comunidades con estos filtros"
          description="Probá otra zona o categoría, o explorá el directorio completo."
          actionLabel="Ir al directorio"
          onAction={() => {
            window.location.href = '/directorio';
          }}
        />
      ) : null}

      <ul className="grid gap-3 sm:grid-cols-2">
        {filtered.map((item) => (
          <li key={item.id}>
            <Link
              to={`/directorio/${item.id}`}
              className="block rounded-2xl border border-terreta-border bg-terreta-card p-4 transition hover:border-terreta-accent/40"
            >
              <h2 className="font-semibold text-terreta-dark">{item.name}</h2>
              <p className="mt-1 text-sm text-terreta-dark/70">{item.rol || item.org || 'Comunidad'}</p>
              <p className="mt-2 text-xs text-terreta-accent">Ver ficha →</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
};
