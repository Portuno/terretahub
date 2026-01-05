-- ============================================
-- FIX: Resource Needs RLS Policy Issue (SIMPLE VERSION)
-- ============================================
-- Este script corrige el error 42501 de forma más directa
-- Deshabilita RLS temporalmente, elimina políticas y crea una nueva

-- 1. Deshabilitar RLS temporalmente para limpiar
ALTER TABLE resource_needs DISABLE ROW LEVEL SECURITY;

-- 2. Eliminar TODAS las políticas existentes
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

-- 3. Habilitar RLS nuevamente
ALTER TABLE resource_needs ENABLE ROW LEVEL SECURITY;

-- 4. Crear política de INSERT simple (sin especificar TO)
-- Esto permite que se aplique a todos los roles por defecto
CREATE POLICY "Anyone can create resource needs"
  ON resource_needs FOR INSERT
  WITH CHECK (true);

-- 5. Crear política de SELECT para usuarios autenticados
CREATE POLICY "Authenticated users can view resource needs"
  ON resource_needs FOR SELECT
  USING (auth.role() = 'authenticated');

-- 6. Crear política de UPDATE para usuarios autenticados
CREATE POLICY "Authenticated users can update resource needs"
  ON resource_needs FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 7. Asegurar permisos explícitos en la tabla
GRANT INSERT ON resource_needs TO anon;
GRANT INSERT ON resource_needs TO authenticated;
GRANT SELECT ON resource_needs TO authenticated;
GRANT UPDATE ON resource_needs TO authenticated;

-- 8. Verificar que user_id permita NULL
ALTER TABLE resource_needs ALTER COLUMN user_id DROP NOT NULL;

-- 9. Asegurar que las columnas tengan DEFAULTs
ALTER TABLE resource_needs 
  ALTER COLUMN verticals SET DEFAULT '{}',
  ALTER COLUMN format_tags SET DEFAULT '{}',
  ALTER COLUMN need_types SET DEFAULT '{}',
  ALTER COLUMN status SET DEFAULT 'new';

-- Comentarios:
-- - La política de INSERT no especifica TO, lo que la hace aplicable a todos los roles
-- - Los permisos GRANT están explícitos para anon y authenticated
-- - Se asegura que user_id permita NULL para usuarios anónimos

