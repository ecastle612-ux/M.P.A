-- FAC-OPS-001 Phase E.2 — Assets + Building Systems
-- No inventory, parts, PM programs, inspections, safety, compliance, or capital.

insert into public.permission_capabilities (key, namespace, description)
values
  ('facility.assets:read', 'facility.assets', 'Read facility assets, categories, and asset command centers'),
  ('facility.assets:write', 'facility.assets', 'Create and manage facility assets and categories'),
  ('facility.systems:read', 'facility.systems', 'Read building systems and system command centers'),
  ('facility.systems:write', 'facility.systems', 'Create and manage building systems and asset links')
on conflict (key) do nothing;

insert into public.role_permission_grants (role, capability_key)
values
  ('property_manager', 'facility.assets:read'),
  ('property_manager', 'facility.assets:write'),
  ('property_manager', 'facility.systems:read'),
  ('property_manager', 'facility.systems:write'),
  ('organization_admin', 'facility.assets:read'),
  ('organization_admin', 'facility.assets:write'),
  ('organization_admin', 'facility.systems:read'),
  ('organization_admin', 'facility.systems:write'),
  ('maintenance_technician', 'facility.assets:read'),
  ('maintenance_technician', 'facility.systems:read'),
  ('property_owner', 'facility.assets:read'),
  ('property_owner', 'facility.systems:read')
on conflict (role, capability_key) do nothing;

create table if not exists public.facility_asset_categories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  criticality_default text not null default 'medium'
    check (criticality_default in ('critical', 'high', 'medium', 'low')),
  status text not null default 'active'
    check (status in ('active', 'archived')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, name)
);

create index if not exists facility_asset_categories_org_idx
  on public.facility_asset_categories (organization_id, status, name);

create table if not exists public.facility_systems (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  site_id uuid not null references public.facility_sites (id) on delete cascade,
  name text not null,
  system_type text not null default 'other'
    check (system_type in ('hvac', 'fire', 'electrical', 'plumbing', 'vertical_transport', 'other')),
  status text not null default 'active'
    check (status in ('active', 'degraded', 'down', 'decommissioned')),
  criticality text not null default 'medium'
    check (criticality in ('critical', 'high', 'medium', 'low')),
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists facility_systems_org_site_idx
  on public.facility_systems (organization_id, site_id, status, name);

create table if not exists public.facility_assets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  site_id uuid not null references public.facility_sites (id) on delete restrict,
  location_id uuid references public.facility_locations (id) on delete set null,
  parent_asset_id uuid references public.facility_assets (id) on delete set null,
  category_id uuid references public.facility_asset_categories (id) on delete set null,
  name text not null,
  asset_tag text,
  manufacturer text,
  model text,
  serial_number text,
  criticality text not null default 'medium'
    check (criticality in ('critical', 'high', 'medium', 'low')),
  status text not null default 'intake'
    check (status in ('intake', 'active', 'in_repair', 'decommissioned')),
  installed_on date,
  warranty_until date,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  decommissioned_at timestamptz
);

create index if not exists facility_assets_org_site_idx
  on public.facility_assets (organization_id, site_id, status, name);

create index if not exists facility_assets_parent_idx
  on public.facility_assets (parent_asset_id)
  where parent_asset_id is not null;

create index if not exists facility_assets_tag_idx
  on public.facility_assets (organization_id, asset_tag)
  where asset_tag is not null;

create table if not exists public.facility_asset_systems (
  organization_id uuid not null references public.organizations (id) on delete cascade,
  asset_id uuid not null references public.facility_assets (id) on delete cascade,
  system_id uuid not null references public.facility_systems (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (asset_id, system_id)
);

create index if not exists facility_asset_systems_system_idx
  on public.facility_asset_systems (system_id);

alter table public.facility_asset_categories enable row level security;
alter table public.facility_systems enable row level security;
alter table public.facility_assets enable row level security;
alter table public.facility_asset_systems enable row level security;

drop policy if exists facility_asset_categories_select on public.facility_asset_categories;
create policy facility_asset_categories_select on public.facility_asset_categories
for select using (public.is_org_member(organization_id));

drop policy if exists facility_asset_categories_write on public.facility_asset_categories;
create policy facility_asset_categories_write on public.facility_asset_categories
for all using (public.is_org_manager(organization_id))
with check (public.is_org_manager(organization_id));

drop policy if exists facility_systems_select on public.facility_systems;
create policy facility_systems_select on public.facility_systems
for select using (public.is_org_member(organization_id));

drop policy if exists facility_systems_write on public.facility_systems;
create policy facility_systems_write on public.facility_systems
for all using (public.is_org_manager(organization_id))
with check (public.is_org_manager(organization_id));

drop policy if exists facility_assets_select on public.facility_assets;
create policy facility_assets_select on public.facility_assets
for select using (public.is_org_member(organization_id));

drop policy if exists facility_assets_write on public.facility_assets;
create policy facility_assets_write on public.facility_assets
for all using (public.is_org_manager(organization_id))
with check (public.is_org_manager(organization_id));

drop policy if exists facility_asset_systems_select on public.facility_asset_systems;
create policy facility_asset_systems_select on public.facility_asset_systems
for select using (public.is_org_member(organization_id));

drop policy if exists facility_asset_systems_write on public.facility_asset_systems;
create policy facility_asset_systems_write on public.facility_asset_systems
for all using (public.is_org_manager(organization_id))
with check (public.is_org_manager(organization_id));
