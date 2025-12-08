-- ============================================
-- TABLA: Feedback Messages (Mensajes de Feedback)
-- ============================================

CREATE TABLE IF NOT EXISTS feedback_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL DEFAULT 'Anónimo',
  message TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para orden cronológico reciente
CREATE INDEX IF NOT EXISTS idx_feedback_messages_created_at
ON feedback_messages(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE feedback_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can create feedback messages" ON feedback_messages;
DROP POLICY IF EXISTS "Authenticated users can view feedback messages" ON feedback_messages;
DROP POLICY IF EXISTS "Authenticated users can update feedback messages" ON feedback_messages;

-- Cualquiera puede enviar feedback (sin requerir sesión)
CREATE POLICY "Anyone can create feedback messages"
  ON feedback_messages FOR INSERT
  WITH CHECK (true);

-- Solo usuarios autenticados pueden leer feedback
CREATE POLICY "Authenticated users can view feedback messages"
  ON feedback_messages FOR SELECT
  USING (auth.role() = 'authenticated');

-- Solo usuarios autenticados pueden actualizar feedback (marcar revisado, etc.)
CREATE POLICY "Authenticated users can update feedback messages"
  ON feedback_messages FOR UPDATE
  USING (auth.role() = 'authenticated');

-- ============================================
-- TRIGGER updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_feedback_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_feedback_messages_updated_at ON feedback_messages;
CREATE TRIGGER update_feedback_messages_updated_at
  BEFORE UPDATE ON feedback_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_feedback_messages_updated_at();

-- ============================================
-- COMENTARIOS
-- ============================================
COMMENT ON TABLE feedback_messages IS 'Feedback enviado desde el frontend (opcionalmente anónimo)';
COMMENT ON COLUMN feedback_messages.user_id IS 'Usuario autenticado (si existe sesión)';
COMMENT ON COLUMN feedback_messages.name IS 'Nombre proporcionado por la persona o Anónimo';
COMMENT ON COLUMN feedback_messages.message IS 'Contenido del feedback';
COMMENT ON COLUMN feedback_messages.user_agent IS 'User agent del cliente que envía el feedback';
