-- ============================================
-- FIX FINAL: Resource Needs RLS
-- ============================================
-- Este script deshabilita RLS solo para INSERT o crea una política ultra permisiva

-- 1. Eliminar todas las políticas existentes
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

-- 2. Asegurar permisos GRANT
GRANT INSERT ON resource_needs TO anon;
GRANT INSERT ON resource_needs TO authenticated;
GRANT SELECT ON resource_needs TO authenticated;

-- 3. OPCIÓN A: Deshabilitar RLS completamente (solo para testing)
-- Descomenta la siguiente línea si quieres deshabilitar RLS:
-- ALTER TABLE resource_needs DISABLE ROW LEVEL SECURITY;

-- 4. OPCIÓN B: Crear política ultra permisiva con FOR ALL
-- Si prefieres mantener RLS habilitado, usa esta política:
ALTER TABLE resource_needs ENABLE ROW LEVEL SECURITY;

-- Política para INSERT que permite a cualquiera
CREATE POLICY "enable_insert_for_all"
  ON resource_needs FOR INSERT
  TO public
  WITH CHECK (true);

-- Política para SELECT para usuarios autenticados
CREATE POLICY "enable_select_for_authenticated"
  ON resource_needs FOR SELECT
  TO authenticated
  USING (true);

-- 5. Verificar que la política se creó
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE tablename = 'resource_needs' 
  AND cmd = 'INSERT';
  
  IF policy_count = 0 THEN
    RAISE EXCEPTION 'No se pudo crear la política de INSERT';
  ELSE
    RAISE NOTICE 'Política de INSERT creada correctamente. Total: %', policy_count;
  END IF;
END $$;

