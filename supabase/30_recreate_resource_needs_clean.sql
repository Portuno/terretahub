-- ============================================
-- RECREAR TABLA RESOURCE_NEEDS DESDE CERO
-- ============================================
-- Elimina la tabla actual y la crea de nuevo con solo los campos esenciales

-- 1. ELIMINAR TABLA COMPLETA (esto elimina todo: datos, políticas, triggers, etc.)
DROP TABLE IF EXISTS resource_needs CASCADE;

-- 2. CREAR TABLA NUEVA CON SOLO LOS CAMPOS NECESARIOS
CREATE TABLE resource_needs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  verticals TEXT[] NOT NULL DEFAULT '{}',
  format_tags TEXT[] NOT NULL DEFAULT '{}',
  details TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. CREAR ÍNDICE PARA ORDEN CRONOLÓGICO
CREATE INDEX idx_resource_needs_created_at ON resource_needs(created_at DESC);

-- 4. OTORGAR PERMISOS PRIMERO (antes de habilitar RLS)
GRANT INSERT ON resource_needs TO anon;
GRANT INSERT ON resource_needs TO authenticated;
GRANT SELECT ON resource_needs TO authenticated;

-- 5. HABILITAR ROW LEVEL SECURITY
ALTER TABLE resource_needs ENABLE ROW LEVEL SECURITY;

-- 6. CREAR POLÍTICA DE INSERT: CUALQUIERA PUEDE INSERTAR
-- NO especificar TO para que se aplique a todos los roles por defecto
CREATE POLICY "Anyone can create resource needs"
  ON resource_needs FOR INSERT
  WITH CHECK (true);

-- 7. CREAR POLÍTICA DE SELECT: SOLO USUARIOS AUTENTICADOS PUEDEN VER
CREATE POLICY "Authenticated users can view resource needs"
  ON resource_needs FOR SELECT
  USING (auth.role() = 'authenticated');

-- 8. COMENTARIOS PARA DOCUMENTACIÓN
COMMENT ON TABLE resource_needs IS 'Solicitudes de recursos y colaboración de la comunidad';
COMMENT ON COLUMN resource_needs.id IS 'ID único de la solicitud';
COMMENT ON COLUMN resource_needs.user_id IS 'ID del usuario registrado (NULL si es usuario anónimo)';
COMMENT ON COLUMN resource_needs.verticals IS 'Array de verticales de interés seleccionadas';
COMMENT ON COLUMN resource_needs.format_tags IS 'Array de formatos preferidos (tags)';
COMMENT ON COLUMN resource_needs.details IS 'Descripción detallada de la necesidad (texto libre)';
COMMENT ON COLUMN resource_needs.created_at IS 'Fecha y hora de creación de la solicitud';
