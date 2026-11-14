-- Quedadas: zona del directorio y si el lugar es interior o exterior.
-- Aplicar a mano. No rellena filas viejas.

alter table public.events
  add column if not exists zone_id smallint references public.directory_zones(id);

alter table public.events
  add column if not exists venue_setting text;

alter table public.events
  drop constraint if exists events_venue_setting_check;

alter table public.events
  add constraint events_venue_setting_check
  check (venue_setting is null or venue_setting in ('interior', 'exterior'));
