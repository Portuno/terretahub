-- Frase corta de lo que un proyecto busca. Si tiene texto, la tarjeta dice que busca colaboradores.
-- Aplicar a mano. No rellena proyectos viejos.

alter table public.projects
  add column if not exists need_summary text;

alter table public.projects
  drop constraint if exists projects_need_summary_len;

alter table public.projects
  add constraint projects_need_summary_len
  check (need_summary is null or char_length(need_summary) <= 120);
