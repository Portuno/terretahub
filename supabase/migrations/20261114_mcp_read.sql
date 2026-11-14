-- Lecturas del MCP: auditoría y búsqueda en español.
-- Aplicar a mano. Si el insert de auditoría falla, la lectura igual responde.

create table if not exists public.mcp_audit (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  tool text not null,
  arguments jsonb not null default '{}'::jsonb,
  result jsonb,
  created_at timestamptz not null default now()
);

create index if not exists mcp_audit_user_created_idx
  on public.mcp_audit (user_id, created_at desc);

alter table public.mcp_audit enable row level security;

drop policy if exists mcp_audit_insert_own on public.mcp_audit;
create policy mcp_audit_insert_own
  on public.mcp_audit for insert
  with check (
    (auth.uid() is not null and user_id = auth.uid())
    or (auth.uid() is null and user_id is null)
  );

drop policy if exists mcp_audit_select_own on public.mcp_audit;
create policy mcp_audit_select_own
  on public.mcp_audit for select
  using (user_id = auth.uid());

grant insert on public.mcp_audit to anon, authenticated;
grant select on public.mcp_audit to authenticated;
revoke update, delete on public.mcp_audit from anon, authenticated;

create index if not exists agora_posts_content_fts_idx
  on public.agora_posts
  using gin (to_tsvector('spanish', coalesce(content, '')));

create index if not exists projects_search_fts_idx
  on public.projects
  using gin (
    to_tsvector(
      'spanish',
      coalesce(name, '') || ' ' || coalesce(slogan, '') || ' ' || coalesce(description, '')
    )
  );
