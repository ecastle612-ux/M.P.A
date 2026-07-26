-- FAC-002 Slice D: WO materials + facility report capability
-- AUTHORIZE FAC-002 SLICE D (2026-07-26)

insert into public.permission_capabilities (key, namespace, description)
values
  ('facility:report:read', 'facility', 'View and generate Facility Operations reports')
on conflict (key) do nothing;

insert into public.role_permission_grants (role, capability_key)
values
  ('property_manager', 'facility:report:read'),
  ('facility_technician', 'facility:report:read')
on conflict (role, capability_key) do nothing;

insert into public.role_permission_grants (role, capability_key)
select 'organization_admin', capability_key
from public.role_permission_grants
where role = 'property_manager'
  and capability_key = 'facility:report:read'
on conflict (role, capability_key) do nothing;

create table if not exists public.facility_work_order_materials (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  work_order_id uuid not null references public.maintenance_work_orders (id) on delete cascade,
  name text not null,
  quantity numeric not null default 1 check (quantity > 0),
  inventory_item_id uuid references public.facility_inventory_items (id) on delete set null,
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users (id),
  updated_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists facility_work_order_materials_wo_idx
  on public.facility_work_order_materials (organization_id, work_order_id, sort_order);

drop trigger if exists trg_facility_work_order_materials_updated_at on public.facility_work_order_materials;
create trigger trg_facility_work_order_materials_updated_at
before update on public.facility_work_order_materials
for each row
execute function public.set_updated_at();

alter table public.facility_work_order_materials enable row level security;

drop policy if exists facility_work_order_materials_select on public.facility_work_order_materials;
create policy facility_work_order_materials_select
on public.facility_work_order_materials
for select
using (public.has_org_capability(organization_id, 'maintenance:read'));

drop policy if exists facility_work_order_materials_insert on public.facility_work_order_materials;
create policy facility_work_order_materials_insert
on public.facility_work_order_materials
for insert
with check (public.has_org_capability(organization_id, 'maintenance:update'));

drop policy if exists facility_work_order_materials_update on public.facility_work_order_materials;
create policy facility_work_order_materials_update
on public.facility_work_order_materials
for update
using (public.has_org_capability(organization_id, 'maintenance:update'))
with check (public.has_org_capability(organization_id, 'maintenance:update'));

drop policy if exists facility_work_order_materials_delete on public.facility_work_order_materials;
create policy facility_work_order_materials_delete
on public.facility_work_order_materials
for delete
using (public.has_org_capability(organization_id, 'maintenance:update'));
