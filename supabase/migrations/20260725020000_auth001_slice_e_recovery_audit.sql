-- AUTH-001 Slice E — recovery contacts, privileged audit, support escalations.
-- Append-only privileged audit; never store passwords or temporary credentials.

-- ---------------------------------------------------------------------------
-- 0) commercial_status — allow Active (R-04 gate enforced in application)
-- ---------------------------------------------------------------------------
alter table public.organizations
  drop constraint if exists organizations_commercial_status_check;

alter table public.organizations
  add constraint organizations_commercial_status_check
  check (
    commercial_status is null
    or commercial_status in ('trial', 'pending_setup', 'active')
  );

comment on column public.organizations.commercial_status is
  'AUTH-001 commercial lifecycle: trial | pending_setup | active (Slice E). Active requires verified secondary recovery contact (R-04).';

-- ---------------------------------------------------------------------------
-- 1) Secondary recovery contact (one active record per organization)
-- ---------------------------------------------------------------------------
create table if not exists public.organization_recovery_contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text,
  verified_at timestamptz,
  verification_token_hash text,
  verification_expires_at timestamptz,
  org_admin_acknowledged_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id)
);

create index if not exists organization_recovery_contacts_email_idx
  on public.organization_recovery_contacts (lower(email));

comment on table public.organization_recovery_contacts is
  'AUTH-001 Slice E secondary recovery contact. Not automatically an Org Admin.';

alter table public.organization_recovery_contacts enable row level security;

drop policy if exists organization_recovery_contacts_select_member on public.organization_recovery_contacts;
create policy organization_recovery_contacts_select_member
on public.organization_recovery_contacts
for select
using (
  exists (
    select 1
    from public.organization_memberships m
    where m.organization_id = organization_recovery_contacts.organization_id
      and m.user_id = auth.uid()
      and m.status = 'active'
  )
);

drop policy if exists organization_recovery_contacts_manage_manager on public.organization_recovery_contacts;
create policy organization_recovery_contacts_manage_manager
on public.organization_recovery_contacts
for all
using (public.is_org_manager(organization_id))
with check (public.is_org_manager(organization_id));

-- ---------------------------------------------------------------------------
-- 2) Privileged audit (append-only A07)
-- ---------------------------------------------------------------------------
create table if not exists public.auth_privileged_audit (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default timezone('utc', now()),
  actor_user_id uuid references auth.users (id) on delete set null,
  actor_type text not null check (
    actor_type in ('system', 'org_admin', 'subaccount', 'master_admin', 'support', 'implementation_specialist')
  ),
  organization_id uuid references public.organizations (id) on delete set null,
  action text not null,
  target_type text not null,
  target_id text not null,
  reason text,
  ip_address text,
  device text,
  before_state jsonb,
  after_state jsonb,
  correlation_id text,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists auth_privileged_audit_org_occurred_idx
  on public.auth_privileged_audit (organization_id, occurred_at desc);

create index if not exists auth_privileged_audit_action_idx
  on public.auth_privileged_audit (action, occurred_at desc);

comment on table public.auth_privileged_audit is
  'AUTH-001 Slice E append-only privileged audit. Never store passwords or secrets.';

alter table public.auth_privileged_audit enable row level security;

-- Master Admin / org managers can read; inserts via service role only (no insert policy for authenticated).
drop policy if exists auth_privileged_audit_select_manager on public.auth_privileged_audit;
create policy auth_privileged_audit_select_manager
on public.auth_privileged_audit
for select
using (
  public.is_org_manager(organization_id)
  or exists (
    select 1
    from public.organization_memberships m
    where m.user_id = auth.uid()
      and m.status = 'active'
      and 'organization_admin' = any(m.roles)
  )
);

-- Block updates/deletes for authenticated roles (service role bypasses RLS).
revoke update, delete on public.auth_privileged_audit from authenticated, anon;

-- ---------------------------------------------------------------------------
-- 3) Support escalation tracking (auth/recovery classes)
-- ---------------------------------------------------------------------------
create table if not exists public.auth_support_escalations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations (id) on delete set null,
  issue_class text not null,
  level text not null check (level in ('L0', 'L1', 'L2', 'L3')),
  status text not null default 'open' check (status in ('open', 'escalated', 'resolved', 'closed')),
  subject_user_id uuid references auth.users (id) on delete set null,
  opened_by uuid references auth.users (id) on delete set null,
  reason text not null,
  resolution_notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  resolved_at timestamptz
);

create index if not exists auth_support_escalations_org_idx
  on public.auth_support_escalations (organization_id, created_at desc);

comment on table public.auth_support_escalations is
  'AUTH-001 Slice E support escalation state for auth/recovery issue classes.';

alter table public.auth_support_escalations enable row level security;

drop policy if exists auth_support_escalations_select_member on public.auth_support_escalations;
create policy auth_support_escalations_select_member
on public.auth_support_escalations
for select
using (
  organization_id is null
  or exists (
    select 1
    from public.organization_memberships m
    where m.organization_id = auth_support_escalations.organization_id
      and m.user_id = auth.uid()
      and m.status = 'active'
  )
);

drop policy if exists auth_support_escalations_manage_manager on public.auth_support_escalations;
create policy auth_support_escalations_manage_manager
on public.auth_support_escalations
for all
using (
  organization_id is null
  or public.is_org_manager(organization_id)
)
with check (
  organization_id is null
  or public.is_org_manager(organization_id)
);
