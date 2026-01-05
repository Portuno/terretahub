-- ============================================
-- DESHABILITAR RLS PARA RESOURCE_NEEDS
-- ============================================
-- Si las políticas RLS no funcionan, esta es la solución más simple:
-- Deshabilitar RLS completamente para esta tabla

-- 1. Eliminar todas las políticas
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'resource_needs'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON resource_needs', r.policyname);
  END LOOP;
END $$;

-- 2. Deshabilitar RLS completamente
ALTER TABLE resource_needs DISABLE ROW LEVEL SECURITY;

-- 3. Asegurar permisos GRANT (aunque RLS esté deshabilitado, es buena práctica)
GRANT INSERT ON resource_needs TO anon;
GRANT INSERT ON resource_needs TO authenticated;
GRANT SELECT ON resource_needs TO authenticated;

-- NOTA: Con RLS deshabilitado, cualquier usuario (incluso anónimo) puede insertar.
-- Si necesitas restricciones de seguridad, tendrás que manejarlas en el código de la aplicación.

