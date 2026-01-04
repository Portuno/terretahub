-- ============================================
-- OPTIMIZE RLS POLICIES FOR PERFORMANCE
-- ============================================
-- Este script optimiza las políticas RLS para mejorar el rendimiento
-- Reemplaza auth.uid() con (select auth.uid()) para evitar re-evaluación por fila
-- Basado en: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

-- ============================================
-- 1. OPTIMIZAR POLÍTICAS DE PROFILES
-- ============================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Recrear con optimización (select auth.uid())
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING ((select auth.uid()) = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK ((select auth.uid()) = id);

-- ============================================
-- 2. OPTIMIZAR POLÍTICAS DE LINK_BIO_PROFILES
-- ============================================

-- La política "Link bio profiles are viewable by everyone" ya existe para SELECT
-- Necesitamos crear políticas separadas para INSERT, UPDATE y DELETE
-- para evitar tener múltiples políticas permisivas para SELECT
DROP POLICY IF EXISTS "Users can manage own link bio profile" ON link_bio_profiles;
DROP POLICY IF EXISTS "Users can insert own link bio profile" ON link_bio_profiles;
DROP POLICY IF EXISTS "Users can update own link bio profile" ON link_bio_profiles;
DROP POLICY IF EXISTS "Users can delete own link bio profile" ON link_bio_profiles;

-- Políticas separadas para cada operación (SELECT ya está cubierto por "viewable by everyone")
CREATE POLICY "Users can insert own link bio profile"
  ON link_bio_profiles FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own link bio profile"
  ON link_bio_profiles FOR UPDATE
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own link bio profile"
  ON link_bio_profiles FOR DELETE
  USING ((select auth.uid()) = user_id);

-- ============================================
-- 3. OPTIMIZAR POLÍTICAS DE AGORA_POSTS
-- ============================================

DROP POLICY IF EXISTS "Authenticated users can create posts" ON agora_posts;
DROP POLICY IF EXISTS "Users can update own posts" ON agora_posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON agora_posts;
DROP POLICY IF EXISTS "Admins can delete any post" ON agora_posts;

CREATE POLICY "Authenticated users can create posts"
  ON agora_posts FOR INSERT
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "Users can update own posts"
  ON agora_posts FOR UPDATE
  USING ((select auth.uid()) = author_id);

-- Combinar DELETE: usuarios pueden eliminar sus propios posts O admins pueden eliminar cualquier post
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
-- 4. OPTIMIZAR POLÍTICAS DE AGORA_COMMENTS
-- ============================================

DROP POLICY IF EXISTS "Authenticated users can create comments" ON agora_comments;
DROP POLICY IF EXISTS "Users can update own comments" ON agora_comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON agora_comments;

CREATE POLICY "Authenticated users can create comments"
  ON agora_comments FOR INSERT
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "Users can update own comments"
  ON agora_comments FOR UPDATE
  USING ((select auth.uid()) = author_id);

CREATE POLICY "Users can delete own comments"
  ON agora_comments FOR DELETE
  USING ((select auth.uid()) = author_id);

-- ============================================
-- 5. OPTIMIZAR POLÍTICAS DE PROJECTS
-- ============================================

-- Optimizar política de visibilidad (SELECT)
DROP POLICY IF EXISTS "Projects visibility policy" ON projects;
DROP POLICY IF EXISTS "Published projects are viewable by everyone" ON projects;

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

-- Políticas combinadas para evitar múltiples políticas permisivas
DROP POLICY IF EXISTS "Authenticated users can create projects" ON projects;
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
DROP POLICY IF EXISTS "Admins can update any project" ON projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON projects;
DROP POLICY IF EXISTS "Admins can delete any project" ON projects;

CREATE POLICY "Authenticated users can create projects"
  ON projects FOR INSERT
  WITH CHECK ((select auth.uid()) IS NOT NULL);

-- Combinar UPDATE: usuarios pueden actualizar sus propios proyectos O admins pueden actualizar cualquier proyecto
CREATE POLICY "Users and admins can update projects"
  ON projects FOR UPDATE
  USING (
    (select auth.uid()) = author_id
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

-- Combinar DELETE: usuarios pueden eliminar sus propios proyectos O admins pueden eliminar cualquier proyecto
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
-- 6. OPTIMIZAR OTRAS POLÍTICAS
-- ============================================

-- Notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING ((select auth.uid()) = user_id);

-- Profile views
DROP POLICY IF EXISTS "Users can view own profile views" ON profile_views;

CREATE POLICY "Users can view own profile views"
  ON profile_views FOR SELECT
  USING ((select auth.uid()) = profile_user_id);

-- Link clicks
DROP POLICY IF EXISTS "Users can view own link clicks" ON link_clicks;

CREATE POLICY "Users can view own link clicks"
  ON link_clicks FOR SELECT
  USING ((select auth.uid()) = profile_user_id);

-- Feedback messages
DROP POLICY IF EXISTS "Authenticated users can view feedback messages" ON feedback_messages;
DROP POLICY IF EXISTS "Authenticated users can update feedback messages" ON feedback_messages;

CREATE POLICY "Authenticated users can view feedback messages"
  ON feedback_messages FOR SELECT
  USING ((select auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can update feedback messages"
  ON feedback_messages FOR UPDATE
  USING ((select auth.uid()) IS NOT NULL);

-- Resource needs
DROP POLICY IF EXISTS "Authenticated users can view resource needs" ON resource_needs;
DROP POLICY IF EXISTS "Authenticated users can update resource needs" ON resource_needs;

CREATE POLICY "Authenticated users can view resource needs"
  ON resource_needs FOR SELECT
  USING ((select auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can update resource needs"
  ON resource_needs FOR UPDATE
  USING ((select auth.uid()) IS NOT NULL);

-- Contact messages (admin only)
DROP POLICY IF EXISTS "Admins can view contact messages" ON contact_messages;
DROP POLICY IF EXISTS "Admins can update contact messages" ON contact_messages;

CREATE POLICY "Admins can view contact messages"
  ON contact_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update contact messages"
  ON contact_messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

-- ============================================
-- COMENTARIOS
-- ============================================
-- Todas las políticas ahora usan (select auth.uid()) en lugar de auth.uid()
-- Esto evita que se evalúe para cada fila, mejorando significativamente el rendimiento
-- Ver: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

