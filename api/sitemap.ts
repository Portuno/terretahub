import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { SITE_ORIGIN } from '../lib/site';
import { getProjectSlug } from '../lib/projectSlug';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) {
    return new Date().toISOString().split('T')[0];
  }
  return d.toISOString().split('T')[0];
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');

    const supabase = createClient(supabaseUrl, supabaseKey);
    const currentDate = formatDate(new Date());

    const [blogsResult, projectsResult, profilesResult, agoraResult, torreResult] = await Promise.all([
      supabase
        .from('blogs')
        .select('slug, author:profiles!blogs_author_id_fkey(username), updated_at')
        .eq('status', 'published')
        .order('updated_at', { ascending: false })
        .limit(1000),
      supabase
        .from('projects')
        .select('id, name, updated_at, archived_at')
        .eq('status', 'published')
        .order('updated_at', { ascending: false })
        .limit(1000),
      supabase
        .from('link_bio_profiles')
        .select('username, custom_slug, updated_at')
        .eq('is_published', true)
        .order('updated_at', { ascending: false })
        .limit(1000),
      supabase
        .from('agora_posts')
        .select('id, updated_at')
        .order('updated_at', { ascending: false })
        .limit(500),
      supabase
        .from('torre_seo_pages')
        .select('slug, updated_at')
        .eq('status', 'published')
        .order('updated_at', { ascending: false })
        .limit(1000),
    ]);

    type SitemapProject = {
      id: string;
      name?: string;
      updated_at?: string;
      archived_at?: string | null;
    };

    let projects: SitemapProject[] | null = (projectsResult.data as SitemapProject[] | null) || null;
    if (projectsResult.error && /archived_at/i.test(projectsResult.error.message || '')) {
      const retry = await supabase
        .from('projects')
        .select('id, name, updated_at')
        .eq('status', 'published')
        .order('updated_at', { ascending: false })
        .limit(1000);
      projects = (retry.data as SitemapProject[] | null) || null;
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

    blogsResult.data?.forEach((blog: { slug?: string; updated_at?: string; author?: { username?: string } | { username?: string }[] }) => {
      const author = Array.isArray(blog.author) ? blog.author[0] : blog.author;
      const username = author?.username;
      if (username && blog.slug) {
        xml += xmlUrl(`/blog/${username}/${blog.slug}`, formatDate(blog.updated_at || currentDate), 'weekly', '0.8');
      }
    });

    projects?.forEach((project: { id: string; name?: string; updated_at?: string; archived_at?: string | null }) => {
      if (project.archived_at) {
        return;
      }
      const slug = getProjectSlug(project.name || '', project.id);
      if (!slug || slug.endsWith('-')) {
        return;
      }
      xml += xmlUrl(`/proyecto/${slug}`, formatDate(project.updated_at || currentDate), 'weekly', '0.8');
    });

    profilesResult.data?.forEach((profile: { username?: string; custom_slug?: string; updated_at?: string }) => {
      const handle = profile.custom_slug || profile.username;
      if (handle) {
        xml += xmlUrl(`/p/${handle}`, formatDate(profile.updated_at || currentDate), 'weekly', '0.7');
      }
    });

    agoraResult.data?.forEach((post: { id: string; updated_at?: string }) => {
      if (post.id) {
        xml += xmlUrl(`/agora/post/${post.id}`, formatDate(post.updated_at || currentDate), 'daily', '0.6');
      }
    });

    torreResult.data?.forEach((page: { slug?: string; updated_at?: string }) => {
      if (page.slug) {
        xml += xmlUrl(
          `/biblioteca/torre-del-semas/p/${encodeURIComponent(page.slug)}`,
          formatDate(page.updated_at || currentDate),
          'weekly',
          '0.5'
        );
      }
    });

    xml += `</urlset>`;

    res.status(200).send(xml);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).json({ error: 'Error generating sitemap' });
  }
}
