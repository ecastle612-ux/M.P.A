-- FAC-OPS-001 Phase E.1 — Facility Site profiles + notifications
-- Site + location only. No assets, inventory, PM, inspections, safety, compliance, systems, or capital.

insert into public.permission_capabilities (key, namespace, description)
values
  ('facility.sites:read', 'facility.sites', 'Read Facility Sites, Overview, and Facility Mission Control'),
  ('facility.sites:write', 'facility.sites', 'Create, update, activate, and archive Facility Sites')
on conflict (key) do nothing;

insert into public.role_permission_grants (role, capability_key)
values
  ('property_manager', 'facility.sites:read'),
  ('property_manager', 'facility.sites:write'),
  ('organization_admin', 'facility.sites:read'),
  ('organization_admin', 'facility.sites:write'),
  ('maintenance_technician', 'facility.sites:read'),
  ('property_owner', 'facility.sites:read')
on conflict (role, capability_key) do nothing;

create table if not exists public.facility_sites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  timezone text not null default 'America/New_York',
  status text not null default 'draft'
    check (status in ('draft', 'active', 'archived')),
  property_id uuid references public.property_properties (id) on delete set null,
  address_line1 text,
  city text,
  region text,
  postal_code text,
  country text,
  activated_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists facility_sites_org_idx
  on public.facility_sites (organization_id, status, name);

create index if not exists facility_sites_property_idx
  on public.facility_sites (property_id)
  where property_id is not null;

create table if not exists public.facility_locations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  site_id uuid not null references public.facility_sites (id) on delete cascade,
  parent_location_id uuid references public.facility_locations (id) on delete set null,
  name text not null,
  location_type text not null default 'building'
    check (location_type in ('campus', 'building', 'floor', 'room', 'yard', 'storeroom', 'other')),
  status text not null default 'active'
    check (status in ('active', 'archived')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists facility_locations_site_idx
  on public.facility_locations (site_id, status, name);

create table if not exists public.facility_notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  site_id uuid references public.facility_sites (id) on delete cascade,
  notification_key text not null,
  title text not null,
  body text not null,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists facility_notifications_user_idx
  on public.facility_notifications (user_id, created_at desc);

alter table public.facility_sites enable row level security;
alter table public.facility_locations enable row level security;
alter table public.facility_notifications enable row level security;

drop policy if exists facility_sites_select on public.facility_sites;
create policy facility_sites_select on public.facility_sites
for select using (public.is_org_member(organization_id));

drop policy if exists facility_sites_write on public.facility_sites;
create policy facility_sites_write on public.facility_sites
for all using (public.is_org_manager(organization_id))
with check (public.is_org_manager(organization_id));

drop policy if exists facility_locations_select on public.facility_locations;
create policy facility_locations_select on public.facility_locations
for select using (public.is_org_member(organization_id));

drop policy if exists facility_locations_write on public.facility_locations;
create policy facility_locations_write on public.facility_locations
for all using (public.is_org_manager(organization_id))
with check (public.is_org_manager(organization_id));

drop policy if exists facility_notifications_select_own on public.facility_notifications;
create policy facility_notifications_select_own on public.facility_notifications
for select using (user_id = auth.uid() or public.is_org_manager(organization_id));

drop policy if exists facility_notifications_insert on public.facility_notifications;
create policy facility_notifications_insert on public.facility_notifications
for insert with check (
  public.is_org_manager(organization_id)
  or public.is_org_member(organization_id)
  or user_id = auth.uid()
);

drop policy if exists facility_notifications_update_own on public.facility_notifications;
create policy facility_notifications_update_own on public.facility_notifications
for update
to authenticated
using (user_id = auth.uid() or public.is_org_manager(organization_id))
with check (user_id = auth.uid() or public.is_org_manager(organization_id));
