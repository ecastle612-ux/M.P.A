-- COM-002 Slice C: SaaS Checkout persistence (no provisioning / no orgs).
-- Dedicated from FIN-OPS financial_stripe_webhook_events.

create table if not exists public.saas_checkout_sessions (
  id uuid primary key default gen_random_uuid(),
  stripe_checkout_session_id text not null unique,
  stripe_customer_id text,
  stripe_subscription_id text,
  catalog_offer_id text not null,
  product_sku text not null,
  plan_tier text not null,
  billing_cycle text not null,
  status text not null check (
    status in (
      'checkout_created',
      'checkout_completed',
      'checkout_expired',
      'checkout_canceled',
      'payment_failed'
    )
  ),
  customer_email text,
  idempotency_key text unique,
  demo_session_id text,
  metadata jsonb not null default '{}'::jsonb,
  -- Slice C hard guarantees — provisioning is Slice D.
  provisioned boolean not null default false check (provisioned = false),
  organization_id uuid,
  user_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint saas_checkout_no_org_yet check (organization_id is null),
  constraint saas_checkout_no_user_yet check (user_id is null)
);

create index if not exists saas_checkout_sessions_status_idx
  on public.saas_checkout_sessions (status);

create table if not exists public.saas_stripe_webhook_events (
  id uuid primary key default gen_random_uuid(),
  stripe_event_id text not null unique,
  event_type text not null,
  payload jsonb not null,
  processed_at timestamptz,
  checkout_session_id text,
  created_at timestamptz not null default now()
);

alter table public.saas_checkout_sessions enable row level security;
alter table public.saas_stripe_webhook_events enable row level security;

-- Service role / platform operators only (no customer RLS policies).
drop policy if exists saas_checkout_sessions_operator_select on public.saas_checkout_sessions;
create policy saas_checkout_sessions_operator_select
  on public.saas_checkout_sessions
  for select
  to authenticated
  using (
    exists (
      select 1 from public.platform_operators po
      where po.user_id = auth.uid() and po.status = 'active'
    )
  );

drop policy if exists saas_stripe_webhook_events_operator_select on public.saas_stripe_webhook_events;
create policy saas_stripe_webhook_events_operator_select
  on public.saas_stripe_webhook_events
  for select
  to authenticated
  using (
    exists (
      select 1 from public.platform_operators po
      where po.user_id = auth.uid() and po.status = 'active'
    )
  );
