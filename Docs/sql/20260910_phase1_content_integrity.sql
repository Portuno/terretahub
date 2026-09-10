-- Fase 1 — integridad de contenido (proyectos, eventos, recursos, postulaciones)
-- Aplicar a mano en el SQL editor de Supabase cuando corresponda.
-- No borra filas. Los UPDATE de limpieza son reversibles (status).
--
-- IMPORTANTE: los bloques 1 y 6 cambian status en producción de forma reversible.
-- Revisá el resultado con SELECT antes de dejarlos definitivos.

-- ---------------------------------------------------------------------------
-- 1) Limpieza segura (opcional, reversible): archivar proyectos vacíos
--    que hayan quedado en review/published sin título, descripción o imagen.
--    No ejecutes DELETE. Si querés revertir: pasar esos ids de draft a review.
-- ---------------------------------------------------------------------------
UPDATE public.projects
SET status = 'draft',
    updated_at = now()
WHERE status IN ('review', 'published')
  AND (
    btrim(coalesce(name, '')) = ''
    OR char_length(btrim(coalesce(description, ''))) < 40
    OR coalesce(array_length(images, 1), 0) < 1
  );

-- ---------------------------------------------------------------------------
-- 2) Validación de proyectos en INSERT/UPDATE (equivalente al front)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.validate_project_content()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF btrim(coalesce(NEW.name, '')) = '' OR char_length(btrim(NEW.name)) < 3 THEN
    RAISE EXCEPTION 'El proyecto necesita un título de al menos 3 caracteres'
      USING ERRCODE = '23514';
  END IF;

  IF NEW.status IN ('review', 'published') THEN
    IF char_length(btrim(coalesce(NEW.slogan, ''))) < 8 THEN
      RAISE EXCEPTION 'El proyecto necesita un slogan de al menos 8 caracteres'
        USING ERRCODE = '23514';
    END IF;

    IF char_length(btrim(coalesce(NEW.description, ''))) < 40 THEN
      RAISE EXCEPTION 'El proyecto necesita una descripción de al menos 40 caracteres'
        USING ERRCODE = '23514';
    END IF;

    IF coalesce(array_length(NEW.images, 1), 0) < 1 THEN
      RAISE EXCEPTION 'El proyecto necesita al menos una imagen'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_project_content ON public.projects;
CREATE TRIGGER trg_validate_project_content
BEFORE INSERT OR UPDATE ON public.projects
FOR EACH ROW
EXECUTE PROCEDURE public.validate_project_content();

-- ---------------------------------------------------------------------------
-- 3) Validación de eventos en INSERT/UPDATE
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.validate_event_content()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF btrim(coalesce(NEW.title, '')) = '' OR char_length(btrim(NEW.title)) < 3 THEN
    RAISE EXCEPTION 'El evento necesita un título de al menos 3 caracteres'
      USING ERRCODE = '23514';
  END IF;

  IF char_length(btrim(coalesce(NEW.description, ''))) < 20 THEN
    RAISE EXCEPTION 'El evento necesita una descripción de al menos 20 caracteres'
      USING ERRCODE = '23514';
  END IF;

  IF TG_OP = 'INSERT' AND NEW.start_date IS NOT NULL AND NEW.start_date <= now() THEN
    RAISE EXCEPTION 'La quedada tiene que ser en el futuro'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_event_content ON public.events;
CREATE TRIGGER trg_validate_event_content
BEFORE INSERT OR UPDATE ON public.events
FOR EACH ROW
EXECUTE PROCEDURE public.validate_event_content();

-- ---------------------------------------------------------------------------
-- 4) Recursos / L'Almoina: no aceptar pedidos vacíos
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.validate_resource_need_content()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF char_length(btrim(coalesce(NEW.details, ''))) < 12 THEN
    RAISE EXCEPTION 'El pedido necesita más detalle (mínimo 12 caracteres)'
      USING ERRCODE = '23514';
  END IF;

  IF NEW.verticals IS NULL OR coalesce(array_length(NEW.verticals, 1), 0) < 1 THEN
    RAISE EXCEPTION 'El pedido necesita al menos una vertical'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_resource_need_content ON public.resource_needs;
CREATE TRIGGER trg_validate_resource_need_content
BEFORE INSERT OR UPDATE ON public.resource_needs
FOR EACH ROW
EXECUTE PROCEDURE public.validate_resource_need_content();

-- ---------------------------------------------------------------------------
-- 5) No postular a eventos ya terminados
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prevent_attendance_on_past_events()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  event_end timestamptz;
BEGIN
  IF NEW.status IS NULL OR NEW.status IN ('cancelled') THEN
    RETURN NEW;
  END IF;

  SELECT end_date INTO event_end
  FROM public.events
  WHERE id = NEW.event_id;

  IF event_end IS NOT NULL AND event_end < now() THEN
    RAISE EXCEPTION 'No se puede postular a un evento ya finalizado'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_attendance_on_past_events ON public.event_attendances;
CREATE TRIGGER trg_prevent_attendance_on_past_events
BEFORE INSERT OR UPDATE OF status ON public.event_attendances
FOR EACH ROW
EXECUTE PROCEDURE public.prevent_attendance_on_past_events();

-- ---------------------------------------------------------------------------
-- 6) Limpieza segura (opcional, reversible): cerrar postulaciones pendientes
--    de eventos ya terminados. Reversible cambiando status a pending en esos ids.
-- ---------------------------------------------------------------------------
UPDATE public.event_attendances ea
SET status = 'cancelled'
FROM public.events e
WHERE ea.event_id = e.id
  AND ea.status = 'pending'
  AND e.end_date < now();
