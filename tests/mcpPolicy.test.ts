import { describe, expect, it } from 'vitest';
import {
  canonicalJson,
  eventFaltantes,
  executeTool,
  madridInstant,
  payloadHash,
  peopleFaltantes,
  proposalRejection,
  READ_TOOLS,
  type McpDb,
} from '../api/mcp';

class Query {
  action: 'select' | 'insert' | 'update' | 'delete' = 'select';
  payload: Record<string, unknown> | null = null;
  filters: Array<{ op: 'eq' | 'in' | 'ilike' | 'gte' | 'lte'; column: string; value: unknown }> = [];
  head = false;
  limitN: number | null = null;
  orderCol: string | null = null;
  ascending = true;
  mode: 'many' | 'one' | 'maybe' = 'many';

  constructor(
    private readonly db: MemoryDb,
    private readonly table: string
  ) {}

  select(_columns?: string, options?: { count?: string; head?: boolean }) {
    this.head = Boolean(options?.head);
    return this;
  }

  insert(payload: Record<string, unknown>) {
    this.action = 'insert';
    this.payload = payload;
    return this;
  }

  update(payload: Record<string, unknown>) {
    this.action = 'update';
    this.payload = payload;
    return this;
  }

  delete() {
    this.action = 'delete';
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push({ op: 'eq', column, value });
    return this;
  }

  in(column: string, value: unknown[]) {
    this.filters.push({ op: 'in', column, value });
    return this;
  }

  ilike(column: string, value: string) {
    this.filters.push({ op: 'ilike', column, value });
    return this;
  }

  gte(column: string, value: unknown) {
    this.filters.push({ op: 'gte', column, value });
    return this;
  }

  lte(column: string, value: unknown) {
    this.filters.push({ op: 'lte', column, value });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderCol = column;
    this.ascending = options?.ascending !== false;
    return this;
  }

  limit(value: number) {
    this.limitN = value;
    return this;
  }

  maybeSingle() {
    this.mode = 'maybe';
    return this.run();
  }

  single() {
    this.mode = 'one';
    return this.run();
  }

  then<T>(resolve: (value: { data: unknown; error: { message: string } | null; count: number | null }) => T, reject?: (reason: unknown) => T) {
    return this.run().then(resolve, reject);
  }

  private matches(row: Record<string, unknown>): boolean {
    return this.filters.every((filter) => {
      const current = row[filter.column];
      if (filter.op === 'eq') return String(current) === String(filter.value);
      if (filter.op === 'in') return (filter.value as unknown[]).map(String).includes(String(current));
      if (filter.op === 'ilike') {
        const needle = String(filter.value).replace(/%/g, '').toLowerCase();
        return String(current || '').toLowerCase().includes(needle);
      }
      if (filter.op === 'gte') return String(current) >= String(filter.value);
      return String(current) <= String(filter.value);
    });
  }

  private rows(): Record<string, unknown>[] {
    let rows = this.db.tables[this.table].filter((row) => this.matches(row));
    if (this.orderCol) {
      const column = this.orderCol;
      rows = [...rows].sort((left, right) => {
        const compared = String(left[column] ?? '').localeCompare(String(right[column] ?? ''));
        return this.ascending ? compared : -compared;
      });
    }
    if (this.limitN !== null) rows = rows.slice(0, this.limitN);
    return rows;
  }

  private async run() {
    if (this.action === 'insert') {
      if (this.table === 'mcp_audit' && this.db.failAudit) {
        return { data: null, error: { message: 'auditoría caída' }, count: null };
      }
      const row = { id: `id-${this.db.tables[this.table].length + 1}`, ...(this.payload || {}) };
      this.db.tables[this.table].push(row);
      if (this.mode === 'many') return { data: null, error: null, count: null };
      return { data: row, error: null, count: null };
    }
    if (this.action === 'update') {
      this.rows().forEach((row) => Object.assign(row, this.payload));
      return { data: null, error: null, count: null };
    }
    if (this.action === 'delete') {
      const matched = new Set(this.rows());
      this.db.tables[this.table] = this.db.tables[this.table].filter((row) => !matched.has(row));
      return { data: null, error: null, count: null };
    }
    const rows = this.rows();
    if (this.head) return { data: null, error: null, count: rows.length };
    if (this.mode === 'one') {
      return rows[0]
        ? { data: rows[0], error: null, count: rows.length }
        : { data: null, error: { message: 'sin fila' }, count: 0 };
    }
    if (this.mode === 'maybe') return { data: rows[0] || null, error: null, count: rows.length };
    return { data: rows, error: null, count: rows.length };
  }
}

class MemoryDb implements McpDb {
  failAudit = false;
  tables: Record<string, Record<string, unknown>[]> = {
    directory_zones: [{ id: 1, name: 'Ruzafa' }],
    user_directory_prefs: [],
    agora_posts: [{ id: 'post-1', author_id: 'ana', content: 'mate en ruzafa', created_at: '2026-11-14T10:00:00Z' }],
    profiles: [
      { id: 'user-1', name: 'Ana', username: 'ana', avatar: '', show_in_community: true },
      { id: 'user-2', name: 'Beto', username: 'beto', avatar: '', show_in_community: false },
    ],
    link_bio_profiles: [],
    events: [],
    directory_events: [{ id: 'city-1', name: 'Feria', ini: '2026-11-18', lugar: 'Centro', visibility: 'published' }],
    directory_entities: [
      { id: 'org-1', name: 'Colmena', description: 'Espacio', url: '', tipo: 'juridica', visibility: 'published' },
      { id: 'org-2', name: 'Oculta', description: '', url: '', tipo: 'juridica', visibility: 'hidden' },
      { id: 'person-1', name: 'Ana', description: '', url: '', tipo: 'fisica', visibility: 'published' },
    ],
    projects: [],
    event_attendances: [],
    agora_comments: [],
    mcp_audit: [],
    mcp_proposals: [],
  };

  from(table: string) {
    if (!this.tables[table]) this.tables[table] = [];
    return new Query(this, table);
  }
}

const future = () => {
  const date = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
  const iso = date.toISOString().slice(0, 10);
  return iso;
};

describe('política del MCP', () => {
  it('ordena el JSON antes de hashear y rechaza una propuesta ajena o repetida', () => {
    const hash = payloadHash({ zone: 'Ruzafa', title: 'Mate' });
    expect(payloadHash({ title: 'Mate', zone: 'Ruzafa' })).toBe(hash);
    expect(canonicalJson({ b: 1, a: 2 })).toBe('{"a":2,"b":1}');
    const row = { user_id: 'user-1', tool: 'proponer_evento', status: 'proposed', payload_hash: hash };
    expect(proposalRejection(row, 'user-2', 'proponer_evento', hash)).toMatch(/no es tuya/);
    expect(proposalRejection({ ...row, status: 'executed' }, 'user-1', 'proponer_evento', hash)).toMatch(/ya se usó/);
    expect(proposalRejection(row, 'user-1', 'proponer_evento', 'otra')).toMatch(/no coincide/);
    expect(proposalRejection(row, 'user-1', 'proponer_evento', hash)).toBeNull();
  });

  it('convierte la hora de Madrid sin mover el día', () => {
    const instant = madridInstant('2026-11-19', '19:00');
    const hour = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Madrid',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).format(instant);
    expect(hour).toBe('19:00');
  });

  it('devuelve habilidades como faltante y no lista perfiles ocultos', async () => {
    const db = new MemoryDb();
    const result = await executeTool(db, null, 'buscar_personas', { habilidades: 'diseño', texto: 'a' });
    expect(result.isError).toBe(false);
    expect(peopleFaltantes({ habilidades: 'diseño' })).toEqual(['habilidades']);
    expect(result.body.faltantes).toEqual(['habilidades']);
    const personas = result.body.personas as Array<{ username: string }>;
    expect(personas.map((person) => person.username)).toEqual(['ana']);
  });

  it('no inventa una zona ni escribe un post al buscar', async () => {
    const db = new MemoryDb();
    const missing = await executeTool(db, 'user-1', 'buscar_agora', { zona: 'Narnia' });
    expect(missing.body.error).toBe('No existe esa zona.');
    expect(db.tables.directory_zones).toHaveLength(1);
    const found = await executeTool(db, null, 'buscar_agora', { texto: 'mate' });
    expect(found.isError).toBe(false);
    expect(db.tables.agora_posts).toHaveLength(1);
    expect((found.body.items as unknown[]).length).toBe(1);
  });

  it('separa las citas del directorio y no ofrece inscripción', async () => {
    const db = new MemoryDb();
    db.tables.events.push({
      id: 'event-1',
      title: 'Mate',
      slug: 'ana-mate',
      start_date: '2026-11-18T18:00:00Z',
      end_date: '2026-11-18T19:00:00Z',
      location: null,
      organizer_id: 'user-1',
      zone_id: 1,
      status: 'published',
    });
    const result = await executeTool(db, null, 'listar_eventos', { desde: '2026-11-01', hasta: '2026-11-30' });
    const quedadas = result.body.quedadas as Array<{ title: string; inscripcion: boolean }>;
    const directorio = result.body.directorio as Array<{ name: string; inscripcion: boolean }>;
    expect(quedadas.map((item) => item.title)).toEqual(['Mate']);
    expect(quedadas[0]?.inscripcion).toBe(true);
    expect(directorio[0]?.inscripcion).toBe(false);
  });

  it('lista solo comunidades jurídicas publicadas', async () => {
    const db = new MemoryDb();
    const result = await executeTool(db, null, 'listar_comunidades', {});
    expect(result.body.comunidades).toEqual([
      expect.objectContaining({ name: 'Colmena' }),
    ]);
  });

  it('no crea una quedada si faltan datos, si la zona no existe o si la auditoría falla', async () => {
    const db = new MemoryDb();
    const incomplete = await executeTool(db, 'user-1', 'proponer_evento', { title: 'ab' });
    expect(incomplete.body.faltantes).toEqual(expect.arrayContaining(eventFaltantes({ title: 'ab' })));
    expect(db.tables.mcp_proposals).toHaveLength(0);
    expect(db.tables.events).toHaveLength(0);

    const unknown = await executeTool(db, 'user-1', 'proponer_evento', {
      title: 'Mate con la Terreta',
      description: 'Mate con la Terreta es una quedada en Ruzafa.',
      date: future(),
      time: '19:00',
      zone: 'Narnia',
    });
    expect(unknown.body.error).toBe('No existe esa zona.');
    expect(db.tables.events).toHaveLength(0);

    const proposed = await executeTool(db, 'user-1', 'proponer_evento', {
      title: 'Mate con la Terreta',
      description: 'Mate con la Terreta es una quedada en Ruzafa.',
      date: future(),
      time: '19:00',
      zone: 'Ruzafa',
    });
    expect(proposed.body.proposal_id).toBeTruthy();
    db.failAudit = true;
    const blocked = await executeTool(db, 'user-1', 'crear_evento', {
      proposal_id: proposed.body.proposal_id,
      borrador: proposed.body.borrador,
    });
    expect(blocked.body.error).toMatch(/auditoría/);
    expect(db.tables.events).toHaveLength(0);
    expect(db.tables.mcp_proposals[0]?.status).toBe('proposed');
  });

  it('crea la quedada en borrador solo cuando la propuesta coincide', async () => {
    const db = new MemoryDb();
    const proposed = await executeTool(db, 'user-1', 'proponer_evento', {
      title: 'Mate con la Terreta',
      description: 'Mate con la Terreta es una quedada en Ruzafa.',
      date: future(),
      time: '19:00',
      zone: 'Ruzafa',
    });
    const mismatch = await executeTool(db, 'user-1', 'crear_evento', {
      proposal_id: proposed.body.proposal_id,
      borrador: { ...(proposed.body.borrador as object), title: 'Otra' },
    });
    expect(mismatch.isError).toBe(true);
    expect(db.tables.events).toHaveLength(0);

    const created = await executeTool(db, 'user-1', 'crear_evento', {
      proposal_id: proposed.body.proposal_id,
      borrador: proposed.body.borrador,
    });
    expect(created.isError).toBe(false);
    expect(created.body.enlace).toBe('/evento/ana/ana-mate-con-la-terreta');
    expect(String(created.body.nota)).toMatch(/borrador/);
    expect(String(created.body.nota)).toMatch(/No está publicada/);
    expect(db.tables.events[0]?.status).toBe('draft');
    expect(db.tables.mcp_proposals[0]?.status).toBe('executed');
  });

  it('corta al llegar a 60 llamadas de la hora', async () => {
    const db = new MemoryDb();
    db.tables.mcp_audit = Array.from({ length: 60 }, (_, index) => ({
      id: `audit-${index}`,
      user_id: 'user-1',
      tool: 'buscar_agora',
      created_at: new Date().toISOString(),
    }));
    const result = await executeTool(db, 'user-1', 'buscar_agora', {});
    expect(result.body.error).toMatch(/60/);
    expect(READ_TOOLS).toHaveLength(8);
  });
});
