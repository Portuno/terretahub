import { createHash } from 'node:crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const SITE_ORIGIN = 'https://www.terretahub.com';
const HOUR_MS = 60 * 60 * 1000;
const MAX_CALLS = 60;

export type McpDb = {
  from: (table: string) => any;
};

export interface ToolOutcome {
  body: Record<string, unknown>;
  isError: boolean;
}

const text = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

const clean = (message?: string): string =>
  (message || 'No se pudo completar la acción.').replace(/\s+/g, ' ').slice(0, 240);

const ok = (body: Record<string, unknown>): ToolOutcome => ({ body, isError: false });
const fail = (message: string): ToolOutcome => ({ body: { error: message }, isError: true });

export const READ_TOOLS = [
  'buscar_agora',
  'listar_eventos',
  'ver_evento',
  'listar_proyectos',
  'ver_proyecto',
  'buscar_personas',
  'listar_comunidades',
  'mi_actividad',
] as const;

export const WRITE_TOOLS = [
  'proponer_evento',
  'crear_evento',
  'proponer_proyecto',
  'crear_proyecto',
  'inscribirse_evento',
  'comentar_en_agora',
] as const;

const limitOf = (value: unknown): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 20;
  return Math.max(1, Math.min(50, Math.floor(parsed)));
};

export const canonicalJson = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map((item) => canonicalJson(item)).join(',')}]`;
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => item !== undefined)
      .sort(([left], [right]) => left.localeCompare(right));
    return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`).join(',')}}`;
  }
  return JSON.stringify(value);
};

export const payloadHash = (value: unknown): string =>
  createHash('sha256').update(canonicalJson(value)).digest('hex');

export const proposalRejection = (
  row: { user_id?: string; tool?: string; status?: string; payload_hash?: string } | null,
  userId: string,
  tool: string,
  hash: string
): string | null => {
  if (!row) return 'La propuesta no existe.';
  if (row.user_id !== userId) return 'La propuesta no es tuya.';
  if (row.tool !== tool) return 'La propuesta es de otra acción.';
  if (row.status !== 'proposed') return 'La propuesta ya se usó.';
  if (row.payload_hash !== hash) return 'El borrador no coincide con la propuesta.';
  return null;
};

export const eventFaltantes = (args: Record<string, unknown>): string[] => {
  const missing: string[] = [];
  if (text(args.title).length < 3) missing.push('título');
  if (text(args.description).length < 20) missing.push('descripción');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text(args.date))) missing.push('fecha');
  if (!/^\d{2}:\d{2}$/.test(text(args.time))) missing.push('hora');
  return missing;
};

export const projectFaltantes = (args: Record<string, unknown>): string[] => {
  const missing: string[] = [];
  if (text(args.name).length < 2) missing.push('nombre');
  if (text(args.slogan).length < 8) missing.push('frase');
  if (text(args.description).length < 40) missing.push('descripción');
  return missing;
};

export const peopleFaltantes = (args: Record<string, unknown>): string[] => {
  const missing: string[] = [];
  if ('habilidades' in args) missing.push('habilidades');
  if ('disponibilidad' in args) missing.push('disponibilidad');
  return missing;
};

const madridOffsetMinutes = (date: Date): number => {
  const name = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Madrid',
    timeZoneName: 'shortOffset',
    hour: '2-digit',
  })
    .formatToParts(date)
    .find((part) => part.type === 'timeZoneName')?.value || '';
  const match = name.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  if (!match) return 60;
  const sign = match[1] === '-' ? -1 : 1;
  return sign * (Number(match[2]) * 60 + Number(match[3] || 0));
};

export const madridInstant = (date: string, time: string): Date => {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, 0);
  const offset = madridOffsetMinutes(new Date(utcGuess));
  return new Date(utcGuess - offset * 60_000);
};

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const projectSlug = (name: string, id: string): string => slugify(name) || `id-${id}`;

const many = async (query: any): Promise<{ rows: any[]; error: string | null; count: number | null }> => {
  try {
    const { data, error, count } = await query;
    if (error) return { rows: [], error: clean(error.message), count: null };
    return { rows: Array.isArray(data) ? data : [], error: null, count: typeof count === 'number' ? count : null };
  } catch (error) {
    return { rows: [], error: clean(error instanceof Error ? error.message : undefined), count: null };
  }
};

const one = async (query: any): Promise<{ row: any | null; error: string | null }> => {
  try {
    const { data, error } = await query;
    if (error) return { row: null, error: clean(error.message) };
    return { row: data ?? null, error: null };
  } catch (error) {
    return { row: null, error: clean(error instanceof Error ? error.message : undefined) };
  }
};

const audit = async (
  db: McpDb,
  userId: string | null,
  tool: string,
  args: Record<string, unknown>,
  result: Record<string, unknown> | null
): Promise<boolean> => {
  try {
    const { error } = await db.from('mcp_audit').insert({
      user_id: userId,
      tool,
      arguments: args,
      result,
    });
    return !error;
  } catch {
    return false;
  }
};

const callsThisHour = async (db: McpDb, userId: string): Promise<number | null> => {
  const since = new Date(Date.now() - HOUR_MS).toISOString();
  const { count, error } = await many(
    db.from('mcp_audit').select('id', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', since)
  );
  if (error) return null;
  return count ?? 0;
};

const findZone = async (
  db: McpDb,
  name: string
): Promise<{ id: number; name: string } | null | { error: string }> => {
  const { rows, error } = await many(db.from('directory_zones').select('id, name').limit(200));
  if (error) return { error };
  const wanted = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const match = rows.find((row) => {
    const current = String(row.name || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    return current === wanted;
  });
  return match ? { id: Number(match.id), name: String(match.name) } : null;
};

const insertReturning = async (
  db: McpDb,
  table: string,
  row: Record<string, unknown>,
  returning: string
): Promise<{ row: any | null; error: string | null }> => {
  const attempt = (payload: Record<string, unknown>) =>
    one(db.from(table).insert(payload).select(returning).single());
  let result = await attempt(row);
  if (result.error && /slug|zone_id|venue_setting|need_summary/.test(result.error)) {
    const next = { ...row };
    for (const key of ['slug', 'zone_id', 'venue_setting', 'need_summary']) {
      if (result.error?.includes(key)) delete next[key];
    }
    result = await attempt(next);
  }
  return result;
};

const guard = async (db: McpDb, userId: string | null, writing: boolean): Promise<ToolOutcome | null> => {
  if (!userId) {
    if (writing) return fail('Hace falta una sesión.');
    return null;
  }
  const count = await callsThisHour(db, userId);
  if (count === null && writing) return fail('No pude contar la auditoría, así que no escribí nada.');
  if (count !== null && count >= MAX_CALLS) return fail('Llegaste al tope de 60 llamadas en esta hora.');
  return null;
};

const buscarAgora = async (db: McpDb, args: Record<string, unknown>): Promise<ToolOutcome> => {
  const limite = limitOf(args.limite);
  let authorIds: string[] | null = null;
  if (text(args.zona)) {
    const zone = await findZone(db, text(args.zona));
    if (zone && 'error' in zone) return fail(zone.error);
    if (!zone) return fail('No existe esa zona.');
    const prefs = await many(
      db.from('user_directory_prefs').select('user_id').eq('zone_id', zone.id).limit(200)
    );
    if (prefs.error) return fail(prefs.error);
    authorIds = prefs.rows.map((row) => String(row.user_id));
  }
  let query = db
    .from('agora_posts')
    .select('id, author_id, content, created_at, image_urls')
    .order('created_at', { ascending: false })
    .limit(limite);
  if (text(args.desde)) query = query.gte('created_at', text(args.desde));
  if (text(args.texto)) query = query.ilike('content', `%${text(args.texto)}%`);
  if (authorIds) query = query.in('author_id', authorIds.length ? authorIds : ['00000000-0000-0000-0000-000000000000']);
  const posts = await many(query);
  if (posts.error) return fail(posts.error);
  return ok({ items: posts.rows, faltantes: [] });
};

const listarEventos = async (db: McpDb, args: Record<string, unknown>): Promise<ToolOutcome> => {
  let query = db
    .from('events')
    .select('id, title, slug, start_date, end_date, location, organizer_id, zone_id')
    .eq('status', 'published')
    .order('start_date', { ascending: true })
    .limit(limitOf(args.limite));
  if (text(args.desde)) query = query.gte('start_date', text(args.desde));
  if (text(args.hasta)) query = query.lte('start_date', text(args.hasta));
  const events = await many(query);
  if (events.error) return fail(events.error);
  const organizerIds = [...new Set(events.rows.map((row) => String(row.organizer_id)))];
  const profiles = organizerIds.length
    ? await many(db.from('profiles').select('id, username').in('id', organizerIds).limit(50))
    : { rows: [], error: null, count: 0 };
  const usernames = new Map(profiles.rows.map((row) => [String(row.id), String(row.username || '')]));
  let directoryQuery = db
    .from('directory_events')
    .select('id, name, ini, lugar')
    .eq('visibility', 'published')
    .order('ini', { ascending: true })
    .limit(20);
  if (text(args.desde)) directoryQuery = directoryQuery.gte('ini', text(args.desde).slice(0, 10));
  if (text(args.hasta)) directoryQuery = directoryQuery.lte('ini', text(args.hasta).slice(0, 10));
  const directory = await many(directoryQuery);
  return ok({
    quedadas: events.rows.map((row) => ({
      ...row,
      username: usernames.get(String(row.organizer_id)) || null,
      inscripcion: true,
    })),
    directorio: (directory.error ? [] : directory.rows).map((row) => ({ ...row, inscripcion: false })),
  });
};

const verEvento = async (db: McpDb, args: Record<string, unknown>): Promise<ToolOutcome> => {
  if (!text(args.id) && !text(args.slug)) return ok({ faltantes: ['id'] });
  let query = db
    .from('events')
    .select('id, title, slug, description, start_date, end_date, location, organizer_id, status, zone_id, venue_setting')
    .eq('status', 'published')
    .limit(1);
  query = text(args.id) ? query.eq('id', text(args.id)) : query.eq('slug', text(args.slug));
  const found = await one(query.maybeSingle());
  if (found.error) return fail(found.error);
  if (!found.row) return fail('No encontré esa quedada publicada.');
  return ok({ evento: { ...found.row, inscripcion: true } });
};

const listarProyectos = async (db: McpDb, args: Record<string, unknown>): Promise<ToolOutcome> => {
  let query = db
    .from('projects')
    .select('id, name, slogan, description, author_id, need_summary')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(limitOf(args.limite));
  if (text(args.texto)) query = query.ilike('name', `%${text(args.texto)}%`);
  let projects = await many(query);
  if (projects.error && /need_summary/.test(projects.error)) {
    projects = await many(
      db
        .from('projects')
        .select('id, name, slogan, description, author_id')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(limitOf(args.limite))
    );
  }
  if (projects.error) return fail(projects.error);
  return ok({
    proyectos: projects.rows.map((row) => ({
      id: row.id,
      name: row.name,
      slogan: row.slogan,
      frase: row.slogan,
      need_summary: row.need_summary ?? null,
      slug: projectSlug(String(row.name || ''), String(row.id)),
    })),
  });
};

const verProyecto = async (db: McpDb, args: Record<string, unknown>): Promise<ToolOutcome> => {
  if (!text(args.id) && !text(args.slug)) return ok({ faltantes: ['id'] });
  if (text(args.id)) {
    const found = await one(
      db.from('projects').select('id, name, slogan, description, status, need_summary').eq('id', text(args.id)).eq('status', 'published').maybeSingle()
    );
    if (found.error && /need_summary/.test(found.error)) {
      const retry = await one(
        db.from('projects').select('id, name, slogan, description, status').eq('id', text(args.id)).eq('status', 'published').maybeSingle()
      );
      if (retry.error) return fail(retry.error);
      if (!retry.row) return fail('No encontré ese proyecto publicado.');
      return ok({ proyecto: { ...retry.row, frase: retry.row.slogan, slug: projectSlug(retry.row.name, retry.row.id) } });
    }
    if (found.error) return fail(found.error);
    if (!found.row) return fail('No encontré ese proyecto publicado.');
    return ok({
      proyecto: { ...found.row, frase: found.row.slogan, slug: projectSlug(found.row.name, found.row.id) },
    });
  }
  const listed = await listarProyectos(db, { limite: 50 });
  if (listed.isError) return listed;
  const proyectos = (listed.body.proyectos as any[]) || [];
  const match = proyectos.find((row) => row.slug === text(args.slug));
  if (!match) return fail('No encontré ese proyecto publicado.');
  return ok({ proyecto: match });
};

const buscarPersonas = async (db: McpDb, args: Record<string, unknown>): Promise<ToolOutcome> => {
  const limite = limitOf(args.limite);
  const needle = text(args.texto);
  let profiles = db.from('profiles').select('id, name, username, avatar').eq('show_in_community', true).limit(limite);
  if (needle) profiles = profiles.ilike('name', `%${needle}%`);
  const people = await many(profiles);
  if (people.error) return fail(people.error);
  let links = db
    .from('link_bio_profiles')
    .select('user_id, username, custom_slug, display_name')
    .eq('is_published', true)
    .limit(limite);
  if (needle) links = links.ilike('display_name', `%${needle}%`);
  const bios = await many(links);
  return ok({
    personas: people.rows.map((row) => ({
      id: row.id,
      name: row.name,
      username: row.username,
      avatar: row.avatar,
      origen: 'comunidad',
    })),
    links: bios.error
      ? []
      : bios.rows.map((row) => ({
          user_id: row.user_id,
          nombre: row.display_name,
          ruta: `/p/${row.custom_slug || row.username}`,
        })),
    faltantes: peopleFaltantes(args),
  });
};

const listarComunidades = async (db: McpDb): Promise<ToolOutcome> => {
  const result = await many(
    db
      .from('directory_entities')
      .select('id, name, description, url')
      .eq('tipo', 'juridica')
      .eq('visibility', 'published')
      .order('name', { ascending: true })
      .limit(50)
  );
  if (result.error) return fail(result.error);
  return ok({ comunidades: result.rows });
};

const miActividad = async (db: McpDb, userId: string | null): Promise<ToolOutcome> => {
  if (!userId) return fail('Hace falta una sesión.');
  const [posts, projects, events, attendances] = await Promise.all([
    many(db.from('agora_posts').select('id, content, created_at').eq('author_id', userId).limit(20)),
    many(db.from('projects').select('id, name, slogan, status').eq('author_id', userId).limit(20)),
    many(db.from('events').select('id, title, slug, status, start_date').eq('organizer_id', userId).limit(20)),
    many(db.from('event_attendances').select('id, event_id, status, registered_at').eq('user_id', userId).limit(20)),
  ]);
  return ok({
    posts: posts.rows,
    proyectos: projects.rows,
    quedadas: events.rows,
    inscripciones: attendances.rows,
  });
};

const saveProposal = async (
  db: McpDb,
  userId: string,
  tool: string,
  draft: Record<string, unknown>
): Promise<ToolOutcome> => {
  const recorded = await audit(db, userId, tool, draft, { fase: 'propuesta' });
  if (!recorded) return fail('No pude registrar la auditoría, así que no escribí nada.');
  const hash = payloadHash(draft);
  const inserted = await one(
    db
      .from('mcp_proposals')
      .insert({ user_id: userId, tool, draft, payload_hash: hash, status: 'proposed' })
      .select('id')
      .single()
  );
  if (inserted.error || !inserted.row?.id) return fail(inserted.error || 'No pude guardar la propuesta.');
  return ok({ proposal_id: inserted.row.id, borrador: draft, faltantes: [] });
};

const proponerEvento = async (db: McpDb, userId: string, args: Record<string, unknown>): Promise<ToolOutcome> => {
  const faltantes = eventFaltantes(args);
  if (faltantes.length) {
    await audit(db, userId, 'proponer_evento', args, { faltantes });
    return ok({ faltantes, proposal_id: null });
  }
  const start = madridInstant(text(args.date), text(args.time));
  if (Number.isNaN(start.getTime()) || start.getTime() <= Date.now()) {
    return fail('La fecha tiene que ser futura.');
  }
  let zoneId: number | null = null;
  let zoneName: string | null = null;
  if (text(args.zone)) {
    const zone = await findZone(db, text(args.zone));
    if (zone && 'error' in zone) return fail(zone.error);
    if (!zone) return fail('No existe esa zona.');
    zoneId = zone.id;
    zoneName = zone.name;
  }
  const draft = {
    title: text(args.title),
    description: text(args.description),
    date: text(args.date),
    time: text(args.time),
    zone: zoneName,
    zone_id: zoneId,
  };
  return saveProposal(db, userId, 'proponer_evento', draft);
};

const proponerProyecto = async (db: McpDb, userId: string, args: Record<string, unknown>): Promise<ToolOutcome> => {
  const faltantes = projectFaltantes(args);
  if (faltantes.length) {
    await audit(db, userId, 'proponer_proyecto', args, { faltantes });
    return ok({ faltantes, proposal_id: null });
  }
  const need = text(args.need_summary);
  if (need.length > 120) return fail('La frase de búsqueda pasa de 120 caracteres.');
  const draft = {
    name: text(args.name),
    slogan: text(args.slogan),
    description: text(args.description),
    need_summary: need || null,
  };
  return saveProposal(db, userId, 'proponer_proyecto', draft);
};

const loadProposal = async (db: McpDb, id: string) =>
  one(db.from('mcp_proposals').select('id, user_id, tool, draft, payload_hash, status').eq('id', id).maybeSingle());

const crearEvento = async (db: McpDb, userId: string, args: Record<string, unknown>): Promise<ToolOutcome> => {
  const draft = (args.borrador && typeof args.borrador === 'object' ? args.borrador : {}) as Record<string, unknown>;
  const recorded = await audit(db, userId, 'crear_evento', { proposal_id: args.proposal_id }, { fase: 'antes' });
  if (!recorded) return fail('No pude registrar la auditoría, así que no escribí nada.');
  const proposal = await loadProposal(db, text(args.proposal_id));
  if (proposal.error) return fail(proposal.error);
  const reason = proposalRejection(proposal.row, userId, 'proponer_evento', payloadHash(draft));
  if (reason) return fail(reason);
  const profile = await one(db.from('profiles').select('username').eq('id', userId).maybeSingle());
  const username = slugify(String(profile.row?.username || ''));
  if (!username) return fail('No encontré tu usuario.');
  const title = text(draft.title);
  const slug = `${username}-${slugify(title)}`;
  const start = madridInstant(text(draft.date), text(draft.time));
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const inserted = await insertReturning(
    db,
    'events',
    {
      organizer_id: userId,
      title,
      slug,
      description: text(draft.description),
      location: null,
      start_date: start.toISOString(),
      end_date: end.toISOString(),
      is_online: false,
      registration_required: true,
      status: 'draft',
      zone_id: draft.zone_id ?? null,
      venue_setting: null,
    },
    'id, slug'
  );
  if (inserted.error || !inserted.row?.id) return fail(inserted.error || 'No pude crear la quedada.');
  const closed = await db.from('mcp_proposals').update({ status: 'executed' }).eq('id', proposal.row.id).eq('user_id', userId);
  if (closed.error) {
    await db.from('events').delete().eq('id', inserted.row.id).eq('organizer_id', userId);
    return fail('No pude cerrar la propuesta, así que deshice la quedada.');
  }
  const savedSlug = inserted.row.slug || slug;
  const enlace = `/evento/${profile.row.username}/${savedSlug}`;
  return ok({
    enlace,
    enlace_absoluto: `${SITE_ORIGIN}${enlace}`,
    nota: 'Quedó en borrador, igual que el formulario. Administración todavía tiene que aprobarla. No está publicada.',
  });
};

const crearProyecto = async (db: McpDb, userId: string, args: Record<string, unknown>): Promise<ToolOutcome> => {
  const draft = (args.borrador && typeof args.borrador === 'object' ? args.borrador : {}) as Record<string, unknown>;
  const recorded = await audit(db, userId, 'crear_proyecto', { proposal_id: args.proposal_id }, { fase: 'antes' });
  if (!recorded) return fail('No pude registrar la auditoría, así que no escribí nada.');
  const proposal = await loadProposal(db, text(args.proposal_id));
  if (proposal.error) return fail(proposal.error);
  const reason = proposalRejection(proposal.row, userId, 'proponer_proyecto', payloadHash(draft));
  if (reason) return fail(reason);
  const inserted = await insertReturning(
    db,
    'projects',
    {
      author_id: userId,
      name: text(draft.name),
      slogan: text(draft.slogan),
      description: text(draft.description),
      need_summary: text(draft.need_summary) || null,
      images: [],
      categories: [],
      technologies: [],
      phase: 'Idea',
      status: 'draft',
    },
    'id, name'
  );
  if (inserted.error || !inserted.row?.id) return fail(inserted.error || 'No pude crear el proyecto.');
  const closed = await db.from('mcp_proposals').update({ status: 'executed' }).eq('id', proposal.row.id).eq('user_id', userId);
  if (closed.error) {
    await db.from('projects').delete().eq('id', inserted.row.id).eq('author_id', userId);
    return fail('No pude cerrar la propuesta, así que deshice el proyecto.');
  }
  const slug = projectSlug(String(inserted.row.name || draft.name), String(inserted.row.id));
  const enlace = `/proyecto/${slug}`;
  return ok({
    enlace,
    enlace_absoluto: `${SITE_ORIGIN}${enlace}`,
    nota: 'Quedó en borrador. Para enviarlo a revisión hace falta una imagen en el formulario. No está publicado.',
  });
};

const inscribirse = async (db: McpDb, userId: string, args: Record<string, unknown>): Promise<ToolOutcome> => {
  if (!text(args.proposal_id)) {
    if (!text(args.event_id)) return ok({ faltantes: ['event_id'], proposal_id: null });
    return saveProposal(db, userId, 'inscribirse_evento', { event_id: text(args.event_id) });
  }
  const draft = (args.borrador && typeof args.borrador === 'object' ? args.borrador : {}) as Record<string, unknown>;
  const recorded = await audit(db, userId, 'inscribirse_evento', { proposal_id: args.proposal_id }, { fase: 'antes' });
  if (!recorded) return fail('No pude registrar la auditoría, así que no escribí nada.');
  const proposal = await loadProposal(db, text(args.proposal_id));
  if (proposal.error) return fail(proposal.error);
  const reason = proposalRejection(proposal.row, userId, 'inscribirse_evento', payloadHash(draft));
  if (reason) return fail(reason);
  const event = await one(
    db.from('events').select('id, status, end_date, max_attendees').eq('id', text(draft.event_id)).maybeSingle()
  );
  if (event.error) return fail(event.error);
  if (!event.row || event.row.status !== 'published') return fail('Este evento no está disponible para registro.');
  if (event.row.end_date && new Date(event.row.end_date).getTime() < Date.now()) {
    return fail('Esta quedada ya finalizó.');
  }
  if (event.row.max_attendees) {
    const taken = await many(
      db.from('event_attendances').select('id', { count: 'exact', head: true }).eq('event_id', event.row.id)
    );
    if ((taken.count || 0) >= Number(event.row.max_attendees)) return fail('Esta quedada ya está llena.');
  }
  const inserted = await one(
    db
      .from('event_attendances')
      .insert({ event_id: event.row.id, user_id: userId, status: 'registered' })
      .select('id')
      .single()
  );
  if (inserted.error) return fail(inserted.error);
  const closed = await db.from('mcp_proposals').update({ status: 'executed' }).eq('id', proposal.row.id).eq('user_id', userId);
  if (closed.error) {
    await db.from('event_attendances').delete().eq('id', inserted.row?.id).eq('user_id', userId);
    return fail('No pude cerrar la propuesta, así que deshice la inscripción.');
  }
  return ok({ nota: 'Inscripción registrada.' });
};

const comentar = async (db: McpDb, userId: string, args: Record<string, unknown>): Promise<ToolOutcome> => {
  if (!text(args.proposal_id)) {
    const faltantes: string[] = [];
    if (!text(args.post_id)) faltantes.push('post_id');
    if (text(args.content).length < 1) faltantes.push('comentario');
    if (faltantes.length) return ok({ faltantes, proposal_id: null });
    return saveProposal(db, userId, 'comentar_en_agora', {
      post_id: text(args.post_id),
      content: text(args.content),
    });
  }
  const draft = (args.borrador && typeof args.borrador === 'object' ? args.borrador : {}) as Record<string, unknown>;
  const recorded = await audit(db, userId, 'comentar_en_agora', { proposal_id: args.proposal_id }, { fase: 'antes' });
  if (!recorded) return fail('No pude registrar la auditoría, así que no escribí nada.');
  const proposal = await loadProposal(db, text(args.proposal_id));
  if (proposal.error) return fail(proposal.error);
  const reason = proposalRejection(proposal.row, userId, 'comentar_en_agora', payloadHash(draft));
  if (reason) return fail(reason);
  const inserted = await one(
    db
      .from('agora_comments')
      .insert({ post_id: text(draft.post_id), author_id: userId, content: text(draft.content) })
      .select('id')
      .single()
  );
  if (inserted.error) return fail(inserted.error);
  const closed = await db.from('mcp_proposals').update({ status: 'executed' }).eq('id', proposal.row.id).eq('user_id', userId);
  if (closed.error) {
    await db.from('agora_comments').delete().eq('id', inserted.row?.id).eq('author_id', userId);
    return fail('No pude cerrar la propuesta, así que deshice el comentario.');
  }
  return ok({ nota: 'Comentario publicado.' });
};

export const executeTool = async (
  db: McpDb,
  userId: string | null,
  name: string,
  args: Record<string, unknown>
): Promise<ToolOutcome> => {
  const known = ([...READ_TOOLS, ...WRITE_TOOLS] as string[]).includes(name);
  if (!known) return fail('Esa herramienta no existe.');
  const confirmsWrite = name.startsWith('crear_') || Boolean(text(args.proposal_id));
  const blocked = await guard(db, userId, confirmsWrite);
  if (blocked) return blocked;
  try {
    if (name === 'buscar_agora') return finishRead(db, userId, name, args, await buscarAgora(db, args));
    if (name === 'listar_eventos') return finishRead(db, userId, name, args, await listarEventos(db, args));
    if (name === 'ver_evento') return finishRead(db, userId, name, args, await verEvento(db, args));
    if (name === 'listar_proyectos') return finishRead(db, userId, name, args, await listarProyectos(db, args));
    if (name === 'ver_proyecto') return finishRead(db, userId, name, args, await verProyecto(db, args));
    if (name === 'buscar_personas') return finishRead(db, userId, name, args, await buscarPersonas(db, args));
    if (name === 'listar_comunidades') return finishRead(db, userId, name, args, await listarComunidades(db));
    if (name === 'mi_actividad') return finishRead(db, userId, name, args, await miActividad(db, userId));
    if (!userId) return fail('Hace falta una sesión.');
    if (name === 'proponer_evento') return proponerEvento(db, userId, args);
    if (name === 'proponer_proyecto') return proponerProyecto(db, userId, args);
    if (name === 'crear_evento') return crearEvento(db, userId, args);
    if (name === 'crear_proyecto') return crearProyecto(db, userId, args);
    if (name === 'inscribirse_evento') return inscribirse(db, userId, args);
    if (name === 'comentar_en_agora') return comentar(db, userId, args);
    return fail('Esa herramienta no existe.');
  } catch (error) {
    return fail(clean(error instanceof Error ? error.message : undefined));
  }
};

const finishRead = async (
  db: McpDb,
  userId: string | null,
  name: string,
  args: Record<string, unknown>,
  outcome: ToolOutcome
): Promise<ToolOutcome> => {
  await audit(db, userId, name, args, outcome.isError ? { error: outcome.body.error } : { ok: true });
  return outcome;
};

export const readResource = async (db: McpDb, uri: string): Promise<ToolOutcome> => {
  if (uri === 'terreta://directorio/zonas') {
    const zones = await many(db.from('directory_zones').select('id, name').order('name', { ascending: true }).limit(200));
    if (zones.error) return fail(zones.error);
    return ok({ zonas: zones.rows });
  }
  if (uri === 'terreta://eventos/semana') {
    const now = new Date();
    const until = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return listarEventos(db, { desde: now.toISOString(), hasta: until.toISOString(), limite: 50 });
  }
  return fail('Ese recurso no existe.');
};

const toolSchema = (name: string, description: string, properties: Record<string, unknown>) => ({
  name,
  description,
  inputSchema: { type: 'object', properties, additionalProperties: false },
});

const TOOL_LIST = [
  toolSchema('buscar_agora', 'Busca publicaciones del Ágora. La zona tiene que existir en el directorio.', {
    texto: { type: 'string' },
    zona: { type: 'string' },
    desde: { type: 'string' },
    limite: { type: 'number' },
  }),
  toolSchema('listar_eventos', 'Lista quedadas publicadas. Las citas del directorio vienen aparte y no tienen inscripción.', {
    desde: { type: 'string' },
    hasta: { type: 'string' },
    limite: { type: 'number' },
  }),
  toolSchema('ver_evento', 'Muestra una quedada publicada por id o slug.', {
    id: { type: 'string' },
    slug: { type: 'string' },
  }),
  toolSchema('listar_proyectos', 'Lista proyectos publicados. La frase corta es el slogan.', {
    texto: { type: 'string' },
    limite: { type: 'number' },
  }),
  toolSchema('ver_proyecto', 'Muestra un proyecto publicado por id o slug.', {
    id: { type: 'string' },
    slug: { type: 'string' },
  }),
  toolSchema('buscar_personas', 'Busca perfiles que eligieron mostrarse, o links públicos. No lista toda la tabla de perfiles.', {
    texto: { type: 'string' },
    limite: { type: 'number' },
    habilidades: { type: 'string' },
    disponibilidad: { type: 'string' },
  }),
  toolSchema('listar_comunidades', 'Lista entidades jurídicas publicadas del directorio.', {}),
  toolSchema('mi_actividad', 'Posts, proyectos, quedadas e inscripciones de la sesión actual.', {}),
  toolSchema('proponer_evento', 'Guarda un borrador de quedada. No crea el evento.', {
    title: { type: 'string' },
    description: { type: 'string' },
    date: { type: 'string' },
    time: { type: 'string' },
    zone: { type: 'string' },
  }),
  toolSchema('crear_evento', 'Crea la quedada solo si la propuesta coincide. Queda en borrador.', {
    proposal_id: { type: 'string' },
    borrador: { type: 'object' },
  }),
  toolSchema('proponer_proyecto', 'Guarda un borrador de proyecto. No crea el proyecto.', {
    name: { type: 'string' },
    slogan: { type: 'string' },
    description: { type: 'string' },
    need_summary: { type: 'string' },
  }),
  toolSchema('crear_proyecto', 'Crea el proyecto en borrador solo si la propuesta coincide.', {
    proposal_id: { type: 'string' },
    borrador: { type: 'object' },
  }),
  toolSchema('inscribirse_evento', 'Inscribe en una quedada publicada después de confirmar la propuesta.', {
    event_id: { type: 'string' },
    proposal_id: { type: 'string' },
    borrador: { type: 'object' },
  }),
  toolSchema('comentar_en_agora', 'Comenta un post después de confirmar la propuesta.', {
    post_id: { type: 'string' },
    content: { type: 'string' },
    proposal_id: { type: 'string' },
    borrador: { type: 'object' },
  }),
];

const asToolResult = (outcome: ToolOutcome) => ({
  content: [{ type: 'text' as const, text: JSON.stringify(outcome.body) }],
  isError: outcome.isError,
});

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
    const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
    if (!url || !key) {
      res.status(500).json({ error: { message: 'Falta la configuración de Supabase.' } });
      return;
    }
    const header = req.headers.authorization;
    const token = typeof header === 'string' && /^Bearer\s+/i.test(header) ? header.replace(/^Bearer\s+/i, '') : '';
    const db: SupabaseClient = createClient(url, key, {
      global: { headers: token ? { Authorization: `Bearer ${token}` } : {} },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    let userId: string | null = null;
    if (token) {
      const { data, error } = await db.auth.getUser(token);
      if (error || !data.user) {
        res.status(401).json({ error: { message: 'La sesión no es válida.' } });
        return;
      }
      userId = data.user.id;
    }
    const [{ Server }, { StreamableHTTPServerTransport }, schemas] = await Promise.all([
      import('@modelcontextprotocol/sdk/server/index.js'),
      import('@modelcontextprotocol/sdk/server/streamableHttp.js'),
      import('@modelcontextprotocol/sdk/types.js'),
    ]);
    const server = new Server(
      { name: 'terreta-hub', version: '1.0.0' },
      { capabilities: { tools: {}, resources: {} } }
    );
    server.setRequestHandler(schemas.ListToolsRequestSchema, async () => ({ tools: TOOL_LIST }));
    server.setRequestHandler(schemas.CallToolRequestSchema, async (request: { params: { name: string; arguments?: Record<string, unknown> } }) => {
      const outcome = await executeTool(db, userId, request.params.name, request.params.arguments || {});
      return asToolResult(outcome);
    });
    server.setRequestHandler(schemas.ListResourcesRequestSchema, async () => ({
      resources: [
        { uri: 'terreta://directorio/zonas', name: 'Zonas', mimeType: 'application/json' },
        { uri: 'terreta://eventos/semana', name: 'Semana', mimeType: 'application/json' },
      ],
    }));
    server.setRequestHandler(schemas.ReadResourceRequestSchema, async (request: { params: { uri: string } }) => {
      const outcome = await readResource(db, request.params.uri);
      return {
        contents: [{ uri: request.params.uri, mimeType: 'application/json', text: JSON.stringify(outcome.body) }],
        isError: outcome.isError,
      };
    });
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });
    await server.connect(transport);
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    await transport.handleRequest(req, res, body);
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({ error: { message: clean(error instanceof Error ? error.message : undefined) } });
    }
  }
}
