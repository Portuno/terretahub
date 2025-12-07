-- ============================================
-- PROFILE ANALYTICS TABLES
-- ============================================
-- Tablas para tracking de estadísticas de perfiles

-- ============================================
-- PROFILE VIEWS TABLE
-- ============================================
-- Almacena las vistas de perfiles públicos
CREATE TABLE IF NOT EXISTS profile_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  device_type TEXT NOT NULL CHECK (device_type IN ('mobile', 'desktop', 'tablet', 'unknown')),
  user_agent TEXT,
  referrer TEXT,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Índices para profile_views
CREATE INDEX IF NOT EXISTS idx_profile_views_profile_user_id ON profile_views(profile_user_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_created_at ON profile_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profile_views_device_type ON profile_views(device_type);
CREATE INDEX IF NOT EXISTS idx_profile_views_profile_date ON profile_views(profile_user_id, created_at DESC);

-- ============================================
-- LINK CLICKS TABLE
-- ============================================
-- Almacena los clicks en enlaces de perfiles
CREATE TABLE IF NOT EXISTS link_clicks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  block_id TEXT NOT NULL,
  link_url TEXT NOT NULL,
  link_title TEXT,
  device_type TEXT NOT NULL CHECK (device_type IN ('mobile', 'desktop', 'tablet', 'unknown')),
  user_agent TEXT,
  referrer TEXT,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Índices para link_clicks
CREATE INDEX IF NOT EXISTS idx_link_clicks_profile_user_id ON link_clicks(profile_user_id);
CREATE INDEX IF NOT EXISTS idx_link_clicks_block_id ON link_clicks(block_id);
CREATE INDEX IF NOT EXISTS idx_link_clicks_created_at ON link_clicks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_link_clicks_device_type ON link_clicks(device_type);
CREATE INDEX IF NOT EXISTS idx_link_clicks_profile_date ON link_clicks(profile_user_id, created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_clicks ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILE VIEWS POLICIES
-- ============================================

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Anyone can insert profile views" ON profile_views;
DROP POLICY IF EXISTS "Users can view own profile views" ON profile_views;

-- Cualquiera puede insertar vistas (para tracking público)
CREATE POLICY "Anyone can insert profile views"
  ON profile_views FOR INSERT
  WITH CHECK (true);

-- Usuarios pueden ver las vistas de su propio perfil
CREATE POLICY "Users can view own profile views"
  ON profile_views FOR SELECT
  USING (auth.uid() = profile_user_id);

-- ============================================
-- LINK CLICKS POLICIES
-- ============================================

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Anyone can insert link clicks" ON link_clicks;
DROP POLICY IF EXISTS "Users can view own link clicks" ON link_clicks;

-- Cualquiera puede insertar clicks (para tracking público)
CREATE POLICY "Anyone can insert link clicks"
  ON link_clicks FOR INSERT
  WITH CHECK (true);

-- Usuarios pueden ver los clicks de su propio perfil
CREATE POLICY "Users can view own link clicks"
  ON link_clicks FOR SELECT
  USING (auth.uid() = profile_user_id);

-- ============================================
-- FUNCTIONS FOR ANALYTICS
-- ============================================

-- Función para obtener estadísticas de vistas de perfil (últimos 30 días)
CREATE OR REPLACE FUNCTION get_profile_views_stats(p_user_id UUID, days_back INTEGER DEFAULT 30)
RETURNS TABLE (
  total_views BIGINT,
  mobile_views BIGINT,
  desktop_views BIGINT,
  tablet_views BIGINT,
  views_today BIGINT,
  views_this_week BIGINT,
  views_this_month BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_views,
    COUNT(*) FILTER (WHERE device_type = 'mobile')::BIGINT as mobile_views,
    COUNT(*) FILTER (WHERE device_type = 'desktop')::BIGINT as desktop_views,
    COUNT(*) FILTER (WHERE device_type = 'tablet')::BIGINT as tablet_views,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE)::BIGINT as views_today,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days')::BIGINT as views_this_week,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days')::BIGINT as views_this_month
  FROM profile_views
  WHERE profile_user_id = p_user_id
    AND created_at >= CURRENT_DATE - (days_back || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener estadísticas de clicks en enlaces (últimos 30 días)
CREATE OR REPLACE FUNCTION get_link_clicks_stats(p_user_id UUID, days_back INTEGER DEFAULT 30)
RETURNS TABLE (
  total_clicks BIGINT,
  mobile_clicks BIGINT,
  desktop_clicks BIGINT,
  tablet_clicks BIGINT,
  clicks_today BIGINT,
  clicks_this_week BIGINT,
  clicks_this_month BIGINT,
  top_link_url TEXT,
  top_link_title TEXT,
  top_link_clicks BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH link_stats AS (
    SELECT 
      link_url,
      link_title,
      COUNT(*) as click_count
    FROM link_clicks
    WHERE profile_user_id = p_user_id
      AND created_at >= CURRENT_DATE - (days_back || ' days')::INTERVAL
    GROUP BY link_url, link_title
    ORDER BY click_count DESC
    LIMIT 1
  )
  SELECT 
    COUNT(*)::BIGINT as total_clicks,
    COUNT(*) FILTER (WHERE device_type = 'mobile')::BIGINT as mobile_clicks,
    COUNT(*) FILTER (WHERE device_type = 'desktop')::BIGINT as desktop_clicks,
    COUNT(*) FILTER (WHERE device_type = 'tablet')::BIGINT as tablet_clicks,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE)::BIGINT as clicks_today,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days')::BIGINT as clicks_this_week,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days')::BIGINT as clicks_this_month,
    COALESCE((SELECT link_url FROM link_stats), '')::TEXT as top_link_url,
    COALESCE((SELECT link_title FROM link_stats), '')::TEXT as top_link_title,
    COALESCE((SELECT click_count FROM link_stats), 0)::BIGINT as top_link_clicks
  FROM link_clicks
  WHERE profile_user_id = p_user_id
    AND created_at >= CURRENT_DATE - (days_back || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener clicks por enlace individual
CREATE OR REPLACE FUNCTION get_link_clicks_by_block(p_user_id UUID, p_block_id TEXT, days_back INTEGER DEFAULT 30)
RETURNS BIGINT AS $$
DECLARE
  click_count BIGINT;
BEGIN
  SELECT COUNT(*)::BIGINT INTO click_count
  FROM link_clicks
  WHERE profile_user_id = p_user_id
    AND block_id = p_block_id
    AND created_at >= CURRENT_DATE - (days_back || ' days')::INTERVAL;
  
  RETURN COALESCE(click_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
