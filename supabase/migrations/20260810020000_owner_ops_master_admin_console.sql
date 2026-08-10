-- Owner Operations Stabilization — Master Admin Platform Console
-- Audited View As (impersonation) + support action audit. Additive only.

create table if not exists public.platform_impersonation_sessions (
  id uuid primary key default gen_random_uuid(),
  operator_user_id uuid not null references auth.users (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  target_role text not null
    check (target_role in (
      'property_manager',
      'organization_owner',
      'facility_manager',
      'facility_technician',
      'resident'
    )),
  target_user_id uuid references auth.users (id) on delete set null,
  mode text not null default 'read_only'
    check (mode in ('read_only', 'write_enabled')),
  reason text,
  started_at timestamptz not null default timezone('utc', now()),
  ended_at timestamptz,
  ended_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists platform_impersonation_sessions_operator_idx
  on public.platform_impersonation_sessions (operator_user_id, started_at desc);

create index if not exists platform_impersonation_sessions_org_idx
  on public.platform_impersonation_sessions (organization_id, started_at desc);

create index if not exists platform_impersonation_sessions_active_idx
  on public.platform_impersonation_sessions (operator_user_id)
  where ended_at is null;

create table if not exists public.platform_support_audit_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations (id) on delete set null,
  operator_user_id uuid not null references auth.users (id) on delete cascade,
  action text not null,
  entity_type text not null,
  entity_id text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists platform_support_audit_events_org_idx
  on public.platform_support_audit_events (organization_id, created_at desc);

create index if not exists platform_support_audit_events_operator_idx
  on public.platform_support_audit_events (operator_user_id, created_at desc);

alter table public.platform_impersonation_sessions enable row level security;
alter table public.platform_support_audit_events enable row level security;

-- Operators only (service role / platform operator paths use service client).
drop policy if exists platform_impersonation_sessions_operator on public.platform_impersonation_sessions;
create policy platform_impersonation_sessions_operator
on public.platform_impersonation_sessions
for all
to authenticated
using (public.is_platform_operator())
with check (public.is_platform_operator());

drop policy if exists platform_support_audit_events_operator on public.platform_support_audit_events;
create policy platform_support_audit_events_operator
on public.platform_support_audit_events
for all
to authenticated
using (public.is_platform_operator())
with check (public.is_platform_operator());
