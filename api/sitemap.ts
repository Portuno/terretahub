import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Obtener variables de entorno (en Vercel, las funciones serverless pueden usar múltiples nombres)
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

// Helper para generar slug
const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

// Formatear fecha para sitemap
const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    // Configurar headers XML
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');

    const supabase = createClient(supabaseUrl, supabaseKey);
    const baseUrl = 'https://terretahub.com';
    const currentDate = formatDate(new Date());

    // URLs estáticas
    const staticUrls = [
      { loc: '/', priority: '1.0', changefreq: 'weekly' },
      { loc: '/agora', priority: '0.9', changefreq: 'daily' },
      { loc: '/comunidad', priority: '0.9', changefreq: 'daily' },
      { loc: '/miembros', priority: '0.9', changefreq: 'daily' },
      { loc: '/proyectos', priority: '0.9', changefreq: 'daily' },
      { loc: '/recursos', priority: '0.8', changefreq: 'weekly' },
      { loc: '/eventos', priority: '0.8', changefreq: 'weekly' },
      { loc: '/blogs', priority: '0.9', changefreq: 'daily' },
      { loc: '/terminos-y-condiciones', priority: '0.3', changefreq: 'monthly' },
      { loc: '/politica-de-privacidad', priority: '0.3', changefreq: 'monthly' },
      { loc: '/docs', priority: '0.5', changefreq: 'monthly' },
      { loc: '/StartUpWeekend', priority: '0.8', changefreq: 'weekly' },
    ];

    // Cargar blogs publicados
    const { data: blogs } = await supabase
      .from('blogs')
      .select('slug, author:profiles!blogs_author_id_fkey(username), updated_at')
      .eq('status', 'published')
      .order('updated_at', { ascending: false })
      .limit(1000);

    // Cargar proyectos publicados
    const { data: projects } = await supabase
      .from('projects')
      .select('name, updated_at')
      .eq('status', 'published')
      .order('updated_at', { ascending: false })
      .limit(1000);

    // Cargar perfiles publicados
    const { data: profiles } = await supabase
      .from('link_bio_profiles')
      .select('username, custom_slug, updated_at')
      .eq('is_published', true)
      .order('updated_at', { ascending: false })
      .limit(1000);

    // Cargar posts del Ágora (últimos 500)
    const { data: agoraPosts } = await supabase
      .from('agora_posts')
      .select('id, updated_at')
      .order('updated_at', { ascending: false })
      .limit(500);

    // Generar XML
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
`;

    // Añadir URLs estáticas
    staticUrls.forEach(url => {
      xml += `  <url>
    <loc>${baseUrl}${url.loc}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>
`;
    });

    // Añadir blogs
    if (blogs) {
      blogs.forEach((blog: any) => {
        const username = blog.author?.username;
        if (username && blog.slug) {
          xml += `  <url>
    <loc>${baseUrl}/blog/${username}/${blog.slug}</loc>
    <lastmod>${formatDate(blog.updated_at)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
        }
      });
    }

    // Añadir proyectos
    if (projects) {
      projects.forEach((project: any) => {
        const slug = generateSlug(project.name);
        xml += `  <url>
    <loc>${baseUrl}/proyecto/${slug}</loc>
    <lastmod>${formatDate(project.updated_at)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
      });
    }

    // Añadir perfiles
    if (profiles) {
      profiles.forEach((profile: any) => {
        const handle = profile.custom_slug || profile.username;
        if (handle) {
          xml += `  <url>
    <loc>${baseUrl}/p/${handle}</loc>
    <lastmod>${formatDate(profile.updated_at)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
        }
      });
    }

    // Añadir posts del Ágora
    if (agoraPosts) {
      agoraPosts.forEach((post: any) => {
        xml += `  <url>
    <loc>${baseUrl}/agora/post/${post.id}</loc>
    <lastmod>${formatDate(post.updated_at)}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.6</priority>
  </url>
`;
      });
    }

    xml += `</urlset>`;

    res.status(200).send(xml);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).json({ error: 'Error generating sitemap' });
  }
}
