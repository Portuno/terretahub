-- ============================================
-- ADD USER ROLES SYSTEM
-- ============================================
-- Agrega sistema de roles (normal, admin) a la tabla profiles
-- y actualiza políticas RLS para permitir acciones administrativas

-- ============================================
-- 1. AGREGAR COLUMNA ROLE A PROFILES
-- ============================================

-- Agregar columna role si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE profiles 
    ADD COLUMN role TEXT NOT NULL DEFAULT 'normal' 
    CHECK (role IN ('normal', 'admin'));
  END IF;
END $$;

-- Crear índice para búsquedas por rol
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Actualizar usuarios existentes sin rol (por si acaso)
UPDATE profiles SET role = 'normal' WHERE role IS NULL;

-- ============================================
-- 2. FUNCIÓN HELPER PARA VERIFICAR SI ES ADMIN
-- ============================================

CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3. ACTUALIZAR POLÍTICAS RLS PARA AGORA POSTS
-- ============================================

-- Eliminar política de eliminación existente
DROP POLICY IF EXISTS "Users can delete own posts" ON agora_posts;

-- Nueva política: usuarios pueden eliminar sus propios posts
CREATE POLICY "Users can delete own posts"
  ON agora_posts FOR DELETE
  USING (auth.uid() = author_id);

-- Nueva política: admins pueden eliminar cualquier post
CREATE POLICY "Admins can delete any post"
  ON agora_posts FOR DELETE
  USING (is_admin(auth.uid()));

-- ============================================
-- 4. ACTUALIZAR POLÍTICAS RLS PARA PROJECTS
-- ============================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Published projects are viewable by everyone" ON projects;
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON projects;

-- Nueva política: todos pueden ver proyectos publicados, 
-- usuarios pueden ver sus propios proyectos (draft/review),
-- admins pueden ver todos los proyectos
CREATE POLICY "Projects visibility policy"
  ON projects FOR SELECT
  USING (
    status = 'published' 
    OR auth.uid() = author_id 
    OR is_admin(auth.uid())
  );

-- Nueva política: usuarios pueden actualizar sus propios proyectos
CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = author_id);

-- Nueva política: admins pueden actualizar cualquier proyecto
CREATE POLICY "Admins can update any project"
  ON projects FOR UPDATE
  USING (is_admin(auth.uid()));

-- Nueva política: usuarios pueden eliminar sus propios proyectos
CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  USING (auth.uid() = author_id);

-- Nueva política: admins pueden eliminar cualquier proyecto
CREATE POLICY "Admins can delete any project"
  ON projects FOR DELETE
  USING (is_admin(auth.uid()));

-- ============================================
-- 5. ACTUALIZAR POLÍTICAS RLS PARA CONTACT MESSAGES
-- ============================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Authenticated users can view contact messages" ON contact_messages;
DROP POLICY IF EXISTS "Authenticated users can update contact messages" ON contact_messages;

-- Nueva política: solo admins pueden ver mensajes de contacto
CREATE POLICY "Admins can view contact messages"
  ON contact_messages FOR SELECT
  USING (is_admin(auth.uid()));

-- Nueva política: solo admins pueden actualizar mensajes de contacto
CREATE POLICY "Admins can update contact messages"
  ON contact_messages FOR UPDATE
  USING (is_admin(auth.uid()));

-- ============================================
-- 6. ACTUALIZAR FUNCIÓN handle_new_user
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, username, email, avatar, role, show_in_community)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Usuario'),
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'avatar',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=' || COALESCE(NEW.raw_user_meta_data->>'username', 'user')
    ),
    'normal', -- Todos los usuarios nuevos tienen rol 'normal' por defecto
    true -- Por defecto, los usuarios aparecen en la comunidad
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COMENTARIOS
-- ============================================

COMMENT ON COLUMN profiles.role IS 'Rol del usuario: normal (por defecto) o admin';
COMMENT ON FUNCTION is_admin(UUID) IS 'Verifica si un usuario tiene rol de administrador';

