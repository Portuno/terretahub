-- ============================================
-- FIX: Resource Needs Insert Issues
-- ============================================
-- Este script corrige posibles problemas con la inserción en resource_needs
-- que pueden causar errores 400

-- 1. Verificar y corregir las políticas RLS si es necesario
-- Asegurar que la política de INSERT permite inserción sin autenticación
DROP POLICY IF EXISTS "Anyone can create resource needs" ON resource_needs;

CREATE POLICY "Anyone can create resource needs"
  ON resource_needs FOR INSERT
  WITH CHECK (true);

-- 2. Verificar que los campos con DEFAULT funcionen correctamente
-- Si hay problemas, podemos hacer que los campos opcionales sean más flexibles

-- 3. Asegurar que el trigger de updated_at no cause problemas en INSERT
-- El trigger solo se ejecuta en UPDATE, así que no debería ser un problema

-- 4. Verificar que no haya restricciones de foreign key que bloqueen
-- La referencia a auth.users(id) debería permitir NULL según el schema

-- Comentario: Si el problema persiste, verificar:
-- - Que los arrays se envíen como arrays JavaScript (no como strings)
-- - Que los arrays vacíos [] se acepten (el schema tiene DEFAULT '{}')
-- - Que el campo user_id pueda ser NULL cuando no hay usuario autenticado

