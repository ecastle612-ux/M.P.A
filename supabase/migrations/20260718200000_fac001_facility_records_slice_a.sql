-- FAC-001 Slice A: Permanent Repair History
-- Facility Records + Property Timeline (repair events only).
-- Exactly one active Facility Record per Work Order.

create table if not exists public.facility_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  property_id uuid not null,
  unit_id uuid,
  building_id uuid,
  work_order_id uuid not null,
  legacy_vendor_id uuid,
  service_provider_display_name text,
  service_provider_type text not null default 'vendor' check (
    service_provider_type in (
      'internal_staff',
      'vendor',
      'contractor',
      'emergency_vendor',
      'owner',
      'volunteer',
      'other',
      'unassigned'
    )
  ),
  assigned_staff_user_id uuid references auth.users (id) on delete set null,
  issue text not null,
  resolution text not null default '',
  completed_at timestamptz not null,
  warranty_placeholder text,
  invoice_placeholder text,
  lifecycle_status text not null default 'finalized' check (
    lifecycle_status in ('provisional', 'finalized')
  ),
  status text not null default 'active' check (
    status in ('active', 'superseded_by_correction')
  ),
  correction_of_id uuid,
  correction_reason text,
  corrected_by uuid references auth.users (id) on delete set null,
  corrected_at timestamptz,
  photo_document_ids uuid[] not null default '{}'::uuid[],
  document_ids uuid[] not null default '{}'::uuid[],
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users (id) on delete cascade,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  constraint facility_records_property_fk
    foreign key (property_id, organization_id)
    references public.properties (id, organization_id)
    on delete cascade,
  constraint facility_records_unit_fk
    foreign key (unit_id)
    references public.units (id)
    on delete set null,
  constraint facility_records_work_order_fk
    foreign key (work_order_id, organization_id)
    references public.maintenance_work_orders (id, organization_id)
    on delete restrict,
  constraint facility_records_correction_fk
    foreign key (correction_of_id, organization_id)
    references public.facility_records (id, organization_id)
    on delete restrict
);

-- Exactly one active Facility Record per Work Order.
-- Superseded correction chain rows may retain the same work_order_id.
create unique index if not exists facility_records_one_active_per_work_order_idx
  on public.facility_records (organization_id, work_order_id)
  where status = 'active';

create table if not exists public.facility_timeline_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  property_id uuid not null,
  unit_id uuid,
  building_id uuid,
  event_type text not null,
  occurred_at timestamptz not null,
  title text not null,
  summary text not null,
  actor_user_id uuid references auth.users (id) on delete set null,
  source_entity_type text not null,
  source_entity_id uuid not null,
  facility_record_id uuid,
  work_order_id uuid,
  legacy_vendor_id uuid,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  constraint facility_timeline_property_fk
    foreign key (property_id, organization_id)
    references public.properties (id, organization_id)
    on delete cascade,
  constraint facility_timeline_unit_fk
    foreign key (unit_id)
    references public.units (id)
    on delete set null,
  constraint facility_timeline_facility_record_fk
    foreign key (facility_record_id, organization_id)
    references public.facility_records (id, organization_id)
    on delete set null,
  constraint facility_timeline_work_order_fk
    foreign key (work_order_id, organization_id)
    references public.maintenance_work_orders (id, organization_id)
    on delete set null
);

create index if not exists facility_records_org_property_completed_idx
  on public.facility_records (organization_id, property_id, completed_at desc)
  where status = 'active';

create index if not exists facility_records_org_unit_completed_idx
  on public.facility_records (organization_id, unit_id, completed_at desc)
  where status = 'active' and unit_id is not null;

create index if not exists facility_records_org_vendor_idx
  on public.facility_records (organization_id, legacy_vendor_id, completed_at desc)
  where status = 'active' and legacy_vendor_id is not null;

create index if not exists facility_records_org_work_order_idx
  on public.facility_records (organization_id, work_order_id);

create index if not exists facility_records_search_idx
  on public.facility_records using gin (
    to_tsvector(
      'english',
      coalesce(issue, '') || ' ' ||
      coalesce(resolution, '') || ' ' ||
      coalesce(service_provider_display_name, '')
    )
  );

create index if not exists facility_timeline_org_property_occurred_idx
  on public.facility_timeline_events (organization_id, property_id, occurred_at desc);

create index if not exists facility_timeline_org_unit_occurred_idx
  on public.facility_timeline_events (organization_id, unit_id, occurred_at desc)
  where unit_id is not null;

create index if not exists facility_timeline_org_facility_record_idx
  on public.facility_timeline_events (organization_id, facility_record_id)
  where facility_record_id is not null;

drop trigger if exists trg_facility_records_updated_at on public.facility_records;
create trigger trg_facility_records_updated_at
before update on public.facility_records
for each row
execute function public.set_updated_at();

alter table public.facility_records enable row level security;
alter table public.facility_timeline_events enable row level security;

drop policy if exists facility_records_select_authorized on public.facility_records;
create policy facility_records_select_authorized
on public.facility_records
for select
using (public.has_org_capability(organization_id, 'maintenance:read'));

drop policy if exists facility_records_insert_authorized on public.facility_records;
create policy facility_records_insert_authorized
on public.facility_records
for insert
with check (public.has_org_capability(organization_id, 'maintenance:update'));

drop policy if exists facility_records_update_authorized on public.facility_records;
create policy facility_records_update_authorized
on public.facility_records
for update
using (public.has_org_capability(organization_id, 'maintenance:update'))
with check (public.has_org_capability(organization_id, 'maintenance:update'));

-- Never delete Facility Records (no delete policy).

drop policy if exists facility_timeline_select_authorized on public.facility_timeline_events;
create policy facility_timeline_select_authorized
on public.facility_timeline_events
for select
using (public.has_org_capability(organization_id, 'maintenance:read'));

drop policy if exists facility_timeline_insert_authorized on public.facility_timeline_events;
create policy facility_timeline_insert_authorized
on public.facility_timeline_events
for insert
with check (public.has_org_capability(organization_id, 'maintenance:update'));

-- Timeline is append-only (no update/delete policies).
