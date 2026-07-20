-- CP-003: property owners must be able to enroll/manage their own push devices.
insert into public.role_permission_grants (role, capability_key)
values
  ('property_owner', 'notification:update')
on conflict (role, capability_key) do nothing;
