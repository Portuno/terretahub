import { describe, expect, it } from 'vitest';
import { rankTrends } from '../lib/trends';

describe('rankTrends', () => {
  it('oculta tendencias si no hay señal suficiente', () => {
    expect(rankTrends([['valencia'], ['agora']])).toEqual([]);
    expect(rankTrends([[], null, undefined])).toEqual([]);
  });

  it('ordena por frecuencia real', () => {
    const trends = rankTrends([
      ['Valencia', 'agora'],
      ['valencia', 'quedadas'],
      ['VALENCIA', 'agora'],
    ]);
    expect(trends.map((item) => item.tag)).toEqual(['valencia', 'agora']);
    expect(trends[0].count).toBe(3);
    expect(trends[1].count).toBe(2);
  });
});
