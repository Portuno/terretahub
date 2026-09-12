export const SITE_ORIGIN = 'https://www.terretahub.com';
export const SITE_NAME = 'Terreta Hub';
export const SITE_CLAIM =
  'Terreta Hub es la red social de Valencia: perfil, gente y lo que pasa en la ciudad.';
export const SITE_DISAMBIGUATION =
  'Terreta Hub no está afiliada ni es la misma entidad que Terreta Business Hub S.L.';

export const SITE_SAME_AS = [
  'https://www.linkedin.com/company/terreta-hub',
  'https://x.com/TerretaHub',
] as const;

const APEX_ORIGIN = 'https://terretahub.com';

export const absoluteUrl = (path = '/'): string => {
  if (/^https?:\/\//i.test(path)) {
    return path.replace(APEX_ORIGIN, SITE_ORIGIN);
  }
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (normalized === '/') {
    return `${SITE_ORIGIN}/`;
  }
  return `${SITE_ORIGIN}${normalized}`;
};
