import React, { useEffect, useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { AuthUser } from '../types';
import {
  getUserPrefs,
  listEntities,
  listEvents,
  listUserFlags,
} from '../lib/directoryApi';
import type { DirectoryEntity, DirectoryEvent, UserDirectoryPrefs } from '../lib/directoryTypes';
import { explainMatch, MATCH_LABELS, type MatchCard } from '../lib/directoryMatching';
import { DirectoryOnboarding } from './DirectoryOnboarding';
import { QueryState } from './QueryState';
import { EmptyState } from './EmptyState';
import { useDynamicMetaTags } from '../hooks/useDynamicMetaTags';

interface OutletCtx {
  user: AuthUser | null;
  onOpenAuth: () => void;
}

export const ParaLaTerretaPage: React.FC = () => {
  const { user, onOpenAuth } = useOutletContext<OutletCtx>();
  const [prefs, setPrefs] = useState<UserDirectoryPrefs | null>(null);
  const [entities, setEntities] = useState<DirectoryEntity[]>([]);
  const [events, setEvents] = useState<DirectoryEvent[]>([]);
  const [saved, setSaved] = useState<MatchCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useDynamicMetaTags({
    title: 'Para la Terreta · Terreta Hub',
    description: 'Recomendaciones transparentes del directorio de Valencia: coincide, puente o falta validar.',
    url: '/para-la-terreta',
  });

  const load = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const [prefsResult, entitiesResult, eventsResult, flagsResult] = await Promise.all([
      getUserPrefs(user.id),
      listEntities({ limit: 300 }),
      listEvents({ limit: 150 }),
      listUserFlags(user.id),
    ]);
    if (prefsResult.error || entitiesResult.error) {
      setError(prefsResult.error || entitiesResult.error);
    } else {
      setError(null);
    }
    setPrefs(prefsResult.data);
    setEntities(entitiesResult.data);
    setEvents(eventsResult.data);
    setShowOnboarding(!prefsResult.data || (!prefsResult.data.onboardingCompletedAt && !prefsResult.data.onboardingSkipped));

    const flagIds = new Set(
      flagsResult.data.filter((f) => f.flag === 'saved').map((f) => `${f.targetType}:${f.targetId}`)
    );
    const savedCards: MatchCard[] = [];
    entitiesResult.data.forEach((e) => {
      if (flagIds.has(`entity:${e.id}`)) {
        savedCards.push({
          kind: 'entity',
          id: e.id,
          name: e.name,
          href: `/directorio/${e.id}`,
          match: 'coincide',
          reasons: ['Guardado por ti'],
          conf: e.conf,
        });
      }
    });
    eventsResult.data.forEach((e) => {
      if (flagIds.has(`event:${e.id}`)) {
        savedCards.push({
          kind: 'event',
          id: e.id,
          name: e.name,
          href: `/directorio/evento/${e.id}`,
          match: 'coincide',
          reasons: ['Guardado por ti'],
          conf: e.conf,
        });
      }
    });
    setSaved(savedCards);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const recommendations = useMemo(() => {
    if (!prefs?.consentPersonalization) return [] as MatchCard[];
    const cards: MatchCard[] = [];
    entities.forEach((entity) => {
      const card = explainMatch({ prefs, entity });
      if (card) cards.push(card);
    });
    events.forEach((event) => {
      const card = explainMatch({ prefs, event });
      if (card) cards.push(card);
    });
    const score = (m: MatchCard['match']) => (m === 'coincide' ? 0 : m === 'puente' ? 1 : 2);
    return cards.sort((a, b) => score(a.match) - score(b.match)).slice(0, 24);
  }, [prefs, entities, events]);

  if (!user) {
    return (
      <section className="mx-auto max-w-3xl space-y-4 py-8 text-center">
        <h1 className="font-serif text-3xl font-bold text-terreta-dark">Para la Terreta</h1>
        <p className="text-sm text-terreta-dark/70">Entra para personalizar recomendaciones del directorio.</p>
        <button
          type="button"
          onClick={onOpenAuth}
          className="rounded-full bg-terreta-accent px-5 py-2.5 text-sm font-bold text-white"
        >
          Iniciar sesión
        </button>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-4xl space-y-6 py-4">
      <header className="space-y-2">
        <h1 className="font-serif text-3xl font-bold text-terreta-dark">Para la Terreta</h1>
        <p className="text-sm text-terreta-dark/70">
          Cada card explica por qué aparece: Coincide / Puente / Falta validar. Sin inventar evidencia.
        </p>
        <button
          type="button"
          onClick={() => setShowOnboarding(true)}
          className="text-xs font-semibold text-terreta-accent"
        >
          Ajustar intereses
        </button>
      </header>

      {showOnboarding ? <DirectoryOnboarding onDone={() => { setShowOnboarding(false); load(); }} /> : null}

      <QueryState loading={loading} error={error} onRetry={load} />

      {!loading && prefs && !prefs.consentPersonalization ? (
        <EmptyState
          title="Personalización desactivada"
          description="Activa el consentimiento en el onboarding para ver recomendaciones."
          actionLabel="Configurar"
          onAction={() => setShowOnboarding(true)}
        />
      ) : null}

      {!loading && recommendations.length ? (
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-terreta-dark/50">Recomendaciones</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {recommendations.map((card) => (
              <li key={`${card.kind}-${card.id}`}>
                <Link
                  to={card.href}
                  className="block rounded-2xl border border-terreta-border bg-terreta-card p-4 hover:border-terreta-accent/40"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                        card.match === 'coincide'
                          ? 'bg-emerald-100 text-emerald-800'
                          : card.match === 'puente'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {MATCH_LABELS[card.match]}
                    </span>
                    {card.conf ? (
                      <span className="text-[10px] font-bold uppercase text-terreta-dark/40">conf {card.conf}</span>
                    ) : null}
                  </div>
                  <h3 className="font-semibold text-terreta-dark">{card.name}</h3>
                  <ul className="mt-2 space-y-0.5 text-xs text-terreta-dark/65">
                    {card.reasons.map((r) => (
                      <li key={r}>· {r}</li>
                    ))}
                  </ul>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {!loading && saved.length ? (
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-terreta-dark/50">Guardados</h2>
          <ul className="space-y-2">
            {saved.map((card) => (
              <li key={`saved-${card.kind}-${card.id}`}>
                <Link to={card.href} className="text-sm font-semibold text-terreta-accent">
                  {card.kind === 'event' ? 'Cita' : 'Ficha'}: {card.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="text-xs text-terreta-dark/45">
        Alertas por email: stub / TODO (Auth existe; no hay cola de mail de producto aún).
      </p>
    </section>
  );
};
