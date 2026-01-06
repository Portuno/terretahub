import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Detectar si es un bot de redes sociales
const isBot = (userAgent: string | undefined): boolean => {
  if (!userAgent) return false;
  const botPatterns = [
    'facebookexternalhit',
    'Twitterbot',
    'LinkedInBot',
    'WhatsApp',
    'TelegramBot',
    'Slackbot',
    'DiscordBot',
    'SkypeUriPreview',
    'Googlebot',
    'bingbot',
    'Slurp',
    'DuckDuckBot',
    'Baiduspider',
    'YandexBot',
    'Sogou',
    'Exabot',
    'facebot',
    'ia_archiver'
  ];
  return botPatterns.some(pattern => 
    userAgent.toLowerCase().includes(pattern.toLowerCase())
  );
};

// Obtener URL pública del avatar
const getPublicAvatarUrl = (avatar: string | null | undefined, userId: string | null, supabaseUrl: string): string => {
  if (!avatar) {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId || 'user'}`;
  }

  // Si es base64, no es útil para Open Graph
  if (avatar.startsWith('data:image')) {
    // Intentar obtener de Storage si tenemos userId
    if (userId && supabaseUrl) {
      const projectRef = supabaseUrl.split('//')[1]?.split('.')[0] || '';
      return `https://${projectRef}.supabase.co/storage/v1/object/public/avatars/${userId}/avatar.jpg`;
    }
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId || 'user'}`;
  }

  // Si es una URL válida, usarla directamente
  if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
    return avatar;
  }

  // Si es una ruta relativa, construir URL de Storage
  if (userId && supabaseUrl) {
    const projectRef = supabaseUrl.split('//')[1]?.split('.')[0] || '';
    return `https://${projectRef}.supabase.co/storage/v1/object/public/avatars/${userId}/avatar.jpg`;
  }

  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId || 'user'}`;
};

// Generar HTML con meta tags
const generateHTML = (
  title: string,
  description: string,
  image: string,
  url: string
): string => {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  
  <!-- Primary Meta Tags -->
  <title>${escapeHtml(title)}</title>
  <meta name="title" content="${escapeHtml(title)}" />
  <meta name="description" content="${escapeHtml(description)}" />
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="profile" />
  <meta property="og:url" content="${escapeHtml(url)}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${escapeHtml(image)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="1200" />
  <meta property="og:image:type" content="image/png" />
  <meta property="og:image:secure_url" content="${escapeHtml(image)}" />
  <meta property="og:site_name" content="Terreta Hub" />
  <meta property="og:locale" content="es_ES" />
  <!-- Facebook App ID (opcional pero recomendado) -->
  <!-- Si tienes una Facebook App, agrega: <meta property="fb:app_id" content="TU_APP_ID" /> -->
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="${escapeHtml(url)}" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(image)}" />
  
</head>
<body>
  <div id="root"></div>
  <!-- No scripts needed for bots - they don't execute JavaScript -->
</body>
</html>`;
};

const escapeHtml = (text: string): string => {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // LOG INICIAL - SIEMPRE debe aparecer
  console.log('=== API FUNCTION CALLED ===');
  console.log('Extension:', req.query.extension);
  console.log('User-Agent:', req.headers['user-agent']);
  console.log('Host:', req.headers.host);
  console.log('URL:', req.url);
  
  const { extension } = req.query;
  const userAgent = req.headers['user-agent'] || '';
  const isBotRequest = isBot(userAgent);
  
  console.log('Is Bot:', isBotRequest);
  
  // Obtener variables de entorno (en Vercel, las funciones serverless usan process.env directamente)
  // Intentar múltiples nombres de variables por compatibilidad
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
  
  console.log('Supabase URL configured:', !!supabaseUrl, supabaseUrl ? 'YES' : 'NO');
  console.log('Supabase Key configured:', !!supabaseKey, supabaseKey ? 'YES' : 'NO');
  console.log('Available env vars:', Object.keys(process.env).filter(k => k.includes('SUPABASE')));
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('ERROR: Supabase configuration missing!');
    const host = req.headers.host || 'terretahub.com';
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const currentUrl = `${protocol}://${host}/p/${extension}`;
    
    res.status(200);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(generateHTML(
      'Terreta Hub | Red Social Valenciana',
      'Bienvenido al Epicentre de Terreta Hub.',
      'https://terretahub.com/logo.png',
      currentUrl
    ));
  }

  // Si no es un bot, esta función NO debería ejecutarse porque el rewrite
  // en vercel.json solo debería activarse para bots
  // Pero por seguridad, si llega aquí un usuario normal, devolver 404
  // para que Vercel use el rewrite catch-all que sirve el index.html
  if (!isBotRequest) {
    console.log('Not a bot - this should not happen, returning 404 to trigger fallback');
    res.status(404);
    return res.end();
  }

  // Es un bot - generar meta tags dinámicos
  console.log('Bot detected, fetching profile data...');
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const customSlugLower = (extension as string)?.toLowerCase() || '';

    console.log('Searching for profile with extension:', customSlugLower);

    // Buscar perfil por custom_slug o username
    let profileData = null;

    // Intentar por custom_slug primero
    const { data: bySlug, error: slugError } = await supabase
      .from('link_bio_profiles')
      .select('user_id, username, display_name, bio, avatar, is_published')
      .eq('custom_slug', customSlugLower)
      .eq('is_published', true)
      .maybeSingle();

    console.log('Query by slug result:', { found: !!bySlug, error: slugError?.message });

    if (bySlug) {
      profileData = bySlug;
    } else {
      // Intentar por username
      const { data: byUsername, error: usernameError } = await supabase
        .from('link_bio_profiles')
        .select('user_id, username, display_name, bio, avatar, is_published')
        .eq('username', customSlugLower)
        .eq('is_published', true)
        .maybeSingle();

      console.log('Query by username result:', { found: !!byUsername, error: usernameError?.message });

      if (byUsername) {
        profileData = byUsername;
      }
    }

    // Obtener la URL completa del request
    const host = req.headers.host || 'terretahub.com';
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const currentUrl = `${protocol}://${host}/p/${extension}`;

    if (!profileData) {
      console.log('Profile not found, using defaults');
      const defaultTitle = 'Terreta Hub | Red Social Valenciana';
      const defaultDescription = 'Bienvenido al Epicentre de Terreta Hub. Reserva tu link personalizado, proyecta tus ideas en nuestro laboratorio digital y forma parte de la vanguardia valenciana.';
      const defaultImage = 'https://terretahub.com/logo.png';
      
      res.status(200);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(generateHTML(defaultTitle, defaultDescription, defaultImage, currentUrl));
    }

    console.log('Profile found:', {
      username: profileData.username,
      displayName: profileData.display_name,
      hasAvatar: !!profileData.avatar
    });

    // Construir datos del perfil
    const profileTitle = `${profileData.display_name || profileData.username} | Terreta Hub`;
    const profileDescription = profileData.bio 
      ? profileData.bio.substring(0, 160)
      : `Perfil de ${profileData.display_name || profileData.username} en Terreta Hub`;
    const avatarUrl = getPublicAvatarUrl(profileData.avatar, profileData.user_id, supabaseUrl);

    console.log('Generated meta tags:', {
      title: profileTitle,
      description: profileDescription.substring(0, 50),
      image: avatarUrl,
      url: currentUrl
    });

    // Generar HTML con meta tags
    const html = generateHTML(profileTitle, profileDescription, avatarUrl, currentUrl);
    
    res.status(200);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    
    console.log('Sending HTML response to bot');
    return res.send(html);

  } catch (error: any) {
    console.error('ERROR in handler:', error);
    console.error('Error stack:', error.stack);
    
    // En caso de error, usar defaults
    const host = req.headers.host || 'terretahub.com';
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const currentUrl = `${protocol}://${host}/p/${extension}`;
    
    const defaultTitle = 'Terreta Hub | Red Social Valenciana';
    const defaultDescription = 'Bienvenido al Epicentre de Terreta Hub. Reserva tu link personalizado, proyecta tus ideas en nuestro laboratorio digital y forma parte de la vanguardia valenciana.';
    const defaultImage = 'https://terretahub.com/logo.png';
    
    res.status(200);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(generateHTML(defaultTitle, defaultDescription, defaultImage, currentUrl));
  }
}
