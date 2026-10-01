-- Fase 1 — Directorio curado de Valencia (aditivo, no destructivo)
-- Aplicar a mano en el SQL Editor de Supabase.
-- Tablas nuevas: directory_zones, directory_subzones, directory_entities,
-- directory_events, user_directory_flags, user_directory_prefs.
-- NO toca projects/events UGC ni map_businesses.

-- ---------------------------------------------------------------------------
-- Helper is_admin (idempotente; firma usada en el resto del schema)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = COALESCE(user_id, auth.uid()) AND role = 'admin'
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- Zonas / subzonas (SSOT = rejilla del dataset JSON)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.directory_zones (
  id smallint PRIMARY KEY,
  name text NOT NULL,
  centroid_lat double precision,
  centroid_lon double precision,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.directory_subzones (
  id bigserial PRIMARY KEY,
  zone_id smallint NOT NULL REFERENCES public.directory_zones(id) ON DELETE CASCADE,
  idx smallint NOT NULL CHECK (idx >= 1 AND idx <= 6),
  name text NOT NULL,
  centroid_lat double precision,
  centroid_lon double precision,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (zone_id, idx)
);

CREATE INDEX IF NOT EXISTS idx_directory_subzones_zone
  ON public.directory_subzones (zone_id);

-- ---------------------------------------------------------------------------
-- Entidades (personas / orgs)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.directory_entities (
  id text PRIMARY KEY,
  name text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('fisica', 'juridica')),
  ambito text NOT NULL CHECK (ambito IN ('ciudad', 'producto')),
  cats text[] NOT NULL DEFAULT '{}',
  rol text,
  org text,
  description text,
  url text,
  tags text[] NOT NULL DEFAULT '{}',
  datos jsonb NOT NULL DEFAULT '[]'::jsonb,
  soc jsonb NOT NULL DEFAULT '[]'::jsonb,
  rel text[] NOT NULL DEFAULT '{}',
  dir text,
  geo_precision text CHECK (geo_precision IS NULL OR geo_precision IN ('sede', 'calle', 'barrio')),
  zone_id smallint REFERENCES public.directory_zones(id),
  subzone_id smallint,
  lat double precision,
  lon double precision,
  conf text NOT NULL CHECK (conf IN ('V', 'E', 'A')),
  flag text,
  fuentes text[] NOT NULL DEFAULT '{}',
  estado text,
  notas text,
  orden integer,
  visibility text NOT NULL DEFAULT 'published' CHECK (visibility IN ('published', 'hidden')),
  source_updated_at date,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT directory_entities_coords_pair CHECK (
    (lat IS NULL AND lon IS NULL) OR (lat IS NOT NULL AND lon IS NOT NULL)
  ),
  CONSTRAINT directory_entities_cats_allowed CHECK (
    cats <@ ARRAY[
      'emprendimiento','tecnologia','salud','arte','entretenimiento','publico'
    ]::text[]
  )
);

CREATE INDEX IF NOT EXISTS idx_directory_entities_cats ON public.directory_entities USING gin (cats);
CREATE INDEX IF NOT EXISTS idx_directory_entities_tags ON public.directory_entities USING gin (tags);
CREATE INDEX IF NOT EXISTS idx_directory_entities_zone ON public.directory_entities (zone_id);
CREATE INDEX IF NOT EXISTS idx_directory_entities_ambito ON public.directory_entities (ambito);
CREATE INDEX IF NOT EXISTS idx_directory_entities_tipo ON public.directory_entities (tipo);
CREATE INDEX IF NOT EXISTS idx_directory_entities_conf ON public.directory_entities (conf);
CREATE INDEX IF NOT EXISTS idx_directory_entities_visibility ON public.directory_entities (visibility);
CREATE INDEX IF NOT EXISTS idx_directory_entities_geo
  ON public.directory_entities (lat, lon) WHERE lat IS NOT NULL AND lon IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_directory_entities_name_trgm
  ON public.directory_entities (lower(name));

-- ---------------------------------------------------------------------------
-- Eventos / citas del directorio (distintos de quedadas UGC en public.events)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.directory_events (
  id text PRIMARY KEY,
  name text NOT NULL,
  ambito text NOT NULL CHECK (ambito IN ('ciudad', 'producto')),
  cats text[] NOT NULL DEFAULT '{}',
  description text,
  url text,
  ini date,
  fin date,
  lugar text,
  dir text,
  geo_precision text CHECK (geo_precision IS NULL OR geo_precision IN ('sede', 'calle', 'barrio')),
  zone_id smallint REFERENCES public.directory_zones(id),
  subzone_id smallint,
  lat double precision,
  lon double precision,
  recurrente boolean NOT NULL DEFAULT false,
  conf text NOT NULL CHECK (conf IN ('V', 'E', 'A')),
  flag text,
  fuentes text[] NOT NULL DEFAULT '{}',
  estado text,
  notas text,
  orden integer,
  visibility text NOT NULL DEFAULT 'published' CHECK (visibility IN ('published', 'hidden')),
  source_updated_at date,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT directory_events_coords_pair CHECK (
    (lat IS NULL AND lon IS NULL) OR (lat IS NOT NULL AND lon IS NOT NULL)
  ),
  CONSTRAINT directory_events_cats_allowed CHECK (
    cats <@ ARRAY[
      'emprendimiento','tecnologia','salud','arte','entretenimiento','publico'
    ]::text[]
  )
);

CREATE INDEX IF NOT EXISTS idx_directory_events_cats ON public.directory_events USING gin (cats);
CREATE INDEX IF NOT EXISTS idx_directory_events_zone ON public.directory_events (zone_id);
CREATE INDEX IF NOT EXISTS idx_directory_events_ambito ON public.directory_events (ambito);
CREATE INDEX IF NOT EXISTS idx_directory_events_conf ON public.directory_events (conf);
CREATE INDEX IF NOT EXISTS idx_directory_events_visibility ON public.directory_events (visibility);
CREATE INDEX IF NOT EXISTS idx_directory_events_ini ON public.directory_events (ini);
CREATE INDEX IF NOT EXISTS idx_directory_events_geo
  ON public.directory_events (lat, lon) WHERE lat IS NOT NULL AND lon IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Flags de usuario (guardar / me interesa / contactado)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_directory_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_type text NOT NULL CHECK (target_type IN ('entity', 'event')),
  target_id text NOT NULL,
  flag text NOT NULL CHECK (flag IN ('saved', 'interested', 'contacted')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, target_type, target_id, flag)
);

CREATE INDEX IF NOT EXISTS idx_user_directory_flags_user
  ON public.user_directory_flags (user_id);

-- ---------------------------------------------------------------------------
-- Preferencias / personalización «Para la Terreta»
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_directory_prefs (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  interest_tags text[] NOT NULL DEFAULT '{}',
  seeking text[] NOT NULL DEFAULT '{}',
  focus_mode text CHECK (focus_mode IS NULL OR focus_mode IN ('focus', 'explore')),
  zone_id smallint REFERENCES public.directory_zones(id),
  consent_personalization boolean NOT NULL DEFAULT false,
  consent_email_alerts boolean NOT NULL DEFAULT false,
  email_alerts_stub boolean NOT NULL DEFAULT false,
  onboarding_skipped boolean NOT NULL DEFAULT false,
  onboarding_completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.directory_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.directory_subzones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.directory_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.directory_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_directory_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_directory_prefs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "directory_zones_select_all" ON public.directory_zones;
CREATE POLICY "directory_zones_select_all"
  ON public.directory_zones FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "directory_zones_admin_write" ON public.directory_zones;
CREATE POLICY "directory_zones_admin_write"
  ON public.directory_zones FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "directory_subzones_select_all" ON public.directory_subzones;
CREATE POLICY "directory_subzones_select_all"
  ON public.directory_subzones FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "directory_subzones_admin_write" ON public.directory_subzones;
CREATE POLICY "directory_subzones_admin_write"
  ON public.directory_subzones FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "directory_entities_select_published" ON public.directory_entities;
CREATE POLICY "directory_entities_select_published"
  ON public.directory_entities FOR SELECT
  USING (visibility = 'published' OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "directory_entities_admin_write" ON public.directory_entities;
CREATE POLICY "directory_entities_admin_write"
  ON public.directory_entities FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "directory_events_select_published" ON public.directory_events;
CREATE POLICY "directory_events_select_published"
  ON public.directory_events FOR SELECT
  USING (visibility = 'published' OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "directory_events_admin_write" ON public.directory_events;
CREATE POLICY "directory_events_admin_write"
  ON public.directory_events FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "user_directory_flags_own" ON public.user_directory_flags;
CREATE POLICY "user_directory_flags_own"
  ON public.user_directory_flags FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_directory_prefs_own" ON public.user_directory_prefs;
CREATE POLICY "user_directory_prefs_own"
  ON public.user_directory_prefs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT SELECT ON public.directory_zones TO anon, authenticated;
GRANT SELECT ON public.directory_subzones TO anon, authenticated;
GRANT SELECT ON public.directory_entities TO anon, authenticated;
GRANT SELECT ON public.directory_events TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_directory_flags TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_directory_prefs TO authenticated;
