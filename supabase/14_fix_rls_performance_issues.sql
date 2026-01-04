-- ============================================
-- FIX RLS PERFORMANCE ISSUES
-- ============================================
-- Este script corrige todos los problemas de rendimiento detectados por el linter:
-- 1. auth_rls_initplan: Usar (select auth.uid()) en lugar de auth.uid()
-- 2. multiple_permissive_policies: Combinar políticas permisivas múltiples en una sola
-- Basado en: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

-- ============================================
-- 1. FIX PROJECTS VISIBILITY POLICY (auth_rls_initplan)
-- ============================================

-- La política "Projects visibility policy" debe usar (select auth.uid()) en lugar de auth.uid()
DROP POLICY IF EXISTS "Projects visibility policy" ON projects;

CREATE POLICY "Projects visibility policy"
  ON projects FOR SELECT
  USING (
    status = 'published' 
    OR (select auth.uid()) = author_id 
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

-- ============================================
-- 2. FIX LINK_BIO_PROFILES MULTIPLE PERMISSIVE POLICIES
-- ============================================

-- El problema: "Users can manage own link bio profile" está definida como FOR ALL
-- que incluye SELECT, pero ya existe "Link bio profiles are viewable by everyone" para SELECT
-- Solución: Cambiar "Users can manage own link bio profile" a solo INSERT, UPDATE, DELETE

DROP POLICY IF EXISTS "Users can manage own link bio profile" ON link_bio_profiles;

-- Asegurarse de que la política de SELECT público existe
DROP POLICY IF EXISTS "Link bio profiles are viewable by everyone" ON link_bio_profiles;
CREATE POLICY "Link bio profiles are viewable by everyone"
  ON link_bio_profiles FOR SELECT
  USING (true);

-- Política solo para INSERT, UPDATE, DELETE (no SELECT)
CREATE POLICY "Users can manage own link bio profile"
  ON link_bio_profiles FOR INSERT, UPDATE, DELETE
  USING ((select auth.uid()) = user_id);

-- ============================================
-- 3. FIX AGORA_POSTS MULTIPLE PERMISSIVE POLICIES (DELETE)
-- ============================================

-- El problema: Hay dos políticas permisivas para DELETE:
-- - "Users can delete own posts"
-- - "Admins can delete any post"
-- Solución: Combinarlas en una sola política

DROP POLICY IF EXISTS "Users can delete own posts" ON agora_posts;
DROP POLICY IF EXISTS "Admins can delete any post" ON agora_posts;
DROP POLICY IF EXISTS "Users and admins can delete posts" ON agora_posts;

CREATE POLICY "Users and admins can delete posts"
  ON agora_posts FOR DELETE
  USING (
    (select auth.uid()) = author_id
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

-- ============================================
-- 4. FIX PROJECTS MULTIPLE PERMISSIVE POLICIES (UPDATE)
-- ============================================

-- El problema: Hay dos políticas permisivas para UPDATE:
-- - "Users can update own projects"
-- - "Admins can update any project"
-- Solución: Combinarlas en una sola política (si no existe ya)

DROP POLICY IF EXISTS "Users can update own projects" ON projects;
DROP POLICY IF EXISTS "Admins can update any project" ON projects;
DROP POLICY IF EXISTS "Users and admins can update projects" ON projects;

CREATE POLICY "Users and admins can update projects"
  ON projects FOR UPDATE
  USING (
    (select auth.uid()) = author_id
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

-- ============================================
-- 5. FIX PROJECTS MULTIPLE PERMISSIVE POLICIES (DELETE)
-- ============================================

-- El problema: Hay dos políticas permisivas para DELETE:
-- - "Users can delete own projects"
-- - "Admins can delete any project"
-- Solución: Combinarlas en una sola política (si no existe ya)

DROP POLICY IF EXISTS "Users can delete own projects" ON projects;
DROP POLICY IF EXISTS "Admins can delete any project" ON projects;
DROP POLICY IF EXISTS "Users and admins can delete projects" ON projects;

CREATE POLICY "Users and admins can delete projects"
  ON projects FOR DELETE
  USING (
    (select auth.uid()) = author_id
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

-- ============================================
-- 6. OPTIMIZAR ÍNDICES PARA CONSULTAS FRECUENTES
-- ============================================

-- Asegurar que existe un índice compuesto para búsqueda por custom_slug e is_published
-- Esto acelera las consultas de perfiles públicos por custom_slug
CREATE INDEX IF NOT EXISTS idx_link_bio_profiles_slug_published 
ON link_bio_profiles(custom_slug, is_published) 
WHERE custom_slug IS NOT NULL AND is_published = true;

-- Asegurar que existe un índice compuesto para búsqueda por user_id e is_published
-- Esto puede ayudar con consultas que filtran por ambos campos
CREATE INDEX IF NOT EXISTS idx_link_bio_profiles_user_published 
ON link_bio_profiles(user_id, is_published);

-- ============================================
-- COMENTARIOS
-- ============================================
-- Todas las políticas ahora:
-- 1. Usan (select auth.uid()) en lugar de auth.uid() para evitar re-evaluación por fila
-- 2. Están combinadas para evitar múltiples políticas permisivas para la misma acción
-- Esto mejora significativamente el rendimiento de las consultas
-- Ver: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

