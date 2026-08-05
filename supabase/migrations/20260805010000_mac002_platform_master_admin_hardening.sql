-- MAC-002 — Platform Master Admin hardening
-- 1) master_admin is NEVER org-grantable via permission overrides
-- 2) has_org_capability ignores master_admin allow overrides (JWT app_metadata only)
-- 3) Expire stale impersonation / portal_test sessions (8h)

-- ---------------------------------------------------------------------------
-- 1) Remove any existing org-level master_admin grants
-- ---------------------------------------------------------------------------
delete from public.organization_permission_overrides
where capability_key = 'master_admin';

comment on table public.organization_permission_overrides is
  'Per-org capability allow/deny overrides. capability_key master_admin is forbidden (MAC-002) — platform MA is app_metadata only.';

-- ---------------------------------------------------------------------------
-- 2) Block insert/update of master_admin overrides
-- ---------------------------------------------------------------------------
create or replace function public.prevent_org_master_admin_override()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.capability_key = 'master_admin' then
    raise exception 'capability_key master_admin cannot be granted via organization_permission_overrides (MAC-002)';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_org_master_admin_override on public.organization_permission_overrides;
create trigger trg_prevent_org_master_admin_override
before insert or update on public.organization_permission_overrides
for each row
execute function public.prevent_org_master_admin_override();

-- ---------------------------------------------------------------------------
-- 3) has_org_capability — platform MA via JWT only; never via overrides for master_admin
-- ---------------------------------------------------------------------------
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
      and overrides.capability_key <> 'master_admin'
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
      and overrides.capability_key <> 'master_admin'
      and (
        overrides.capability_key = required_capability
        or overrides.capability_key = split_part(required_capability, ':', 1) || ':*'
      )
    limit 1
  )
  select case
    when required_capability = 'master_admin' then (select allowed from master_admin_grant)
    when (select allowed from master_admin_grant) then true
    when exists (select 1 from deny_overrides) then false
    when exists (select 1 from allow_overrides) then true
    else exists (select 1 from base_grants)
  end;
$$;

comment on function public.has_org_capability(uuid, text) is
  'Org capability check. Platform Master Admin via JWT app_metadata.dev_master_admin only (MAC-002).';

-- ---------------------------------------------------------------------------
-- 4) Close sessions older than 8 hours (server-side TTL companion)
-- ---------------------------------------------------------------------------
update public.master_admin_impersonation_sessions
set ended_at = now()
where ended_at is null
  and started_at < now() - interval '8 hours';
