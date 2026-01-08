-- ============================================
-- ADD MEDIA SUPPORT TO AGORA
-- ============================================
-- Este script agrega soporte para fotos, videos y links en el Ágora
-- Reglas de negocio:
-- - Máximo 1 video por post
-- - Máximo 4 fotos por post
-- - Si hay video, máximo 3 fotos adicionales
-- - Links opcionales

-- ============================================
-- 1. CREAR BUCKET DE STORAGE PARA MEDIA DEL ÁGORA
-- ============================================

-- Crear bucket si no existe
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'agora_media',
  'agora_media',
  true, -- Público para lectura
  20971520, -- 20 MB por archivo
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'video/mp4',
    'video/webm'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. POLÍTICAS DE STORAGE PARA AGORA_MEDIA
-- ============================================

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Public read access for agora media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload agora media" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own agora media" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own agora media" ON storage.objects;

-- Lectura pública de media del Ágora
CREATE POLICY "Public read access for agora media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'agora_media');

-- Usuarios autenticados pueden subir media
CREATE POLICY "Authenticated users can upload agora media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'agora_media');

-- Usuarios pueden actualizar su propia media
CREATE POLICY "Users can update own agora media"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'agora_media' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Usuarios pueden eliminar su propia media
CREATE POLICY "Users can delete own agora media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'agora_media' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================
-- 3. MODIFICAR TABLA AGORA_POSTS
-- ============================================

-- Agregar columnas para media
ALTER TABLE agora_posts
  ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS video_url TEXT,
  ADD COLUMN IF NOT EXISTS link_url TEXT;

-- ============================================
-- 4. AGREGAR CONSTRAINTS DE VALIDACIÓN
-- ============================================

-- Constraint: máximo 4 imágenes
ALTER TABLE agora_posts
  DROP CONSTRAINT IF EXISTS check_max_images;

ALTER TABLE agora_posts
  ADD CONSTRAINT check_max_images
  CHECK (array_length(image_urls, 1) IS NULL OR array_length(image_urls, 1) <= 4);

-- Constraint: si hay video, máximo 3 imágenes
ALTER TABLE agora_posts
  DROP CONSTRAINT IF EXISTS check_video_images_combo;

ALTER TABLE agora_posts
  ADD CONSTRAINT check_video_images_combo
  CHECK (
    video_url IS NULL OR 
    (array_length(image_urls, 1) IS NULL OR array_length(image_urls, 1) <= 3)
  );

-- ============================================
-- 5. ACTUALIZAR FUNCIÓN RPC get_agora_feed
-- ============================================

CREATE OR REPLACE FUNCTION get_agora_feed(limit_posts INTEGER DEFAULT 50)
RETURNS JSON
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
AS $$
DECLARE
  result JSON;
BEGIN
  WITH posts_data AS (
    SELECT 
      p.id,
      p.author_id,
      p.content,
      p.image_urls,
      p.video_url,
      p.link_url,
      p.created_at,
      p.updated_at
    FROM agora_posts p
    ORDER BY p.created_at DESC
    LIMIT limit_posts
  ),
  comments_data AS (
    SELECT 
      c.id,
      c.post_id,
      c.author_id,
      c.content,
      c.created_at
    FROM agora_comments c
    WHERE c.post_id IN (SELECT id FROM posts_data)
    ORDER BY c.created_at ASC
  ),
  all_author_ids AS (
    SELECT DISTINCT author_id FROM posts_data
    UNION
    SELECT DISTINCT author_id FROM comments_data
  ),
  profiles_data AS (
    SELECT 
      prof.id,
      prof.name,
      prof.username,
      prof.role,
      CASE 
        WHEN prof.avatar IS NOT NULL AND length(prof.avatar) < 1000 THEN prof.avatar
        WHEN lbp.avatar IS NOT NULL AND length(lbp.avatar) < 1000 THEN lbp.avatar
        ELSE NULL
      END as avatar
    FROM profiles prof
    LEFT JOIN link_bio_profiles lbp ON prof.id = lbp.user_id
    WHERE prof.id IN (SELECT author_id FROM all_author_ids)
  )
  SELECT json_build_object(
    'posts', (
      SELECT json_agg(
        json_build_object(
          'id', p.id,
          'author_id', p.author_id,
          'content', p.content,
          'image_urls', COALESCE(p.image_urls, ARRAY[]::TEXT[]),
          'video_url', p.video_url,
          'link_url', p.link_url,
          'created_at', p.created_at,
          'updated_at', p.updated_at,
          'author', (
            SELECT json_build_object(
              'id', pr.id,
              'name', pr.name,
              'username', pr.username,
              'avatar', pr.avatar,
              'role', pr.role
            )
            FROM profiles_data pr
            WHERE pr.id = p.author_id
            LIMIT 1
          ),
          'comments', (
            SELECT json_agg(
              json_build_object(
                'id', c.id,
                'author_id', c.author_id,
                'content', c.content,
                'created_at', c.created_at,
                'author', (
                  SELECT json_build_object(
                    'id', pr.id,
                    'name', pr.name,
                    'username', pr.username,
                    'avatar', pr.avatar,
                    'role', pr.role
                  )
                  FROM profiles_data pr
                  WHERE pr.id = c.author_id
                  LIMIT 1
                )
              )
              ORDER BY c.created_at ASC
            )
            FROM comments_data c
            WHERE c.post_id = p.id
          )
        )
        ORDER BY p.created_at DESC
      )
      FROM posts_data p
    )
  ) INTO result;
  
  RETURN COALESCE(result, '{"posts":[]}'::json);
END;
$$;

-- ============================================
-- COMENTARIOS
-- ============================================

COMMENT ON COLUMN agora_posts.image_urls IS 'Array de URLs de imágenes (máximo 4, o 3 si hay video)';
COMMENT ON COLUMN agora_posts.video_url IS 'URL del video (máximo 1 por post)';
COMMENT ON COLUMN agora_posts.link_url IS 'URL opcional de enlace externo';
