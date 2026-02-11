/**
 * Cliente para la Avatar API (avatares por elementos).
 * Usa VITE_AVATAR_API_URL si está definida; si no, las funciones no hacen peticiones.
 */

export type ElementSlug = 'tierra' | 'agua' | 'fuego' | 'aire';

const API_ELEMENT_TO_TERRETA: Record<string, ElementSlug> = {
  earth: 'tierra',
  water: 'agua',
  fire: 'fuego',
  air: 'aire',
};

export interface AvatarApiResponse {
  avatarUrl: string;
  element: string;
  styleId: string | null;
  styleName: string | null;
}

const getBaseUrl = (): string => {
  const url = typeof import.meta !== 'undefined' && import.meta.env?.VITE_AVATAR_API_URL;
  return typeof url === 'string' ? url.trim() : '';
};

/**
 * Obtiene la URL del avatar y el elemento asignado para un userId.
 * Si la API no está configurada, retorna null.
 */
export const fetchAvatarAndElement = async (
  userId: string
): Promise<{ avatarUrl: string; element: ElementSlug } | null> => {
  const base = getBaseUrl();
  if (!base || !userId) return null;

  try {
    const url = `${base.replace(/\/$/, '')}/avatar/${encodeURIComponent(userId)}`;
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) return null;
    const data = (await res.json()) as AvatarApiResponse;
    const elementSlug = API_ELEMENT_TO_TERRETA[data.element] ?? 'tierra';
    return {
      avatarUrl: data.avatarUrl ?? '',
      element: elementSlug,
    };
  } catch {
    return null;
  }
};

/**
 * Obtiene solo el elemento asignado para un userId.
 */
export const fetchElement = async (userId: string): Promise<ElementSlug | null> => {
  const base = getBaseUrl();
  if (!base || !userId) return null;

  try {
    const url = `${base.replace(/\/$/, '')}/element/${encodeURIComponent(userId)}`;
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) return null;
    const data = (await res.json()) as { element: string };
    return (API_ELEMENT_TO_TERRETA[data.element] ?? 'tierra') as ElementSlug;
  } catch {
    return null;
  }
};
