-- Espacio compartido PSCV. No almacena nóminas ni fichas de pacientes:
-- registra tareas de programa, agenda y enlaces a sistemas con sus propios permisos.
create table if not exists public.pscv_members (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.pscv_members enable row level security;
create policy pscv_member_self on public.pscv_members for select to authenticated using (user_id = auth.uid());

create table if not exists public.pscv_workspace_items (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('task', 'event', 'roster', 'resource', 'medication')),
  title text not null check (length(trim(title)) between 1 and 200),
  details text not null default '' check (length(details) <= 2000),
  item_date date,
  item_time time,
  category text not null default '',
  url text not null default '' check (url = '' or url ~ '^https://'),
  reference_id text not null default '',
  done boolean not null default false,
  archived boolean not null default false,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null default auth.uid() references auth.users(id),
  updated_by uuid not null default auth.uid() references auth.users(id),
  check (kind <> 'event' or item_date is not null),
  check (kind not in ('roster', 'resource') or url <> ''),
  check (kind <> 'medication' or reference_id <> '')
);
alter table public.pscv_workspace_items enable row level security;
create policy pscv_team_read on public.pscv_workspace_items for select to authenticated
  using (exists (select 1 from public.pscv_members where user_id = auth.uid()));
create policy pscv_team_insert on public.pscv_workspace_items for insert to authenticated
  with check (exists (select 1 from public.pscv_members where user_id = auth.uid()) and created_by = auth.uid());
create policy pscv_team_update on public.pscv_workspace_items for update to authenticated
  using (exists (select 1 from public.pscv_members where user_id = auth.uid()))
  with check (exists (select 1 from public.pscv_members where user_id = auth.uid()));
create or replace function public.pscv_stamp_update() returns trigger language plpgsql set search_path = public as $$
begin
  new.created_by := old.created_by;
  new.created_at := old.created_at;
  new.updated_by := auth.uid();
  new.updated_at := now();
  new.version := old.version + 1;
  return new;
end;
$$;
create trigger pscv_stamp before update on public.pscv_workspace_items for each row execute function public.pscv_stamp_update();
grant select on public.pscv_members to authenticated;
grant select, insert, update on public.pscv_workspace_items to authenticated;
-- Dos integrantes no pueden incorporar simultáneamente el mismo medicamento.
create unique index pscv_active_medication_unique on public.pscv_workspace_items (reference_id)
  where kind = 'medication' and archived = false;
