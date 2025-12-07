-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
-- Almacena las notificaciones de los usuarios
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('comment', 'project_approved', 'project_rejected')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_id UUID, -- ID del post, proyecto, etc. relacionado
  related_type TEXT, -- 'post', 'project', etc.
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Índices para notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- NOTIFICATIONS POLICIES
-- ============================================

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "System can create notifications" ON notifications;

-- Usuarios pueden ver sus propias notificaciones
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Usuarios pueden actualizar sus propias notificaciones (marcar como leídas)
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- El sistema puede crear notificaciones (usando SECURITY DEFINER en las funciones)
CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Función para crear notificación cuando alguien comenta un post
CREATE OR REPLACE FUNCTION notify_post_comment()
RETURNS TRIGGER AS $$
DECLARE
  post_author_id UUID;
  comment_author_name TEXT;
BEGIN
  -- Obtener el autor del post
  SELECT author_id INTO post_author_id
  FROM agora_posts
  WHERE id = NEW.post_id;

  -- Obtener el nombre del autor del comentario
  SELECT name INTO comment_author_name
  FROM profiles
  WHERE id = NEW.author_id;

  -- No notificar si el comentario es del mismo autor del post
  IF post_author_id = NEW.author_id THEN
    RETURN NEW;
  END IF;

  -- Crear la notificación
  INSERT INTO notifications (user_id, type, title, message, related_id, related_type)
  VALUES (
    post_author_id,
    'comment',
    'Nuevo comentario',
    comment_author_name || ' comentó tu post',
    NEW.post_id,
    'post'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Eliminar trigger existente si existe
DROP TRIGGER IF EXISTS on_comment_created ON agora_comments;

-- Trigger para crear notificación cuando se crea un comentario
CREATE TRIGGER on_comment_created
  AFTER INSERT ON agora_comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_post_comment();

-- Función para crear notificación cuando cambia el status de un proyecto
CREATE OR REPLACE FUNCTION notify_project_status_change()
RETURNS TRIGGER AS $$
DECLARE
  project_name TEXT;
BEGIN
  -- Solo procesar si el status realmente cambió
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Obtener el nombre del proyecto
    project_name := NEW.name;

    -- Notificación cuando se aprueba (cambia a 'published')
    IF NEW.status = 'published' AND OLD.status != 'published' THEN
      INSERT INTO notifications (user_id, type, title, message, related_id, related_type)
      VALUES (
        NEW.author_id,
        'project_approved',
        'Proyecto aprobado',
        'Tu proyecto "' || project_name || '" ha sido aprobado y publicado',
        NEW.id,
        'project'
      );
    END IF;

    -- Notificación cuando se rechaza (cambia de 'review' a 'draft')
    IF NEW.status = 'draft' AND OLD.status = 'review' THEN
      INSERT INTO notifications (user_id, type, title, message, related_id, related_type)
      VALUES (
        NEW.author_id,
        'project_rejected',
        'Proyecto rechazado',
        'Tu proyecto "' || project_name || '" ha sido rechazado y vuelto a borrador',
        NEW.id,
        'project'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Eliminar triggers existentes si existen
DROP TRIGGER IF EXISTS on_project_status_changed ON projects;

-- Trigger para crear notificaciones cuando cambia el status de un proyecto
CREATE TRIGGER on_project_status_changed
  AFTER UPDATE OF status ON projects
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION notify_project_status_change();
