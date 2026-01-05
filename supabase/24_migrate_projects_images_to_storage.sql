-- ============================================
-- MIGRATE PROJECTS IMAGES TO STORAGE
-- ============================================
-- Este script crea un bucket de Storage para imágenes de proyectos y configura las políticas
-- Esto reduce significativamente el tamaño de las respuestas de la base de datos
-- Las imágenes se almacenarán como archivos en Storage en lugar de base64 en la DB
--
-- IMPORTANTE: Las imágenes base64 grandes en el campo images (JSON array) están causando
-- payloads enormes (5+ MB). Este script prepara el sistema para migrar a Storage.

-- ============================================
-- 1. CREAR BUCKET DE PROYECTOS
-- ============================================

-- Crear bucket para imágenes de proyectos (público para acceso directo)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'projects', 
  'projects', 
  true,  -- Público para acceso directo
  5242880,  -- 5MB máximo por archivo (imágenes de proyectos pueden ser más grandes)
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
SET 
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- ============================================
-- 2. POLÍTICAS DE STORAGE PARA PROYECTOS
-- ============================================

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Public can view project images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own project images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own project images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own project images" ON storage.objects;

-- Permitir lectura pública de imágenes de proyectos
CREATE POLICY "Public can view project images"
ON storage.objects FOR SELECT
USING (bucket_id = 'projects');

-- Permitir a usuarios autenticados subir imágenes de sus propios proyectos
-- Estructura: author_id/project_id/image_1.jpg
CREATE POLICY "Users can upload their own project images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'projects' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir a usuarios actualizar imágenes de sus propios proyectos
CREATE POLICY "Users can update their own project images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'projects' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir a usuarios eliminar imágenes de sus propios proyectos
CREATE POLICY "Users can delete their own project images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'projects' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================
-- 3. FUNCIÓN PARA LIMPIAR IMÁGENES BASE64 GRANDES
-- ============================================
-- Esta función reemplaza imágenes base64 grandes en el array images con placeholders
-- Útil para limpiar datos existentes sin migración inmediata

CREATE OR REPLACE FUNCTION clean_large_base64_project_images()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count INTEGER := 0;
  project_record RECORD;
  cleaned_images TEXT[];
  image_item TEXT;
  has_large_images BOOLEAN;
BEGIN
  -- Iterar sobre todos los proyectos que tienen imágenes
  FOR project_record IN 
    SELECT id, images, author_id
    FROM projects
    WHERE images IS NOT NULL 
      AND jsonb_array_length(images::jsonb) > 0
  LOOP
    cleaned_images := ARRAY[]::TEXT[];
    has_large_images := false;
    
    -- Procesar cada imagen en el array
    FOR image_item IN 
      SELECT jsonb_array_elements_text(project_record.images::jsonb)
    LOOP
      -- Si la imagen es base64 grande, reemplazarla con placeholder
      IF image_item IS NOT NULL 
         AND length(image_item) > 500 
         AND image_item LIKE 'data:image%' THEN
        -- Reemplazar con placeholder (puedes usar una URL de placeholder o eliminar)
        cleaned_images := array_append(cleaned_images, 'https://via.placeholder.com/800x600?text=Image+Too+Large');
        has_large_images := true;
      ELSE
        -- Mantener la imagen si es pequeña o ya es una URL
        cleaned_images := array_append(cleaned_images, image_item);
      END IF;
    END LOOP;
    
    -- Actualizar el proyecto si tenía imágenes grandes
    IF has_large_images THEN
      UPDATE projects
      SET images = cleaned_images::jsonb
      WHERE id = project_record.id;
      
      updated_count := updated_count + 1;
    END IF;
  END LOOP;
  
  RETURN updated_count;
END;
$$;

-- ============================================
-- 4. FUNCIÓN PARA FILTRAR IMÁGENES BASE64 EN QUERIES
-- ============================================
-- Esta función procesa el array de imágenes y filtra las base64 grandes
-- Retorna solo URLs o imágenes pequeñas

CREATE OR REPLACE FUNCTION filter_large_base64_images(images_json JSONB)
RETURNS JSONB
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  filtered_images JSONB := '[]'::jsonb;
  image_item TEXT;
BEGIN
  -- Si no hay imágenes, retornar array vacío
  IF images_json IS NULL OR jsonb_array_length(images_json) = 0 THEN
    RETURN '[]'::jsonb;
  END IF;
  
  -- Procesar cada imagen
  FOR image_item IN 
    SELECT jsonb_array_elements_text(images_json)
  LOOP
    -- Solo incluir si es URL o base64 pequeño
    IF image_item IS NOT NULL AND (
      -- Es una URL (http/https)
      image_item LIKE 'http%' OR
      -- Es base64 pequeño
      (image_item LIKE 'data:image%' AND length(image_item) <= 500)
    ) THEN
      filtered_images := filtered_images || jsonb_build_array(image_item);
    END IF;
  END LOOP;
  
  RETURN filtered_images;
END;
$$;

-- ============================================
-- 5. ACTUALIZAR FUNCIÓN get_projects_with_authors
-- ============================================
-- Filtrar imágenes base64 grandes para reducir payload

DROP FUNCTION IF EXISTS get_projects_with_authors(INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION get_projects_with_authors(
  limit_count INTEGER DEFAULT 100,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  author_id UUID,
  name TEXT,
  slogan TEXT,
  description TEXT,
  images JSONB,
  video_url TEXT,
  website TEXT,
  categories TEXT[],
  technologies TEXT[],
  phase TEXT,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  author_name TEXT,
  author_username TEXT,
  author_avatar TEXT
) 
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.author_id,
    p.name,
    p.slogan,
    p.description,
    -- Filtrar imágenes base64 grandes
    filter_large_base64_images(p.images::jsonb) as images,
    p.video_url,
    p.website,
    p.categories,
    p.technologies,
    p.phase,
    p.status,
    p.created_at,
    p.updated_at,
    COALESCE(prof.name, 'Usuario') as author_name,
    COALESCE(prof.username, 'usuario') as author_username,
    -- Filtrar avatar base64 grande
    CASE 
      WHEN prof.avatar IS NOT NULL AND length(prof.avatar) > 500 AND prof.avatar LIKE 'data:image%' THEN
        format('https://api.dicebear.com/7.x/avataaars/svg?seed=%s', COALESCE(prof.username, 'user'))
      ELSE COALESCE(prof.avatar, format('https://api.dicebear.com/7.x/avataaars/svg?seed=%s', COALESCE(prof.username, 'user')))
    END as author_avatar
  FROM projects p
  LEFT JOIN profiles prof ON p.author_id = prof.id
  WHERE p.status = 'published'
  ORDER BY p.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;

-- ============================================
-- 6. COMENTARIOS
-- ============================================

COMMENT ON FUNCTION clean_large_base64_project_images IS 'Limpia imágenes base64 grandes del campo images en proyectos. Reemplaza con placeholders para reducir payload.';
COMMENT ON FUNCTION filter_large_base64_images IS 'Filtra imágenes base64 grandes de un array JSONB. Retorna solo URLs o base64 pequeños.';
COMMENT ON FUNCTION get_projects_with_authors IS 'Obtiene proyectos con información del autor. Filtra imágenes base64 grandes para reducir payload significativamente.';

-- ============================================
-- 7. NOTAS IMPORTANTES
-- ============================================
-- 
-- Para migrar las imágenes existentes a Storage, necesitarás:
-- 1. Ejecutar este script SQL
-- 2. Crear una función en el frontend/backend que:
--    - Lea las imágenes base64 de cada proyecto
--    - Convierta base64 a Blob
--    - Suba cada imagen a Storage en: {author_id}/{project_id}/{image_index}.jpg
--    - Actualice el campo images con las URLs de Storage
-- 
-- Ejemplo de estructura en Storage:
-- projects/
--   {author_id}/
--     {project_id}/
--       image_0.jpg
--       image_1.jpg
--       image_2.jpg
--
-- Ejemplo de URL pública:
-- https://{project_ref}.supabase.co/storage/v1/object/public/projects/{author_id}/{project_id}/image_0.jpg

