-- PAY-001 Slice 1: Settlement funding foundation
-- Destination enrollment, fee policy, durable charge→settlement mapping.
-- No owner transfers, refunds automation, or dispute automation.

-- ---------------------------------------------------------------------------
-- org_settlement_funding_settings — per-org enrollment + fee policy
-- ---------------------------------------------------------------------------

create table if not exists public.org_settlement_funding_settings (
  organization_id uuid primary key references public.organizations (id) on delete cascade,
  destination_enrolled boolean not null default false,
  funding_enabled boolean not null default false,
  fee_bps integer not null default 0 check (fee_bps >= 0 and fee_bps <= 10000),
  fee_flat_cents integer not null default 0 check (fee_flat_cents >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists org_settlement_funding_settings_enrolled_idx
  on public.org_settlement_funding_settings (destination_enrolled, funding_enabled);

-- ---------------------------------------------------------------------------
-- payment_settlement_mappings — durable charge → org settlement Express link
-- ---------------------------------------------------------------------------

create table if not exists public.payment_settlement_mappings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  property_id uuid references public.properties (id) on delete set null,
  payment_attempt_id uuid not null references public.payment_attempts (id) on delete cascade,
  provider text not null default 'stripe',
  settlement_external_account_id text not null,
  connect_account_id uuid references public.connect_accounts (id) on delete set null,
  external_payment_intent_id text,
  external_checkout_session_id text,
  funding_mode text not null check (funding_mode in ('destination', 'legacy_platform')),
  application_fee_amount_cents integer not null default 0 check (application_fee_amount_cents >= 0),
  charge_amount_cents integer not null check (charge_amount_cents > 0),
  currency text not null default 'usd',
  status text not null default 'created'
    check (status in ('created', 'confirmed', 'failed', 'canceled')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  confirmed_at timestamptz,
  updated_at timestamptz not null default timezone('utc', now()),
  unique (payment_attempt_id)
);

create index if not exists payment_settlement_mappings_org_idx
  on public.payment_settlement_mappings (organization_id, created_at desc);

create index if not exists payment_settlement_mappings_settlement_idx
  on public.payment_settlement_mappings (settlement_external_account_id, funding_mode);

create index if not exists payment_settlement_mappings_external_pi_idx
  on public.payment_settlement_mappings (provider, external_payment_intent_id)
  where external_payment_intent_id is not null;

-- ---------------------------------------------------------------------------
-- capabilities — funding ops (toggle / view mapping)
-- ---------------------------------------------------------------------------

insert into public.permission_capabilities (key, namespace, description)
values
  (
    'funding:manage',
    'funding',
    'Manage PAY-001 destination funding enrollment and kill switch for an organization'
  ),
  (
    'funding:read',
    'funding',
    'View PAY-001 settlement funding settings and charge→settlement mappings'
  )
on conflict (key) do nothing;

insert into public.role_permission_grants (role, capability_key)
values
  ('property_manager', 'funding:manage'),
  ('property_manager', 'funding:read'),
  ('property_owner', 'funding:read')
on conflict (role, capability_key) do nothing;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.org_settlement_funding_settings enable row level security;
alter table public.payment_settlement_mappings enable row level security;

drop policy if exists org_settlement_funding_settings_select on public.org_settlement_funding_settings;
create policy org_settlement_funding_settings_select on public.org_settlement_funding_settings for select
using (
  public.has_org_capability(organization_id, 'funding:read')
  or public.has_org_capability(organization_id, 'funding:manage')
  or public.has_org_capability(organization_id, 'financial:read')
  or public.has_org_capability(organization_id, 'payout:manage')
);

drop policy if exists org_settlement_funding_settings_upsert on public.org_settlement_funding_settings;
create policy org_settlement_funding_settings_upsert on public.org_settlement_funding_settings for all
using (
  public.has_org_capability(organization_id, 'funding:manage')
  or public.has_org_capability(organization_id, 'financial:admin')
)
with check (
  public.has_org_capability(organization_id, 'funding:manage')
  or public.has_org_capability(organization_id, 'financial:admin')
);

drop policy if exists payment_settlement_mappings_select on public.payment_settlement_mappings;
create policy payment_settlement_mappings_select on public.payment_settlement_mappings for select
using (
  public.has_org_capability(organization_id, 'funding:read')
  or public.has_org_capability(organization_id, 'funding:manage')
  or public.has_org_capability(organization_id, 'financial:read')
  or public.has_org_capability(organization_id, 'financial:admin')
);

-- Inserts/updates via service role from BillingService (no authenticated write policy)
