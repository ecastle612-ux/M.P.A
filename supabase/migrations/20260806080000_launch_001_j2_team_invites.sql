-- LAUNCH-001 Journey J2 — Build Your Team
-- Expand membership/invite roles, org-admin manager check, invite email tracking.

-- ---------------------------------------------------------------------------
-- Role permission grant / override role enums
-- ---------------------------------------------------------------------------

alter table public.role_permission_grants
  drop constraint if exists role_permission_grants_role_check;

alter table public.role_permission_grants
  add constraint role_permission_grants_role_check
  check (
    role in (
      'organization_admin',
      'property_manager',
      'leasing_agent',
      'maintenance_technician',
      'property_owner',
      'tenant',
      'vendor'
    )
  );

alter table public.organization_permission_overrides
  drop constraint if exists organization_permission_overrides_role_check;

alter table public.organization_permission_overrides
  add constraint organization_permission_overrides_role_check
  check (
    role in (
      'organization_admin',
      'property_manager',
      'leasing_agent',
      'maintenance_technician',
      'property_owner',
      'tenant',
      'vendor'
    )
  );

-- ---------------------------------------------------------------------------
-- Membership / invitation role arrays
-- ---------------------------------------------------------------------------

alter table public.organization_memberships
  drop constraint if exists organization_memberships_roles_check;

alter table public.organization_memberships
  add constraint organization_memberships_roles_check
  check (
    roles <@ array[
      'organization_admin',
      'property_manager',
      'leasing_agent',
      'maintenance_technician',
      'property_owner',
      'tenant',
      'vendor'
    ]::text[]
  );

alter table public.organization_invitations
  drop constraint if exists organization_invitations_roles_check;

alter table public.organization_invitations
  add constraint organization_invitations_roles_check
  check (
    roles <@ array[
      'organization_admin',
      'property_manager',
      'leasing_agent',
      'maintenance_technician',
      'property_owner',
      'tenant',
      'vendor'
    ]::text[]
  );

alter table public.organization_invitations
  add column if not exists email_status text not null default 'pending'
    check (email_status in ('pending', 'sent', 'failed', 'skipped')),
  add column if not exists email_sent_at timestamptz,
  add column if not exists email_provider_id text,
  add column if not exists email_error text;

-- ---------------------------------------------------------------------------
-- Org managers include Organization Admin
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
        'property_manager' = any(memberships.roles)
        or 'organization_admin' = any(memberships.roles)
      )
  );
$$;

-- ---------------------------------------------------------------------------
-- Permission grants for launch roles
-- ---------------------------------------------------------------------------

insert into public.role_permission_grants (role, capability_key)
values
  -- Organization Admin ≈ full PM operator
  ('organization_admin', 'identity:read'),
  ('organization_admin', 'organization:create'),
  ('organization_admin', 'organization:read'),
  ('organization_admin', 'organization:switch'),
  ('organization_admin', 'invitation:create'),
  ('organization_admin', 'invitation:read'),
  ('organization_admin', 'membership:read'),
  ('organization_admin', 'membership:update'),
  ('organization_admin', 'profile:read'),
  ('organization_admin', 'profile:update'),
  ('organization_admin', 'navigation:access'),
  ('organization_admin', 'authorization:manage'),
  ('organization_admin', 'pm.finance:read'),
  ('organization_admin', 'pm.finance:charge.write'),
  ('organization_admin', 'pm.finance:payment.refund'),
  ('organization_admin', 'pm.finance:late_fee.manage'),
  ('organization_admin', 'pm.finance:vendor_invoice.review'),
  ('organization_admin', 'pm.finance:vendor_payment.release'),
  ('organization_admin', 'pm.finance:reports.read'),
  ('organization_admin', 'pm.finance:settings.manage'),
  ('organization_admin', 'pm.properties:read'),
  ('organization_admin', 'pm.properties:write'),
  -- Leasing Agent
  ('leasing_agent', 'identity:read'),
  ('leasing_agent', 'organization:read'),
  ('leasing_agent', 'organization:switch'),
  ('leasing_agent', 'invitation:read'),
  ('leasing_agent', 'membership:read'),
  ('leasing_agent', 'profile:read'),
  ('leasing_agent', 'profile:update'),
  ('leasing_agent', 'navigation:access'),
  ('leasing_agent', 'pm.properties:read'),
  ('leasing_agent', 'pm.finance:read'),
  -- Maintenance Technician
  ('maintenance_technician', 'identity:read'),
  ('maintenance_technician', 'organization:read'),
  ('maintenance_technician', 'organization:switch'),
  ('maintenance_technician', 'membership:read'),
  ('maintenance_technician', 'profile:read'),
  ('maintenance_technician', 'profile:update'),
  ('maintenance_technician', 'navigation:access'),
  ('maintenance_technician', 'pm.properties:read')
on conflict (role, capability_key) do nothing;
