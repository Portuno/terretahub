import { describe, expect, it } from 'vitest';
import { filterMapItems, getEventTimeBucket, type MapItem } from '../lib/mapUtils';

const item = (partial: Partial<MapItem>): MapItem => ({
  id: '1',
  type: 'dir_entity',
  source: 'directory',
  title: 'Lanzadera',
  latitude: 39.45,
  longitude: -0.32,
  cats: ['emprendimiento'],
  ...partial,
});

describe('mapUtils directory layers', () => {
  it('filtra por tipo y búsqueda', () => {
    const items = [
      item({ id: '1', title: 'Lanzadera' }),
      item({ id: '2', title: 'Mostra', type: 'dir_event', cats: ['arte'] }),
      item({ id: '3', title: 'Negocio UGC', type: 'business', source: 'ugc', cats: undefined }),
    ];
    const filtered = filterMapItems(items, ['dir_entity'], 'all', { search: 'lanza' });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].title).toBe('Lanzadera');
  });

  it('clasifica eventos futuros/pasados', () => {
    expect(getEventTimeBucket('2099-01-01')).toBe('future');
    expect(getEventTimeBucket('2020-01-01')).toBe('past');
  });
});
