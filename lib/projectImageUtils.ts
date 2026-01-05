/**
 * Utilidades para manejo de imágenes de proyectos con Storage
 * Optimiza imágenes antes de subirlas y maneja la migración de base64 a Storage
 */

import { supabase } from './supabase';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_DIMENSION = 1920; // Máximo 1920px (Full HD)
const QUALITY = 0.85; // Calidad JPEG/WebP

/**
 * Optimiza una imagen antes de subirla
 * Redimensiona y comprime la imagen para reducir el tamaño
 */
export const optimizeProjectImage = (file: File): Promise<Blob> => {
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
 * Sube una imagen de proyecto a Storage y retorna la URL pública
 */
export const uploadProjectImageToStorage = async (
  authorId: string,
  projectId: string,
  file: File | Blob,
  imageIndex: number
): Promise<string> => {
  try {
    // Optimizar imagen si es un File
    const optimizedFile = file instanceof File 
      ? await optimizeProjectImage(file)
      : file;
    
    // Determinar extensión basada en el tipo MIME
    let ext = 'jpg';
    if (optimizedFile.type === 'image/webp') ext = 'webp';
    else if (optimizedFile.type === 'image/png') ext = 'png';
    
    const filePath = `${authorId}/${projectId}/image_${imageIndex}.${ext}`;
    
    // Subir imagen
    const { error: uploadError } = await supabase.storage
      .from('projects')
      .upload(filePath, optimizedFile, {
        cacheControl: '3600',
        upsert: true,
        contentType: optimizedFile.type || 'image/jpeg'
      });
    
    if (uploadError) {
      throw uploadError;
    }
    
    // Obtener URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('projects')
      .getPublicUrl(filePath);
    
    return publicUrl;
  } catch (error: any) {
    console.error('[projectImageUtils] Error al subir imagen de proyecto:', error);
    throw error;
  }
};

/**
 * Sube múltiples imágenes de proyecto a Storage
 * Retorna un array de URLs públicas
 */
export const uploadProjectImagesToStorage = async (
  authorId: string,
  projectId: string,
  images: (File | Blob | string)[]
): Promise<string[]> => {
  const uploadedUrls: string[] = [];
  
  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    
    // Si ya es una URL, mantenerla
    if (typeof image === 'string') {
      if (image.startsWith('http')) {
        uploadedUrls.push(image);
        continue;
      }
      
      // Si es base64, convertir a Blob y subir
      if (image.startsWith('data:image')) {
        try {
          const response = await fetch(image);
          const blob = await response.blob();
          const url = await uploadProjectImageToStorage(authorId, projectId, blob, i);
          uploadedUrls.push(url);
        } catch (error) {
          console.error(`[projectImageUtils] Error al subir imagen ${i}:`, error);
          // Si falla, mantener el base64 original
          uploadedUrls.push(image);
        }
      } else {
        uploadedUrls.push(image);
      }
    } else {
      // Es un File o Blob, subirlo directamente
      try {
        const url = await uploadProjectImageToStorage(authorId, projectId, image, i);
        uploadedUrls.push(url);
      } catch (error) {
        console.error(`[projectImageUtils] Error al subir imagen ${i}:`, error);
        // Si falla, intentar convertir a base64 como fallback
        if (image instanceof File) {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (reader.result) {
              uploadedUrls.push(reader.result as string);
            }
          };
          reader.readAsDataURL(image);
        }
      }
    }
  }
  
  return uploadedUrls;
};

/**
 * Elimina todas las imágenes de un proyecto de Storage
 */
export const deleteProjectImagesFromStorage = async (
  authorId: string,
  projectId: string
): Promise<void> => {
  try {
    const folderPath = `${authorId}/${projectId}`;
    
    // Listar todos los archivos en la carpeta del proyecto
    const { data: files, error: listError } = await supabase.storage
      .from('projects')
      .list(folderPath);
    
    if (listError) {
      throw listError;
    }
    
    if (files && files.length > 0) {
      const filesToDelete = files.map(f => `${folderPath}/${f.name}`);
      const { error: deleteError } = await supabase.storage
        .from('projects')
        .remove(filesToDelete);
      
      if (deleteError) {
        throw deleteError;
      }
    }
  } catch (error: any) {
    console.error('[projectImageUtils] Error al eliminar imágenes de proyecto:', error);
    throw error;
  }
};

/**
 * Convierte imágenes base64 a Storage si son muy grandes
 * Retorna un array con URLs de Storage o los base64 originales si son pequeños
 */
export const migrateProjectImagesToStorage = async (
  authorId: string,
  projectId: string,
  images: string[]
): Promise<string[]> => {
  const migratedImages: string[] = [];
  
  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    
    // Si ya es una URL, mantenerla
    if (image.startsWith('http')) {
      migratedImages.push(image);
      continue;
    }
    
    // Si es base64 pequeño, mantenerlo
    if (!image.startsWith('data:image') || image.length <= 500) {
      migratedImages.push(image);
      continue;
    }
    
    // Si es base64 grande, migrar a Storage
    try {
      const response = await fetch(image);
      const blob = await response.blob();
      const storageUrl = await uploadProjectImageToStorage(authorId, projectId, blob, i);
      migratedImages.push(storageUrl);
    } catch (error) {
      console.error(`[projectImageUtils] Error al migrar imagen ${i} a Storage:`, error);
      // Si falla, mantener el base64 original
      migratedImages.push(image);
    }
  }
  
  return migratedImages;
};

