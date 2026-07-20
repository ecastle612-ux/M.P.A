-- UX-001 WI-9 Master Admin Slice A
-- Capability `master_admin` is granted via organization_permission_overrides
-- (not global role_permission_grants). Initial grant: property_manager role
-- on organization slug `mpa-development`.

insert into public.permission_capabilities (key, namespace, description)
values (
  'master_admin',
  'master_admin',
  'Access Master Admin console (Slice A). Granted via organization_permission_overrides, not global role grants.'
)
on conflict (key) do nothing;

insert into public.organization_permission_overrides (
  organization_id,
  role,
  capability_key,
  effect,
  created_by
)
select
  o.id,
  'property_manager',
  'master_admin',
  'allow',
  coalesce(
    (
      select m.user_id
      from public.organization_memberships m
      where m.organization_id = o.id
        and m.status = 'active'
        and m.roles @> array['property_manager']::text[]
      order by m.created_at asc
      limit 1
    ),
    (
      select m.user_id
      from public.organization_memberships m
      where m.organization_id = o.id
        and m.status = 'active'
      order by m.created_at asc
      limit 1
    )
  )
from public.organizations o
where o.slug = 'mpa-development'
  and exists (
    select 1
    from public.organization_memberships m
    where m.organization_id = o.id
      and m.status = 'active'
  )
on conflict (organization_id, role, capability_key) do update
set effect = excluded.effect;
