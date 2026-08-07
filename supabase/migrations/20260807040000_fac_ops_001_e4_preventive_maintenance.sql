-- FAC-OPS-001 Phase E.4 — Preventive Maintenance programs
-- Generates shared facility work orders (E.3 product_context).
-- Out of scope: inventory, parts, inspections, safety, compliance, capital.

insert into public.permission_capabilities (key, namespace, description)
values
  ('facility.preventive:read', 'facility.preventive', 'Read preventive maintenance programs and schedules'),
  ('facility.preventive:write', 'facility.preventive', 'Create and manage preventive maintenance programs')
on conflict (key) do nothing;

insert into public.role_permission_grants (role, capability_key)
values
  ('organization_admin', 'facility.preventive:read'),
  ('organization_admin', 'facility.preventive:write'),
  ('property_manager', 'facility.preventive:read'),
  ('property_manager', 'facility.preventive:write'),
  ('maintenance_technician', 'facility.preventive:read'),
  ('property_owner', 'facility.preventive:read')
on conflict (role, capability_key) do nothing;

create table if not exists public.facility_pm_schedules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  site_id uuid not null references public.facility_sites (id) on delete restrict,
  asset_id uuid references public.facility_assets (id) on delete set null,
  system_id uuid references public.facility_systems (id) on delete set null,
  name text not null,
  title_template text not null,
  description_template text not null default '',
  category text not null default 'general'
    check (category in ('general', 'plumbing', 'electrical', 'hvac', 'appliance', 'structural', 'other')),
  priority text not null default 'normal'
    check (priority in ('low', 'normal', 'high', 'emergency')),
  cadence_unit text not null default 'month'
    check (cadence_unit in ('day', 'week', 'month', 'year')),
  cadence_interval integer not null default 1
    check (cadence_interval >= 1 and cadence_interval <= 365),
  is_one_shot boolean not null default false,
  next_due_on date,
  last_completed_on date,
  status text not null default 'draft'
    check (status in ('draft', 'active', 'paused', 'retired')),
  criticality text not null default 'medium'
    check (criticality in ('critical', 'high', 'medium', 'low')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint facility_pm_schedules_target_check
    check (asset_id is not null or system_id is not null)
);

create index if not exists facility_pm_schedules_org_status_idx
  on public.facility_pm_schedules (organization_id, status, next_due_on);

create index if not exists facility_pm_schedules_site_idx
  on public.facility_pm_schedules (organization_id, site_id, status);

create index if not exists facility_pm_schedules_asset_idx
  on public.facility_pm_schedules (organization_id, asset_id)
  where asset_id is not null;

create index if not exists facility_pm_schedules_system_idx
  on public.facility_pm_schedules (organization_id, system_id)
  where system_id is not null;

create table if not exists public.facility_pm_generation_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  schedule_id uuid not null references public.facility_pm_schedules (id) on delete cascade,
  due_on date not null,
  work_order_id uuid references public.maintenance_work_orders (id) on delete set null,
  status text not null default 'due'
    check (status in ('due', 'work_created', 'work_completed', 'acknowledged')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (schedule_id, due_on)
);

create index if not exists facility_pm_generation_runs_org_idx
  on public.facility_pm_generation_runs (organization_id, status, due_on desc);

create index if not exists facility_pm_generation_runs_wo_idx
  on public.facility_pm_generation_runs (work_order_id)
  where work_order_id is not null;

alter table public.facility_pm_schedules enable row level security;
alter table public.facility_pm_generation_runs enable row level security;

drop policy if exists facility_pm_schedules_select on public.facility_pm_schedules;
create policy facility_pm_schedules_select on public.facility_pm_schedules
for select using (public.is_org_member(organization_id));

drop policy if exists facility_pm_schedules_manage on public.facility_pm_schedules;
create policy facility_pm_schedules_manage on public.facility_pm_schedules
for all using (
  public.is_facility_operations_manager(organization_id)
  or public.is_maintenance_manager(organization_id)
)
with check (
  public.is_facility_operations_manager(organization_id)
  or public.is_maintenance_manager(organization_id)
);

drop policy if exists facility_pm_generation_runs_select on public.facility_pm_generation_runs;
create policy facility_pm_generation_runs_select on public.facility_pm_generation_runs
for select using (public.is_org_member(organization_id));

drop policy if exists facility_pm_generation_runs_manage on public.facility_pm_generation_runs;
create policy facility_pm_generation_runs_manage on public.facility_pm_generation_runs
for all using (
  public.is_facility_operations_manager(organization_id)
  or public.is_maintenance_manager(organization_id)
)
with check (
  public.is_facility_operations_manager(organization_id)
  or public.is_maintenance_manager(organization_id)
);
