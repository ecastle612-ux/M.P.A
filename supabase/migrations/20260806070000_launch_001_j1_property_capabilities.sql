-- LAUNCH-001 Journey J1 — Property portfolio capabilities
-- Gates create/read of portfolio properties outside FO settings.

insert into public.permission_capabilities (key, namespace, description)
values
  ('pm.properties:read', 'pm.properties', 'Read portfolio properties, units, and Property Command Center'),
  ('pm.properties:write', 'pm.properties', 'Create and activate portfolio properties and units')
on conflict (key) do nothing;

insert into public.role_permission_grants (role, capability_key)
values
  ('property_manager', 'pm.properties:read'),
  ('property_manager', 'pm.properties:write'),
  ('property_owner', 'pm.properties:read')
on conflict (role, capability_key) do nothing;
