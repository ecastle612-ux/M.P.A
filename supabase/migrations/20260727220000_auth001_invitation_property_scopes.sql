-- AUTH-001 residual: persist property scopes on invitations so leasing_agent /
-- facility_technician invites apply membership_property_scopes on accept.

alter table public.organization_invitations
  add column if not exists property_ids uuid[] not null default '{}'::uuid[];

comment on column public.organization_invitations.property_ids is
  'Property scope for property-scoped roles (leasing_agent, facility_technician). Applied to membership_property_scopes on invite create and accept.';
