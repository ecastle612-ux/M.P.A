-- Phase 5 Sprint 1 — Leasing & Applicant Lifecycle Foundation (additive)
-- Extends pm_residents, Document Intelligence entity types, and leasing APIs.
-- Does NOT integrate background screening providers or redesign SignWell.

-- ---------------------------------------------------------------------------
-- Person lifecycle statuses (one record; status changes only)
-- ---------------------------------------------------------------------------

alter table public.pm_residents
  drop constraint if exists pm_residents_status_check;

alter table public.pm_residents
  add constraint pm_residents_status_check
  check (status in (
    'prospect',
    'applicant',
    'screening_pending',
    'approved',
    'pending_lease',
    'pending_move_in',
    'active',
    'former',
    'archived'
  ));

-- ---------------------------------------------------------------------------
-- Lease applications (workflow record bound to the same person)
-- ---------------------------------------------------------------------------

create table if not exists public.lease_applications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  resident_id uuid not null references public.pm_residents (id) on delete cascade,
  property_id uuid not null references public.property_properties (id) on delete restrict,
  unit_id uuid references public.property_units (id) on delete set null,
  lease_id uuid references public.lease_agreements (id) on delete set null,
  status text not null default 'draft'
    check (status in (
      'draft',
      'submitted',
      'incomplete',
      'screening_pending',
      'approved',
      'denied',
      'withdrawn'
    )),
  desired_move_in date,
  notes text,
  incomplete_reason text,
  decision_reason text,
  screening_provider text,
  screening_external_id text,
  screening_status text
    check (
      screening_status is null
      or screening_status in ('not_started', 'planned', 'pending', 'clear', 'review', 'fail')
    ),
  submitted_at timestamptz,
  decided_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists lease_applications_org_idx
  on public.lease_applications (organization_id, created_at desc);

create index if not exists lease_applications_resident_idx
  on public.lease_applications (organization_id, resident_id);

create index if not exists lease_applications_status_idx
  on public.lease_applications (organization_id, status);

create index if not exists lease_applications_property_idx
  on public.lease_applications (organization_id, property_id);

alter table public.lease_applications enable row level security;

drop policy if exists lease_applications_select_member on public.lease_applications;
create policy lease_applications_select_member
on public.lease_applications
for select
to authenticated
using (public.is_org_member(organization_id));

drop policy if exists lease_applications_write_leasing on public.lease_applications;
create policy lease_applications_write_leasing
on public.lease_applications
for all
to authenticated
using (public.is_leasing_writer(organization_id))
with check (public.is_leasing_writer(organization_id));

-- ---------------------------------------------------------------------------
-- Document Intelligence — application entity (no duplicate uploads)
-- ---------------------------------------------------------------------------

alter table public.document_documents
  drop constraint if exists document_documents_entity_type_check;

alter table public.document_documents
  add constraint document_documents_entity_type_check
  check (entity_type in (
    'property',
    'unit',
    'resident',
    'lease',
    'maintenance',
    'vendor',
    'organization',
    'asset',
    'inspection',
    'compliance',
    'financial',
    'building',
    'application'
  ));

alter table public.document_document_links
  drop constraint if exists document_document_links_entity_type_check;

alter table public.document_document_links
  add constraint document_document_links_entity_type_check
  check (entity_type in (
    'property',
    'unit',
    'resident',
    'lease',
    'maintenance',
    'vendor',
    'organization',
    'asset',
    'inspection',
    'compliance',
    'financial',
    'building',
    'application'
  ));
