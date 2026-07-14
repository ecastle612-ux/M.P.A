-- Phase 4 foundation: properties, units, and dashboard authorization surface.

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  code text,
  property_type text not null check (property_type in ('residential', 'commercial', 'apartment', 'condo', 'hoa', 'townhome', 'multi_family')),
  status text not null default 'draft' check (status in ('draft', 'active', 'inactive', 'archived')),
  description text,
  address_line_1 text not null,
  address_line_2 text,
  city text not null,
  state_region text not null,
  postal_code text not null,
  country_code text not null,
  timezone text,
  latitude numeric(10, 7) check (latitude between -90 and 90),
  longitude numeric(10, 7) check (longitude between -180 and 180),
  ownership_entity_name text,
  owner_contact_name text,
  owner_contact_email text,
  owner_contact_phone text,
  cover_image_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users (id) on delete cascade,
  updated_by uuid references auth.users (id) on delete set null,
  archived_at timestamptz,
  archived_by uuid references auth.users (id) on delete set null,
  deleted_at timestamptz,
  deleted_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id)
);

create table if not exists public.units (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  property_id uuid not null,
  unit_number text not null,
  unit_label text,
  bedrooms numeric(4, 1) check (bedrooms is null or bedrooms >= 0),
  bathrooms numeric(4, 1) check (bathrooms is null or bathrooms >= 0),
  square_feet integer check (square_feet is null or square_feet >= 0),
  floor text,
  rent_amount numeric(12, 2) check (rent_amount is null or rent_amount >= 0),
  deposit_amount numeric(12, 2) check (deposit_amount is null or deposit_amount >= 0),
  currency_code text not null default 'USD',
  occupancy_status text not null default 'vacant_not_ready' check (occupancy_status in ('occupied', 'vacant_ready', 'vacant_not_ready', 'notice', 'offline')),
  status text not null default 'active' check (status in ('active', 'inactive', 'archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users (id) on delete cascade,
  updated_by uuid references auth.users (id) on delete set null,
  archived_at timestamptz,
  archived_by uuid references auth.users (id) on delete set null,
  deleted_at timestamptz,
  deleted_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint units_property_fk
    foreign key (property_id, organization_id)
    references public.properties (id, organization_id)
    on delete cascade
);

create unique index if not exists properties_org_code_unique_idx
  on public.properties (organization_id, lower(code))
  where code is not null and deleted_at is null;

create index if not exists properties_org_status_idx
  on public.properties (organization_id, status)
  where deleted_at is null;

create index if not exists properties_org_type_idx
  on public.properties (organization_id, property_type)
  where deleted_at is null;

create unique index if not exists units_org_property_number_unique_idx
  on public.units (organization_id, property_id, lower(unit_number))
  where deleted_at is null;

create index if not exists units_org_property_status_idx
  on public.units (organization_id, property_id, status)
  where deleted_at is null;

create index if not exists units_org_occupancy_idx
  on public.units (organization_id, occupancy_status)
  where deleted_at is null;

drop trigger if exists trg_properties_updated_at on public.properties;
create trigger trg_properties_updated_at
before update on public.properties
for each row
execute function public.set_updated_at();

drop trigger if exists trg_units_updated_at on public.units;
create trigger trg_units_updated_at
before update on public.units
for each row
execute function public.set_updated_at();

insert into public.permission_capabilities (key, namespace, description)
values
  ('dashboard:read', 'dashboard', 'Read organization dashboard metrics'),
  ('property:create', 'property', 'Create properties'),
  ('property:read', 'property', 'Read properties'),
  ('property:update', 'property', 'Update properties'),
  ('property:archive', 'property', 'Archive and restore properties'),
  ('property:delete', 'property', 'Soft-delete properties'),
  ('unit:create', 'unit', 'Create units'),
  ('unit:read', 'unit', 'Read units'),
  ('unit:update', 'unit', 'Update units'),
  ('unit:archive', 'unit', 'Archive and restore units'),
  ('unit:delete', 'unit', 'Soft-delete units')
on conflict (key) do nothing;

insert into public.role_permission_grants (role, capability_key)
values
  ('property_manager', 'dashboard:read'),
  ('property_manager', 'property:create'),
  ('property_manager', 'property:read'),
  ('property_manager', 'property:update'),
  ('property_manager', 'property:archive'),
  ('property_manager', 'property:delete'),
  ('property_manager', 'unit:create'),
  ('property_manager', 'unit:read'),
  ('property_manager', 'unit:update'),
  ('property_manager', 'unit:archive'),
  ('property_manager', 'unit:delete'),
  ('property_owner', 'dashboard:read'),
  ('property_owner', 'property:read'),
  ('property_owner', 'unit:read'),
  ('tenant', 'dashboard:read'),
  ('tenant', 'property:read'),
  ('tenant', 'unit:read'),
  ('vendor', 'dashboard:read'),
  ('vendor', 'property:read'),
  ('vendor', 'unit:read')
on conflict (role, capability_key) do nothing;

alter table public.properties enable row level security;
alter table public.units enable row level security;

drop policy if exists properties_select_authorized on public.properties;
create policy properties_select_authorized
on public.properties
for select
using (public.has_org_capability(organization_id, 'property:read'));

drop policy if exists properties_insert_authorized on public.properties;
create policy properties_insert_authorized
on public.properties
for insert
with check (
  public.has_org_capability(organization_id, 'property:create')
  and created_by = auth.uid()
);

drop policy if exists properties_update_authorized on public.properties;
create policy properties_update_authorized
on public.properties
for update
using (
  public.has_org_capability(organization_id, 'property:update')
  or public.has_org_capability(organization_id, 'property:archive')
  or public.has_org_capability(organization_id, 'property:delete')
)
with check (
  public.has_org_capability(organization_id, 'property:update')
  or public.has_org_capability(organization_id, 'property:archive')
  or public.has_org_capability(organization_id, 'property:delete')
);

drop policy if exists properties_delete_authorized on public.properties;
create policy properties_delete_authorized
on public.properties
for delete
using (public.has_org_capability(organization_id, 'property:delete'));

drop policy if exists units_select_authorized on public.units;
create policy units_select_authorized
on public.units
for select
using (public.has_org_capability(organization_id, 'unit:read'));

drop policy if exists units_insert_authorized on public.units;
create policy units_insert_authorized
on public.units
for insert
with check (
  public.has_org_capability(organization_id, 'unit:create')
  and created_by = auth.uid()
);

drop policy if exists units_update_authorized on public.units;
create policy units_update_authorized
on public.units
for update
using (
  public.has_org_capability(organization_id, 'unit:update')
  or public.has_org_capability(organization_id, 'unit:archive')
  or public.has_org_capability(organization_id, 'unit:delete')
)
with check (
  public.has_org_capability(organization_id, 'unit:update')
  or public.has_org_capability(organization_id, 'unit:archive')
  or public.has_org_capability(organization_id, 'unit:delete')
);

drop policy if exists units_delete_authorized on public.units;
create policy units_delete_authorized
on public.units
for delete
using (public.has_org_capability(organization_id, 'unit:delete'));
