-- ============================================
-- OPTIMIZE PROJECTS QUERIES
-- ============================================
-- Este script optimiza las consultas de proyectos que están causando problemas de rendimiento
-- Problemas identificados:
-- 1. select('*') trae todos los campos incluyendo arrays grandes (922 kB)
-- 2. Múltiples consultas separadas en lugar de JOINs (20-40 segundos)
-- 3. Consultas de perfiles con muchos IDs son muy lentas

-- ============================================
-- 1. FUNCIÓN PARA OBTENER PROYECTOS CON AUTORES
-- ============================================
-- Esta función hace un JOIN de proyectos con perfiles y link_bio_profiles
-- en una sola consulta, devolviendo solo los campos necesarios para la galería
-- Usa SECURITY INVOKER para respetar RLS policies

CREATE OR REPLACE FUNCTION get_projects_with_authors()
RETURNS TABLE (
  -- Campos del proyecto (solo los necesarios para la galería)
  id UUID,
  author_id UUID,
  name TEXT,
  slogan TEXT,
  description TEXT,
  images TEXT[],
  video_url TEXT,
  website TEXT,
  categories TEXT[],
  technologies TEXT[],
  phase TEXT,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  -- Campos del autor
  author_name TEXT,
  author_username TEXT,
  author_avatar TEXT
) 
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.author_id,
    p.name,
    p.slogan,
    p.description,
    p.images,
    p.video_url,
    p.website,
    p.categories,
    p.technologies,
    p.phase,
    p.status,
    p.created_at,
    p.updated_at,
    -- Información del autor desde profiles
    COALESCE(prof.name, 'Usuario') as author_name,
    COALESCE(prof.username, 'usuario') as author_username,
    -- Priorizar avatar de link_bio_profiles, luego profiles, luego default
    COALESCE(
      lbp.avatar,
      prof.avatar,
      format('https://api.dicebear.com/7.x/avataaars/svg?seed=%s', COALESCE(prof.username, 'user'))
    ) as author_avatar
  FROM projects p
  LEFT JOIN profiles prof ON p.author_id = prof.id
  LEFT JOIN LATERAL (
    SELECT avatar 
    FROM link_bio_profiles 
    WHERE user_id = p.author_id AND avatar IS NOT NULL 
    LIMIT 1
  ) lbp ON true
  WHERE p.status = 'published'
  ORDER BY p.created_at DESC;
END;
$$;

-- ============================================
-- 2. FUNCIÓN PARA OBTENER PERFILES EN LOTE OPTIMIZADA
-- ============================================
-- Esta función optimiza las consultas de perfiles con múltiples IDs
-- usando un JOIN con link_bio_profiles en una sola consulta

CREATE OR REPLACE FUNCTION get_profiles_batch(user_ids UUID[])
RETURNS TABLE (
  id UUID,
  name TEXT,
  username TEXT,
  avatar TEXT
) 
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    prof.id,
    COALESCE(prof.name, 'Usuario') as name,
    COALESCE(prof.username, 'usuario') as username,
    COALESCE(
      lbp.avatar,
      prof.avatar,
      format('https://api.dicebear.com/7.x/avataaars/svg?seed=%s', COALESCE(prof.username, 'user'))
    ) as avatar
  FROM profiles prof
  LEFT JOIN LATERAL (
    SELECT avatar 
    FROM link_bio_profiles 
    WHERE user_id = prof.id AND avatar IS NOT NULL 
    LIMIT 1
  ) lbp ON true
  WHERE prof.id = ANY(user_ids);
END;
$$;

-- ============================================
-- 3. ÍNDICES ADICIONALES PARA OPTIMIZACIÓN
-- ============================================

-- Primero, eliminar cualquier índice problemático que incluya campos TEXT grandes
-- Estos índices pueden causar error "index row requires X bytes, maximum size is 8191"
DROP INDEX IF EXISTS idx_link_bio_profiles_user_avatar;
DROP INDEX IF EXISTS idx_profiles_id_username_avatar;
DROP INDEX IF EXISTS idx_link_bio_profiles_user_id_optimized;

-- Índice compuesto para proyectos publicados ordenados por fecha
-- Este índice es crítico para la función get_projects_with_authors
CREATE INDEX IF NOT EXISTS idx_projects_published_created_at 
ON projects(status, created_at DESC) 
WHERE status = 'published';

-- Índice para optimizar JOINs con link_bio_profiles por user_id
-- NOTA: Solo indexamos user_id, NO incluimos avatar porque:
-- 1. PostgreSQL tiene un límite de 8191 bytes por fila de índice
-- 2. El campo 'avatar' es TEXT y puede contener URLs muy largas que exceden este límite
-- 3. El índice en user_id es suficiente para hacer JOINs rápidos
-- Verificar si ya existe un índice en user_id antes de crear uno nuevo
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'link_bio_profiles' 
    AND indexname = 'idx_link_bio_profiles_user_id'
  ) THEN
    CREATE INDEX idx_link_bio_profiles_user_id 
    ON link_bio_profiles(user_id);
  END IF;
END $$;

-- NOTA IMPORTANTE: No creamos índices que incluyan campos TEXT grandes (avatar, description, etc.) porque:
-- 1. PostgreSQL tiene un límite de 8191 bytes por fila de índice
-- 2. Los campos TEXT pueden contener datos muy largos que exceden este límite
-- 3. El índice en 'id' (clave primaria) ya existe y es suficiente para JOINs rápidos
-- 4. Los JOINs por id ya son eficientes gracias al índice primario en profiles

-- ============================================
-- 4. ACTUALIZAR ESTADÍSTICAS
-- ============================================
-- Actualizar estadísticas para que el planificador de consultas tome mejores decisiones

ANALYZE projects;
ANALYZE profiles;
ANALYZE link_bio_profiles;

-- ============================================
-- 5. FUNCIÓN PARA OBTENER PERFILES EN LOTE (ALTERNATIVA RPC)
-- ============================================
-- Esta función puede ser llamada desde el cliente usando RPC
-- en lugar de hacer múltiples consultas con .in()

CREATE OR REPLACE FUNCTION get_profiles_batch_rpc(user_ids UUID[])
RETURNS TABLE (
  id UUID,
  name TEXT,
  username TEXT,
  avatar TEXT,
  role TEXT
) 
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    prof.id,
    COALESCE(prof.name, 'Usuario') as name,
    COALESCE(prof.username, 'usuario') as username,
    COALESCE(
      lbp.avatar,
      prof.avatar,
      format('https://api.dicebear.com/7.x/avataaars/svg?seed=%s', COALESCE(prof.username, 'user'))
    ) as avatar,
    prof.role
  FROM profiles prof
  LEFT JOIN LATERAL (
    SELECT avatar 
    FROM link_bio_profiles 
    WHERE user_id = prof.id AND avatar IS NOT NULL 
    LIMIT 1
  ) lbp ON true
  WHERE prof.id = ANY(user_ids);
END;
$$;

-- ============================================
-- 6. COMENTARIOS
-- ============================================
COMMENT ON FUNCTION get_projects_with_authors IS 'Obtiene proyectos publicados con información de autores en una sola consulta optimizada. Reduce significativamente el tiempo de respuesta y el tamaño del payload comparado con múltiples consultas separadas.';
COMMENT ON FUNCTION get_profiles_batch IS 'Obtiene perfiles en lote con avatares optimizados. Usa JOIN con link_bio_profiles para obtener avatares en una sola consulta.';
COMMENT ON FUNCTION get_profiles_batch_rpc IS 'Versión RPC de get_profiles_batch que incluye el campo role. Puede ser llamada desde el cliente usando supabase.rpc() para evitar múltiples consultas con .in().';

