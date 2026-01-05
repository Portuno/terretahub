-- ============================================
-- CLASIFICACIÓN DE PERFILES POR LINK IN BIO
-- ============================================
-- Este script modifica get_community_profiles para:
-- 1. Incluir información sobre si el perfil tiene link in bio
-- 2. Ordenar primero los perfiles con link in bio, luego los que no

-- ============================================
-- 1. MODIFICAR get_community_profiles
-- ============================================
-- Agregar campo has_link_bio y ordenar por este campo primero
-- Primero eliminamos la función existente porque estamos cambiando el tipo de retorno

DROP FUNCTION IF EXISTS get_community_profiles(INTEGER);

CREATE OR REPLACE FUNCTION get_community_profiles(limit_count INTEGER DEFAULT 50)
RETURNS TABLE (
  id UUID,
  name TEXT,
  username TEXT,
  avatar TEXT,
  role TEXT,
  has_link_bio BOOLEAN
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
    (lbp_check.user_id IS NOT NULL) as has_link_bio
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
  WHERE prof.show_in_community = true
  -- Ordenar primero los perfiles con link in bio, luego los que no
  -- Dentro de cada grupo, ordenar por fecha de creación descendente
  ORDER BY 
    (lbp_check.user_id IS NOT NULL) DESC,  -- TRUE primero (perfiles con link in bio)
    prof.created_at DESC
  LIMIT limit_count;
END;
$$;

-- ============================================
-- 2. COMENTARIOS
-- ============================================

COMMENT ON FUNCTION get_community_profiles IS 'Obtiene perfiles de comunidad. Filtra avatares base64 grandes para reducir payload. Incluye campo has_link_bio y ordena primero los perfiles con link in bio.';

