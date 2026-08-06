-- CORE-004 Phase 5 — Vendor Operations canonical workflow
-- Single carrier: vendors.workflow_stage. Maintenance jobs remain on Phase 2.

alter table public.vendors
  add column if not exists workflow_stage text;

update public.vendors
set workflow_stage = case
  when status = 'archived' then 'archived'
  when status = 'inactive' then 'inactive'
  when preferred_vendor is true then 'preferred_vendor'
  when status = 'active' then 'available'
  else 'prospective_vendor'
end
where workflow_stage is null;

alter table public.vendors
  alter column workflow_stage set default 'prospective_vendor';

alter table public.vendors
  alter column workflow_stage set not null;

alter table public.vendors
  drop constraint if exists vendors_workflow_stage_check;

alter table public.vendors
  add constraint vendors_workflow_stage_check
  check (
    workflow_stage in (
      'prospective_vendor',
      'invited',
      'application_submitted',
      'compliance_review',
      'insurance_verification',
      'approved',
      'available',
      'assigned',
      'work_in_progress',
      'invoice_submitted',
      'payment_pending',
      'paid',
      'performance_review',
      'preferred_vendor',
      'suspended',
      'inactive',
      'archived'
    )
  );

comment on column public.vendors.workflow_stage is
  'CORE-004 Phase 5 — canonical vendor lifecycle stage (sole vendor identity carrier).';

create index if not exists vendors_org_workflow_stage_idx
  on public.vendors (organization_id, workflow_stage)
  where deleted_at is null;

create table if not exists public.vendor_workflow_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  from_stage text,
  to_stage text not null,
  actor_user_id uuid,
  reason text,
  automation jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists vendor_workflow_events_vendor_idx
  on public.vendor_workflow_events (vendor_id, created_at desc);

create index if not exists vendor_workflow_events_org_idx
  on public.vendor_workflow_events (organization_id, created_at desc);

alter table public.vendor_workflow_events enable row level security;

drop policy if exists vendor_workflow_events_select on public.vendor_workflow_events;
create policy vendor_workflow_events_select
  on public.vendor_workflow_events
  for select
  to authenticated
  using (public.has_org_capability(organization_id, 'vendor:read'));

drop policy if exists vendor_workflow_events_insert on public.vendor_workflow_events;
create policy vendor_workflow_events_insert
  on public.vendor_workflow_events
  for insert
  to authenticated
  with check (public.has_org_capability(organization_id, 'vendor:update'));

comment on table public.vendor_workflow_events is
  'CORE-004 Phase 5 — append-only vendor workflow transition audit (single machine).';
