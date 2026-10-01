import type { DirectoryEntity, DirectoryEvent, UserDirectoryPrefs } from './directoryTypes';

export type MatchKind = 'coincide' | 'puente' | 'falta_validar';

export interface MatchCard {
  kind: 'entity' | 'event';
  id: string;
  name: string;
  href: string;
  match: MatchKind;
  reasons: string[];
  conf?: string;
}

const overlap = (a: string[], b: string[]) =>
  a.filter((x) => b.map((y) => y.toLowerCase()).includes(x.toLowerCase()));

export const explainMatch = (input: {
  prefs: UserDirectoryPrefs;
  entity?: DirectoryEntity;
  event?: DirectoryEvent;
}): MatchCard | null => {
  const prefs = input.prefs;
  if (!prefs.consentPersonalization) return null;

  const interest = prefs.interestTags || [];
  const seeking = prefs.seeking || [];
  const focusZone = prefs.zoneId;

  if (input.entity) {
    const e = input.entity;
    const tagHits = overlap(interest, [...e.tags, ...e.cats]);
    const zoneHit = focusZone != null && e.zoneId === focusZone;
    const reasons: string[] = [];
    let match: MatchKind = 'puente';

    if (tagHits.length) {
      reasons.push(`Coincide en: ${tagHits.slice(0, 3).join(', ')}`);
      match = 'coincide';
    }
    if (zoneHit) {
      reasons.push('Misma zona que tu foco');
      if (match !== 'coincide') match = 'coincide';
    }
    if (e.conf === 'A') {
      reasons.push('Falta validar (conf A)');
      match = tagHits.length || zoneHit ? 'puente' : 'falta_validar';
    } else if (e.conf === 'E') {
      reasons.push('Dato de ecosistema — conviene refrescar (conf E)');
      if (!tagHits.length && !zoneHit) match = 'puente';
    }
    if (!reasons.length) {
      if (seeking.includes('conocer gente') && e.tipo === 'fisica') {
        reasons.push('Puente: buscas conocer gente');
        match = 'puente';
      } else if (seeking.includes('socios') && e.tipo === 'juridica') {
        reasons.push('Puente: buscas socios / orgs');
        match = 'puente';
      } else {
        return null;
      }
    }

    return {
      kind: 'entity',
      id: e.id,
      name: e.name,
      href: `/directorio/${e.id}`,
      match,
      reasons,
      conf: e.conf,
    };
  }

  if (input.event) {
    const ev = input.event;
    const tagHits = overlap(interest, ev.cats);
    const zoneHit = focusZone != null && ev.zoneId === focusZone;
    const reasons: string[] = [];
    let match: MatchKind = 'puente';

    if (tagHits.length) {
      reasons.push(`Coincide en: ${tagHits.join(', ')}`);
      match = 'coincide';
    }
    if (zoneHit) {
      reasons.push('En tu zona');
      match = 'coincide';
    }
    if (seeking.includes('eventos') || seeking.includes('cultura')) {
      if (!reasons.length) {
        reasons.push(`Puente: buscas ${seeking.includes('cultura') ? 'cultura' : 'eventos'}`);
        match = 'puente';
      }
    }
    if (ev.conf === 'A') {
      reasons.push('Falta validar fechas/fuentes (conf A)');
      match = tagHits.length || zoneHit ? 'puente' : 'falta_validar';
    }
    if (!reasons.length) return null;

    return {
      kind: 'event',
      id: ev.id,
      name: ev.name,
      href: `/directorio/evento/${ev.id}`,
      match,
      reasons,
      conf: ev.conf,
    };
  }

  return null;
};

export const MATCH_LABELS: Record<MatchKind, string> = {
  coincide: 'Coincide',
  puente: 'Puente',
  falta_validar: 'Falta validar',
};
