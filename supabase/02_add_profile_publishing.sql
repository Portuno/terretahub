-- ============================================
-- MIGRACIÓN: Agregar campos de publicación
-- ============================================

-- Agregar campos para publicación personalizada
ALTER TABLE link_bio_profiles 
ADD COLUMN IF NOT EXISTS custom_slug TEXT,
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;

-- Crear índice único para custom_slug (solo para valores no nulos)
CREATE UNIQUE INDEX IF NOT EXISTS idx_link_bio_profiles_custom_slug_unique 
ON link_bio_profiles(custom_slug) 
WHERE custom_slug IS NOT NULL;

-- Crear índice para búsqueda por is_published
CREATE INDEX IF NOT EXISTS idx_link_bio_profiles_is_published 
ON link_bio_profiles(is_published);

-- Comentarios
COMMENT ON COLUMN link_bio_profiles.custom_slug IS 'Extensión personalizada para la URL del perfil (ej: www.terretahub.com/p/username/custom_slug)';
COMMENT ON COLUMN link_bio_profiles.is_published IS 'Indica si el perfil está publicado y accesible públicamente';

