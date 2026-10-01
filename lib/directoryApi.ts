import { supabase } from './supabase';
import { executeQueryWithRetry } from './supabaseHelpers';
import type {
  DirectoryEntity,
  DirectoryEvent,
  DirectoryFlagKind,
  DirectoryListFilters,
  DirectorySocialLink,
  DirectoryDato,
  DirectoryTargetType,
  DirectoryZone,
  UserDirectoryPrefs,
  DirectoryCategory,
  DirectoryEntityTipo,
  DirectoryAmbito,
  DirectoryConf,
  GeoPrecision,
  DirectoryVisibility,
  DirectoryFocusMode,
} from './directoryTypes';

const mapSoc = (value: unknown): DirectorySocialLink[] => {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is { k?: string; u?: string } => Boolean(item) && typeof item === 'object')
    .map((item) => ({ k: String(item.k || ''), u: String(item.u || '') }))
    .filter((item) => item.k && item.u);
};

const mapDatos = (value: unknown): DirectoryDato[] => {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is { k?: string; v?: string } => Boolean(item) && typeof item === 'object')
    .map((item) => ({ k: String(item.k || ''), v: String(item.v || '') }))
    .filter((item) => item.k);
};

export const mapDbEntity = (row: Record<string, unknown>): DirectoryEntity => ({
  id: String(row.id),
  name: String(row.name || ''),
  tipo: row.tipo as DirectoryEntityTipo,
  ambito: row.ambito as DirectoryAmbito,
  cats: (row.cats as DirectoryCategory[]) || [],
  rol: (row.rol as string) || null,
  org: (row.org as string) || null,
  description: (row.description as string) || null,
  url: (row.url as string) || null,
  tags: (row.tags as string[]) || [],
  datos: mapDatos(row.datos),
  soc: mapSoc(row.soc),
  rel: (row.rel as string[]) || [],
  dir: (row.dir as string) || null,
  geoPrecision: (row.geo_precision as GeoPrecision) || null,
  zoneId: row.zone_id === null || row.zone_id === undefined ? null : Number(row.zone_id),
  subzoneId: row.subzone_id === null || row.subzone_id === undefined ? null : Number(row.subzone_id),
  lat: row.lat === null || row.lat === undefined ? null : Number(row.lat),
  lon: row.lon === null || row.lon === undefined ? null : Number(row.lon),
  conf: row.conf as DirectoryConf,
  flag: (row.flag as string) || null,
  fuentes: (row.fuentes as string[]) || [],
  estado: (row.estado as string) || null,
  notas: (row.notas as string) || null,
  orden: row.orden === null || row.orden === undefined ? null : Number(row.orden),
  visibility: (row.visibility as DirectoryVisibility) || 'published',
  sourceUpdatedAt: (row.source_updated_at as string) || null,
  updatedAt: (row.updated_at as string) || null,
});

export const mapDbEvent = (row: Record<string, unknown>): DirectoryEvent => ({
  id: String(row.id),
  name: String(row.name || ''),
  ambito: row.ambito as DirectoryAmbito,
  cats: (row.cats as DirectoryCategory[]) || [],
  description: (row.description as string) || null,
  url: (row.url as string) || null,
  ini: (row.ini as string) || null,
  fin: (row.fin as string) || null,
  lugar: (row.lugar as string) || null,
  dir: (row.dir as string) || null,
  geoPrecision: (row.geo_precision as GeoPrecision) || null,
  zoneId: row.zone_id === null || row.zone_id === undefined ? null : Number(row.zone_id),
  subzoneId: row.subzone_id === null || row.subzone_id === undefined ? null : Number(row.subzone_id),
  lat: row.lat === null || row.lat === undefined ? null : Number(row.lat),
  lon: row.lon === null || row.lon === undefined ? null : Number(row.lon),
  recurrente: Boolean(row.recurrente),
  conf: row.conf as DirectoryConf,
  flag: (row.flag as string) || null,
  fuentes: (row.fuentes as string[]) || [],
  estado: (row.estado as string) || null,
  notas: (row.notas as string) || null,
  orden: row.orden === null || row.orden === undefined ? null : Number(row.orden),
  visibility: (row.visibility as DirectoryVisibility) || 'published',
  sourceUpdatedAt: (row.source_updated_at as string) || null,
  updatedAt: (row.updated_at as string) || null,
});

const applyEntityFilters = (query: any, filters: DirectoryListFilters = {}) => {
  let q = query.eq('visibility', 'published');
  if (filters.cats?.length) {
    q = q.overlaps('cats', filters.cats);
  }
  if (filters.tipo) {
    q = q.eq('tipo', filters.tipo);
  }
  if (filters.ambito) {
    q = q.eq('ambito', filters.ambito);
  }
  if (filters.zoneId !== undefined) {
    q = q.eq('zone_id', filters.zoneId);
  }
  if (filters.subzoneId !== undefined) {
    q = q.eq('subzone_id', filters.subzoneId);
  }
  if (filters.geolocated) {
    q = q.not('lat', 'is', null).not('lon', 'is', null);
  }
  if (filters.search?.trim()) {
    q = q.ilike('name', `%${filters.search.trim()}%`);
  }
  return q;
};

export const listEntities = async (
  filters: DirectoryListFilters = {}
): Promise<{ data: DirectoryEntity[]; error: string | null }> => {
  const limit = filters.limit ?? 500;
  const { data, error } = await executeQueryWithRetry(
    async () =>
      await applyEntityFilters(
        supabase.from('directory_entities').select('*').order('orden', { ascending: true, nullsFirst: false }),
        filters
      ).limit(limit),
    'list directory entities'
  );

  if (error) {
    return { data: [], error: error.message || 'No se pudo cargar el directorio.' };
  }

  let rows = ((data as Record<string, unknown>[]) || []).map(mapDbEntity);
  if (filters.hasSoc) {
    rows = rows.filter((row) => row.soc.length > 0);
  }
  return { data: rows, error: null };
};

export const listEvents = async (
  filters: DirectoryListFilters = {}
): Promise<{ data: DirectoryEvent[]; error: string | null }> => {
  const limit = filters.limit ?? 500;
  let query = supabase
    .from('directory_events')
    .select('*')
    .eq('visibility', 'published')
    .order('ini', { ascending: true, nullsFirst: false });

  if (filters.cats?.length) {
    query = query.overlaps('cats', filters.cats);
  }
  if (filters.ambito) {
    query = query.eq('ambito', filters.ambito);
  }
  if (filters.zoneId !== undefined) {
    query = query.eq('zone_id', filters.zoneId);
  }
  if (filters.subzoneId !== undefined) {
    query = query.eq('subzone_id', filters.subzoneId);
  }
  if (filters.geolocated) {
    query = query.not('lat', 'is', null).not('lon', 'is', null);
  }
  if (filters.search?.trim()) {
    query = query.ilike('name', `%${filters.search.trim()}%`);
  }

  const { data, error } = await executeQueryWithRetry(
    async () => await query.limit(limit),
    'list directory events'
  );

  if (error) {
    return { data: [], error: error.message || 'No se pudieron cargar las citas del directorio.' };
  }

  return {
    data: ((data as Record<string, unknown>[]) || []).map(mapDbEvent),
    error: null,
  };
};

export const getEntityById = async (
  id: string
): Promise<{ data: DirectoryEntity | null; error: string | null }> => {
  const { data, error } = await executeQueryWithRetry(
    async () =>
      await supabase.from('directory_entities').select('*').eq('id', id).maybeSingle(),
    'get directory entity'
  );
  if (error) {
    return { data: null, error: error.message || 'No se pudo cargar la ficha.' };
  }
  if (!data) {
    return { data: null, error: null };
  }
  return { data: mapDbEntity(data as Record<string, unknown>), error: null };
};

export const getEventById = async (
  id: string
): Promise<{ data: DirectoryEvent | null; error: string | null }> => {
  const { data, error } = await executeQueryWithRetry(
    async () =>
      await supabase.from('directory_events').select('*').eq('id', id).maybeSingle(),
    'get directory event'
  );
  if (error) {
    return { data: null, error: error.message || 'No se pudo cargar la cita.' };
  }
  if (!data) {
    return { data: null, error: null };
  }
  return { data: mapDbEvent(data as Record<string, unknown>), error: null };
};

export const listZones = async (): Promise<{ data: DirectoryZone[]; error: string | null }> => {
  const [zonesResult, subzonesResult] = await Promise.all([
    executeQueryWithRetry(
      async () => await supabase.from('directory_zones').select('*').order('id', { ascending: true }),
      'list directory zones'
    ),
    executeQueryWithRetry(
      async () =>
        await supabase
          .from('directory_subzones')
          .select('*')
          .order('zone_id', { ascending: true })
          .order('idx', { ascending: true }),
      'list directory subzones'
    ),
  ]);

  if (zonesResult.error) {
    return { data: [], error: zonesResult.error.message || 'No se pudieron cargar las zonas.' };
  }

  const subzones = ((subzonesResult.data as Record<string, unknown>[]) || []).map((row) => ({
    zoneId: Number(row.zone_id),
    idx: Number(row.idx),
    name: String(row.name || ''),
    centroidLat: row.centroid_lat === null || row.centroid_lat === undefined ? null : Number(row.centroid_lat),
    centroidLon: row.centroid_lon === null || row.centroid_lon === undefined ? null : Number(row.centroid_lon),
  }));

  const zones: DirectoryZone[] = ((zonesResult.data as Record<string, unknown>[]) || []).map((row) => ({
    id: Number(row.id),
    name: String(row.name || ''),
    centroidLat: row.centroid_lat === null || row.centroid_lat === undefined ? null : Number(row.centroid_lat),
    centroidLon: row.centroid_lon === null || row.centroid_lon === undefined ? null : Number(row.centroid_lon),
    subzones: subzones.filter((sz) => sz.zoneId === Number(row.id)),
  }));

  return { data: zones, error: null };
};

export const resolveEntityIdByName = async (
  name: string
): Promise<string | null> => {
  const { data, error } = await executeQueryWithRetry(
    async () =>
      await supabase
        .from('directory_entities')
        .select('id')
        .eq('visibility', 'published')
        .ilike('name', name.trim())
        .limit(1)
        .maybeSingle(),
    'resolve directory entity by name'
  );
  if (error || !data) return null;
  return String((data as { id: string }).id);
};

export const listUserFlags = async (
  userId: string
): Promise<{ data: Array<{ targetType: DirectoryTargetType; targetId: string; flag: DirectoryFlagKind }>; error: string | null }> => {
  const { data, error } = await executeQueryWithRetry(
    async () =>
      await supabase
        .from('user_directory_flags')
        .select('target_type, target_id, flag')
        .eq('user_id', userId),
    'list user directory flags'
  );
  if (error) {
    return { data: [], error: error.message || 'No se pudieron cargar los guardados.' };
  }
  return {
    data: ((data as Array<{ target_type: DirectoryTargetType; target_id: string; flag: DirectoryFlagKind }>) || []).map(
      (row) => ({
        targetType: row.target_type,
        targetId: row.target_id,
        flag: row.flag,
      })
    ),
    error: null,
  };
};

export const setUserFlag = async (input: {
  userId: string;
  targetType: DirectoryTargetType;
  targetId: string;
  flag: DirectoryFlagKind;
  enabled: boolean;
}): Promise<string | null> => {
  if (input.enabled) {
    const { error } = await supabase.from('user_directory_flags').upsert(
      {
        user_id: input.userId,
        target_type: input.targetType,
        target_id: input.targetId,
        flag: input.flag,
      },
      { onConflict: 'user_id,target_type,target_id,flag' }
    );
    return error ? error.message : null;
  }

  const { error } = await supabase
    .from('user_directory_flags')
    .delete()
    .eq('user_id', input.userId)
    .eq('target_type', input.targetType)
    .eq('target_id', input.targetId)
    .eq('flag', input.flag);
  return error ? error.message : null;
};

export const getUserPrefs = async (
  userId: string
): Promise<{ data: UserDirectoryPrefs | null; error: string | null }> => {
  const { data, error } = await executeQueryWithRetry(
    async () =>
      await supabase.from('user_directory_prefs').select('*').eq('user_id', userId).maybeSingle(),
    'get user directory prefs'
  );
  if (error) {
    return { data: null, error: error.message || 'No se pudieron cargar las preferencias.' };
  }
  if (!data) return { data: null, error: null };
  const row = data as Record<string, unknown>;
  return {
    data: {
      userId,
      interestTags: (row.interest_tags as string[]) || [],
      seeking: (row.seeking as string[]) || [],
      focusMode: (row.focus_mode as DirectoryFocusMode) || null,
      zoneId: row.zone_id === null || row.zone_id === undefined ? null : Number(row.zone_id),
      consentPersonalization: Boolean(row.consent_personalization),
      consentEmailAlerts: Boolean(row.consent_email_alerts),
      emailAlertsStub: Boolean(row.email_alerts_stub),
      onboardingSkipped: Boolean(row.onboarding_skipped),
      onboardingCompletedAt: (row.onboarding_completed_at as string) || null,
    },
    error: null,
  };
};

export const upsertUserPrefs = async (
  prefs: Partial<UserDirectoryPrefs> & { userId: string }
): Promise<string | null> => {
  const { error } = await supabase.from('user_directory_prefs').upsert(
    {
      user_id: prefs.userId,
      interest_tags: prefs.interestTags ?? [],
      seeking: prefs.seeking ?? [],
      focus_mode: prefs.focusMode ?? null,
      zone_id: prefs.zoneId ?? null,
      consent_personalization: prefs.consentPersonalization ?? false,
      consent_email_alerts: prefs.consentEmailAlerts ?? false,
      email_alerts_stub: prefs.emailAlertsStub ?? false,
      onboarding_skipped: prefs.onboardingSkipped ?? false,
      onboarding_completed_at: prefs.onboardingCompletedAt ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );
  return error ? error.message : null;
};

export const clearUserPersonalization = async (userId: string): Promise<string | null> => {
  const [flags, prefs] = await Promise.all([
    supabase.from('user_directory_flags').delete().eq('user_id', userId),
    supabase.from('user_directory_prefs').delete().eq('user_id', userId),
  ]);
  if (flags.error) return flags.error.message;
  if (prefs.error) return prefs.error.message;
  return null;
};
