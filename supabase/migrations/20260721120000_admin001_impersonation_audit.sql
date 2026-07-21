-- ADMIN-001: Master Admin impersonation / portal test audit trail
-- Authenticated subject remains Master Admin; effective subject is session-scoped.

create table if not exists public.master_admin_impersonation_sessions (
  id uuid primary key default gen_random_uuid(),
  master_admin_user_id uuid not null references auth.users (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  mode text not null check (mode in ('portal_test', 'impersonate')),
  portal text check (portal is null or portal in ('resident', 'vendor', 'owner', 'manager')),
  target_user_id uuid references auth.users (id) on delete set null,
  target_display_name text,
  target_role_label text,
  reason text,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  constraint master_admin_impersonation_sessions_target_chk check (
    (mode = 'portal_test' and portal is not null)
    or (mode = 'impersonate' and target_user_id is not null)
  )
);

create index if not exists master_admin_impersonation_sessions_admin_idx
  on public.master_admin_impersonation_sessions (master_admin_user_id, started_at desc);

create index if not exists master_admin_impersonation_sessions_org_idx
  on public.master_admin_impersonation_sessions (organization_id, started_at desc);

create index if not exists master_admin_impersonation_sessions_active_idx
  on public.master_admin_impersonation_sessions (master_admin_user_id)
  where ended_at is null;

create table if not exists public.master_admin_impersonation_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null
    references public.master_admin_impersonation_sessions (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  actor_user_id uuid not null references auth.users (id) on delete cascade,
  event_type text not null check (event_type in ('page_visit', 'sensitive_action', 'note')),
  pathname text,
  entity_type text,
  entity_id text,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists master_admin_impersonation_events_session_idx
  on public.master_admin_impersonation_events (session_id, created_at asc);

alter table public.master_admin_impersonation_sessions enable row level security;
alter table public.master_admin_impersonation_events enable row level security;

drop policy if exists master_admin_impersonation_sessions_select on public.master_admin_impersonation_sessions;
create policy master_admin_impersonation_sessions_select
  on public.master_admin_impersonation_sessions
  for select
  using (
    master_admin_user_id = auth.uid()
    or public.has_org_capability(organization_id, 'master_admin')
  );

drop policy if exists master_admin_impersonation_sessions_insert on public.master_admin_impersonation_sessions;
create policy master_admin_impersonation_sessions_insert
  on public.master_admin_impersonation_sessions
  for insert
  with check (
    master_admin_user_id = auth.uid()
    and public.has_org_capability(organization_id, 'master_admin')
  );

drop policy if exists master_admin_impersonation_sessions_update on public.master_admin_impersonation_sessions;
create policy master_admin_impersonation_sessions_update
  on public.master_admin_impersonation_sessions
  for update
  using (
    master_admin_user_id = auth.uid()
    and public.has_org_capability(organization_id, 'master_admin')
  )
  with check (
    master_admin_user_id = auth.uid()
    and public.has_org_capability(organization_id, 'master_admin')
  );

drop policy if exists master_admin_impersonation_events_select on public.master_admin_impersonation_events;
create policy master_admin_impersonation_events_select
  on public.master_admin_impersonation_events
  for select
  using (
    actor_user_id = auth.uid()
    or public.has_org_capability(organization_id, 'master_admin')
  );

drop policy if exists master_admin_impersonation_events_insert on public.master_admin_impersonation_events;
create policy master_admin_impersonation_events_insert
  on public.master_admin_impersonation_events
  for insert
  with check (
    actor_user_id = auth.uid()
    and public.has_org_capability(organization_id, 'master_admin')
  );
