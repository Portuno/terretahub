import { supabase } from './supabase';
import { generateSlug } from './utils';

/**
 * Genera un slug único para un blog basado en el título y username
 */
export const generateBlogSlug = (title: string, username: string): string => {
  const baseSlug = generateSlug(title);
  return `${username}-${baseSlug}`;
};

/**
 * Valida si un slug es único (opcionalmente excluyendo un blog específico)
 */
export const validateBlogSlug = async (
  slug: string,
  excludeId?: string
): Promise<boolean> => {
  try {
    let query = supabase
      .from('blogs')
      .select('id')
      .eq('slug', slug)
      .limit(1);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error validating blog slug:', error);
      return false;
    }

    return !data || data.length === 0;
  } catch (err) {
    console.error('Error validating blog slug:', err);
    return false;
  }
};

/**
 * Sube una imagen de card a Supabase Storage
 * Retorna el path relativo en el bucket
 */
export const uploadBlogCardImage = async (
  userId: string,
  blogId: string,
  file: File
): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `card-${Date.now()}.${fileExt}`;
  const filePath = `${userId}/${blogId}/card/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('blog-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (uploadError) {
    console.error('Error uploading blog card image:', uploadError);
    throw new Error('Error al subir la imagen de card');
  }

  return filePath;
};

/**
 * Sube una imagen de contenido a Supabase Storage
 * Retorna el path relativo en el bucket
 */
export const uploadBlogContentImage = async (
  userId: string,
  blogId: string,
  file: File
): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `content-${Date.now()}.${fileExt}`;
  const filePath = `${userId}/${blogId}/content/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('blog-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (uploadError) {
    console.error('Error uploading blog content image:', uploadError);
    throw new Error('Error al subir la imagen de contenido');
  }

  return filePath;
};

/**
 * Genera la URL pública desde un path del bucket
 */
export const getBlogImageUrl = (path: string): string => {
  const { data } = supabase.storage
    .from('blog-images')
    .getPublicUrl(path);

  return data.publicUrl;
};

/**
 * Trunca un texto a un máximo de caracteres
 */
export const truncateExcerpt = (text: string, maxLength: number = 140): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

/**
 * Valida un archivo de imagen
 */
export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  // Validar tipo MIME
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Solo se permiten imágenes en formato JPG, PNG o WEBP'
    };
  }

  // Validar tamaño (5MB máximo)
  const maxSize = 5 * 1024 * 1024; // 5MB en bytes
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'La imagen no puede ser mayor a 5MB'
    };
  }

  return { valid: true };
};

/**
 * Elimina una imagen del bucket
 */
export const deleteBlogImage = async (path: string): Promise<void> => {
  const { error } = await supabase.storage
    .from('blog-images')
    .remove([path]);

  if (error) {
    console.error('Error deleting blog image:', error);
    throw new Error('Error al eliminar la imagen');
  }
};
