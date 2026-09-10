import { describe, expect, it } from 'vitest';
import { canApplyToEvent, isEventEnded } from '../lib/eventUtils';
import { isOwnContent } from '../lib/ownership';

describe('eventos', () => {
  it('marca un evento pasado como finalizado', () => {
    expect(isEventEnded('2020-01-01T12:00:00.000Z')).toBe(true);
    expect(isEventEnded(new Date(Date.now() + 60_000))).toBe(false);
  });

  it('no permite postular a una quedada pasada', () => {
    const result = canApplyToEvent({
      endDate: '2020-01-01T12:00:00.000Z',
      status: 'published',
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/finalizó/i);
  });

  it('permite postular a una quedada futura publicada', () => {
    const result = canApplyToEvent({
      endDate: new Date(Date.now() + 86_400_000).toISOString(),
      status: 'published',
    });
    expect(result.ok).toBe(true);
  });
});

describe('contenido propio', () => {
  it('solo el dueño puede editar o borrar', () => {
    expect(isOwnContent('user-1', 'user-1')).toBe(true);
    expect(isOwnContent('user-1', 'user-2')).toBe(false);
    expect(isOwnContent('user-1', null)).toBe(false);
  });
});
