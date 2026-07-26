-- FAC-002 Slice C: asset V1 fields + inspections + Facility Record bridge
-- AUTHORIZE FAC-002 SLICE C (2026-07-25)

insert into public.permission_capabilities (key, namespace, description)
values
  ('facility:asset:write', 'facility', 'Create and update facility building assets'),
  ('facility:inspection:read', 'facility', 'Read facility inspection runs and templates'),
  ('facility:inspection:write', 'facility', 'Create and complete facility inspections')
on conflict (key) do nothing;

insert into public.role_permission_grants (role, capability_key)
values
  ('property_manager', 'facility:asset:write'),
  ('property_manager', 'facility:inspection:read'),
  ('property_manager', 'facility:inspection:write'),
  ('facility_technician', 'facility:inspection:read'),
  ('facility_technician', 'facility:inspection:write')
on conflict (role, capability_key) do nothing;

insert into public.role_permission_grants (role, capability_key)
select 'organization_admin', capability_key
from public.role_permission_grants
where role = 'property_manager'
  and capability_key in ('facility:asset:write', 'facility:inspection:read', 'facility:inspection:write')
on conflict (role, capability_key) do nothing;

-- Asset V1 columns
alter table public.facility_assets
  add column if not exists warranty_starts_on date,
  add column if not exists warranty_ends_on date,
  add column if not exists warranty_notes text,
  add column if not exists replacement_planned boolean not null default false,
  add column if not exists replacement_target_year integer,
  add column if not exists replacement_notes text;

update public.facility_assets
set warranty_notes = coalesce(warranty_notes, nullif(trim(warranty_placeholder), ''))
where warranty_notes is null
  and warranty_placeholder is not null
  and trim(warranty_placeholder) <> '';

-- Inspection templates (optional org checklists)
create table if not exists public.facility_inspection_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  description text,
  items jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users (id),
  updated_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists facility_inspection_templates_org_idx
  on public.facility_inspection_templates (organization_id)
  where deleted_at is null;

drop trigger if exists trg_facility_inspection_templates_updated_at on public.facility_inspection_templates;
create trigger trg_facility_inspection_templates_updated_at
before update on public.facility_inspection_templates
for each row
execute function public.set_updated_at();

alter table public.facility_inspection_templates enable row level security;

drop policy if exists facility_inspection_templates_select on public.facility_inspection_templates;
create policy facility_inspection_templates_select
on public.facility_inspection_templates
for select
using (public.has_org_capability(organization_id, 'facility:inspection:read'));

drop policy if exists facility_inspection_templates_insert on public.facility_inspection_templates;
create policy facility_inspection_templates_insert
on public.facility_inspection_templates
for insert
with check (public.has_org_capability(organization_id, 'facility:inspection:write'));

drop policy if exists facility_inspection_templates_update on public.facility_inspection_templates;
create policy facility_inspection_templates_update
on public.facility_inspection_templates
for update
using (public.has_org_capability(organization_id, 'facility:inspection:write'))
with check (public.has_org_capability(organization_id, 'facility:inspection:write'));

-- Inspection runs
create table if not exists public.facility_inspection_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  property_id uuid not null,
  unit_id uuid references public.units (id) on delete set null,
  template_id uuid references public.facility_inspection_templates (id) on delete set null,
  title text not null,
  status text not null default 'draft' check (
    status in ('draft', 'in_progress', 'completed', 'canceled')
  ),
  assigned_to_user_id uuid references auth.users (id) on delete set null,
  due_on date,
  started_at timestamptz,
  completed_at timestamptz,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users (id),
  updated_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint facility_inspection_runs_property_fk
    foreign key (property_id, organization_id)
    references public.properties (id, organization_id)
    on delete cascade
);

create index if not exists facility_inspection_runs_org_status_idx
  on public.facility_inspection_runs (organization_id, status)
  where deleted_at is null;

create index if not exists facility_inspection_runs_property_idx
  on public.facility_inspection_runs (organization_id, property_id)
  where deleted_at is null;

drop trigger if exists trg_facility_inspection_runs_updated_at on public.facility_inspection_runs;
create trigger trg_facility_inspection_runs_updated_at
before update on public.facility_inspection_runs
for each row
execute function public.set_updated_at();

alter table public.facility_inspection_runs enable row level security;

drop policy if exists facility_inspection_runs_select on public.facility_inspection_runs;
create policy facility_inspection_runs_select
on public.facility_inspection_runs
for select
using (public.has_org_capability(organization_id, 'facility:inspection:read'));

drop policy if exists facility_inspection_runs_insert on public.facility_inspection_runs;
create policy facility_inspection_runs_insert
on public.facility_inspection_runs
for insert
with check (public.has_org_capability(organization_id, 'facility:inspection:write'));

drop policy if exists facility_inspection_runs_update on public.facility_inspection_runs;
create policy facility_inspection_runs_update
on public.facility_inspection_runs
for update
using (public.has_org_capability(organization_id, 'facility:inspection:write'))
with check (public.has_org_capability(organization_id, 'facility:inspection:write'));

-- Inspection items
create table if not exists public.facility_inspection_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  run_id uuid not null references public.facility_inspection_runs (id) on delete cascade,
  sort_order integer not null default 0,
  label text not null,
  result text check (result is null or result in ('pass', 'fail', 'na')),
  notes text,
  photo_media_asset_ids uuid[] not null default '{}'::uuid[],
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists facility_inspection_items_run_idx
  on public.facility_inspection_items (organization_id, run_id, sort_order);

drop trigger if exists trg_facility_inspection_items_updated_at on public.facility_inspection_items;
create trigger trg_facility_inspection_items_updated_at
before update on public.facility_inspection_items
for each row
execute function public.set_updated_at();

alter table public.facility_inspection_items enable row level security;

drop policy if exists facility_inspection_items_select on public.facility_inspection_items;
create policy facility_inspection_items_select
on public.facility_inspection_items
for select
using (public.has_org_capability(organization_id, 'facility:inspection:read'));

drop policy if exists facility_inspection_items_insert on public.facility_inspection_items;
create policy facility_inspection_items_insert
on public.facility_inspection_items
for insert
with check (public.has_org_capability(organization_id, 'facility:inspection:write'));

drop policy if exists facility_inspection_items_update on public.facility_inspection_items;
create policy facility_inspection_items_update
on public.facility_inspection_items
for update
using (public.has_org_capability(organization_id, 'facility:inspection:write'))
with check (public.has_org_capability(organization_id, 'facility:inspection:write'));

-- Facility Record bridge: allow inspection-sourced memory without WO
alter table public.facility_records
  alter column work_order_id drop not null;

alter table public.facility_records
  add column if not exists inspection_run_id uuid references public.facility_inspection_runs (id) on delete set null;

alter table public.facility_records
  drop constraint if exists facility_records_source_presence_check;

alter table public.facility_records
  add constraint facility_records_source_presence_check
  check (work_order_id is not null or inspection_run_id is not null);

create unique index if not exists facility_records_one_active_per_inspection_run_idx
  on public.facility_records (organization_id, inspection_run_id)
  where status = 'active' and inspection_run_id is not null;
