-- ============================================
-- MIGRACIÓN: Agregar campos de publicación
-- ============================================

-- Agregar campos para publicación personalizada
ALTER TABLE link_bio_profiles 
ADD COLUMN IF NOT EXISTS custom_slug TEXT,
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;

-- Eliminar índice único antiguo si existe (puede que no exista)
DROP INDEX IF EXISTS idx_link_bio_profiles_custom_slug;

-- Crear índice único para custom_slug (solo para valores no nulos)
-- Esto permite múltiples NULL pero valores únicos no nulos
CREATE UNIQUE INDEX IF NOT EXISTS idx_link_bio_profiles_custom_slug_unique 
ON link_bio_profiles(custom_slug) 
WHERE custom_slug IS NOT NULL;

-- Crear índice para búsqueda por is_published
CREATE INDEX IF NOT EXISTS idx_link_bio_profiles_is_published 
ON link_bio_profiles(is_published);

-- Actualizar la restricción UNIQUE de la tabla si es necesario
-- Nota: Si la tabla ya tiene UNIQUE(custom_slug) en la definición, esto puede fallar
-- En ese caso, ejecuta manualmente: ALTER TABLE link_bio_profiles DROP CONSTRAINT IF EXISTS link_bio_profiles_custom_slug_key;

-- Comentarios
COMMENT ON COLUMN link_bio_profiles.custom_slug IS 'Extensión personalizada para la URL del perfil (ej: www.terretahub.com/p/username/custom_slug)';
COMMENT ON COLUMN link_bio_profiles.is_published IS 'Indica si el perfil está publicado y accesible públicamente';

