import { describe, expect, it } from 'vitest';
import { formatRelativeTime } from '../lib/relativeTime';

describe('tiempo relativo', () => {
  const now = new Date('2026-11-14T12:00:00Z');

  it('acorta minutos, horas y días', () => {
    expect(formatRelativeTime('2026-11-14T11:59:40Z', now)).toBe('Ahora');
    expect(formatRelativeTime('2026-11-14T11:55:00Z', now)).toBe('hace 5 min');
    expect(formatRelativeTime('2026-11-14T10:00:00Z', now)).toBe('hace 2 h');
    expect(formatRelativeTime('2026-11-11T12:00:00Z', now)).toBe('hace 3 d');
  });
});
