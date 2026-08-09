-- Phase 4 Sprint 7 — Reporting & Analytics Center (additive)
-- Capability only — no analytics warehouse; reports read existing tables.
-- Roles: grant to LAUNCH invite roles and production role_permission_grants check roles.

insert into public.permission_capabilities (key, namespace, description)
values
  ('platform.reports:read', 'platform.reports', 'Read Reporting & Analytics Center insights and exports')
on conflict (key) do nothing;

insert into public.role_permission_grants (role, capability_key)
values
  ('organization_admin', 'platform.reports:read'),
  ('property_manager', 'platform.reports:read'),
  ('leasing_agent', 'platform.reports:read'),
  ('property_owner', 'platform.reports:read')
on conflict (role, capability_key) do nothing;

-- Technician role name differs across environments (LAUNCH vs prod constraint).
insert into public.role_permission_grants (role, capability_key)
select r.role, 'platform.reports:read'
from (values ('maintenance_technician'), ('facility_technician')) as r(role)
where exists (
  select 1
  from pg_constraint c
  where c.conname = 'role_permission_grants_role_check'
    and pg_get_constraintdef(c.oid) like '%' || r.role || '%'
)
on conflict (role, capability_key) do nothing;
