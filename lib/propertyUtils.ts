import { generateSlug } from './utils';

/**
 * Genera un slug estable para una propiedad a partir del título y el id.
 * Ejemplo: "Habitación luminosa" + "uuid" -> "habitacion-luminosa-abc12345"
 */
export const generatePropertySlug = (title: string, id: string): string => {
  const baseSlug = generateSlug(title || 'propiedad');
  const shortId = id.replace(/-/g, '').slice(0, 8) || 'propiedad';
  return `${baseSlug}-${shortId}`;
};

