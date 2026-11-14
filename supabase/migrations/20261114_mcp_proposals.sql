-- Borradores del MCP. El id lo genera la base. Solo pasa a executed en el mismo paso que escribe el contenido.
-- Aplicar a mano.

create table if not exists public.mcp_proposals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tool text not null,
  draft jsonb not null,
  payload_hash text not null,
  status text not null default 'proposed' check (status in ('proposed', 'executed')),
  created_at timestamptz not null default now()
);

create index if not exists mcp_proposals_user_idx
  on public.mcp_proposals (user_id, created_at desc);

alter table public.mcp_proposals enable row level security;

drop policy if exists mcp_proposals_insert_own on public.mcp_proposals;
create policy mcp_proposals_insert_own
  on public.mcp_proposals for insert
  with check (auth.uid() = user_id and status = 'proposed');

drop policy if exists mcp_proposals_select_own on public.mcp_proposals;
create policy mcp_proposals_select_own
  on public.mcp_proposals for select
  using (auth.uid() = user_id);

drop policy if exists mcp_proposals_execute_own on public.mcp_proposals;
create policy mcp_proposals_execute_own
  on public.mcp_proposals for update
  using (auth.uid() = user_id and status = 'proposed')
  with check (auth.uid() = user_id and status = 'executed');

grant select, insert, update on public.mcp_proposals to authenticated;
revoke delete on public.mcp_proposals from anon, authenticated;
