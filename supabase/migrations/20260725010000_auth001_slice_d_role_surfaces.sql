-- AUTH-001 Slice D — first-class organization_admin, leasing_agent, facility_technician
-- Role catalog expansion, permission templates, property scopes, is_org_manager update.
-- Does not implement Slice E recovery.

-- ---------------------------------------------------------------------------
-- 1) Expand membership / invitation role CHECKs
-- ---------------------------------------------------------------------------
alter table public.organization_memberships
  drop constraint if exists organization_memberships_roles_check;

alter table public.organization_invitations
  drop constraint if exists organization_invitations_roles_check;

alter table public.organization_memberships
  add constraint organization_memberships_roles_check check (
    roles <@ array[
      'organization_admin',
      'property_manager',
      'leasing_agent',
      'facility_technician',
      'property_owner',
      'tenant',
      'vendor'
    ]::text[]
  );

alter table public.organization_invitations
  add constraint organization_invitations_roles_check check (
    roles <@ array[
      'organization_admin',
      'property_manager',
      'leasing_agent',
      'facility_technician',
      'property_owner',
      'tenant',
      'vendor'
    ]::text[]
  );

-- ---------------------------------------------------------------------------
-- 2) Expand role_permission_grants / overrides role CHECKs
-- ---------------------------------------------------------------------------
alter table public.role_permission_grants
  drop constraint if exists role_permission_grants_role_check;

alter table public.organization_permission_overrides
  drop constraint if exists organization_permission_overrides_role_check;

alter table public.role_permission_grants
  add constraint role_permission_grants_role_check check (
    role = any (
      array[
        'organization_admin',
        'property_manager',
        'leasing_agent',
        'facility_technician',
        'property_owner',
        'tenant',
        'vendor'
      ]::text[]
    )
  );

alter table public.organization_permission_overrides
  add constraint organization_permission_overrides_role_check check (
    role = any (
      array[
        'organization_admin',
        'property_manager',
        'leasing_agent',
        'facility_technician',
        'property_owner',
        'tenant',
        'vendor'
      ]::text[]
    )
  );

-- ---------------------------------------------------------------------------
-- 3) is_org_manager — Org Admin + Property Manager staff
-- ---------------------------------------------------------------------------
create or replace function public.is_org_manager(target_org_id uuid)
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
        'organization_admin' = any(memberships.roles)
        or 'property_manager' = any(memberships.roles)
      )
  );
$$;

comment on function public.is_org_manager(uuid) is
  'AUTH-001 Slice D: true when active membership includes organization_admin or property_manager.';

-- ---------------------------------------------------------------------------
-- 4) Property scopes for property-scoped staff roles
-- ---------------------------------------------------------------------------
create table if not exists public.membership_property_scopes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  membership_id uuid not null references public.organization_memberships (id) on delete cascade,
  property_id uuid not null references public.properties (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  unique (membership_id, property_id)
);

create index if not exists membership_property_scopes_org_idx
  on public.membership_property_scopes (organization_id);

create index if not exists membership_property_scopes_membership_idx
  on public.membership_property_scopes (membership_id);

create index if not exists membership_property_scopes_property_idx
  on public.membership_property_scopes (property_id);

alter table public.membership_property_scopes enable row level security;

drop policy if exists membership_property_scopes_select_member on public.membership_property_scopes;
create policy membership_property_scopes_select_member
on public.membership_property_scopes
for select
using (
  exists (
    select 1
    from public.organization_memberships m
    where m.organization_id = membership_property_scopes.organization_id
      and m.user_id = auth.uid()
      and m.status = 'active'
  )
);

drop policy if exists membership_property_scopes_manage_manager on public.membership_property_scopes;
create policy membership_property_scopes_manage_manager
on public.membership_property_scopes
for all
using (public.is_org_manager(organization_id))
with check (public.is_org_manager(organization_id));

-- ---------------------------------------------------------------------------
-- 5) Permission templates (Slice D roles)
-- ---------------------------------------------------------------------------
insert into public.role_permission_grants (role, capability_key)
select 'organization_admin', capability_key
from public.role_permission_grants
where role = 'property_manager'
on conflict (role, capability_key) do nothing;

insert into public.role_permission_grants (role, capability_key)
values
  ('leasing_agent', 'identity:read'),
  ('leasing_agent', 'organization:read'),
  ('leasing_agent', 'organization:switch'),
  ('leasing_agent', 'profile:read'),
  ('leasing_agent', 'profile:update'),
  ('leasing_agent', 'navigation:access'),
  ('leasing_agent', 'dashboard:read'),
  ('leasing_agent', 'property:read'),
  ('leasing_agent', 'unit:read'),
  ('leasing_agent', 'tenant:create'),
  ('leasing_agent', 'tenant:read'),
  ('leasing_agent', 'tenant:update'),
  ('leasing_agent', 'applicant:create'),
  ('leasing_agent', 'applicant:read'),
  ('leasing_agent', 'applicant:update'),
  ('leasing_agent', 'lease:create'),
  ('leasing_agent', 'lease:read'),
  ('leasing_agent', 'lease:update'),
  ('leasing_agent', 'document:create'),
  ('leasing_agent', 'document:read'),
  ('leasing_agent', 'document:update'),
  ('leasing_agent', 'communication:read'),
  ('leasing_agent', 'message:create'),
  ('leasing_agent', 'message:read'),
  ('leasing_agent', 'notification:read'),
  ('facility_technician', 'identity:read'),
  ('facility_technician', 'organization:read'),
  ('facility_technician', 'organization:switch'),
  ('facility_technician', 'profile:read'),
  ('facility_technician', 'profile:update'),
  ('facility_technician', 'navigation:access'),
  ('facility_technician', 'dashboard:read'),
  ('facility_technician', 'property:read'),
  ('facility_technician', 'unit:read'),
  ('facility_technician', 'maintenance:create'),
  ('facility_technician', 'maintenance:read'),
  ('facility_technician', 'maintenance:update'),
  ('facility_technician', 'vendor:read'),
  ('facility_technician', 'document:read'),
  ('facility_technician', 'document:create'),
  ('facility_technician', 'communication:read'),
  ('facility_technician', 'message:create'),
  ('facility_technician', 'message:read'),
  ('facility_technician', 'notification:read')
on conflict (role, capability_key) do nothing;

-- ---------------------------------------------------------------------------
-- 6) Backfill primary Org Admins (is_owner) → organization_admin role
-- ---------------------------------------------------------------------------
update public.organization_memberships
set roles = (
  select array_agg(distinct r order by r)
  from unnest(roles || array['organization_admin']::text[]) as r
)
where coalesce(is_owner, false) = true
  and not ('organization_admin' = any(roles));
