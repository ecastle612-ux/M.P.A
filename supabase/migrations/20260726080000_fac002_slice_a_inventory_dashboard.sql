-- FAC-002 Slice A: facility inventory + capabilities for technician hub
-- AUTHORIZE FAC-002 SLICE A (2026-07-25)

insert into public.permission_capabilities (key, namespace, description)
values
  ('facility:dashboard', 'facility', 'Access Facility Operations hub and technician dashboard'),
  ('facility:inventory:read', 'facility', 'Read facility inventory items'),
  ('facility:inventory:write', 'facility', 'Create and update facility inventory items')
on conflict (key) do nothing;

insert into public.role_permission_grants (role, capability_key)
values
  ('property_manager', 'facility:dashboard'),
  ('property_manager', 'facility:inventory:read'),
  ('property_manager', 'facility:inventory:write'),
  ('facility_technician', 'facility:dashboard'),
  ('facility_technician', 'facility:inventory:read'),
  ('facility_technician', 'facility:inventory:write')
on conflict (role, capability_key) do nothing;

-- Mirror PM grants onto organization_admin when that role template exists (AUTH-001 Slice D).
insert into public.role_permission_grants (role, capability_key)
select 'organization_admin', capability_key
from public.role_permission_grants
where role = 'property_manager'
  and capability_key in ('facility:dashboard', 'facility:inventory:read', 'facility:inventory:write')
on conflict (role, capability_key) do nothing;

create table if not exists public.facility_inventory_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  status text not null default 'available' check (
    status in ('available', 'in_service', 'repair', 'disposed', 'retired', 'lost', 'stolen')
  ),
  category text,
  property_id uuid references public.properties (id) on delete set null,
  assigned_technician_user_id uuid references auth.users (id) on delete set null,
  purchase_date date,
  warranty_ends_on date,
  warranty_notes text,
  serial_number text,
  notes text,
  primary_media_asset_id uuid references public.media_assets (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users (id),
  updated_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists facility_inventory_items_org_idx
  on public.facility_inventory_items (organization_id)
  where deleted_at is null;

create index if not exists facility_inventory_items_status_idx
  on public.facility_inventory_items (organization_id, status)
  where deleted_at is null;

create index if not exists facility_inventory_items_property_idx
  on public.facility_inventory_items (organization_id, property_id)
  where deleted_at is null;

drop trigger if exists trg_facility_inventory_items_updated_at on public.facility_inventory_items;
create trigger trg_facility_inventory_items_updated_at
before update on public.facility_inventory_items
for each row
execute function public.set_updated_at();

alter table public.facility_inventory_items enable row level security;

drop policy if exists facility_inventory_items_select on public.facility_inventory_items;
create policy facility_inventory_items_select
on public.facility_inventory_items
for select
using (public.has_org_capability(organization_id, 'facility:inventory:read'));

drop policy if exists facility_inventory_items_insert on public.facility_inventory_items;
create policy facility_inventory_items_insert
on public.facility_inventory_items
for insert
with check (public.has_org_capability(organization_id, 'facility:inventory:write'));

drop policy if exists facility_inventory_items_update on public.facility_inventory_items;
create policy facility_inventory_items_update
on public.facility_inventory_items
for update
using (public.has_org_capability(organization_id, 'facility:inventory:write'))
with check (public.has_org_capability(organization_id, 'facility:inventory:write'));
