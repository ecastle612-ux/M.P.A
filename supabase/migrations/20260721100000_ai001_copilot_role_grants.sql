-- AI-001: broaden operational copilot grants so owners can use AI and portals can open the launcher.
insert into public.role_permission_grants (role, capability_key)
values
  ('property_owner', 'ai:use'),
  ('tenant', 'ai:read'),
  ('vendor', 'ai:read')
on conflict (role, capability_key) do nothing;
