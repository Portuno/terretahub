import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Inlined (no local lib imports): Vercel ESM ("type":"module") fails to resolve
// extensionless ../lib/* at cold start → FUNCTION_INVOCATION_FAILED before handler.
const SITE_ORIGIN = 'https://www.terretahub.com';
const PROJECT_ID_SLUG_PREFIX = 'id-';

const generateSlug = (name: string): string =>
  name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const getProjectSlug = (name: string, id: string): string => {
  const fromName = generateSlug(name || '');
  return fromName || `${PROJECT_ID_SLUG_PREFIX}${id}`;
};

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const formatDate = (date: string | Date): string => {
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (Number.isNaN(d.getTime())) {
      return new Date().toISOString().split('T')[0];
    }
    return d.toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
};

const STATIC_URLS: Array<{ loc: string; priority: string; changefreq: string }> = [
  { loc: '/', priority: '1.0', changefreq: 'weekly' },
  { loc: '/agora', priority: '0.9', changefreq: 'daily' },
  { loc: '/comunidad', priority: '0.9', changefreq: 'daily' },
  { loc: '/miembros', priority: '0.9', changefreq: 'daily' },
  { loc: '/proyectos', priority: '0.9', changefreq: 'daily' },
  { loc: '/eventos', priority: '0.8', changefreq: 'weekly' },
  { loc: '/que-es-terreta-hub', priority: '0.9', changefreq: 'monthly' },
  { loc: '/faq', priority: '0.8', changefreq: 'monthly' },
  { loc: '/donde-networking-valencia', priority: '0.8', changefreq: 'monthly' },
  { loc: '/vibehack', priority: '0.7', changefreq: 'monthly' },
  { loc: '/comunidad-tech-valencia-2026', priority: '0.7', changefreq: 'monthly' },
  { loc: '/recursos-emprendedores-valencia', priority: '0.7', changefreq: 'monthly' },
  { loc: '/para-recien-llegados-valencia', priority: '0.7', changefreq: 'monthly' },
  { loc: '/mapa', priority: '0.8', changefreq: 'weekly' },
  { loc: '/directorio', priority: '0.9', changefreq: 'daily' },
  { loc: '/comunidades', priority: '0.8', changefreq: 'weekly' },
  { loc: '/para-la-terreta', priority: '0.7', changefreq: 'weekly' },
  { loc: '/recursos', priority: '0.8', changefreq: 'weekly' },
  { loc: '/blogs', priority: '0.8', changefreq: 'daily' },
  { loc: '/fallas2026', priority: '0.8', changefreq: 'weekly' },
  { loc: '/terris', priority: '0.6', changefreq: 'monthly' },
  { loc: '/biblioteca', priority: '0.6', changefreq: 'weekly' },
  { loc: '/biblioteca/torre-del-semas', priority: '0.5', changefreq: 'weekly' },
  { loc: '/biblioteca/torre-del-semas/que-es', priority: '0.5', changefreq: 'monthly' },
  { loc: '/unfinde', priority: '0.5', changefreq: 'monthly' },
  { loc: '/terminos-y-condiciones', priority: '0.3', changefreq: 'monthly' },
  { loc: '/politica-de-privacidad', priority: '0.3', changefreq: 'monthly' },
  { loc: '/docs', priority: '0.4', changefreq: 'monthly' },
];

const xmlUrl = (loc: string, lastmod: string, changefreq: string, priority: string): string => `  <url>
    <loc>${SITE_ORIGIN}${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>
`;

const buildStaticXml = (currentDate: string): string => {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
`;
  STATIC_URLS.forEach((url) => {
    xml += xmlUrl(url.loc, currentDate, url.changefreq, url.priority);
  });
  xml += `</urlset>`;
  return xml;
};

const sendXml = (res: VercelResponse, xml: string) => {
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.status(200).send(xml);
};

type QueryResult<T> = { data: T[] | null; error: { message?: string } | null };

async function safeQuery<T>(
  label: string,
  run: () => PromiseLike<QueryResult<T>>
): Promise<T[]> {
  try {
    const result = await run();
    if (result.error) {
      console.warn(`[sitemap] ${label} query error:`, result.error.message || result.error);
      return [];
    }
    return result.data || [];
  } catch (err) {
    console.warn(`[sitemap] ${label} query failed:`, err);
    return [];
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const currentDate = formatDate(new Date());

  try {
    if (!supabaseUrl || !supabaseKey) {
      console.warn('[sitemap] Missing SUPABASE_URL/KEY; returning static urlset only');
      sendXml(res, buildStaticXml(currentDate));
      return;
    }

    let supabase: SupabaseClient;
    try {
      supabase = createClient(supabaseUrl, supabaseKey);
    } catch (err) {
      console.warn('[sitemap] createClient failed; returning static urlset only', err);
      sendXml(res, buildStaticXml(currentDate));
      return;
    }

    const [
      blogs,
      projectsRaw,
      profiles,
      agora,
      torre,
      dirEntities,
      dirEvents,
    ] = await Promise.allSettled([
      safeQuery('blogs', () =>
        supabase
          .from('blogs')
          .select('slug, author:profiles!blogs_author_id_fkey(username), updated_at')
          .eq('status', 'published')
          .order('updated_at', { ascending: false })
          .limit(1000)
      ),
      safeQuery('projects', () =>
        supabase
          .from('projects')
          .select('id, name, updated_at, archived_at')
          .eq('status', 'published')
          .order('updated_at', { ascending: false })
          .limit(1000)
      ),
      safeQuery('profiles', () =>
        supabase
          .from('link_bio_profiles')
          .select('username, custom_slug, updated_at')
          .eq('is_published', true)
          .order('updated_at', { ascending: false })
          .limit(1000)
      ),
      safeQuery('agora', () =>
        supabase
          .from('agora_posts')
          .select('id, updated_at')
          .order('updated_at', { ascending: false })
          .limit(500)
      ),
      safeQuery('torre', () =>
        supabase
          .from('torre_seo_pages')
          .select('slug, updated_at')
          .eq('status', 'published')
          .order('updated_at', { ascending: false })
          .limit(1000)
      ),
      // Isolated: missing directory_* tables must never break the handler
      safeQuery('directory_entities', () =>
        supabase
          .from('directory_entities')
          .select('id, updated_at')
          .eq('visibility', 'published')
          .order('updated_at', { ascending: false })
          .limit(1000)
      ),
      safeQuery('directory_events', () =>
        supabase
          .from('directory_events')
          .select('id, updated_at')
          .eq('visibility', 'published')
          .order('updated_at', { ascending: false })
          .limit(500)
      ),
    ]);

    type SitemapProject = {
      id: string;
      name?: string;
      updated_at?: string;
      archived_at?: string | null;
    };

    let projects: SitemapProject[] =
      projectsRaw.status === 'fulfilled' ? (projectsRaw.value as SitemapProject[]) : [];

    // Retry without archived_at if the column is missing in live
    if (projects.length === 0) {
      try {
        const retry = await safeQuery<SitemapProject>('projects_no_archived', () =>
          supabase
            .from('projects')
            .select('id, name, updated_at')
            .eq('status', 'published')
            .order('updated_at', { ascending: false })
            .limit(1000)
        );
        if (retry.length > 0) {
          projects = retry;
        }
      } catch (err) {
        console.warn('[sitemap] projects retry failed:', err);
      }
    }

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
`;

    STATIC_URLS.forEach((url) => {
      xml += xmlUrl(url.loc, currentDate, url.changefreq, url.priority);
    });

    const blogsData =
      blogs.status === 'fulfilled'
        ? (blogs.value as Array<{
            slug?: string;
            updated_at?: string;
            author?: { username?: string } | { username?: string }[];
          }>)
        : [];
    blogsData.forEach((blog) => {
      try {
        const author = Array.isArray(blog.author) ? blog.author[0] : blog.author;
        const username = author?.username;
        if (username && blog.slug) {
          xml += xmlUrl(
            `/blog/${username}/${blog.slug}`,
            formatDate(blog.updated_at || currentDate),
            'weekly',
            '0.8'
          );
        }
      } catch (err) {
        console.warn('[sitemap] blog entry skipped:', err);
      }
    });

    projects.forEach((project) => {
      try {
        if (project.archived_at) {
          return;
        }
        const slug = getProjectSlug(project.name || '', project.id);
        if (!slug || slug.endsWith('-')) {
          return;
        }
        xml += xmlUrl(
          `/proyecto/${slug}`,
          formatDate(project.updated_at || currentDate),
          'weekly',
          '0.8'
        );
      } catch (err) {
        console.warn('[sitemap] project entry skipped (getProjectSlug):', err);
      }
    });

    const profilesData =
      profiles.status === 'fulfilled'
        ? (profiles.value as Array<{ username?: string; custom_slug?: string; updated_at?: string }>)
        : [];
    profilesData.forEach((profile) => {
      try {
        const handle = profile.custom_slug || profile.username;
        if (handle) {
          xml += xmlUrl(`/p/${handle}`, formatDate(profile.updated_at || currentDate), 'weekly', '0.7');
        }
      } catch (err) {
        console.warn('[sitemap] profile entry skipped:', err);
      }
    });

    const agoraData =
      agora.status === 'fulfilled' ? (agora.value as Array<{ id: string; updated_at?: string }>) : [];
    agoraData.forEach((post) => {
      try {
        if (post.id) {
          xml += xmlUrl(
            `/agora/post/${post.id}`,
            formatDate(post.updated_at || currentDate),
            'daily',
            '0.6'
          );
        }
      } catch (err) {
        console.warn('[sitemap] agora entry skipped:', err);
      }
    });

    const torreData =
      torre.status === 'fulfilled' ? (torre.value as Array<{ slug?: string; updated_at?: string }>) : [];
    torreData.forEach((page) => {
      try {
        if (page.slug) {
          xml += xmlUrl(
            `/biblioteca/torre-del-semas/p/${encodeURIComponent(page.slug)}`,
            formatDate(page.updated_at || currentDate),
            'weekly',
            '0.5'
          );
        }
      } catch (err) {
        console.warn('[sitemap] torre entry skipped:', err);
      }
    });

    const dirEntitiesData =
      dirEntities.status === 'fulfilled'
        ? (dirEntities.value as Array<{ id?: string; updated_at?: string }>)
        : [];
    dirEntitiesData.forEach((entity) => {
      try {
        if (entity.id) {
          xml += xmlUrl(
            `/directorio/${entity.id}`,
            formatDate(entity.updated_at || currentDate),
            'weekly',
            '0.7'
          );
        }
      } catch (err) {
        console.warn('[sitemap] directory entity skipped:', err);
      }
    });

    const dirEventsData =
      dirEvents.status === 'fulfilled'
        ? (dirEvents.value as Array<{ id?: string; updated_at?: string }>)
        : [];
    dirEventsData.forEach((event) => {
      try {
        if (event.id) {
          xml += xmlUrl(
            `/directorio/evento/${event.id}`,
            formatDate(event.updated_at || currentDate),
            'weekly',
            '0.6'
          );
        }
      } catch (err) {
        console.warn('[sitemap] directory event skipped:', err);
      }
    });

    xml += `</urlset>`;
    sendXml(res, xml);
  } catch (error) {
    console.error('[sitemap] Unexpected error; emitting static urlset:', error);
    try {
      sendXml(res, buildStaticXml(currentDate));
    } catch (fallbackError) {
      // Absolute last resort: still prefer XML over JSON 500
      console.error('[sitemap] Static fallback also failed:', fallbackError);
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.status(200).send(buildStaticXml(currentDate));
    }
  }
}
