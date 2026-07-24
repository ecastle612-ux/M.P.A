-- FIN-003 Phase C: allocation profiles + payout runs + transfer intents/attempts
-- Money-out persistence only. No schedules. D–E remain locked.

-- ---------------------------------------------------------------------------
-- allocation_profiles — D1 per-property owner splits (Σ percent = 100)
-- ---------------------------------------------------------------------------

create table if not exists public.allocation_profiles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  property_id uuid not null references public.properties (id) on delete cascade,
  owner_user_id uuid not null references auth.users (id) on delete cascade,
  percent numeric(7, 4) not null check (percent > 0 and percent <= 100),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, property_id, owner_user_id)
);

create index if not exists allocation_profiles_org_property_idx
  on public.allocation_profiles (organization_id, property_id);

-- ---------------------------------------------------------------------------
-- payout_runs — ad-hoc money-out batches
-- ---------------------------------------------------------------------------

create table if not exists public.payout_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  status text not null default 'draft' check (
    status in ('draft', 'queued', 'running', 'succeeded', 'partial', 'failed', 'canceled')
  ),
  period_start timestamptz not null,
  period_end timestamptz not null,
  currency text not null default 'usd' check (currency = 'usd'),
  created_by uuid references auth.users (id) on delete set null,
  preflight_available_cents bigint,
  preflight_sum_cents bigint,
  failure_reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  started_at timestamptz,
  completed_at timestamptz,
  check (period_end > period_start)
);

create index if not exists payout_runs_org_status_idx
  on public.payout_runs (organization_id, status, created_at desc);

create table if not exists public.payout_run_properties (
  id uuid primary key default gen_random_uuid(),
  payout_run_id uuid not null references public.payout_runs (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  property_id uuid not null references public.properties (id) on delete cascade,
  period_start timestamptz not null,
  period_end timestamptz not null,
  unique (payout_run_id, property_id)
);

-- R3 claim uniqueness enforced in OwnerPayoutService (status-aware). Lookup index:
create index if not exists payout_run_properties_claim_lookup_idx
  on public.payout_run_properties (organization_id, property_id, period_start, period_end);

-- ---------------------------------------------------------------------------
-- allocations — computed owner nets for a run/property/period
-- ---------------------------------------------------------------------------

create table if not exists public.payout_allocations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  payout_run_id uuid not null references public.payout_runs (id) on delete cascade,
  property_id uuid not null references public.properties (id) on delete cascade,
  owner_user_id uuid not null references auth.users (id) on delete cascade,
  period_start timestamptz not null,
  period_end timestamptz not null,
  split_percent numeric(7, 4) not null,
  property_distributable_cents bigint not null check (property_distributable_cents >= 0),
  amount_cents bigint not null check (amount_cents >= 0),
  currency text not null default 'usd',
  skip_reason text,
  created_at timestamptz not null default timezone('utc', now()),
  unique (payout_run_id, property_id, owner_user_id)
);

create index if not exists payout_allocations_run_idx
  on public.payout_allocations (payout_run_id);

-- ---------------------------------------------------------------------------
-- transfer_intents — immutable amount/destination snapshots
-- ---------------------------------------------------------------------------

create table if not exists public.transfer_intents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  payout_run_id uuid not null references public.payout_runs (id) on delete cascade,
  allocation_id uuid not null references public.payout_allocations (id) on delete cascade,
  property_id uuid not null references public.properties (id) on delete cascade,
  owner_user_id uuid not null references auth.users (id) on delete cascade,
  period_start timestamptz not null,
  period_end timestamptz not null,
  amount_cents bigint not null check (amount_cents > 0),
  currency text not null default 'usd',
  source_settlement_account_id text not null,
  destination_owner_account_id text not null,
  status text not null default 'pending' check (
    status in (
      'pending',
      'eligible',
      'executing',
      'in_transit',
      'paid',
      'failed',
      'skipped',
      'needs_reconcile'
    )
  ),
  skip_reason text,
  external_transfer_id text,
  failure_reason text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (payout_run_id, allocation_id)
);

create unique index if not exists transfer_intents_external_transfer_uidx
  on public.transfer_intents (external_transfer_id)
  where external_transfer_id is not null;

create index if not exists transfer_intents_run_status_idx
  on public.transfer_intents (payout_run_id, status);

-- ---------------------------------------------------------------------------
-- payout_attempts — idempotent execution tries
-- ---------------------------------------------------------------------------

create table if not exists public.payout_attempts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  transfer_intent_id uuid not null references public.transfer_intents (id) on delete cascade,
  attempt_number integer not null check (attempt_number >= 1),
  idempotency_key text not null,
  status text not null default 'created' check (
    status in ('created', 'succeeded', 'failed', 'unknown')
  ),
  external_transfer_id text,
  error_message text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (transfer_intent_id, attempt_number),
  unique (idempotency_key)
);

create index if not exists payout_attempts_intent_idx
  on public.payout_attempts (transfer_intent_id, attempt_number desc);

-- ---------------------------------------------------------------------------
-- RLS — org-scoped via membership; writes via service role / payout:manage APIs
-- ---------------------------------------------------------------------------

alter table public.allocation_profiles enable row level security;
alter table public.payout_runs enable row level security;
alter table public.payout_run_properties enable row level security;
alter table public.payout_allocations enable row level security;
alter table public.transfer_intents enable row level security;
alter table public.payout_attempts enable row level security;

create policy allocation_profiles_select on public.allocation_profiles for select
using (
  public.has_org_capability(organization_id, 'payout:manage')
  or public.has_org_capability(organization_id, 'financial:read')
);

create policy payout_runs_select on public.payout_runs for select
using (
  public.has_org_capability(organization_id, 'payout:manage')
  or public.has_org_capability(organization_id, 'financial:read')
);

create policy payout_run_properties_select on public.payout_run_properties for select
using (
  public.has_org_capability(organization_id, 'payout:manage')
  or public.has_org_capability(organization_id, 'financial:read')
);

create policy payout_allocations_select on public.payout_allocations for select
using (
  public.has_org_capability(organization_id, 'payout:manage')
  or public.has_org_capability(organization_id, 'financial:read')
);

create policy transfer_intents_select on public.transfer_intents for select
using (
  public.has_org_capability(organization_id, 'payout:manage')
  or public.has_org_capability(organization_id, 'financial:read')
);

create policy payout_attempts_select on public.payout_attempts for select
using (
  public.has_org_capability(organization_id, 'payout:manage')
  or public.has_org_capability(organization_id, 'financial:read')
);

-- Mutations go through service role (OwnerPayoutService); no authenticated INSERT/UPDATE policies.
