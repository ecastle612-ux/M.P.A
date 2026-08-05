-- CORE-004 Phase 2 — Maintenance Operations canonical workflow
-- Extends Phase 6 work orders with enforced workflow_stage + audit trail.
-- ARCH-001: extend maintenance_work_orders — do not create a second WO system.

alter table public.maintenance_work_orders
  add column if not exists workflow_stage text;

update public.maintenance_work_orders
set workflow_stage = case status
  when 'submitted' then 'request'
  when 'triaged' then 'triage'
  when 'assigned' then 'assignment'
  when 'in_progress' then 'field_execution'
  when 'vendor_on_site' then 'vendor_escalation'
  when 'awaiting_approval' then 'quality_review'
  when 'on_hold' then 'triage'
  when 'completed' then 'completion'
  when 'cancelled' then 'completion'
  else 'request'
end
where workflow_stage is null;

alter table public.maintenance_work_orders
  alter column workflow_stage set default 'request';

alter table public.maintenance_work_orders
  alter column workflow_stage set not null;

alter table public.maintenance_work_orders
  drop constraint if exists maintenance_work_orders_workflow_stage_check;

alter table public.maintenance_work_orders
  add constraint maintenance_work_orders_workflow_stage_check
  check (
    workflow_stage in (
      'request',
      'intake',
      'triage',
      'priority_classification',
      'assignment',
      'scheduling',
      'dispatch',
      'field_execution',
      'vendor_escalation',
      'quality_review',
      'resident_confirmation',
      'completion',
      'analytics'
    )
  );

comment on column public.maintenance_work_orders.workflow_stage is
  'CORE-004 Phase 2 — single canonical maintenance lifecycle stage. All entry points converge here.';

create index if not exists maintenance_wo_org_workflow_stage_idx
  on public.maintenance_work_orders (organization_id, workflow_stage)
  where deleted_at is null;

-- Workflow transition audit
create table if not exists public.maintenance_workflow_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  work_order_id uuid not null references public.maintenance_work_orders (id) on delete cascade,
  property_id uuid references public.properties (id) on delete set null,
  from_stage text,
  to_stage text not null,
  actor_user_id uuid,
  reason text,
  automation jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists maintenance_workflow_events_wo_idx
  on public.maintenance_workflow_events (work_order_id, created_at desc);

create index if not exists maintenance_workflow_events_org_idx
  on public.maintenance_workflow_events (organization_id, created_at desc);

alter table public.maintenance_workflow_events enable row level security;

drop policy if exists maintenance_workflow_events_select on public.maintenance_workflow_events;
create policy maintenance_workflow_events_select
  on public.maintenance_workflow_events
  for select
  to authenticated
  using (public.has_org_capability(organization_id, 'maintenance:read'));

drop policy if exists maintenance_workflow_events_insert on public.maintenance_workflow_events;
create policy maintenance_workflow_events_insert
  on public.maintenance_workflow_events
  for insert
  to authenticated
  with check (public.has_org_capability(organization_id, 'maintenance:update'));

comment on table public.maintenance_workflow_events is
  'CORE-004 Phase 2 — append-only maintenance workflow transition audit.';
