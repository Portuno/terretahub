-- ============================================
-- ADD MENTION NOTIFICATIONS SUPPORT
-- ============================================
-- Agrega el tipo 'mention' a las notificaciones y actualiza el constraint

-- Primero, eliminar el constraint existente
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Agregar el nuevo constraint con 'mention' incluido
ALTER TABLE notifications 
  ADD CONSTRAINT notifications_type_check 
  CHECK (type IN ('comment', 'project_approved', 'project_rejected', 'mention'));

-- Verificar que el constraint se aplicó correctamente
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'notifications_type_check'
  ) THEN
    RAISE EXCEPTION 'Constraint notifications_type_check no se creó correctamente';
  END IF;
END $$;
