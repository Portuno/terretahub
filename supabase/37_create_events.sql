-- ============================================
-- TABLA: Events (Eventos)
-- ============================================

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  location_url TEXT, -- URL para ubicación virtual o mapa
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  image_url TEXT, -- Imagen del evento
  category TEXT, -- Categoría del evento (networking, workshop, conferencia, etc.)
  is_online BOOLEAN DEFAULT false,
  max_attendees INTEGER, -- NULL = sin límite
  registration_required BOOLEAN DEFAULT true,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'published', 'cancelled', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para eventos
CREATE INDEX IF NOT EXISTS idx_events_organizer_id ON events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at DESC);

-- ============================================
-- TABLA: Event Attendances (Asistencias a Eventos)
-- ============================================

CREATE TABLE IF NOT EXISTS event_attendances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'attended', 'cancelled')),
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id) -- Un usuario solo puede registrarse una vez por evento
);

-- Índices para asistencias
CREATE INDEX IF NOT EXISTS idx_event_attendances_event_id ON event_attendances(event_id);
CREATE INDEX IF NOT EXISTS idx_event_attendances_user_id ON event_attendances(user_id);
CREATE INDEX IF NOT EXISTS idx_event_attendances_status ON event_attendances(status);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendances ENABLE ROW LEVEL SECURITY;

-- Políticas para events
DROP POLICY IF EXISTS "Anyone can view published events" ON events;
DROP POLICY IF EXISTS "Authenticated users can create events" ON events;
DROP POLICY IF EXISTS "Organizers can update their events" ON events;
DROP POLICY IF EXISTS "Organizers can delete their events" ON events;

-- Cualquiera puede ver eventos publicados
CREATE POLICY "Anyone can view published events"
  ON events FOR SELECT
  USING (status = 'published');

-- Usuarios autenticados pueden ver sus propios eventos (incluso borradores y en revisión)
CREATE POLICY "Users can view their own events"
  ON events FOR SELECT
  USING (auth.uid() = organizer_id);

-- Admins pueden ver todos los eventos (incluyendo los en revisión)
CREATE POLICY "Admins can view all events"
  ON events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Usuarios autenticados pueden crear eventos
CREATE POLICY "Authenticated users can create events"
  ON events FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Organizadores pueden actualizar sus eventos
CREATE POLICY "Organizers can update their events"
  ON events FOR UPDATE
  USING (auth.uid() = organizer_id)
  WITH CHECK (auth.uid() = organizer_id);

-- Admins pueden actualizar cualquier evento (para aprobar/rechazar)
CREATE POLICY "Admins can update any event"
  ON events FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Organizadores pueden eliminar sus eventos
CREATE POLICY "Organizers can delete their events"
  ON events FOR DELETE
  USING (auth.uid() = organizer_id);

-- Políticas para event_attendances
DROP POLICY IF EXISTS "Anyone can view attendances for published events" ON event_attendances;
DROP POLICY IF EXISTS "Users can register for events" ON event_attendances;
DROP POLICY IF EXISTS "Users can update their own attendance" ON event_attendances;
DROP POLICY IF EXISTS "Users can cancel their own attendance" ON event_attendances;

-- Cualquiera puede ver asistencias de eventos publicados
CREATE POLICY "Anyone can view attendances for published events"
  ON event_attendances FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events 
      WHERE events.id = event_attendances.event_id 
      AND events.status = 'published'
    )
  );

-- Usuarios pueden ver sus propias asistencias
CREATE POLICY "Users can view their own attendances"
  ON event_attendances FOR SELECT
  USING (auth.uid() = user_id);

-- Usuarios autenticados pueden registrarse a eventos publicados
CREATE POLICY "Users can register for events"
  ON event_attendances FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' 
    AND auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM events 
      WHERE events.id = event_attendances.event_id 
      AND events.status = 'published'
      AND events.registration_required = true
      AND (events.max_attendees IS NULL OR 
           (SELECT COUNT(*) FROM event_attendances 
            WHERE event_id = events.id AND status != 'cancelled') < events.max_attendees)
    )
  );

-- Usuarios pueden actualizar su propia asistencia
CREATE POLICY "Users can update their own attendance"
  ON event_attendances FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Usuarios pueden cancelar su propia asistencia
CREATE POLICY "Users can cancel their own attendance"
  ON event_attendances FOR UPDATE
  USING (auth.uid() = user_id AND status = 'cancelled')
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger para actualizar updated_at en events
CREATE OR REPLACE FUNCTION update_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_events_updated_at ON events;
CREATE TRIGGER trigger_update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_events_updated_at();

-- ============================================
-- FUNCIONES AUXILIARES
-- ============================================

-- Función para obtener el número de asistentes registrados
CREATE OR REPLACE FUNCTION get_event_attendee_count(event_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM event_attendances
    WHERE event_id = event_uuid
    AND status != 'cancelled'
  );
END;
$$ LANGUAGE plpgsql;

-- Función para verificar si un usuario está registrado
CREATE OR REPLACE FUNCTION is_user_registered(event_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM event_attendances
    WHERE event_id = event_uuid
    AND user_id = user_uuid
    AND status != 'cancelled'
  );
END;
$$ LANGUAGE plpgsql;
