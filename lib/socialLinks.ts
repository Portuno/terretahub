/**
 * Normaliza URLs de redes sociales para perfiles públicos (/p/:slug).
 * Los usuarios guardan username, path o URL completa de forma inconsistente.
 */

const MIN_WHATSAPP_DIGITS = 8;

/** Extrae dígitos de un teléfono / URL de WhatsApp. */
export function extractWhatsAppDigits(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const value = raw.trim();
  if (!value) return null;

  // wa.me / whatsapp.com/send / api.whatsapp.com
  try {
    const withProtocol = /^https?:\/\//i.test(value)
      ? value
      : value.startsWith('//')
        ? `https:${value}`
        : /^(?:wa\.me|api\.whatsapp\.com|www\.whatsapp\.com|whatsapp\.com)\b/i.test(value)
          ? `https://${value}`
          : null;

    if (withProtocol) {
      const url = new URL(withProtocol);
      const host = url.hostname.replace(/^www\./, '').toLowerCase();

      if (host === 'wa.me' || host === 'api.whatsapp.com' || host === 'whatsapp.com') {
        const phoneParam = url.searchParams.get('phone');
        if (phoneParam) {
          const digits = phoneParam.replace(/\D/g, '');
          return digits.length >= MIN_WHATSAPP_DIGITS ? digits : null;
        }
        // wa.me/34600111222 or wa.me/34600111222?text=...
        const pathDigits = url.pathname.replace(/\D/g, '');
        return pathDigits.length >= MIN_WHATSAPP_DIGITS ? pathDigits : null;
      }
    }
  } catch {
    // no es URL parseable; seguir con extracción de dígitos
  }

  const digits = value.replace(/\D/g, '');
  return digits.length >= MIN_WHATSAPP_DIGITS ? digits : null;
}

/**
 * Devuelve https://wa.me/<digits> o null si no hay número válido.
 * Nunca devuelve whatsapp.com / wa.me genéricos sin número.
 */
export function normalizeWhatsAppUrl(raw: string | null | undefined): string | null {
  const digits = extractWhatsAppDigits(raw);
  return digits ? `https://wa.me/${digits}` : null;
}

/**
 * Normaliza LinkedIn a https://www.linkedin.com/in/... (o /company/...) cuando aplica.
 * Acepta username, path, www.sin-protocolo, o URL completa.
 */
export function normalizeLinkedInUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let value = raw.trim();
  if (!value) return null;

  value = value.replace(/^@+/, '');

  // Protocolo relativo
  if (value.startsWith('//')) {
    value = `https:${value}`;
  }

  // Si parece host linkedin sin esquema
  if (/^(www\.)?linkedin\.com\b/i.test(value)) {
    value = `https://${value}`;
  }

  // URL completa
  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      const host = url.hostname.replace(/^www\./, '').toLowerCase();
      if (host !== 'linkedin.com') {
        // URL no-linkedin guardada por error: no forzar /in/
        return url.toString();
      }
      // Normalizar a https://www.linkedin.com + path (+ query si hay)
      const path = url.pathname.replace(/\/+$/, '') || '/';
      const search = url.search || '';
      return `https://www.linkedin.com${path}${search}`;
    } catch {
      return null;
    }
  }

  // Path tipo /in/foo o in/foo o /company/bar
  const pathMatch = value.match(/^\/?(in|company|school)\/[A-Za-z0-9._%-]+\/?/i);
  if (pathMatch) {
    const path = value.startsWith('/') ? value : `/${value}`;
    return `https://www.linkedin.com${path.replace(/\/+$/, '')}`;
  }

  // Username / slug suelto
  const slug = value
    .replace(/^\/+/, '')
    .replace(/\/+$/, '')
    .split(/[/?#]/)[0]
    .trim();
  if (!slug || /\s/.test(slug)) return null;

  return `https://www.linkedin.com/in/${encodeURIComponent(slug)}`;
}

/**
 * Si el avatar usa transforms/thumbnails de Supabase u otros CDNs,
 * intenta devolver la URL a resolución completa.
 */
export function getFullQualityAvatarUrl(avatar: string | null | undefined): string {
  if (!avatar) return '';
  try {
    const url = new URL(avatar);
    // Supabase render/image transforms: /storage/v1/render/image/public/...
    if (url.pathname.includes('/storage/v1/render/image/')) {
      url.pathname = url.pathname.replace(
        '/storage/v1/render/image/public/',
        '/storage/v1/object/public/'
      );
      // quitar params de tamaño
      ['width', 'height', 'quality', 'resize'].forEach((p) => url.searchParams.delete(p));
      return url.toString();
    }
    // Query params típicos de thumbnail
    ['width', 'height', 'w', 'h', 'q', 'quality', 'resize', 'fit'].forEach((p) =>
      url.searchParams.delete(p)
    );
    return url.toString();
  } catch {
    return avatar;
  }
}
