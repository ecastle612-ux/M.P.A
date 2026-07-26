-- FAC-002 Slice B: preventive maintenance schedules/occurrences + capabilities
-- AUTHORIZE FAC-002 SLICE B (2026-07-25)

insert into public.permission_capabilities (key, namespace, description)
values
  ('facility:pm:read', 'facility', 'Read preventive maintenance schedules and occurrences'),
  ('facility:pm:write', 'facility', 'Create and update preventive maintenance schedules'),
  ('facility:calendar:read', 'facility', 'View Facility operations calendar projection')
on conflict (key) do nothing;

insert into public.role_permission_grants (role, capability_key)
values
  ('property_manager', 'facility:pm:read'),
  ('property_manager', 'facility:pm:write'),
  ('property_manager', 'facility:calendar:read'),
  ('facility_technician', 'facility:pm:read'),
  ('facility_technician', 'facility:calendar:read')
on conflict (role, capability_key) do nothing;

insert into public.role_permission_grants (role, capability_key)
select 'organization_admin', capability_key
from public.role_permission_grants
where role = 'property_manager'
  and capability_key in ('facility:pm:read', 'facility:pm:write', 'facility:calendar:read')
on conflict (role, capability_key) do nothing;

create table if not exists public.facility_pm_schedules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  property_id uuid not null,
  asset_id uuid,
  title text not null,
  cadence text not null check (
    cadence in ('daily', 'weekly', 'monthly', 'quarterly', 'semiannual', 'annual', 'custom')
  ),
  custom_interval_days integer check (custom_interval_days is null or custom_interval_days > 0),
  next_due date not null,
  default_assignee_user_id uuid references auth.users (id) on delete set null,
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users (id),
  updated_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint facility_pm_schedules_custom_cadence_check check (
    (cadence <> 'custom' and custom_interval_days is null)
    or (cadence = 'custom' and custom_interval_days is not null)
  ),
  constraint facility_pm_schedules_property_fk
    foreign key (property_id, organization_id)
    references public.properties (id, organization_id)
    on delete cascade,
  constraint facility_pm_schedules_asset_fk
    foreign key (asset_id)
    references public.facility_assets (id)
    on delete set null
);

create unique index if not exists facility_pm_schedules_id_org_uidx
  on public.facility_pm_schedules (id, organization_id);

create index if not exists facility_pm_schedules_due_idx
  on public.facility_pm_schedules (organization_id, next_due)
  where active = true and deleted_at is null;

create index if not exists facility_pm_schedules_property_idx
  on public.facility_pm_schedules (organization_id, property_id)
  where deleted_at is null;

drop trigger if exists trg_facility_pm_schedules_updated_at on public.facility_pm_schedules;
create trigger trg_facility_pm_schedules_updated_at
before update on public.facility_pm_schedules
for each row
execute function public.set_updated_at();

alter table public.facility_pm_schedules enable row level security;

drop policy if exists facility_pm_schedules_select on public.facility_pm_schedules;
create policy facility_pm_schedules_select
on public.facility_pm_schedules
for select
using (public.has_org_capability(organization_id, 'facility:pm:read'));

drop policy if exists facility_pm_schedules_insert on public.facility_pm_schedules;
create policy facility_pm_schedules_insert
on public.facility_pm_schedules
for insert
with check (public.has_org_capability(organization_id, 'facility:pm:write'));

drop policy if exists facility_pm_schedules_update on public.facility_pm_schedules;
create policy facility_pm_schedules_update
on public.facility_pm_schedules
for update
using (public.has_org_capability(organization_id, 'facility:pm:write'))
with check (public.has_org_capability(organization_id, 'facility:pm:write'));

create table if not exists public.facility_pm_occurrences (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  schedule_id uuid not null,
  due_on date not null,
  status text not null default 'pending' check (
    status in ('pending', 'materialized', 'skipped', 'cancelled')
  ),
  work_order_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint facility_pm_occurrences_schedule_fk
    foreign key (schedule_id)
    references public.facility_pm_schedules (id)
    on delete cascade,
  constraint facility_pm_occurrences_work_order_fk
    foreign key (work_order_id)
    references public.maintenance_work_orders (id)
    on delete set null,
  constraint facility_pm_occurrences_schedule_due_uidx unique (schedule_id, due_on)
);

create unique index if not exists facility_pm_occurrences_org_id_uidx
  on public.facility_pm_occurrences (organization_id, id);

create unique index if not exists facility_pm_occurrences_work_order_uidx
  on public.facility_pm_occurrences (work_order_id)
  where work_order_id is not null;

create index if not exists facility_pm_occurrences_due_idx
  on public.facility_pm_occurrences (organization_id, due_on, status);

drop trigger if exists trg_facility_pm_occurrences_updated_at on public.facility_pm_occurrences;
create trigger trg_facility_pm_occurrences_updated_at
before update on public.facility_pm_occurrences
for each row
execute function public.set_updated_at();

alter table public.facility_pm_occurrences enable row level security;

drop policy if exists facility_pm_occurrences_select on public.facility_pm_occurrences;
create policy facility_pm_occurrences_select
on public.facility_pm_occurrences
for select
using (public.has_org_capability(organization_id, 'facility:pm:read'));

drop policy if exists facility_pm_occurrences_insert on public.facility_pm_occurrences;
create policy facility_pm_occurrences_insert
on public.facility_pm_occurrences
for insert
with check (public.has_org_capability(organization_id, 'facility:pm:write'));

drop policy if exists facility_pm_occurrences_update on public.facility_pm_occurrences;
create policy facility_pm_occurrences_update
on public.facility_pm_occurrences
for update
using (public.has_org_capability(organization_id, 'facility:pm:write'))
with check (public.has_org_capability(organization_id, 'facility:pm:write'));
