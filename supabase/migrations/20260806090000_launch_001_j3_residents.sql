-- LAUNCH-001 Journey J3 — First Resident
-- Operational resident records independent of leases (lease comes in J4).

-- ---------------------------------------------------------------------------
-- Capabilities
-- ---------------------------------------------------------------------------

insert into public.permission_capabilities (key, namespace, description)
values
  ('pm.residents:read', 'pm.residents', 'Read resident directory, profiles, and Resident Command Center'),
  ('pm.residents:write', 'pm.residents', 'Create residents and assign them to properties and units')
on conflict (key) do nothing;

insert into public.role_permission_grants (role, capability_key)
values
  ('organization_admin', 'pm.residents:read'),
  ('organization_admin', 'pm.residents:write'),
  ('property_manager', 'pm.residents:read'),
  ('property_manager', 'pm.residents:write'),
  ('leasing_agent', 'pm.residents:read'),
  ('leasing_agent', 'pm.residents:write'),
  ('property_owner', 'pm.residents:read')
on conflict (role, capability_key) do nothing;

-- ---------------------------------------------------------------------------
-- Residents table (person without requiring a lease)
-- ---------------------------------------------------------------------------

create table if not exists public.pm_residents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  property_id uuid not null references public.property_properties (id) on delete restrict,
  unit_id uuid not null references public.property_units (id) on delete restrict,
  first_name text not null,
  last_name text not null,
  display_name text not null,
  email text not null,
  phone text,
  status text not null default 'pending_lease'
    check (status in ('prospect', 'pending_lease', 'pending_move_in', 'active', 'former')),
  portal_status text not null default 'pending_activation'
    check (portal_status in ('pending_activation', 'active', 'disabled')),
  user_id uuid references auth.users (id) on delete set null,
  lease_id uuid references public.lease_agreements (id) on delete set null,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, email)
);

create index if not exists pm_residents_org_idx
  on public.pm_residents (organization_id, created_at desc);

create index if not exists pm_residents_property_idx
  on public.pm_residents (organization_id, property_id);

create index if not exists pm_residents_unit_idx
  on public.pm_residents (organization_id, unit_id);

create index if not exists pm_residents_status_idx
  on public.pm_residents (organization_id, status);

create index if not exists pm_residents_name_idx
  on public.pm_residents (organization_id, last_name, first_name);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

create or replace function public.is_resident_writer(target_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_memberships memberships
    where memberships.organization_id = target_org_id
      and memberships.user_id = auth.uid()
      and memberships.status = 'active'
      and (
        'property_manager' = any(memberships.roles)
        or 'organization_admin' = any(memberships.roles)
        or 'leasing_agent' = any(memberships.roles)
      )
  );
$$;

alter table public.pm_residents enable row level security;

drop policy if exists pm_residents_select_member on public.pm_residents;
create policy pm_residents_select_member on public.pm_residents
for select using (
  public.is_org_member(organization_id) or user_id = auth.uid()
);

drop policy if exists pm_residents_manage_writer on public.pm_residents;
create policy pm_residents_manage_writer on public.pm_residents
for all using (public.is_resident_writer(organization_id))
with check (public.is_resident_writer(organization_id));
