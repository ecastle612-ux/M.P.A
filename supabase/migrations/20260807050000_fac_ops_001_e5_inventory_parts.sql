-- FAC-OPS-001 Phase E.5 — Inventory + Parts
-- Facility owns inventory; Maintenance consumes via shared WO issue links.
-- Out of scope: inspections, safety, compliance, capital.

insert into public.permission_capabilities (key, namespace, description)
values
  ('facility.parts:read', 'facility.parts', 'Read parts catalog and compatibility'),
  ('facility.parts:write', 'facility.parts', 'Create and manage parts catalog'),
  ('facility.inventory:read', 'facility.inventory', 'Read inventory locations, stock, and movements'),
  ('facility.inventory:write', 'facility.inventory', 'Receive, issue, adjust, and return inventory')
on conflict (key) do nothing;

insert into public.role_permission_grants (role, capability_key)
values
  ('organization_admin', 'facility.parts:read'),
  ('organization_admin', 'facility.parts:write'),
  ('organization_admin', 'facility.inventory:read'),
  ('organization_admin', 'facility.inventory:write'),
  ('property_manager', 'facility.parts:read'),
  ('property_manager', 'facility.parts:write'),
  ('property_manager', 'facility.inventory:read'),
  ('property_manager', 'facility.inventory:write'),
  ('maintenance_technician', 'facility.parts:read'),
  ('maintenance_technician', 'facility.inventory:read'),
  ('maintenance_technician', 'facility.inventory:write'),
  ('property_owner', 'facility.parts:read'),
  ('property_owner', 'facility.inventory:read')
on conflict (role, capability_key) do nothing;

create table if not exists public.facility_part_categories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  status text not null default 'active'
    check (status in ('active', 'archived')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, name)
);

create table if not exists public.facility_parts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  category_id uuid references public.facility_part_categories (id) on delete set null,
  sku text not null,
  name text not null,
  uom text not null default 'ea'
    check (uom in ('ea', 'box', 'ft', 'm', 'gal', 'L', 'kg', 'lb', 'set', 'other')),
  manufacturer text,
  supplier_name text,
  supplier_reference text,
  critical_part boolean not null default false,
  reorder_threshold_default numeric(14, 3) not null default 0
    check (reorder_threshold_default >= 0),
  minimum_stock_default numeric(14, 3) not null default 0
    check (minimum_stock_default >= 0),
  notes text,
  status text not null default 'active'
    check (status in ('active', 'archived')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, sku)
);

create index if not exists facility_parts_org_name_idx
  on public.facility_parts (organization_id, status, name);

create table if not exists public.facility_part_asset_compat (
  part_id uuid not null references public.facility_parts (id) on delete cascade,
  asset_id uuid not null references public.facility_assets (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (part_id, asset_id)
);

create table if not exists public.facility_part_system_compat (
  part_id uuid not null references public.facility_parts (id) on delete cascade,
  system_id uuid not null references public.facility_systems (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (part_id, system_id)
);

create table if not exists public.facility_inventory_locations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  site_id uuid not null references public.facility_sites (id) on delete restrict,
  facility_location_id uuid references public.facility_locations (id) on delete set null,
  name text not null,
  status text not null default 'active'
    check (status in ('active', 'archived')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, site_id, name)
);

create index if not exists facility_inventory_locations_org_site_idx
  on public.facility_inventory_locations (organization_id, site_id, status);

create table if not exists public.facility_inventory_stock (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  part_id uuid not null references public.facility_parts (id) on delete restrict,
  inventory_location_id uuid not null references public.facility_inventory_locations (id) on delete restrict,
  quantity_on_hand numeric(14, 3) not null default 0,
  reorder_threshold numeric(14, 3) not null default 0
    check (reorder_threshold >= 0),
  minimum_stock numeric(14, 3) not null default 0
    check (minimum_stock >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (part_id, inventory_location_id)
);

create index if not exists facility_inventory_stock_org_idx
  on public.facility_inventory_stock (organization_id, quantity_on_hand);

create table if not exists public.facility_part_movements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  part_id uuid not null references public.facility_parts (id) on delete restrict,
  inventory_location_id uuid not null references public.facility_inventory_locations (id) on delete restrict,
  movement_type text not null
    check (movement_type in ('receive', 'issue', 'adjust', 'return')),
  quantity numeric(14, 3) not null check (quantity > 0),
  quantity_delta numeric(14, 3) not null,
  reason text not null default '',
  work_order_id uuid references public.maintenance_work_orders (id) on delete set null,
  actor_user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint facility_part_movements_issue_wo_check
    check (movement_type <> 'issue' or work_order_id is not null)
);

create index if not exists facility_part_movements_org_idx
  on public.facility_part_movements (organization_id, created_at desc);

create index if not exists facility_part_movements_part_idx
  on public.facility_part_movements (part_id, created_at desc);

create index if not exists facility_part_movements_wo_idx
  on public.facility_part_movements (work_order_id)
  where work_order_id is not null;

alter table public.facility_part_categories enable row level security;
alter table public.facility_parts enable row level security;
alter table public.facility_part_asset_compat enable row level security;
alter table public.facility_part_system_compat enable row level security;
alter table public.facility_inventory_locations enable row level security;
alter table public.facility_inventory_stock enable row level security;
alter table public.facility_part_movements enable row level security;

drop policy if exists facility_part_categories_select on public.facility_part_categories;
create policy facility_part_categories_select on public.facility_part_categories
for select using (public.is_org_member(organization_id));
drop policy if exists facility_part_categories_manage on public.facility_part_categories;
create policy facility_part_categories_manage on public.facility_part_categories
for all using (
  public.is_facility_operations_manager(organization_id)
  or public.is_maintenance_manager(organization_id)
)
with check (
  public.is_facility_operations_manager(organization_id)
  or public.is_maintenance_manager(organization_id)
);

drop policy if exists facility_parts_select on public.facility_parts;
create policy facility_parts_select on public.facility_parts
for select using (public.is_org_member(organization_id));
drop policy if exists facility_parts_manage on public.facility_parts;
create policy facility_parts_manage on public.facility_parts
for all using (
  public.is_facility_operations_manager(organization_id)
  or public.is_maintenance_manager(organization_id)
)
with check (
  public.is_facility_operations_manager(organization_id)
  or public.is_maintenance_manager(organization_id)
);

drop policy if exists facility_part_asset_compat_select on public.facility_part_asset_compat;
create policy facility_part_asset_compat_select on public.facility_part_asset_compat
for select using (public.is_org_member(organization_id));
drop policy if exists facility_part_asset_compat_manage on public.facility_part_asset_compat;
create policy facility_part_asset_compat_manage on public.facility_part_asset_compat
for all using (
  public.is_facility_operations_manager(organization_id)
  or public.is_maintenance_manager(organization_id)
)
with check (
  public.is_facility_operations_manager(organization_id)
  or public.is_maintenance_manager(organization_id)
);

drop policy if exists facility_part_system_compat_select on public.facility_part_system_compat;
create policy facility_part_system_compat_select on public.facility_part_system_compat
for select using (public.is_org_member(organization_id));
drop policy if exists facility_part_system_compat_manage on public.facility_part_system_compat;
create policy facility_part_system_compat_manage on public.facility_part_system_compat
for all using (
  public.is_facility_operations_manager(organization_id)
  or public.is_maintenance_manager(organization_id)
)
with check (
  public.is_facility_operations_manager(organization_id)
  or public.is_maintenance_manager(organization_id)
);

drop policy if exists facility_inventory_locations_select on public.facility_inventory_locations;
create policy facility_inventory_locations_select on public.facility_inventory_locations
for select using (public.is_org_member(organization_id));
drop policy if exists facility_inventory_locations_manage on public.facility_inventory_locations;
create policy facility_inventory_locations_manage on public.facility_inventory_locations
for all using (
  public.is_facility_operations_manager(organization_id)
  or public.is_maintenance_manager(organization_id)
)
with check (
  public.is_facility_operations_manager(organization_id)
  or public.is_maintenance_manager(organization_id)
);

drop policy if exists facility_inventory_stock_select on public.facility_inventory_stock;
create policy facility_inventory_stock_select on public.facility_inventory_stock
for select using (public.is_org_member(organization_id));
drop policy if exists facility_inventory_stock_manage on public.facility_inventory_stock;
create policy facility_inventory_stock_manage on public.facility_inventory_stock
for all using (
  public.is_facility_operations_manager(organization_id)
  or public.is_maintenance_manager(organization_id)
  or public.is_maintenance_technician(organization_id)
)
with check (
  public.is_facility_operations_manager(organization_id)
  or public.is_maintenance_manager(organization_id)
  or public.is_maintenance_technician(organization_id)
);

drop policy if exists facility_part_movements_select on public.facility_part_movements;
create policy facility_part_movements_select on public.facility_part_movements
for select using (public.is_org_member(organization_id));
drop policy if exists facility_part_movements_manage on public.facility_part_movements;
create policy facility_part_movements_manage on public.facility_part_movements
for all using (
  public.is_facility_operations_manager(organization_id)
  or public.is_maintenance_manager(organization_id)
  or public.is_maintenance_technician(organization_id)
)
with check (
  public.is_facility_operations_manager(organization_id)
  or public.is_maintenance_manager(organization_id)
  or public.is_maintenance_technician(organization_id)
);
