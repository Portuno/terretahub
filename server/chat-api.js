/**
 * Servidor de desarrollo para /api/chat/gemini.
 * Solo para uso local con `npm run dev`; en producción Vercel usa api/chat/gemini.ts.
 * Ejecutar: npm run dev:api (en otra terminal: npm run dev).
 * Carga GEMINI_API_KEY y Supabase desde .env.local si existe (dotenv).
 */

import http from 'http';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { getSystemPrompt } from '../lib/chatPrompt.js';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const PORT = 3001;
const MAX_DESC_PROJECT = 380;
const MAX_DESC_EVENT = 280;

function projectSlug(name) {
  return String(name)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function truncate(s, max) {
  if (!s || typeof s !== 'string') return '';
  const t = s.replace(/\s+/g, ' ').trim();
  return t.length <= max ? t : t.slice(0, max) + '…';
}

async function buildLiveContext(supabase) {
  const lines = [];

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
      const cats = Array.isArray(p.categories) ? p.categories.slice(0, 5).join(', ') : '';
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

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function send(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  if (req.method !== 'POST' || req.url !== '/api/chat/gemini') {
    send(res, 404, { error: 'Not found' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY || '';
  if (!apiKey) {
    send(res, 500, { error: 'GEMINI_API_KEY not configured. Add it to .env.local and run npm run dev:api.' });
    return;
  }

  let body;
  try {
    body = await parseBody(req);
  } catch {
    send(res, 400, { error: 'Invalid JSON' });
    return;
  }

  const { messages } = body;
  if (!Array.isArray(messages) || messages.length === 0) {
    send(res, 400, { error: 'messages array required' });
    return;
  }

  let liveContext = '';
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      liveContext = await buildLiveContext(supabase);
    } catch (e) {
      console.warn('[dev chat-api] Live context failed:', e);
    }
  }
  // En la terminal verás si el contexto tiene datos (proyectos/eventos) o está vacío
  console.log('[dev chat-api] liveContext length:', liveContext.length, liveContext ? '(con datos)' : '(vacío)');

  const systemPrompt = getSystemPrompt(liveContext);

  const contents = messages
    .filter((m) => m.role && m.text)
    .map((m) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: String(m.text).slice(0, 32000) }],
    }));

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      send(res, response.status, { error: 'Gemini request failed', details: errText });
      return;
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? 'No pude generar una respuesta.';
    send(res, 200, { text });
  } catch (err) {
    console.error('[dev chat-api]', err);
    send(res, 500, { error: 'Chat request failed' });
  }
});

server.listen(PORT, () => {
  console.log(`[dev] Chat API at http://localhost:${PORT}/api/chat/gemini (use with Vite proxy)`);
});
