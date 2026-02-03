import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getSystemPrompt } from '../../lib/chatPrompt.js';

type ChatMessage = { role: 'user' | 'model'; text: string };

const MAX_DESC_PROJECT = 380;
const MAX_DESC_EVENT = 280;

function projectSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function truncate(s: string | null | undefined, max: number): string {
  if (!s || typeof s !== 'string') return '';
  const t = s.replace(/\s+/g, ' ').trim();
  return t.length <= max ? t : t.slice(0, max) + '…';
}

async function buildLiveContext(supabase: SupabaseClient): Promise<string> {
  const lines: string[] = [];

  const { data: projects } = await supabase
    .from('projects')
    .select('name, slogan, description, phase, categories')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(25);

  if (projects && projects.length > 0) {
    lines.push('--- PROYECTOS (usa este contenido para explicar de qué trata cada uno) ---');
    projects.forEach((p) => {
      const slug = projectSlug(p.name);
      const desc = truncate(p.description, MAX_DESC_PROJECT);
      const slogan = p.slogan ? truncate(p.slogan, 120) : '';
      const phase = p.phase || '';
      const cats = Array.isArray(p.categories) ? (p.categories as string[]).slice(0, 5).join(', ') : '';
      lines.push(`[${p.name}] Slogan: ${slogan}. De qué va: ${desc}. Fase: ${phase}. Temas: ${cats}. Enlace: /proyecto/${slug}`);
    });
  }

  const now = new Date().toISOString();
  const { data: eventsData } = await supabase
    .from('events')
    .select('id, title, slug, start_date, description, location, category, organizer_id')
    .eq('status', 'published')
    .order('start_date', { ascending: true });

  if (eventsData && eventsData.length > 0) {
    const organizerIds = [...new Set(eventsData.map((e) => e.organizer_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username')
      .in('id', organizerIds);
    const byId = new Map((profiles || []).map((p) => [p.id, p.username]));

    const upcoming = eventsData.filter((e) => e.start_date >= now);
    const past = eventsData.filter((e) => e.start_date < now);

    if (upcoming.length > 0) {
      lines.push('--- EVENTOS PRÓXIMOS (descripción para explicar de qué va cada uno) ---');
      upcoming.slice(0, 15).forEach((e) => {
        const username = byId.get(e.organizer_id) || 'usuario';
        const slug = e.slug || 'evento';
        const desc = truncate(e.description, MAX_DESC_EVENT);
        const loc = e.location ? truncate(e.location, 80) : '';
        const cat = e.category || '';
        lines.push(`[${e.title}] ${desc}. Ubicación: ${loc}. Categoría: ${cat}. Fecha: ${e.start_date}. Enlace: /evento/${username}/${slug}`);
      });
    }
    if (past.length > 0) {
      lines.push('--- EVENTOS PASADOS ---');
      past.slice(-8).forEach((e) => {
        const username = byId.get(e.organizer_id) || 'usuario';
        const slug = e.slug || 'evento';
        const desc = truncate(e.description, MAX_DESC_EVENT);
        lines.push(`[${e.title}] ${desc}. Enlace: /evento/${username}/${slug}`);
      });
    }
  }

  const { data: blogsData } = await supabase
    .from('blogs')
    .select('id, title, slug, excerpt, author_id')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(15);

  if (blogsData && blogsData.length > 0) {
    const authorIds = [...new Set(blogsData.map((b) => b.author_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username')
      .in('id', authorIds);
    const byId = new Map((profiles || []).map((p) => [p.id, p.username]));
    lines.push('--- BLOGS (opiniones de la Terreta; excerpt para resumir) ---');
    blogsData.forEach((b) => {
      const username = byId.get(b.author_id) || 'autor';
      const slug = b.slug || 'blog';
      const excerpt = truncate(b.excerpt, 140);
      lines.push(`[${b.title}] ${excerpt}. Enlace: /blog/${username}/${slug}`);
    });
  }

  return lines.join('\n');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY || '';
  if (!apiKey) {
    res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
    return;
  }

  const { messages } = req.body as { messages?: ChatMessage[] };
  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'messages array required' });
    return;
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
  let liveContext = '';
  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      liveContext = await buildLiveContext(supabase);
    } catch (e) {
      console.warn('[chat/gemini] Live context failed:', e);
    }
  }

  const systemPrompt = getSystemPrompt(liveContext);

  const contents = messages
    .filter((m) => m.role && m.text)
    .map((m) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: String(m.text).slice(0, 32000) }],
    }));

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`;
    const body = {
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      res.status(response.status).json({ error: 'Gemini request failed', details: errText });
      return;
    }

    const data = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text =
      data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? 'No pude generar una respuesta.';

    res.status(200).json({ text });
  } catch (err) {
    console.error('[chat/gemini]', err);
    res.status(500).json({ error: 'Chat request failed' });
  }
}
