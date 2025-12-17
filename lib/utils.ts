// Helper function to generate URL-friendly slug from project name
export const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

// Helper to normalize URLs - ensures they have a protocol
export const normalizeUrl = (url: string): string => {
  if (!url || url === '#') return '#';
  
  // If URL already has a protocol, return as is
  if (/^https?:\/\//i.test(url)) {
    return url;
  }
  
  // If URL starts with //, add https:
  if (url.startsWith('//')) {
    return `https:${url}`;
  }
  
  // Otherwise, add https://
  return `https://${url}`;
};
