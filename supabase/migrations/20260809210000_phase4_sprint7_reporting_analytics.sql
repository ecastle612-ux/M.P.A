-- Phase 4 Sprint 7 — Reporting & Analytics Center (additive)
-- Capability only — no analytics warehouse; reports read existing tables.

insert into public.permission_capabilities (key, namespace, description)
values
  ('platform.reports:read', 'platform.reports', 'Read Reporting & Analytics Center insights and exports')
on conflict (key) do nothing;

insert into public.role_permission_grants (role, capability_key)
values
  ('organization_admin', 'platform.reports:read'),
  ('property_manager', 'platform.reports:read'),
  ('leasing_agent', 'platform.reports:read'),
  ('maintenance_technician', 'platform.reports:read'),
  ('property_owner', 'platform.reports:read')
on conflict (role, capability_key) do nothing;
