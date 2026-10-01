import { describe, expect, it } from 'vitest';
import {
  buildZoneCanon,
  mapEventToRow,
  mapPersonToEntityRow,
} from '../lib/directoryImportMap';
import { formatDirectoryAddress } from '../lib/geoPrecision';

const zoneCanon = buildZoneCanon({
  '0': { nombre: 'Fora de la rejilla', subzonas: [] },
  '1': { nombre: 'Ciutat de València', subzonas: ['A', 'B', 'C', 'D', 'E', 'F'] },
});

describe('directoryImportMap', () => {
  it('mapea una persona válida', () => {
    const { row, skip } = mapPersonToEntityRow(
      {
        id: 'p001',
        n: 'Lanzadera',
        tipo: 'juridica',
        ambito: 'ciudad',
        cat: 'emprendimiento',
        conf: 'V',
        geo: 'sede',
        z: 1,
        sz: 4,
        lat: 39.45,
        lon: -0.32,
        soc: [{ k: 'linkedin', u: 'https://example.com' }],
        tags: ['aceleradora'],
        fuentes: ['https://lanzadera.es/'],
      },
      '2026-09-14',
      zoneCanon
    );
    expect(skip).toBeNull();
    expect(row?.id).toBe('p001');
    expect(row?.cats).toEqual(['emprendimiento']);
    expect(row?.geo_precision).toBe('sede');
    expect(row?.visibility).toBe('published');
  });

  it('skipea conf inválida y coords parciales', () => {
    const badConf = mapPersonToEntityRow(
      { id: 'pX', n: 'X', tipo: 'fisica', ambito: 'ciudad', cat: 'arte', conf: 'Z' },
      null,
      zoneCanon
    );
    expect(badConf.skip?.reason).toMatch(/conf/i);

    const partial = mapPersonToEntityRow(
      {
        id: 'pY',
        n: 'Y',
        tipo: 'fisica',
        ambito: 'ciudad',
        cat: 'arte',
        conf: 'A',
        lat: 39.4,
      },
      null,
      zoneCanon
    );
    expect(partial.skip?.reason).toMatch(/parciales/i);
  });

  it('skipea zona fuera de canon', () => {
    const { skip } = mapPersonToEntityRow(
      {
        id: 'pZ',
        n: 'Z',
        tipo: 'juridica',
        ambito: 'ciudad',
        cat: 'publico',
        conf: 'V',
        z: 99,
      },
      null,
      zoneCanon
    );
    expect(skip?.reason).toMatch(/zona/i);
  });

  it('mapea evento y normaliza fechas vacías', () => {
    const { row, skip } = mapEventToRow(
      {
        id: 'e001',
        n: 'VDS',
        ambito: 'ciudad',
        cat: 'emprendimiento',
        conf: 'V',
        ini: '2026-10-21',
        fin: '',
        rec: false,
        z: 1,
        sz: 5,
        lat: 39.45,
        lon: -0.35,
        geo: 'sede',
      },
      '2026-09-14',
      zoneCanon
    );
    expect(skip).toBeNull();
    expect(row?.ini).toBe('2026-10-21');
    expect(row?.fin).toBeNull();
    expect(row?.recurrente).toBe(false);
  });
});

describe('geoPrecision', () => {
  it('no presenta calle/barrio como dirección exacta', () => {
    const calle = formatDirectoryAddress({
      dir: 'Carrer X 12',
      geoPrecision: 'calle',
    });
    expect(calle.isExact).toBe(false);
    expect(calle.primary).toMatch(/Zona:/);
    expect(calle.badge).toMatch(/calle/i);

    const sede = formatDirectoryAddress({
      dir: 'La Marina de València',
      geoPrecision: 'sede',
    });
    expect(sede.isExact).toBe(true);
    expect(sede.primary).toBe('La Marina de València');
  });
});
