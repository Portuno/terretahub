import { DIRECTORY_CATEGORIES } from './directoryTypes';
import type {
  DirectoryAmbito,
  DirectoryCategory,
  DirectoryConf,
  DirectoryEntityTipo,
  GeoPrecision,
} from './directoryTypes';

const ALLOWED_CATS = new Set<string>(DIRECTORY_CATEGORIES);
const ALLOWED_TIPO = new Set(['fisica', 'juridica']);
const ALLOWED_AMBITO = new Set(['ciudad', 'producto']);
const ALLOWED_CONF = new Set(['V', 'E', 'A']);
const ALLOWED_GEO = new Set(['sede', 'calle', 'barrio']);

export interface RawDirectoryPerson {
  id?: string;
  n?: string;
  tipo?: string;
  ambito?: string;
  cat?: string | string[];
  rol?: string;
  org?: string;
  desc?: string;
  url?: string;
  tags?: string[];
  datos?: unknown;
  soc?: unknown;
  rel?: string[];
  dir?: string;
  geo?: string | null;
  z?: number | null;
  sz?: number | null;
  lat?: number | null;
  lon?: number | null;
  conf?: string;
  flag?: string;
  fuentes?: string[];
  estado?: string;
  notas?: string;
  orden?: number;
}

export interface RawDirectoryEvent {
  id?: string;
  n?: string;
  ambito?: string;
  cat?: string | string[];
  desc?: string;
  url?: string;
  ini?: string;
  fin?: string;
  lugar?: string;
  dir?: string;
  geo?: string | null;
  z?: number | null;
  sz?: number | null;
  lat?: number | null;
  lon?: number | null;
  rec?: boolean;
  conf?: string;
  flag?: string;
  fuentes?: string[];
  estado?: string;
  notas?: string;
  orden?: number;
}

export interface MapSkip {
  id: string | null;
  reason: string;
}

const asCats = (cat: string | string[] | undefined): DirectoryCategory[] | null => {
  if (!cat) return null;
  const values = Array.isArray(cat) ? cat : [cat];
  const cleaned = values.map((c) => String(c).trim()).filter(Boolean);
  if (!cleaned.length) return null;
  if (cleaned.some((c) => !ALLOWED_CATS.has(c))) return null;
  return cleaned as DirectoryCategory[];
};

const asNumberOrNull = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
};

const emptyToNull = (value?: string | null): string | null => {
  if (value === null || value === undefined) return null;
  const trimmed = String(value).trim();
  return trimmed.length ? trimmed : null;
};

const parseDateOrNull = (value?: string | null): string | null => {
  const trimmed = emptyToNull(value);
  if (!trimmed) return null;
  if (!/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return null;
  return trimmed.slice(0, 10);
};

export const mapPersonToEntityRow = (
  raw: RawDirectoryPerson,
  sourceUpdatedAt: string | null,
  zoneCanon: Set<number>
): { row: Record<string, unknown> | null; skip: MapSkip | null } => {
  const id = emptyToNull(raw.id);
  const name = emptyToNull(raw.n);
  if (!id || !name) {
    return { row: null, skip: { id, reason: 'falta id o nombre' } };
  }
  if (!raw.tipo || !ALLOWED_TIPO.has(raw.tipo)) {
    return { row: null, skip: { id, reason: `tipo inválido: ${raw.tipo}` } };
  }
  if (!raw.ambito || !ALLOWED_AMBITO.has(raw.ambito)) {
    return { row: null, skip: { id, reason: `ambito inválido: ${raw.ambito}` } };
  }
  if (!raw.conf || !ALLOWED_CONF.has(raw.conf)) {
    return { row: null, skip: { id, reason: `conf inválida: ${raw.conf}` } };
  }
  const cats = asCats(raw.cat);
  if (!cats) {
    return { row: null, skip: { id, reason: `categoría inválida: ${JSON.stringify(raw.cat)}` } };
  }

  const geo = emptyToNull(raw.geo);
  if (geo && !ALLOWED_GEO.has(geo)) {
    return { row: null, skip: { id, reason: `geo inválida: ${geo}` } };
  }

  const lat = asNumberOrNull(raw.lat);
  const lon = asNumberOrNull(raw.lon);
  if ((lat === null) !== (lon === null)) {
    return { row: null, skip: { id, reason: 'coordenadas parciales' } };
  }

  const zoneId = asNumberOrNull(raw.z);
  const subzoneId = asNumberOrNull(raw.sz);
  if (zoneId !== null && !zoneCanon.has(zoneId)) {
    return { row: null, skip: { id, reason: `zona fuera de canon: ${zoneId}` } };
  }
  if (subzoneId !== null && (subzoneId < 0 || subzoneId > 6)) {
    return { row: null, skip: { id, reason: `subzona fuera de canon: ${subzoneId}` } };
  }

  return {
    skip: null,
    row: {
      id,
      name,
      tipo: raw.tipo as DirectoryEntityTipo,
      ambito: raw.ambito as DirectoryAmbito,
      cats,
      rol: emptyToNull(raw.rol),
      org: emptyToNull(raw.org),
      description: emptyToNull(raw.desc),
      url: emptyToNull(raw.url),
      tags: Array.isArray(raw.tags) ? raw.tags.filter(Boolean) : [],
      datos: Array.isArray(raw.datos) ? raw.datos : [],
      soc: Array.isArray(raw.soc) ? raw.soc : [],
      rel: Array.isArray(raw.rel) ? raw.rel.filter(Boolean) : [],
      dir: emptyToNull(raw.dir),
      geo_precision: (geo as GeoPrecision | null) || null,
      zone_id: zoneId,
      subzone_id: subzoneId === 0 ? null : subzoneId,
      lat,
      lon,
      conf: raw.conf as DirectoryConf,
      flag: emptyToNull(raw.flag),
      fuentes: Array.isArray(raw.fuentes) ? raw.fuentes.filter(Boolean) : [],
      estado: emptyToNull(raw.estado),
      notas: emptyToNull(raw.notas),
      orden: asNumberOrNull(raw.orden),
      visibility: 'published',
      source_updated_at: sourceUpdatedAt,
      updated_at: new Date().toISOString(),
    },
  };
};

export const mapEventToRow = (
  raw: RawDirectoryEvent,
  sourceUpdatedAt: string | null,
  zoneCanon: Set<number>
): { row: Record<string, unknown> | null; skip: MapSkip | null } => {
  const id = emptyToNull(raw.id);
  const name = emptyToNull(raw.n);
  if (!id || !name) {
    return { row: null, skip: { id, reason: 'falta id o nombre' } };
  }
  if (!raw.ambito || !ALLOWED_AMBITO.has(raw.ambito)) {
    return { row: null, skip: { id, reason: `ambito inválido: ${raw.ambito}` } };
  }
  if (!raw.conf || !ALLOWED_CONF.has(raw.conf)) {
    return { row: null, skip: { id, reason: `conf inválida: ${raw.conf}` } };
  }
  const cats = asCats(raw.cat);
  if (!cats) {
    return { row: null, skip: { id, reason: `categoría inválida: ${JSON.stringify(raw.cat)}` } };
  }

  const geo = emptyToNull(raw.geo);
  if (geo && !ALLOWED_GEO.has(geo)) {
    return { row: null, skip: { id, reason: `geo inválida: ${geo}` } };
  }

  const lat = asNumberOrNull(raw.lat);
  const lon = asNumberOrNull(raw.lon);
  if ((lat === null) !== (lon === null)) {
    return { row: null, skip: { id, reason: 'coordenadas parciales' } };
  }

  const zoneId = asNumberOrNull(raw.z);
  const subzoneId = asNumberOrNull(raw.sz);
  if (zoneId !== null && !zoneCanon.has(zoneId)) {
    return { row: null, skip: { id, reason: `zona fuera de canon: ${zoneId}` } };
  }
  if (subzoneId !== null && (subzoneId < 0 || subzoneId > 6)) {
    return { row: null, skip: { id, reason: `subzona fuera de canon: ${subzoneId}` } };
  }

  return {
    skip: null,
    row: {
      id,
      name,
      ambito: raw.ambito as DirectoryAmbito,
      cats,
      description: emptyToNull(raw.desc),
      url: emptyToNull(raw.url),
      ini: parseDateOrNull(raw.ini),
      fin: parseDateOrNull(raw.fin),
      lugar: emptyToNull(raw.lugar),
      dir: emptyToNull(raw.dir),
      geo_precision: (geo as GeoPrecision | null) || null,
      zone_id: zoneId,
      subzone_id: subzoneId === 0 ? null : subzoneId,
      lat,
      lon,
      recurrente: Boolean(raw.rec),
      conf: raw.conf as DirectoryConf,
      flag: emptyToNull(raw.flag),
      fuentes: Array.isArray(raw.fuentes) ? raw.fuentes.filter(Boolean) : [],
      estado: emptyToNull(raw.estado),
      notas: emptyToNull(raw.notas),
      orden: asNumberOrNull(raw.orden),
      visibility: 'published',
      source_updated_at: sourceUpdatedAt,
      updated_at: new Date().toISOString(),
    },
  };
};

export const buildZoneCanon = (rejilla: Record<string, { nombre: string; subzonas?: string[] }>): Set<number> => {
  return new Set(Object.keys(rejilla).map((k) => Number(k)).filter((n) => Number.isFinite(n)));
};
