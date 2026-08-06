-- CORE-004 Phase 4 — Resident Operations canonical workflow
-- Single carrier: tenants.workflow_stage. One resident identity for all domains.

alter table public.tenants
  add column if not exists workflow_stage text;

update public.tenants
set workflow_stage = case lifecycle_status
  when 'awaiting_signature' then 'lease_signed'
  when 'awaiting_move_in' then 'move_in_scheduled'
  when 'active' then 'active_resident'
  when 'notice_given' then 'renewal'
  when 'moving_out' then 'move_out_scheduled'
  when 'former' then 'former_resident'
  else 'applicant'
end
where workflow_stage is null;

alter table public.tenants
  alter column workflow_stage set default 'applicant';

alter table public.tenants
  alter column workflow_stage set not null;

alter table public.tenants
  drop constraint if exists tenants_workflow_stage_check;

alter table public.tenants
  add constraint tenants_workflow_stage_check
  check (
    workflow_stage in (
      'applicant',
      'approved',
      'lease_signed',
      'move_in_scheduled',
      'move_in_complete',
      'active_resident',
      'community_participation',
      'maintenance',
      'payments',
      'renewal',
      'move_out_scheduled',
      'former_resident',
      'archive'
    )
  );

comment on column public.tenants.workflow_stage is
  'CORE-004 Phase 4 — canonical resident lifecycle stage (sole resident identity carrier).';

create index if not exists tenants_org_workflow_stage_idx
  on public.tenants (organization_id, workflow_stage)
  where deleted_at is null;

-- Append-only resident workflow audit
create table if not exists public.resident_workflow_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  property_id uuid references public.properties (id) on delete set null,
  from_stage text,
  to_stage text not null,
  actor_user_id uuid,
  reason text,
  automation jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists resident_workflow_events_tenant_idx
  on public.resident_workflow_events (tenant_id, created_at desc);

create index if not exists resident_workflow_events_org_idx
  on public.resident_workflow_events (organization_id, created_at desc);

alter table public.resident_workflow_events enable row level security;

drop policy if exists resident_workflow_events_select on public.resident_workflow_events;
create policy resident_workflow_events_select
  on public.resident_workflow_events
  for select
  to authenticated
  using (public.has_org_capability(organization_id, 'tenant:read'));

drop policy if exists resident_workflow_events_insert on public.resident_workflow_events;
create policy resident_workflow_events_insert
  on public.resident_workflow_events
  for insert
  to authenticated
  with check (public.has_org_capability(organization_id, 'tenant:update'));

comment on table public.resident_workflow_events is
  'CORE-004 Phase 4 — append-only resident workflow transition audit (single machine).';
