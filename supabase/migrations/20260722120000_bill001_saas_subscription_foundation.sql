-- BILL-001 Phase A: SaaS subscription billing foundation
-- Strictly separate from API-005 resident payments and FIN-003 Connect.

-- ---------------------------------------------------------------------------
-- saas_customers — org ↔ Stripe Customer (SaaS only)
-- ---------------------------------------------------------------------------

create table if not exists public.saas_customers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  provider text not null default 'stripe',
  external_customer_id text not null,
  email text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id),
  unique (organization_id, id),
  unique (provider, external_customer_id)
);

create index if not exists saas_customers_external_idx
  on public.saas_customers (provider, external_customer_id);

-- ---------------------------------------------------------------------------
-- saas_subscriptions — exactly one non-terminal sub per org
-- ---------------------------------------------------------------------------

create table if not exists public.saas_subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  saas_customer_id uuid not null,
  provider text not null default 'stripe',
  external_subscription_id text not null,
  external_price_id text,
  plan_code text not null default 'professional'
    check (plan_code in ('trial', 'founder', 'professional', 'business', 'enterprise')),
  billing_interval text check (billing_interval is null or billing_interval in ('month', 'year')),
  status text not null default 'incomplete' check (
    status in (
      'incomplete', 'incomplete_expired', 'trialing', 'active',
      'past_due', 'canceled', 'unpaid', 'paused'
    )
  ),
  trial_ends_at timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,
  ended_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  unique (provider, external_subscription_id),
  constraint saas_subscriptions_customer_fk
    foreign key (saas_customer_id, organization_id)
    references public.saas_customers (id, organization_id)
    on delete cascade
);

-- One non-terminal subscription per organization
create unique index if not exists saas_subscriptions_one_open_per_org_idx
  on public.saas_subscriptions (organization_id)
  where status in ('incomplete', 'trialing', 'active', 'past_due', 'unpaid', 'paused');

create index if not exists saas_subscriptions_org_status_idx
  on public.saas_subscriptions (organization_id, status);

create index if not exists saas_subscriptions_plan_idx
  on public.saas_subscriptions (plan_code, status);

-- ---------------------------------------------------------------------------
-- saas_invoices — mirrored Stripe Billing invoices
-- ---------------------------------------------------------------------------

create table if not exists public.saas_invoices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  saas_subscription_id uuid,
  provider text not null default 'stripe',
  external_invoice_id text not null,
  status text not null default 'draft' check (
    status in ('draft', 'open', 'paid', 'void', 'uncollectible')
  ),
  currency text not null default 'usd',
  amount_due numeric(12, 2) not null default 0,
  amount_paid numeric(12, 2) not null default 0,
  hosted_invoice_url text,
  invoice_pdf text,
  period_start timestamptz,
  period_end timestamptz,
  paid_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  unique (provider, external_invoice_id),
  constraint saas_invoices_subscription_fk
    foreign key (saas_subscription_id, organization_id)
    references public.saas_subscriptions (id, organization_id)
    on delete set null
);

create index if not exists saas_invoices_org_created_idx
  on public.saas_invoices (organization_id, created_at desc);

-- ---------------------------------------------------------------------------
-- saas_entitlement_snapshots — cached plan limits (Phase C fills)
-- ---------------------------------------------------------------------------

create table if not exists public.saas_entitlement_snapshots (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  plan_code text not null,
  features jsonb not null default '{}'::jsonb,
  limits jsonb not null default '{}'::jsonb,
  source_subscription_id uuid,
  computed_at timestamptz not null default timezone('utc', now()),
  unique (organization_id)
);

-- ---------------------------------------------------------------------------
-- saas_audit_events
-- ---------------------------------------------------------------------------

create table if not exists public.saas_audit_events (
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

create index if not exists saas_audit_org_created_idx
  on public.saas_audit_events (organization_id, created_at desc);

-- ---------------------------------------------------------------------------
-- saas_webhook_events — dedicated idempotency (never payments/connect)
-- ---------------------------------------------------------------------------

create table if not exists public.saas_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  external_event_id text not null,
  organization_id uuid references public.organizations (id) on delete set null,
  event_type text,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'received'
    check (status in ('received', 'processed', 'failed', 'ignored')),
  created_at timestamptz not null default timezone('utc', now()),
  processed_at timestamptz,
  unique (provider, external_event_id)
);

-- ---------------------------------------------------------------------------
-- capabilities
-- ---------------------------------------------------------------------------

insert into public.permission_capabilities (key, namespace, description)
values
  ('saas:read', 'saas', 'View organization SaaS subscription and invoices'),
  ('saas:manage', 'saas', 'Manage SaaS subscription: checkout, portal, cancel'),
  ('saas:admin', 'saas', 'Master Admin SaaS metrics and founder grants')
on conflict (key) do nothing;

insert into public.role_permission_grants (role, capability_key)
values
  ('property_manager', 'saas:read'),
  ('property_manager', 'saas:manage')
on conflict (role, capability_key) do nothing;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.saas_customers enable row level security;
alter table public.saas_subscriptions enable row level security;
alter table public.saas_invoices enable row level security;
alter table public.saas_entitlement_snapshots enable row level security;
alter table public.saas_audit_events enable row level security;
alter table public.saas_webhook_events enable row level security;

drop policy if exists saas_customers_select on public.saas_customers;
create policy saas_customers_select on public.saas_customers for select
using (public.has_org_capability(organization_id, 'saas:read'));

drop policy if exists saas_subscriptions_select on public.saas_subscriptions;
create policy saas_subscriptions_select on public.saas_subscriptions for select
using (public.has_org_capability(organization_id, 'saas:read'));

drop policy if exists saas_invoices_select on public.saas_invoices;
create policy saas_invoices_select on public.saas_invoices for select
using (public.has_org_capability(organization_id, 'saas:read'));

drop policy if exists saas_entitlements_select on public.saas_entitlement_snapshots;
create policy saas_entitlements_select on public.saas_entitlement_snapshots for select
using (public.has_org_capability(organization_id, 'saas:read'));

drop policy if exists saas_audit_select on public.saas_audit_events;
create policy saas_audit_select on public.saas_audit_events for select
using (public.has_org_capability(organization_id, 'saas:read'));

-- Webhook store: service role only (no authenticated policies)
