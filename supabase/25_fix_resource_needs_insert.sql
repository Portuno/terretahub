-- ============================================
-- FIX: Resource Needs Insert Issues
-- ============================================
-- Este script corrige posibles problemas con la inserción en resource_needs
-- que pueden causar errores 400

-- 1. Verificar y corregir las políticas RLS
-- Asegurar que la política de INSERT permite inserción sin autenticación
DROP POLICY IF EXISTS "Anyone can create resource needs" ON resource_needs;

-- Crear política que permite INSERT a cualquiera (incluso usuarios no autenticados)
CREATE POLICY "Anyone can create resource needs"
  ON resource_needs FOR INSERT
  WITH CHECK (true);

-- 2. Verificar que la tabla existe y tiene la estructura correcta
-- Si la tabla no existe, se creará con el script 12_create_resource_needs.sql

-- 3. Verificar que los campos con DEFAULT funcionen correctamente
-- Los campos NOT NULL con DEFAULT deberían funcionar automáticamente

-- 4. Asegurar que el trigger de updated_at no cause problemas en INSERT
-- El trigger solo se ejecuta en UPDATE, así que no debería ser un problema

-- 5. Verificar que no haya restricciones de foreign key que bloqueen
-- La referencia a auth.users(id) debería permitir NULL según el schema
-- Si user_id es NULL, la foreign key no debería validarse

-- 6. Verificar permisos en la tabla
-- Asegurar que la tabla tiene los permisos correctos para INSERT
GRANT INSERT ON resource_needs TO anon;
GRANT INSERT ON resource_needs TO authenticated;

-- Comentarios adicionales:
-- - Los arrays deben enviarse como arrays JavaScript [] (no como strings)
-- - Los arrays vacíos [] se convierten automáticamente a '{}' en PostgreSQL
-- - El campo user_id puede ser NULL cuando no hay usuario autenticado
-- - Todos los campos NOT NULL tienen valores por defecto, así que deberían funcionar

