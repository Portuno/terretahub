export const PROJECT_ID_SLUG_PREFIX = 'id-';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const getProjectSlug = (name: string, id: string): string => {
  const fromName = generateSlug(name || '');
  return fromName || `${PROJECT_ID_SLUG_PREFIX}${id}`;
};

export const parseProjectIdFromSlug = (slug: string): string | null => {
  if (!slug) {
    return null;
  }
  if (slug.startsWith(PROJECT_ID_SLUG_PREFIX)) {
    return slug.slice(PROJECT_ID_SLUG_PREFIX.length) || null;
  }
  if (UUID_RE.test(slug)) {
    return slug;
  }
  return null;
};

export const projectMatchesSlug = (name: string, id: string, slug: string): boolean => {
  return getProjectSlug(name, id) === slug || id === slug;
};

export const projectPublicPath = (name: string, id: string): string =>
  `/proyecto/${getProjectSlug(name, id)}`;
