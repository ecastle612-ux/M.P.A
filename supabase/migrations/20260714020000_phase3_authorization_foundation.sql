-- Phase 3 foundation: permission-based authorization model.

create table if not exists public.permission_capabilities (
  key text primary key,
  namespace text not null,
  description text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.role_permission_grants (
  id uuid primary key default gen_random_uuid(),
  role text not null check (role in ('property_manager', 'property_owner', 'tenant', 'vendor')),
  capability_key text not null references public.permission_capabilities (key) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  unique (role, capability_key)
);

create table if not exists public.organization_permission_overrides (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  role text not null check (role in ('property_manager', 'property_owner', 'tenant', 'vendor')),
  capability_key text not null references public.permission_capabilities (key) on delete cascade,
  effect text not null check (effect in ('allow', 'deny')),
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, role, capability_key)
);

insert into public.permission_capabilities (key, namespace, description)
values
  ('identity:read', 'identity', 'Read identity context for the authenticated user'),
  ('organization:create', 'organization', 'Create organizations'),
  ('organization:read', 'organization', 'Read organizations and memberships'),
  ('organization:switch', 'organization', 'Switch active organization context'),
  ('invitation:create', 'invitation', 'Create organization invitations'),
  ('invitation:read', 'invitation', 'Read organization invitations'),
  ('membership:read', 'membership', 'Read organization membership records'),
  ('membership:update', 'membership', 'Update organization memberships'),
  ('profile:read', 'profile', 'Read profile information'),
  ('profile:update', 'profile', 'Update profile information'),
  ('navigation:access', 'navigation', 'Access role-aware navigation'),
  ('authorization:manage', 'authorization', 'Manage org-level permission overrides')
on conflict (key) do nothing;

insert into public.role_permission_grants (role, capability_key)
values
  ('property_manager', 'identity:read'),
  ('property_manager', 'organization:create'),
  ('property_manager', 'organization:read'),
  ('property_manager', 'organization:switch'),
  ('property_manager', 'invitation:create'),
  ('property_manager', 'invitation:read'),
  ('property_manager', 'membership:read'),
  ('property_manager', 'membership:update'),
  ('property_manager', 'profile:read'),
  ('property_manager', 'profile:update'),
  ('property_manager', 'navigation:access'),
  ('property_manager', 'authorization:manage'),
  ('property_owner', 'identity:read'),
  ('property_owner', 'organization:read'),
  ('property_owner', 'organization:switch'),
  ('property_owner', 'invitation:read'),
  ('property_owner', 'membership:read'),
  ('property_owner', 'profile:read'),
  ('property_owner', 'profile:update'),
  ('property_owner', 'navigation:access'),
  ('tenant', 'identity:read'),
  ('tenant', 'organization:read'),
  ('tenant', 'organization:switch'),
  ('tenant', 'profile:read'),
  ('tenant', 'profile:update'),
  ('tenant', 'navigation:access'),
  ('vendor', 'identity:read'),
  ('vendor', 'organization:read'),
  ('vendor', 'organization:switch'),
  ('vendor', 'profile:read'),
  ('vendor', 'profile:update'),
  ('vendor', 'navigation:access')
on conflict (role, capability_key) do nothing;

alter table public.permission_capabilities enable row level security;
alter table public.role_permission_grants enable row level security;
alter table public.organization_permission_overrides enable row level security;

drop policy if exists permission_capabilities_select_authenticated on public.permission_capabilities;
create policy permission_capabilities_select_authenticated
on public.permission_capabilities
for select
using (auth.role() = 'authenticated');

drop policy if exists role_permission_grants_select_authenticated on public.role_permission_grants;
create policy role_permission_grants_select_authenticated
on public.role_permission_grants
for select
using (auth.role() = 'authenticated');

drop policy if exists permission_overrides_select_member on public.organization_permission_overrides;
create policy permission_overrides_select_member
on public.organization_permission_overrides
for select
using (
  exists (
    select 1
    from public.organization_memberships memberships
    where memberships.organization_id = organization_permission_overrides.organization_id
      and memberships.user_id = auth.uid()
      and memberships.status = 'active'
  )
);

drop policy if exists permission_overrides_manage_manager on public.organization_permission_overrides;
create policy permission_overrides_manage_manager
on public.organization_permission_overrides
for all
using (public.is_org_manager(organization_id))
with check (public.is_org_manager(organization_id));
