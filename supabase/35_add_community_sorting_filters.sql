-- ============================================
-- AGREGAR FILTROS DE ORDENAMIENTO A COMUNIDAD
-- ============================================
-- Este script modifica get_community_profiles para incluir:
-- 1. Campo created_at para ordenar por fecha de registro
-- 2. Campo profile_views_count para ordenar por cantidad de visitas
-- 3. Mantiene el ordenamiento por has_link_bio (perfiles completos primero)

-- ============================================
-- 1. MODIFICAR get_community_profiles
-- ============================================
-- Agregar campos created_at y profile_views_count

DROP FUNCTION IF EXISTS get_community_profiles(INTEGER);

CREATE OR REPLACE FUNCTION get_community_profiles(limit_count INTEGER DEFAULT 50)
RETURNS TABLE (
  id UUID,
  name TEXT,
  username TEXT,
  avatar TEXT,
  role TEXT,
  has_link_bio BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  profile_views_count BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    prof.id,
    COALESCE(prof.name, 'Usuario') as name,
    COALESCE(prof.username, 'usuario') as username,
    -- Filtrar avatares base64 grandes
    CASE 
      WHEN prof.avatar IS NOT NULL AND length(prof.avatar) > 500 AND prof.avatar LIKE 'data:image%' THEN
        format('https://api.dicebear.com/7.x/avataaars/svg?seed=%s', COALESCE(prof.username, 'user'))
      WHEN lbp.avatar IS NOT NULL AND length(lbp.avatar) > 500 AND lbp.avatar LIKE 'data:image%' THEN
        format('https://api.dicebear.com/7.x/avataaars/svg?seed=%s', COALESCE(prof.username, 'user'))
      WHEN lbp.avatar IS NOT NULL AND (length(lbp.avatar) <= 500 OR NOT lbp.avatar LIKE 'data:image%') THEN
        lbp.avatar
      WHEN prof.avatar IS NOT NULL AND (length(prof.avatar) <= 500 OR NOT prof.avatar LIKE 'data:image%') THEN
        prof.avatar
      ELSE
        format('https://api.dicebear.com/7.x/avataaars/svg?seed=%s', COALESCE(prof.username, 'user'))
    END as avatar,
    prof.role,
    -- Verificar si el perfil tiene link_bio_profile
    (lbp_check.user_id IS NOT NULL) as has_link_bio,
    -- Fecha de creación del perfil
    prof.created_at,
    -- Conteo de visitas al perfil
    COALESCE(views_count.count, 0)::BIGINT as profile_views_count
  FROM profiles prof
  LEFT JOIN LATERAL (
    SELECT link_bio_profiles.avatar as avatar
    FROM link_bio_profiles 
    WHERE link_bio_profiles.user_id = prof.id 
      AND link_bio_profiles.avatar IS NOT NULL
      AND (length(link_bio_profiles.avatar) <= 500 OR NOT link_bio_profiles.avatar LIKE 'data:image%')
    LIMIT 1
  ) lbp ON true
  LEFT JOIN LATERAL (
    SELECT link_bio_profiles.user_id
    FROM link_bio_profiles 
    WHERE link_bio_profiles.user_id = prof.id
    LIMIT 1
  ) lbp_check ON true
  LEFT JOIN LATERAL (
    SELECT COUNT(*)::BIGINT as count
    FROM profile_views
    WHERE profile_views.profile_user_id = prof.id
  ) views_count ON true
  WHERE prof.show_in_community = true
  -- Ordenar primero los perfiles con link in bio, luego los que no
  -- Dentro de cada grupo, ordenar por fecha de creación descendente (por defecto)
  ORDER BY 
    (lbp_check.user_id IS NOT NULL) DESC,  -- TRUE primero (perfiles con link in bio)
    prof.created_at DESC
  LIMIT limit_count;
END;
$$;

-- ============================================
-- 2. AGREGAR POLÍTICA RLS PARA PERMITIR CONTEO DE VISITAS
-- ============================================
-- Necesitamos permitir que la función pueda leer los conteos de visitas
-- para todos los perfiles (solo los conteos agregados, no los datos individuales)

-- Crear política que permita leer conteos agregados de visitas para la función
-- Esta política permite que cualquier usuario vea los conteos de visitas
-- (necesario para el ordenamiento en la comunidad)
DROP POLICY IF EXISTS "Anyone can view profile view counts" ON profile_views;

-- Nota: En lugar de crear una política que permita leer todo, 
-- usamos SECURITY DEFINER en la función para que pueda leer los conteos
-- La función ya está configurada como SECURITY DEFINER arriba

-- ============================================
-- 3. COMENTARIOS
-- ============================================

COMMENT ON FUNCTION get_community_profiles IS 'Obtiene perfiles de comunidad. Incluye campos created_at y profile_views_count para filtros de ordenamiento. Filtra avatares base64 grandes para reducir payload. Incluye campo has_link_bio y ordena primero los perfiles con link in bio. Usa SECURITY DEFINER para poder contar visitas de todos los perfiles.';
