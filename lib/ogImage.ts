import { SITE_ORIGIN } from './site';

export const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/logo.png`;

export const ogSafeImageUrl = (url?: string | null): string => {
  if (!url) {
    return DEFAULT_OG_IMAGE;
  }

  const lower = url.toLowerCase();
  if (lower.startsWith('data:')) {
    return DEFAULT_OG_IMAGE;
  }
  if (
    lower.includes('.svg') ||
    lower.includes('image/svg') ||
    lower.includes('dicebear.com')
  ) {
    return DEFAULT_OG_IMAGE;
  }
  if (!lower.startsWith('http://') && !lower.startsWith('https://')) {
    return DEFAULT_OG_IMAGE;
  }

  return url;
};
