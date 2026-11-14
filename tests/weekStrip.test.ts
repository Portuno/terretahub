import { describe, expect, it } from 'vitest';
import { currentWeek, isSameLocalDay } from '../lib/weekStrip';

describe('semana', () => {
  it('empieza el lunes de la semana local', () => {
    const week = currentWeek(new Date(2026, 10, 14, 12, 0, 0));
    expect(week.map((day) => day.iso)).toEqual([
      '2026-11-09',
      '2026-11-10',
      '2026-11-11',
      '2026-11-12',
      '2026-11-13',
      '2026-11-14',
      '2026-11-15',
    ]);
    expect(week[0]?.label).toBe('Lun');
  });

  it('compara el día local', () => {
    expect(isSameLocalDay('2026-11-14T12:00:00', '2026-11-14')).toBe(true);
    expect(isSameLocalDay('2026-11-14T12:00:00', '2026-11-15')).toBe(false);
  });
});
