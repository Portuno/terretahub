import { describe, expect, it } from 'vitest';
import { explainMatch, MATCH_LABELS } from '../lib/directoryMatching';
import type { DirectoryEntity, UserDirectoryPrefs } from '../lib/directoryTypes';

const prefs: UserDirectoryPrefs = {
  userId: 'u1',
  interestTags: ['tecnologia', 'arte'],
  seeking: ['eventos'],
  focusMode: 'explore',
  zoneId: 1,
  consentPersonalization: true,
  consentEmailAlerts: false,
  emailAlertsStub: true,
  onboardingSkipped: false,
  onboardingCompletedAt: '2026-09-17',
};

const entity = (partial: Partial<DirectoryEntity>): DirectoryEntity => ({
  id: 'p001',
  name: 'Test',
  tipo: 'juridica',
  ambito: 'ciudad',
  cats: ['tecnologia'],
  rol: null,
  org: null,
  description: null,
  url: null,
  tags: ['IA'],
  datos: [],
  soc: [],
  rel: [],
  dir: null,
  geoPrecision: 'sede',
  zoneId: 1,
  subzoneId: 2,
  lat: 39.4,
  lon: -0.3,
  conf: 'V',
  flag: null,
  fuentes: [],
  estado: null,
  notas: null,
  orden: 1,
  visibility: 'published',
  sourceUpdatedAt: null,
  updatedAt: null,
  ...partial,
});

describe('directoryMatching', () => {
  it('explica coincide con tags y zona', () => {
    const card = explainMatch({ prefs, entity: entity({}) });
    expect(card?.match).toBe('coincide');
    expect(card?.reasons.some((r) => /Coincide|zona/i.test(r))).toBe(true);
    expect(MATCH_LABELS.coincide).toBe('Coincide');
  });

  it('marca falta validar con conf A sin overlap fuerte', () => {
    const card = explainMatch({
      prefs: { ...prefs, interestTags: [], zoneId: null },
      entity: entity({ conf: 'A', cats: ['publico'], tags: [] }),
    });
    expect(card?.match).toBe('falta_validar');
  });

  it('no recomienda sin consentimiento', () => {
    const card = explainMatch({
      prefs: { ...prefs, consentPersonalization: false },
      entity: entity({}),
    });
    expect(card).toBeNull();
  });
});
