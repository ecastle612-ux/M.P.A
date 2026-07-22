-- ADMIN-003: Master Admin (app_metadata.dev_master_admin) must satisfy
-- has_org_capability for active-org HQ tools such as Migration Center.
-- Membership roles may be empty for Master Admin–only operators.

create or replace function public.has_org_capability(target_org_id uuid, required_capability text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with master_admin_grant as (
    select coalesce(
      (auth.jwt() -> 'app_metadata' ->> 'dev_master_admin')::boolean,
      false
    ) as allowed
  ),
  member_roles as (
    select distinct unnest(memberships.roles) as role
    from public.organization_memberships memberships
    where memberships.organization_id = target_org_id
      and memberships.user_id = auth.uid()
      and memberships.status = 'active'
  ),
  base_grants as (
    select grants.capability_key
    from public.role_permission_grants grants
    join member_roles on member_roles.role = grants.role
    where grants.capability_key = required_capability
       or grants.capability_key = split_part(required_capability, ':', 1) || ':*'
  ),
  deny_overrides as (
    select 1
    from public.organization_permission_overrides overrides
    join member_roles on member_roles.role = overrides.role
    where overrides.organization_id = target_org_id
      and overrides.effect = 'deny'
      and (
        overrides.capability_key = required_capability
        or overrides.capability_key = split_part(required_capability, ':', 1) || ':*'
      )
    limit 1
  ),
  allow_overrides as (
    select 1
    from public.organization_permission_overrides overrides
    join member_roles on member_roles.role = overrides.role
    where overrides.organization_id = target_org_id
      and overrides.effect = 'allow'
      and (
        overrides.capability_key = required_capability
        or overrides.capability_key = split_part(required_capability, ':', 1) || ':*'
      )
    limit 1
  )
  select case
    when (select allowed from master_admin_grant) then true
    when exists (select 1 from deny_overrides) then false
    when exists (select 1 from allow_overrides) then true
    else exists (select 1 from base_grants)
  end;
$$;
