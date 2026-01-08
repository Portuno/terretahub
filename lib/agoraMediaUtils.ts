import { supabase } from './supabase';

/**
 * Valida la selección de archivos según las reglas del Ágora:
 * - Máximo 1 video
 * - Máximo 4 imágenes
 * - Si hay video, máximo 3 imágenes
 */
export const validateAgoraMedia = (files: File[]): { ok: boolean; error?: string } => {
  const imageFiles = files.filter(file => file.type.startsWith('image/'));
  const videoFiles = files.filter(file => file.type.startsWith('video/'));

  if (videoFiles.length > 1) {
    return { ok: false, error: 'Solo puedes subir un video por post.' };
  }

  if (imageFiles.length > 4) {
    return { ok: false, error: 'Máximo 4 imágenes por post.' };
  }

  if (videoFiles.length === 1 && imageFiles.length > 3) {
    return { ok: false, error: 'Si subes un video, solo puedes añadir hasta 3 imágenes adicionales.' };
  }

  // Validar tipos de archivo permitidos
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const allowedVideoTypes = ['video/mp4', 'video/webm'];

  for (const file of imageFiles) {
    if (!allowedImageTypes.includes(file.type)) {
      return { ok: false, error: `Tipo de imagen no permitido: ${file.type}. Solo se permiten JPEG, PNG y WebP.` };
    }
  }

  for (const file of videoFiles) {
    if (!allowedVideoTypes.includes(file.type)) {
      return { ok: false, error: `Tipo de video no permitido: ${file.type}. Solo se permiten MP4 y WebM.` };
    }
  }

  // Validar tamaño máximo (20 MB por archivo)
  const maxSize = 20 * 1024 * 1024; // 20 MB
  for (const file of files) {
    if (file.size > maxSize) {
      return { ok: false, error: `El archivo ${file.name} excede el tamaño máximo de 20 MB.` };
    }
  }

  return { ok: true };
};

/**
 * Optimiza una imagen para el Ágora (similar a proyectos pero con ajustes para feed)
 */
const optimizeAgoraImage = async (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxWidth = 1920; // Máximo ancho para imágenes del feed
        const maxHeight = 1920; // Máximo alto para imágenes del feed
        let width = img.width;
        let height = img.height;

        // Calcular nuevas dimensiones manteniendo aspect ratio
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = width * ratio;
          height = height * ratio;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo obtener contexto del canvas'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Error al convertir imagen a blob'));
            }
          },
          file.type === 'image/png' ? 'image/png' : 'image/jpeg',
          0.85 // Calidad 85% para balance entre tamaño y calidad
        );
      };
      img.onerror = () => reject(new Error('Error al cargar imagen'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Error al leer archivo'));
    reader.readAsDataURL(file);
  });
};

/**
 * Sube un archivo de media (imagen o video) al bucket agora_media
 */
const uploadAgoraMediaFile = async (
  userId: string,
  postId: string | null,
  file: File | Blob,
  fileIndex: number,
  isVideo: boolean
): Promise<string> => {
  try {
    // Optimizar imagen si es necesario
    const fileToUpload = isVideo || !(file instanceof File)
      ? file
      : await optimizeAgoraImage(file);

    // Determinar extensión
    let ext = 'jpg';
    if (fileToUpload instanceof File) {
      if (fileToUpload.type === 'image/webp') ext = 'webp';
      else if (fileToUpload.type === 'image/png') ext = 'png';
      else if (fileToUpload.type === 'video/mp4') ext = 'mp4';
      else if (fileToUpload.type === 'video/webm') ext = 'webm';
    } else {
      // Para Blobs, intentar inferir del tipo
      const type = fileToUpload.type || 'image/jpeg';
      if (type.includes('webp')) ext = 'webp';
      else if (type.includes('png')) ext = 'png';
      else if (type.includes('mp4')) ext = 'mp4';
      else if (type.includes('webm')) ext = 'webm';
    }

    const fileType = isVideo ? 'video' : 'image';
    const timestamp = Date.now();
    const filePath = `${userId}/${postId || 'temp'}/${timestamp}_${fileType}_${fileIndex}.${ext}`;

    // Subir archivo
    const { error: uploadError } = await supabase.storage
      .from('agora_media')
      .upload(filePath, fileToUpload, {
        cacheControl: '3600',
        upsert: false, // No sobrescribir archivos existentes
        contentType: fileToUpload instanceof File 
          ? fileToUpload.type 
          : (isVideo ? 'video/mp4' : 'image/jpeg')
      });

    if (uploadError) {
      throw uploadError;
    }

    // Obtener URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('agora_media')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error: any) {
    console.error('[agoraMediaUtils] Error al subir archivo:', error);
    throw error;
  }
};

/**
 * Sube múltiples archivos de media al bucket agora_media
 * Retorna las URLs organizadas por tipo (imágenes y video)
 */
export const uploadAgoraMedia = async (
  userId: string,
  files: File[],
  postId: string | null = null
): Promise<{ imageUrls: string[]; videoUrl: string | null }> => {
  try {
    // Separar imágenes y videos
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    const videoFiles = files.filter(file => file.type.startsWith('video/'));

    const imageUrls: string[] = [];
    let videoUrl: string | null = null;

    // Subir imágenes
    for (let i = 0; i < imageFiles.length; i++) {
      const url = await uploadAgoraMediaFile(userId, postId, imageFiles[i], i, false);
      imageUrls.push(url);
    }

    // Subir video (solo uno)
    if (videoFiles.length > 0) {
      videoUrl = await uploadAgoraMediaFile(userId, postId, videoFiles[0], 0, true);
    }

    return { imageUrls, videoUrl };
  } catch (error: any) {
    console.error('[agoraMediaUtils] Error al subir media:', error);
    throw error;
  }
};

/**
 * Valida y limpia una URL de enlace
 */
export const validateLinkUrl = (url: string): string | null => {
  if (!url || !url.trim()) {
    return null;
  }

  let cleanedUrl = url.trim();

  // Agregar https:// si no tiene protocolo
  if (!cleanedUrl.match(/^https?:\/\//i)) {
    cleanedUrl = `https://${cleanedUrl}`;
  }

  // Validación básica de URL
  try {
    new URL(cleanedUrl);
    return cleanedUrl;
  } catch {
    return null;
  }
};
