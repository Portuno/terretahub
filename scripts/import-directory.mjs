#!/usr/bin/env node
/**
 * Import idempotente del directorio València desde data/directory/terreta-hub-dataset.json
 *
 * Env:
 *   SUPABASE_URL o VITE_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY  (nunca commitear)
 *
 * Uso:
 *   npm run import:directory
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const datasetPath = resolve(root, 'data/directory/terreta-hub-dataset.json');

const ALLOWED_CATS = new Set([
  'emprendimiento',
  'tecnologia',
  'salud',
  'arte',
  'entretenimiento',
  'publico',
]);
const ALLOWED_TIPO = new Set(['fisica', 'juridica']);
const ALLOWED_AMBITO = new Set(['ciudad', 'producto']);
const ALLOWED_CONF = new Set(['V', 'E', 'A']);
const ALLOWED_GEO = new Set(['sede', 'calle', 'barrio']);

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!url || !serviceKey) {
  console.error(
    'Faltan SUPABASE_URL (o VITE_SUPABASE_URL) y SUPABASE_SERVICE_ROLE_KEY en el entorno.'
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const chunk = (arr, size) => {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

const mean = (values) => {
  if (!values.length) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
};

const emptyToNull = (value) => {
  if (value === null || value === undefined) return null;
  const trimmed = String(value).trim();
  return trimmed.length ? trimmed : null;
};

const asNumberOrNull = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
};

const asCats = (cat) => {
  if (!cat) return null;
  const values = Array.isArray(cat) ? cat : [cat];
  const cleaned = values.map((c) => String(c).trim()).filter(Boolean);
  if (!cleaned.length || cleaned.some((c) => !ALLOWED_CATS.has(c))) return null;
  return cleaned;
};

const parseDateOrNull = (value) => {
  const trimmed = emptyToNull(value);
  if (!trimmed) return null;
  if (!/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return null;
  return trimmed.slice(0, 10);
};

const mapPerson = (raw, sourceUpdatedAt, zoneCanon) => {
  const id = emptyToNull(raw.id);
  const name = emptyToNull(raw.n);
  if (!id || !name) return { skip: { id, reason: 'falta id o nombre' } };
  if (!raw.tipo || !ALLOWED_TIPO.has(raw.tipo)) return { skip: { id, reason: `tipo inválido: ${raw.tipo}` } };
  if (!raw.ambito || !ALLOWED_AMBITO.has(raw.ambito)) return { skip: { id, reason: `ambito inválido: ${raw.ambito}` } };
  if (!raw.conf || !ALLOWED_CONF.has(raw.conf)) return { skip: { id, reason: `conf inválida: ${raw.conf}` } };
  const cats = asCats(raw.cat);
  if (!cats) return { skip: { id, reason: `categoría inválida: ${JSON.stringify(raw.cat)}` } };
  const geo = emptyToNull(raw.geo);
  if (geo && !ALLOWED_GEO.has(geo)) return { skip: { id, reason: `geo inválida: ${geo}` } };
  const lat = asNumberOrNull(raw.lat);
  const lon = asNumberOrNull(raw.lon);
  if ((lat === null) !== (lon === null)) return { skip: { id, reason: 'coordenadas parciales' } };
  const zoneId = asNumberOrNull(raw.z);
  const subzoneId = asNumberOrNull(raw.sz);
  if (zoneId !== null && !zoneCanon.has(zoneId)) return { skip: { id, reason: `zona fuera de canon: ${zoneId}` } };
  if (subzoneId !== null && (subzoneId < 0 || subzoneId > 6)) {
    return { skip: { id, reason: `subzona fuera de canon: ${subzoneId}` } };
  }
  return {
    row: {
      id,
      name,
      tipo: raw.tipo,
      ambito: raw.ambito,
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
      geo_precision: geo,
      zone_id: zoneId,
      subzone_id: subzoneId === 0 ? null : subzoneId,
      lat,
      lon,
      conf: raw.conf,
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

const mapEvent = (raw, sourceUpdatedAt, zoneCanon) => {
  const id = emptyToNull(raw.id);
  const name = emptyToNull(raw.n);
  if (!id || !name) return { skip: { id, reason: 'falta id o nombre' } };
  if (!raw.ambito || !ALLOWED_AMBITO.has(raw.ambito)) return { skip: { id, reason: `ambito inválido: ${raw.ambito}` } };
  if (!raw.conf || !ALLOWED_CONF.has(raw.conf)) return { skip: { id, reason: `conf inválida: ${raw.conf}` } };
  const cats = asCats(raw.cat);
  if (!cats) return { skip: { id, reason: `categoría inválida: ${JSON.stringify(raw.cat)}` } };
  const geo = emptyToNull(raw.geo);
  if (geo && !ALLOWED_GEO.has(geo)) return { skip: { id, reason: `geo inválida: ${geo}` } };
  const lat = asNumberOrNull(raw.lat);
  const lon = asNumberOrNull(raw.lon);
  if ((lat === null) !== (lon === null)) return { skip: { id, reason: 'coordenadas parciales' } };
  const zoneId = asNumberOrNull(raw.z);
  const subzoneId = asNumberOrNull(raw.sz);
  if (zoneId !== null && !zoneCanon.has(zoneId)) return { skip: { id, reason: `zona fuera de canon: ${zoneId}` } };
  if (subzoneId !== null && (subzoneId < 0 || subzoneId > 6)) {
    return { skip: { id, reason: `subzona fuera de canon: ${subzoneId}` } };
  }
  return {
    row: {
      id,
      name,
      ambito: raw.ambito,
      cats,
      description: emptyToNull(raw.desc),
      url: emptyToNull(raw.url),
      ini: parseDateOrNull(raw.ini),
      fin: parseDateOrNull(raw.fin),
      lugar: emptyToNull(raw.lugar),
      dir: emptyToNull(raw.dir),
      geo_precision: geo,
      zone_id: zoneId,
      subzone_id: subzoneId === 0 ? null : subzoneId,
      lat,
      lon,
      recurrente: Boolean(raw.rec),
      conf: raw.conf,
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

const main = async () => {
  const raw = JSON.parse(readFileSync(datasetPath, 'utf8'));
  const rejilla = raw.rejilla || {};
  const sourceUpdatedAt = raw.fecha || null;
  const zoneCanon = new Set(Object.keys(rejilla).map((k) => Number(k)).filter((n) => Number.isFinite(n)));

  console.log('[import] dataset', datasetPath);
  console.log('[import] personas', raw.personas?.length || 0, 'eventos', raw.eventos?.length || 0);

  const pointsByZone = new Map();
  const pointsBySubzone = new Map();
  const collectPoint = (z, sz, lat, lon) => {
    if (lat == null || lon == null || z == null) return;
    if (!pointsByZone.has(z)) pointsByZone.set(z, []);
    pointsByZone.get(z).push([lat, lon]);
    if (sz != null && sz > 0) {
      const key = `${z}:${sz}`;
      if (!pointsBySubzone.has(key)) pointsBySubzone.set(key, []);
      pointsBySubzone.get(key).push([lat, lon]);
    }
  };

  for (const p of raw.personas || []) collectPoint(p.z, p.sz, p.lat, p.lon);
  for (const e of raw.eventos || []) collectPoint(e.z, e.sz, e.lat, e.lon);

  const zoneRows = Object.entries(rejilla).map(([idStr, zone]) => {
    const id = Number(idStr);
    const pts = pointsByZone.get(id) || [];
    return {
      id,
      name: zone.nombre,
      centroid_lat: mean(pts.map((p) => p[0])),
      centroid_lon: mean(pts.map((p) => p[1])),
      updated_at: new Date().toISOString(),
    };
  });

  const { error: zoneError } = await supabase.from('directory_zones').upsert(zoneRows, { onConflict: 'id' });
  if (zoneError) {
    console.error('[import] zones error', zoneError.message);
    process.exit(1);
  }
  console.log('[import] zones upserted', zoneRows.length);

  const subzoneRows = [];
  for (const [idStr, zone] of Object.entries(rejilla)) {
    const zoneId = Number(idStr);
    (zone.subzonas || []).forEach((name, i) => {
      const idx = i + 1;
      const pts = pointsBySubzone.get(`${zoneId}:${idx}`) || [];
      subzoneRows.push({
        zone_id: zoneId,
        idx,
        name,
        centroid_lat: mean(pts.map((p) => p[0])),
        centroid_lon: mean(pts.map((p) => p[1])),
        updated_at: new Date().toISOString(),
      });
    });
  }

  if (subzoneRows.length) {
    const { error: subError } = await supabase
      .from('directory_subzones')
      .upsert(subzoneRows, { onConflict: 'zone_id,idx' });
    if (subError) {
      console.error('[import] subzones error', subError.message);
      process.exit(1);
    }
  }
  console.log('[import] subzones upserted', subzoneRows.length);

  const entityRows = [];
  const entitySkips = [];
  let entityGeo = 0;
  for (const person of raw.personas || []) {
    const { row, skip } = mapPerson(person, sourceUpdatedAt, zoneCanon);
    if (skip || !row) {
      entitySkips.push(skip);
      continue;
    }
    if (row.lat != null) entityGeo += 1;
    entityRows.push(row);
  }
  for (const batch of chunk(entityRows, 100)) {
    const { error } = await supabase.from('directory_entities').upsert(batch, { onConflict: 'id' });
    if (error) {
      console.error('[import] entities batch error', error.message);
      process.exit(1);
    }
  }

  const eventRows = [];
  const eventSkips = [];
  let eventGeo = 0;
  for (const event of raw.eventos || []) {
    const { row, skip } = mapEvent(event, sourceUpdatedAt, zoneCanon);
    if (skip || !row) {
      eventSkips.push(skip);
      continue;
    }
    if (row.lat != null) eventGeo += 1;
    eventRows.push(row);
  }
  for (const batch of chunk(eventRows, 100)) {
    const { error } = await supabase.from('directory_events').upsert(batch, { onConflict: 'id' });
    if (error) {
      console.error('[import] events batch error', error.message);
      process.exit(1);
    }
  }

  console.log('[import] entities upserted', entityRows.length, 'geolocated', entityGeo);
  console.log('[import] events upserted', eventRows.length, 'geolocated', eventGeo);
  console.log('[import] entity skips', entitySkips.length);
  entitySkips.slice(0, 20).forEach((s) => console.log('  skip entity', s?.id, s?.reason));
  console.log('[import] event skips', eventSkips.length);
  eventSkips.slice(0, 20).forEach((s) => console.log('  skip event', s?.id, s?.reason));
  console.log('[import] done');
};

main().catch((err) => {
  console.error('[import] fatal', err);
  process.exit(1);
});
