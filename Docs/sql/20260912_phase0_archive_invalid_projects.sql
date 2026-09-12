-- Fase 0 — archivar proyectos inválidos (vacíos / incompletos) que hayan
-- quedado en review o published.
-- Aplicar a mano en el SQL editor de Supabase. NO borra filas.
--
-- Revertir un id concreto:
--   UPDATE public.projects SET archived_at = NULL, status = 'published' WHERE id = '...';
-- (solo si el contenido ya cumple título/descripción/imagen)

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;

DO $$
BEGIN
  ALTER TABLE public.projects DISABLE TRIGGER trg_validate_project_content;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

UPDATE public.projects
SET status = 'draft',
    archived_at = now(),
    updated_at = now()
WHERE archived_at IS NULL
  AND status IN ('review', 'published')
  AND (
    char_length(btrim(coalesce(name, ''))) < 3
    OR char_length(btrim(coalesce(description, ''))) < 40
    OR coalesce(array_length(images, 1), 0) < 1
  );

CREATE OR REPLACE FUNCTION public.validate_project_content()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.archived_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

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
