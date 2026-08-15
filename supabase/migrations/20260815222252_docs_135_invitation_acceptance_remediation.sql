-- docs/135 — Complete invitation create/accept remediation.
-- Repo-only until Production migration certification + Owner apply.
-- Does NOT apply itself. Do not deploy from this slice.
--
-- Canonical transport: delivery_status + last_delivered_at (Production live columns).
-- Does not add email_status. Does not rename or drop delivery_status.
-- Does not add an invitee-self-insert membership policy.
-- Does not create a client-callable SECURITY DEFINER accept RPC (PLAT-005).
-- Accept mutations are owned by trusted Next.js service_role (docs/135 Option B).

-- ---------------------------------------------------------------------------
-- Transport columns (no-op on Production; required for local J2 lineage)
-- ---------------------------------------------------------------------------

alter table public.organization_invitations
  add column if not exists delivery_status text;

alter table public.organization_invitations
  add column if not exists last_delivered_at timestamptz;

alter table public.organization_invitations
  drop constraint if exists organization_invitations_delivery_status_check;

alter table public.organization_invitations
  add constraint organization_invitations_delivery_status_check
  check (
    delivery_status is null
    or delivery_status in ('pending', 'sent', 'failed')
  );

comment on column public.organization_invitations.delivery_status is
  'Invitation email transport state. sent = provider accepted the send, not inbox confirmation.';
comment on column public.organization_invitations.last_delivered_at is
  'Timestamp when the email provider accepted the send. Not inbox delivery.';

-- ---------------------------------------------------------------------------
-- Invitee must not UPDATE persisted role / operating_scope / token
-- SELECT-by-email remains for post-login preview.
-- Accept marks accepted via service_role.
-- ---------------------------------------------------------------------------

drop policy if exists invitations_update_authorized on public.organization_invitations;
create policy invitations_update_authorized
on public.organization_invitations
for update
using (public.has_org_capability(organization_id, 'invitation:create'))
with check (public.has_org_capability(organization_id, 'invitation:create'));

-- ---------------------------------------------------------------------------
-- Technician CHECK compatibility (additive). Not a new role.
-- Preserve maintenance_technician (app) and facility_technician (live rows).
-- Do not rewrite memberships. Do not change RBAC grants.
-- ---------------------------------------------------------------------------

alter table public.organization_invitations
  drop constraint if exists organization_invitations_roles_check;

alter table public.organization_invitations
  add constraint organization_invitations_roles_check
  check (
    roles <@ array[
      'organization_admin',
      'property_manager',
      'leasing_agent',
      'maintenance_technician',
      'facility_technician',
      'property_owner',
      'tenant',
      'vendor'
    ]::text[]
  );

alter table public.organization_memberships
  drop constraint if exists organization_memberships_roles_check;

alter table public.organization_memberships
  add constraint organization_memberships_roles_check
  check (
    roles <@ array[
      'organization_admin',
      'property_manager',
      'leasing_agent',
      'maintenance_technician',
      'facility_technician',
      'property_owner',
      'tenant',
      'vendor'
    ]::text[]
  );

-- ---------------------------------------------------------------------------
-- One invitation.accepted scope event per invitation
-- ---------------------------------------------------------------------------

create unique index if not exists organization_operating_scope_events_invitation_accepted_uidx
  on public.organization_operating_scope_events (invitation_id)
  where reason = 'invitation.accepted' and invitation_id is not null;
