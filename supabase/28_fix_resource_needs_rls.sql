-- ============================================
-- FIX: Resource Needs RLS Policy Issue
-- ============================================
-- Este script corrige el error 42501 (row-level security policy violation)
-- que está bloqueando las inserciones en resource_needs

-- 1. Eliminar todas las políticas existentes para empezar limpio
-- Usar un bloque DO para eliminar todas las políticas dinámicamente
DO $$
DECLARE
  r RECORD;
BEGIN
  -- Eliminar todas las políticas de resource_needs
  FOR r IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'resource_needs'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON resource_needs', r.policyname);
  END LOOP;
END $$;

-- 2. Asegurar que RLS esté habilitado
ALTER TABLE resource_needs ENABLE ROW LEVEL SECURITY;

-- 3. Crear política de INSERT que permite a cualquiera (incluso usuarios anónimos)
-- Crear dos políticas: una para anon y otra para authenticated para mayor claridad
CREATE POLICY "Anyone can create resource needs"
  ON resource_needs FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 4. Crear política de SELECT para usuarios autenticados
CREATE POLICY "Authenticated users can view resource needs"
  ON resource_needs FOR SELECT
  TO authenticated
  USING (true);

-- 5. Crear política de UPDATE para usuarios autenticados
CREATE POLICY "Authenticated users can update resource needs"
  ON resource_needs FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 6. Asegurar permisos explícitos en la tabla
GRANT INSERT ON resource_needs TO anon;
GRANT INSERT ON resource_needs TO authenticated;
GRANT SELECT ON resource_needs TO authenticated;
GRANT UPDATE ON resource_needs TO authenticated;

-- 7. Asegurar que user_id permita NULL explícitamente (para usuarios anónimos)
-- Esto es importante porque la foreign key puede causar problemas si no está bien configurada
DO $$
BEGIN
  -- Si user_id existe pero no permite NULL, hacerlo nullable
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'resource_needs' 
    AND column_name = 'user_id'
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE resource_needs 
    ALTER COLUMN user_id DROP NOT NULL;
  END IF;
  
  -- Asegurar que la foreign key permita NULL correctamente
  -- Si la foreign key no permite NULL en la definición, puede causar problemas
  -- PostgreSQL normalmente permite NULL en foreign keys, pero verificamos por si acaso
END $$;

-- 7.1. Verificar y corregir la foreign key de user_id si es necesario
-- Asegurar que la foreign key permita NULL (que es el comportamiento por defecto)
-- Si hay alguna restricción que impida NULL, la eliminamos y recreamos
DO $$
DECLARE
  fk_constraint_name TEXT;
BEGIN
  -- Buscar el nombre de la constraint de foreign key para user_id
  SELECT tc.constraint_name INTO fk_constraint_name
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
  WHERE tc.table_name = 'resource_needs'
    AND kcu.column_name = 'user_id'
    AND tc.constraint_type = 'FOREIGN KEY'
  LIMIT 1;
  
  -- Si existe la constraint, verificar que permita NULL
  -- Si no permite NULL, la eliminamos y recreamos
  IF fk_constraint_name IS NOT NULL THEN
    -- Verificar si la columna permite NULL
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'resource_needs' 
      AND column_name = 'user_id'
      AND is_nullable = 'NO'
    ) THEN
      -- Eliminar la constraint y recrearla permitiendo NULL
      EXECUTE format('ALTER TABLE resource_needs DROP CONSTRAINT IF EXISTS %I', fk_constraint_name);
      ALTER TABLE resource_needs 
      ADD CONSTRAINT resource_needs_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

-- 8. Verificar que la tabla tenga la estructura correcta
-- Asegurar que las columnas esenciales existan con sus valores por defecto
DO $$
BEGIN
  -- Asegurar que verticals tiene DEFAULT
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'resource_needs' 
    AND column_name = 'verticals'
    AND column_default IS NULL
  ) THEN
    ALTER TABLE resource_needs 
    ALTER COLUMN verticals SET DEFAULT '{}';
  END IF;

  -- Asegurar que format_tags tiene DEFAULT
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'resource_needs' 
    AND column_name = 'format_tags'
    AND column_default IS NULL
  ) THEN
    ALTER TABLE resource_needs 
    ALTER COLUMN format_tags SET DEFAULT '{}';
  END IF;

  -- Asegurar que status tiene DEFAULT
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'resource_needs' 
    AND column_name = 'status'
    AND column_default IS NULL
  ) THEN
    ALTER TABLE resource_needs 
    ALTER COLUMN status SET DEFAULT 'new';
  END IF;
END $$;

-- 9. Verificación final: Asegurar que need_types tenga DEFAULT si existe
DO $$
BEGIN
  -- Asegurar que need_types tiene DEFAULT si la columna existe
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'resource_needs' 
    AND column_name = 'need_types'
    AND column_default IS NULL
  ) THEN
    ALTER TABLE resource_needs 
    ALTER COLUMN need_types SET DEFAULT '{}';
  END IF;
END $$;

-- 10. Verificar que las políticas se crearon correctamente
-- Esta es una verificación de diagnóstico (no modifica nada)
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE tablename = 'resource_needs' 
  AND policyname = 'Anyone can create resource needs';
  
  IF policy_count = 0 THEN
    RAISE WARNING 'La política "Anyone can create resource needs" no se creó correctamente';
  ELSE
    RAISE NOTICE 'Política "Anyone can create resource needs" creada correctamente';
  END IF;
END $$;

-- Comentarios:
-- - La política de INSERT ahora especifica explícitamente TO anon, authenticated
-- - Esto asegura que usuarios anónimos puedan insertar sin problemas
-- - Los permisos GRANT también están explícitos para mayor claridad
-- - Se verifica que need_types tenga DEFAULT para evitar errores de inserción

