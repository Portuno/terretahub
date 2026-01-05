-- ============================================
-- ADD: need_types column to resource_needs if missing
-- ============================================
-- Este script agrega la columna need_types si no existe en la tabla resource_needs
-- Esto corrige el error PGRST204: "Could not find the 'need_types' column"

-- Verificar si la columna existe y agregarla si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'resource_needs' 
    AND column_name = 'need_types'
  ) THEN
    ALTER TABLE resource_needs 
    ADD COLUMN need_types TEXT[] NOT NULL DEFAULT '{}';
    
    COMMENT ON COLUMN resource_needs.need_types IS 'Tipos de recurso solicitados (plantillas, fondos, etc.)';
    
    RAISE NOTICE 'Columna need_types agregada exitosamente a resource_needs';
  ELSE
    RAISE NOTICE 'La columna need_types ya existe en resource_needs';
  END IF;
END $$;

-- Nota: Después de ejecutar este script, puede ser necesario refrescar el schema cache de PostgREST
-- Esto generalmente se hace automáticamente, pero si el error persiste, puedes:
-- 1. Esperar unos minutos para que el cache se actualice
-- 2. O reiniciar el servicio de PostgREST en Supabase

