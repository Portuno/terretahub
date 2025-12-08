-- Migración: feedback_messages -> usar username en vez de user_id

BEGIN;

-- 1) Agregar columna username
ALTER TABLE feedback_messages
  ADD COLUMN IF NOT EXISTS username TEXT;

-- 2) Poblar username con 'anonimo' cuando esté vacío
UPDATE feedback_messages
SET username = COALESCE(username, 'anonimo');

-- 3) Dropear user_id ya que dejaremos de guardar UUID
ALTER TABLE feedback_messages
  DROP COLUMN IF EXISTS user_id;

-- 4) Asegurar NOT NULL y default
ALTER TABLE feedback_messages
  ALTER COLUMN username SET NOT NULL,
  ALTER COLUMN username SET DEFAULT 'anonimo';

-- 5) Comentarios
COMMENT ON COLUMN feedback_messages.username IS 'Username usado al enviar feedback; "anonimo" si el usuario eligió anonimato.';

COMMIT;
