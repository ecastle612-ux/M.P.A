-- CORE-004 Phase 3 — Leasing Operations canonical workflow
-- Extends applicants + leases with enforced workflow_stage + shared audit trail.
-- ARCH-001: extend existing carriers — do not create a second leasing system.

-- ---------------------------------------------------------------------------
-- Applicants (prospect → approval)
-- ---------------------------------------------------------------------------
alter table public.applicants
  add column if not exists workflow_stage text;

update public.applicants
set workflow_stage = case status
  when 'submitted' then 'application'
  when 'awaiting_documents' then 'application'
  when 'screening_in_progress' then 'screening'
  when 'pending_review' then 'approval'
  when 'approved' then 'approval'
  when 'converted_to_resident' then 'resident'
  when 'declined' then 'archive'
  when 'withdrawn' then 'archive'
  else 'prospect'
end
where workflow_stage is null;

alter table public.applicants
  alter column workflow_stage set default 'prospect';

alter table public.applicants
  alter column workflow_stage set not null;

alter table public.applicants
  drop constraint if exists applicants_workflow_stage_check;

alter table public.applicants
  add constraint applicants_workflow_stage_check
  check (
    workflow_stage in (
      'prospect',
      'inquiry',
      'lead_qualification',
      'tour_scheduling',
      'property_showing',
      'application',
      'screening',
      'approval',
      'lease_generation',
      'signwell_signature',
      'move_in_preparation',
      'move_in',
      'resident',
      'renewal',
      'move_out',
      'archive'
    )
  );

comment on column public.applicants.workflow_stage is
  'CORE-004 Phase 3 — canonical leasing lifecycle stage (applicant carrier for early stages).';

create index if not exists applicants_org_workflow_stage_idx
  on public.applicants (organization_id, workflow_stage)
  where deleted_at is null;

-- ---------------------------------------------------------------------------
-- Leases (lease_generation → archive)
-- ---------------------------------------------------------------------------
alter table public.leases
  add column if not exists workflow_stage text;

update public.leases
set workflow_stage = case
  when renewal_status in ('offered', 'pending') then 'renewal'
  when status = 'signed' then 'signwell_signature'
  when status = 'active' then 'resident'
  when status = 'expired' then 'move_out'
  when status = 'terminated' then 'archive'
  else 'lease_generation'
end
where workflow_stage is null;

alter table public.leases
  alter column workflow_stage set default 'lease_generation';

alter table public.leases
  alter column workflow_stage set not null;

alter table public.leases
  drop constraint if exists leases_workflow_stage_check;

alter table public.leases
  add constraint leases_workflow_stage_check
  check (
    workflow_stage in (
      'prospect',
      'inquiry',
      'lead_qualification',
      'tour_scheduling',
      'property_showing',
      'application',
      'screening',
      'approval',
      'lease_generation',
      'signwell_signature',
      'move_in_preparation',
      'move_in',
      'resident',
      'renewal',
      'move_out',
      'archive'
    )
  );

comment on column public.leases.workflow_stage is
  'CORE-004 Phase 3 — canonical leasing lifecycle stage (lease carrier for post-approval stages).';

create index if not exists leases_org_workflow_stage_idx
  on public.leases (organization_id, workflow_stage)
  where deleted_at is null;

-- ---------------------------------------------------------------------------
-- Shared append-only leasing workflow audit
-- ---------------------------------------------------------------------------
create table if not exists public.leasing_workflow_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  applicant_id uuid references public.applicants (id) on delete set null,
  lease_id uuid references public.leases (id) on delete set null,
  property_id uuid references public.properties (id) on delete set null,
  from_stage text,
  to_stage text not null,
  actor_user_id uuid,
  reason text,
  automation jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint leasing_workflow_events_subject_check check (
    applicant_id is not null or lease_id is not null
  )
);

create index if not exists leasing_workflow_events_lease_idx
  on public.leasing_workflow_events (lease_id, created_at desc);

create index if not exists leasing_workflow_events_applicant_idx
  on public.leasing_workflow_events (applicant_id, created_at desc);

create index if not exists leasing_workflow_events_org_idx
  on public.leasing_workflow_events (organization_id, created_at desc);

alter table public.leasing_workflow_events enable row level security;

drop policy if exists leasing_workflow_events_select on public.leasing_workflow_events;
create policy leasing_workflow_events_select
  on public.leasing_workflow_events
  for select
  to authenticated
  using (
    public.has_org_capability(organization_id, 'lease:read')
    or public.has_org_capability(organization_id, 'applicant:read')
  );

drop policy if exists leasing_workflow_events_insert on public.leasing_workflow_events;
create policy leasing_workflow_events_insert
  on public.leasing_workflow_events
  for insert
  to authenticated
  with check (
    public.has_org_capability(organization_id, 'lease:update')
    or public.has_org_capability(organization_id, 'applicant:update')
  );

comment on table public.leasing_workflow_events is
  'CORE-004 Phase 3 — append-only leasing workflow transition audit (single machine).';
