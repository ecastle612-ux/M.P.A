-- AUTH-001 Slice B: organization provisioning foundation.
-- Commercial status: trial | pending_setup only (Active+ later).
-- Idempotent activation ledger; ownership flag on memberships.

alter table public.organizations
  add column if not exists commercial_status text
    check (commercial_status is null or commercial_status in ('trial', 'pending_setup'));

alter table public.organizations
  add column if not exists organization_type text;

comment on column public.organizations.commercial_status is
  'AUTH-001 Slice B commercial lifecycle: trial | pending_setup (Active+ later slices).';

alter table public.organization_memberships
  add column if not exists is_owner boolean not null default false;

create unique index if not exists organization_memberships_one_owner_uidx
  on public.organization_memberships (organization_id)
  where is_owner = true;

comment on column public.organization_memberships.is_owner is
  'AUTH-001 Slice B: primary Organization Administrator ownership marker (role surfaces deferred to Slice D).';

create table if not exists public.organization_provision_requests (
  id uuid primary key default gen_random_uuid(),
  idempotency_key text not null unique,
  status text not null check (status in ('completed', 'failed')),
  organization_id uuid references public.organizations (id) on delete set null,
  org_admin_user_id uuid references auth.users (id) on delete set null,
  plan_code text,
  commercial_status text check (commercial_status is null or commercial_status in ('trial', 'pending_setup')),
  failure_reason text,
  activation_ref jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz,
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists organization_provision_requests_org_idx
  on public.organization_provision_requests (organization_id);

comment on table public.organization_provision_requests is
  'AUTH-001 Slice B idempotent provision ledger. Never store passwords or temp credentials.';

drop trigger if exists trg_organization_provision_requests_updated_at on public.organization_provision_requests;
create trigger trg_organization_provision_requests_updated_at
before update on public.organization_provision_requests
for each row
execute function public.set_updated_at();

alter table public.organization_provision_requests enable row level security;

-- Service-role / security-definer paths perform writes; no member policies for provision ledger.
