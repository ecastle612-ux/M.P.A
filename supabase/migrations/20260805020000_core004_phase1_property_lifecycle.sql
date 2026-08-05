-- CORE-004 Phase 1 — Property Lifecycle operational system
-- Extends Phase 4 properties with enforced lifecycle_stage + audit trail.

-- ---------------------------------------------------------------------------
-- 1) lifecycle_stage on properties
-- ---------------------------------------------------------------------------
alter table public.properties
  add column if not exists lifecycle_stage text;

update public.properties
set lifecycle_stage = case status
  when 'draft' then 'configuration'
  when 'active' then 'operational'
  when 'inactive' then 'disposition'
  when 'archived' then 'archived'
  else 'prospect'
end
where lifecycle_stage is null;

alter table public.properties
  alter column lifecycle_stage set default 'prospect';

alter table public.properties
  alter column lifecycle_stage set not null;

alter table public.properties
  drop constraint if exists properties_lifecycle_stage_check;

alter table public.properties
  add constraint properties_lifecycle_stage_check
  check (
    lifecycle_stage in (
      'prospect',
      'acquisition',
      'onboarding',
      'organization_assignment',
      'configuration',
      'activation',
      'operational',
      'occupancy',
      'turnover',
      'disposition',
      'archived'
    )
  );

comment on column public.properties.lifecycle_stage is
  'CORE-004 Phase 1 operational lifecycle stage. Transitions enforced in application + audited.';

create index if not exists properties_org_lifecycle_stage_idx
  on public.properties (organization_id, lifecycle_stage)
  where deleted_at is null;

-- ---------------------------------------------------------------------------
-- 2) Lifecycle audit / transition log
-- ---------------------------------------------------------------------------
create table if not exists public.property_lifecycle_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  property_id uuid not null references public.properties (id) on delete cascade,
  from_stage text,
  to_stage text not null,
  actor_user_id uuid,
  reason text,
  automation jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists property_lifecycle_events_property_idx
  on public.property_lifecycle_events (property_id, created_at desc);

create index if not exists property_lifecycle_events_org_idx
  on public.property_lifecycle_events (organization_id, created_at desc);

alter table public.property_lifecycle_events enable row level security;

drop policy if exists property_lifecycle_events_select on public.property_lifecycle_events;
create policy property_lifecycle_events_select
  on public.property_lifecycle_events
  for select
  to authenticated
  using (public.has_org_capability(organization_id, 'property:read'));

drop policy if exists property_lifecycle_events_insert on public.property_lifecycle_events;
create policy property_lifecycle_events_insert
  on public.property_lifecycle_events
  for insert
  to authenticated
  with check (public.has_org_capability(organization_id, 'property:update'));

comment on table public.property_lifecycle_events is
  'CORE-004 Phase 1 — immutable-style lifecycle transition audit (append-only via app).';
