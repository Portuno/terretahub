-- ============================================
-- FIX: Cambiar roles de políticas a anon y authenticated
-- ============================================
-- El problema: las políticas usan {public} pero necesitan {anon, authenticated}

-- 1. Eliminar políticas existentes
DROP POLICY IF EXISTS "Anyone can create resource needs" ON resource_needs;
DROP POLICY IF EXISTS "Authenticated users can view resource needs" ON resource_needs;

-- 2. Crear política de INSERT con roles explícitos
CREATE POLICY "Anyone can create resource needs"
  ON resource_needs FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 3. Crear política de SELECT con rol explícito
CREATE POLICY "Authenticated users can view resource needs"
  ON resource_needs FOR SELECT
  TO authenticated
  USING (true);

-- 4. Verificar que se crearon correctamente
DO $$
DECLARE
  insert_policy_count INTEGER;
  select_policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO insert_policy_count
  FROM pg_policies 
  WHERE tablename = 'resource_needs' 
  AND policyname = 'Anyone can create resource needs'
  AND cmd = 'INSERT';
  
  SELECT COUNT(*) INTO select_policy_count
  FROM pg_policies 
  WHERE tablename = 'resource_needs' 
  AND policyname = 'Authenticated users can view resource needs'
  AND cmd = 'SELECT';
  
  IF insert_policy_count = 0 THEN
    RAISE EXCEPTION 'No se pudo crear la política de INSERT';
  END IF;
  
  IF select_policy_count = 0 THEN
    RAISE EXCEPTION 'No se pudo crear la política de SELECT';
  END IF;
  
  RAISE NOTICE 'Políticas creadas correctamente. INSERT: %, SELECT: %', insert_policy_count, select_policy_count;
END $$;

