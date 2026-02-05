/**
 * Utilidades para manejo de imágenes de propiedades con Storage
 * Inspirado en projectImageUtils, pero usando el bucket `properties`
 */

import { supabase } from './supabase';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB (por si necesitas validaciones futuras)
const MAX_DIMENSION = 1920; // Máximo 1920px (Full HD)
const QUALITY = 0.85; // Calidad JPEG/WebP

/**
 * Optimiza una imagen antes de subirla
 * Redimensiona y comprime la imagen para reducir el tamaño
 */
export const optimizePropertyImage = (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calcular nuevas dimensiones manteniendo aspect ratio
        if (width > height) {
          if (width > MAX_DIMENSION) {
            height = (height * MAX_DIMENSION) / width;
            width = MAX_DIMENSION;
          }
        } else {
          if (height > MAX_DIMENSION) {
            width = (width * MAX_DIMENSION) / height;
            height = MAX_DIMENSION;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo obtener contexto del canvas'));
          return;
        }

        // Dibujar imagen redimensionada
        ctx.drawImage(img, 0, 0, width, height);

        // Convertir a Blob con compresión
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Error al convertir imagen a Blob'));
            }
          },
          'image/jpeg',
          QUALITY
        );
      };

      img.onerror = () => {
        reject(new Error('Error al cargar la imagen'));
      };

      if (e.target?.result) {
        img.src = e.target.result as string;
      }
    };

    reader.onerror = () => {
      reject(new Error('Error al leer el archivo'));
    };

    reader.readAsDataURL(file);
  });
};

/**
 * Sube una imagen de propiedad a Storage y retorna la URL pública
 */
export const uploadPropertyImageToStorage = async (
  ownerId: string,
  propertyId: string,
  file: File | Blob,
  imageIndex: number
): Promise<string> => {
  try {
    // Optimizar imagen si es un File
    const optimizedFile = file instanceof File
      ? await optimizePropertyImage(file)
      : file;

    // Determinar extensión basada en el tipo MIME
    let ext = 'jpg';
    if (optimizedFile.type === 'image/webp') ext = 'webp';
    else if (optimizedFile.type === 'image/png') ext = 'png';

    const filePath = `${ownerId}/${propertyId}/image_${imageIndex}.${ext}`;

    // Subir imagen al bucket `properties`
    const { error: uploadError } = await supabase.storage
      .from('properties')
      .upload(filePath, optimizedFile, {
        cacheControl: '3600',
        upsert: true,
        contentType: optimizedFile.type || 'image/jpeg',
      });

    if (uploadError) {
      throw uploadError;
    }

    // Obtener URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('properties')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error: any) {
    console.error('[propertyImageUtils] Error al subir imagen de propiedad:', error);
    throw error;
  }
};

/**
 * Sube múltiples imágenes de propiedad a Storage
 * Acepta mezcla de File/Blob y strings (URLs/base64) y devuelve siempre URLs finales
 */
export const uploadPropertyImagesToStorage = async (
  ownerId: string,
  propertyId: string,
  images: (File | Blob | string)[]
): Promise<string[]> => {
  const uploadedUrls: string[] = [];

  for (let i = 0; i < images.length; i++) {
    const image = images[i];

    // Si ya es una URL http(s), la mantenemos
    if (typeof image === 'string') {
      if (image.startsWith('http')) {
        uploadedUrls.push(image);
        continue;
      }

      // Si es base64 data URL, convertir a Blob y subir
      if (image.startsWith('data:image')) {
        try {
          const response = await fetch(image);
          const blob = await response.blob();
          const url = await uploadPropertyImageToStorage(ownerId, propertyId, blob, i);
          uploadedUrls.push(url);
        } catch (error) {
          console.error(`[propertyImageUtils] Error al subir imagen base64 ${i}:`, error);
          // Si falla, mantenemos el base64 original como fallback
          uploadedUrls.push(image);
        }
      } else {
        // Otro string (por ejemplo, path relativo) lo devolvemos tal cual
        uploadedUrls.push(image);
      }
    } else {
      // Es un File o Blob, subir directamente
      try {
        const url = await uploadPropertyImageToStorage(ownerId, propertyId, image, i);
        uploadedUrls.push(url);
      } catch (error) {
        console.error(`[propertyImageUtils] Error al subir imagen ${i}:`, error);
        // Fallback: intentar convertir File a base64 para al menos guardar algo
        if (image instanceof File) {
          const reader = new FileReader();
          const base64Promise = new Promise<string>((resolve) => {
            reader.onloadend = () => {
              if (reader.result) {
                resolve(reader.result as string);
              } else {
                resolve('');
              }
            };
          });
          reader.readAsDataURL(image);
          const base64 = await base64Promise;
          if (base64) {
            uploadedUrls.push(base64);
          }
        }
      }
    }
  }

  return uploadedUrls;
};

/**
 * Elimina todas las imágenes de una propiedad de Storage
 */
export const deletePropertyImagesFromStorage = async (
  ownerId: string,
  propertyId: string
): Promise<void> => {
  try {
    const folderPath = `${ownerId}/${propertyId}`;

    const { data: files, error: listError } = await supabase.storage
      .from('properties')
      .list(folderPath);

    if (listError) {
      throw listError;
    }

    if (files && files.length > 0) {
      const filesToDelete = files.map((f) => `${folderPath}/${f.name}`);
      const { error: deleteError } = await supabase.storage
        .from('properties')
        .remove(filesToDelete);

      if (deleteError) {
        throw deleteError;
      }
    }
  } catch (error: any) {
    console.error('[propertyImageUtils] Error al eliminar imágenes de propiedad:', error);
    throw error;
  }
};

