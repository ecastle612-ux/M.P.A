-- FIN-003 Phase A: Stripe Connect onboarding foundation (no money movement)
-- Separate from API-005 payments and BILL-001 SaaS customers/webhooks.

-- ---------------------------------------------------------------------------
-- connect_accounts — org settlement + owner Express refs + mirrored status
-- ---------------------------------------------------------------------------

create table if not exists public.connect_accounts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  purpose text not null check (purpose in ('org_settlement', 'owner')),
  owner_user_id uuid references auth.users (id) on delete cascade,
  provider text not null default 'stripe',
  external_account_id text not null,
  status text not null default 'onboarding' check (
    status in (
      'not_started',
      'onboarding',
      'pending_verification',
      'restricted',
      'eligible',
      'disabled'
    )
  ),
  charges_enabled boolean not null default false,
  payouts_enabled boolean not null default false,
  details_submitted boolean not null default false,
  currently_due jsonb not null default '[]'::jsonb,
  past_due jsonb not null default '[]'::jsonb,
  disabled_reason text,
  requirements jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  last_synced_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (provider, external_account_id),
  constraint connect_accounts_owner_required check (
    (purpose = 'org_settlement' and owner_user_id is null)
    or (purpose = 'owner' and owner_user_id is not null)
  )
);

-- One org settlement account per organization (v1)
create unique index if not exists connect_accounts_one_org_settlement_idx
  on public.connect_accounts (organization_id)
  where purpose = 'org_settlement';

-- One owner Connect account per org + owner user (v1)
create unique index if not exists connect_accounts_one_owner_per_org_idx
  on public.connect_accounts (organization_id, owner_user_id)
  where purpose = 'owner';

create index if not exists connect_accounts_org_purpose_idx
  on public.connect_accounts (organization_id, purpose, status);

create index if not exists connect_accounts_external_idx
  on public.connect_accounts (provider, external_account_id);

-- ---------------------------------------------------------------------------
-- connect_audit_events
-- ---------------------------------------------------------------------------

create table if not exists public.connect_audit_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  entity_type text not null,
  entity_id uuid,
  event_type text not null,
  summary text not null,
  actor_user_id uuid references auth.users (id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists connect_audit_org_created_idx
  on public.connect_audit_events (organization_id, created_at desc);

-- ---------------------------------------------------------------------------
-- connect_webhook_events — dedicated idempotency (never payments/saas)
-- ---------------------------------------------------------------------------

create table if not exists public.connect_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  external_event_id text not null,
  organization_id uuid references public.organizations (id) on delete set null,
  connect_account_id uuid,
  event_type text,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'received'
    check (status in ('received', 'processed', 'failed', 'ignored')),
  created_at timestamptz not null default timezone('utc', now()),
  processed_at timestamptz,
  unique (provider, external_event_id)
);

create index if not exists connect_webhook_status_idx
  on public.connect_webhook_events (status, created_at desc);

-- ---------------------------------------------------------------------------
-- capabilities (D10) — Phase A uses onboard; manage reserved for PM org + later runs
-- ---------------------------------------------------------------------------

insert into public.permission_capabilities (key, namespace, description)
values
  ('payout:onboard', 'payout', 'Start and continue Stripe Connect Express onboarding for owner payouts'),
  ('payout:manage', 'payout', 'Manage org settlement Connect onboarding and (later) payout runs')
on conflict (key) do nothing;

insert into public.role_permission_grants (role, capability_key)
values
  ('property_owner', 'payout:onboard'),
  ('property_manager', 'payout:manage'),
  ('property_manager', 'payout:onboard')
on conflict (role, capability_key) do nothing;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.connect_accounts enable row level security;
alter table public.connect_audit_events enable row level security;
alter table public.connect_webhook_events enable row level security;

drop policy if exists connect_accounts_select on public.connect_accounts;
create policy connect_accounts_select on public.connect_accounts for select
using (
  public.has_org_capability(organization_id, 'payout:onboard')
  or public.has_org_capability(organization_id, 'payout:manage')
  or public.has_org_capability(organization_id, 'financial:read')
);

drop policy if exists connect_accounts_insert on public.connect_accounts;
create policy connect_accounts_insert on public.connect_accounts for insert
with check (
  public.has_org_capability(organization_id, 'payout:onboard')
  or public.has_org_capability(organization_id, 'payout:manage')
);

drop policy if exists connect_accounts_update on public.connect_accounts;
create policy connect_accounts_update on public.connect_accounts for update
using (
  public.has_org_capability(organization_id, 'payout:onboard')
  or public.has_org_capability(organization_id, 'payout:manage')
);

drop policy if exists connect_audit_select on public.connect_audit_events;
create policy connect_audit_select on public.connect_audit_events for select
using (
  public.has_org_capability(organization_id, 'payout:manage')
  or public.has_org_capability(organization_id, 'financial:admin')
);

-- Webhook table: service role only (no authenticated policies)
