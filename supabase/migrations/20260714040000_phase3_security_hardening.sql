-- Phase 3 foundation: security hardening and capability-based RLS.

create or replace function public.has_org_capability(target_org_id uuid, required_capability text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with member_roles as (
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
    when exists (select 1 from deny_overrides) then false
    when exists (select 1 from allow_overrides) then true
    else exists (select 1 from base_grants)
  end;
$$;

drop policy if exists organizations_update_by_manager on public.organizations;
create policy organizations_update_authorized
on public.organizations
for update
using (public.has_org_capability(id, 'authorization:manage'))
with check (public.has_org_capability(id, 'authorization:manage'));

drop policy if exists organizations_delete_by_manager on public.organizations;
create policy organizations_delete_authorized
on public.organizations
for delete
using (public.has_org_capability(id, 'authorization:manage'));

drop policy if exists memberships_select_self_or_manager on public.organization_memberships;
create policy memberships_select_self_or_authorized
on public.organization_memberships
for select
using (
  user_id = auth.uid()
  or public.has_org_capability(organization_id, 'membership:read')
);

drop policy if exists memberships_insert_creator_or_manager on public.organization_memberships;
create policy memberships_insert_authorized
on public.organization_memberships
for insert
with check (
  public.has_org_capability(organization_id, 'membership:update')
  or exists (
    select 1
    from public.organizations organizations
    where organizations.id = organization_id
      and organizations.created_by = auth.uid()
  )
);

drop policy if exists memberships_update_manager on public.organization_memberships;
create policy memberships_update_authorized
on public.organization_memberships
for update
using (public.has_org_capability(organization_id, 'membership:update'))
with check (public.has_org_capability(organization_id, 'membership:update'));

drop policy if exists memberships_delete_manager on public.organization_memberships;
create policy memberships_delete_authorized
on public.organization_memberships
for delete
using (public.has_org_capability(organization_id, 'membership:update'));

drop policy if exists invitations_select_member on public.organization_invitations;
create policy invitations_select_authorized
on public.organization_invitations
for select
using (
  public.has_org_capability(organization_id, 'invitation:read')
  or lower(email) = lower(coalesce((auth.jwt() ->> 'email'), ''))
);

drop policy if exists invitations_insert_manager on public.organization_invitations;
create policy invitations_insert_authorized
on public.organization_invitations
for insert
with check (public.has_org_capability(organization_id, 'invitation:create'));

drop policy if exists invitations_update_manager_or_recipient on public.organization_invitations;
create policy invitations_update_authorized
on public.organization_invitations
for update
using (
  public.has_org_capability(organization_id, 'invitation:create')
  or lower(email) = lower(coalesce((auth.jwt() ->> 'email'), ''))
)
with check (
  public.has_org_capability(organization_id, 'invitation:create')
  or lower(email) = lower(coalesce((auth.jwt() ->> 'email'), ''))
);
