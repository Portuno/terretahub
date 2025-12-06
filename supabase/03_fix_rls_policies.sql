-- ============================================
-- FIX: Verificar y corregir políticas RLS
-- ============================================

-- Verificar que las políticas existan y sean correctas
-- Si hay problemas, estas queries las recrearán

-- Eliminar políticas existentes si hay problemas
DROP POLICY IF EXISTS "Link bio profiles are viewable by everyone" ON link_bio_profiles;
DROP POLICY IF EXISTS "Users can manage own link bio profile" ON link_bio_profiles;

-- Recrear política de lectura pública (más permisiva para debugging)
CREATE POLICY "Link bio profiles are viewable by everyone"
  ON link_bio_profiles FOR SELECT
  USING (true);

-- Política para gestión propia
CREATE POLICY "Users can manage own link bio profile"
  ON link_bio_profiles FOR ALL
  USING (auth.uid() = user_id);

-- Verificar que RLS esté habilitado
ALTER TABLE link_bio_profiles ENABLE ROW LEVEL SECURITY;

-- Crear índice compuesto para mejorar performance de búsqueda
CREATE INDEX IF NOT EXISTS idx_link_bio_profiles_slug_published 
ON link_bio_profiles(custom_slug, is_published) 
WHERE custom_slug IS NOT NULL AND is_published = true;

