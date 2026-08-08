-- COM-002 Slice E: subscription lifecycle fields + expanded statuses.

alter table public.organization_subscriptions
  drop constraint if exists organization_subscriptions_status_check;

alter table public.organization_subscriptions
  add constraint organization_subscriptions_status_check
  check (
    status in (
      'pending',
      'active',
      'past_due',
      'canceled',
      'expired',
      'unpaid',
      'incomplete',
      'dispute_hold',
      'trialing'
    )
  );

alter table public.organization_subscriptions
  add column if not exists stripe_subscription_id text,
  add column if not exists stripe_customer_id text,
  add column if not exists plan_tier text,
  add column if not exists billing_cycle text,
  add column if not exists cancel_at_period_end boolean not null default false,
  add column if not exists current_period_end timestamptz,
  add column if not exists grace_started_at timestamptz,
  add column if not exists seat_limit integer,
  add column if not exists property_limit integer,
  add column if not exists pending_plan_tier text,
  add column if not exists sca_required boolean not null default false,
  add column if not exists lifecycle_audit jsonb not null default '[]'::jsonb,
  add column if not exists lifecycle_emails_sent jsonb not null default '[]'::jsonb,
  add column if not exists payment_history jsonb not null default '[]'::jsonb;

create unique index if not exists organization_subscriptions_stripe_sub_uidx
  on public.organization_subscriptions (stripe_subscription_id)
  where stripe_subscription_id is not null;

create table if not exists public.saas_lifecycle_events (
  id uuid primary key default gen_random_uuid(),
  stripe_event_id text not null unique,
  event_type text not null,
  stripe_subscription_id text,
  organization_id uuid references public.organizations (id) on delete set null,
  processed_at timestamptz not null default now(),
  summary text,
  payload jsonb not null default '{}'::jsonb
);

alter table public.saas_lifecycle_events enable row level security;

drop policy if exists saas_lifecycle_events_operator_select on public.saas_lifecycle_events;
create policy saas_lifecycle_events_operator_select
  on public.saas_lifecycle_events for select to authenticated
  using (
    exists (
      select 1 from public.platform_operators po
      where po.user_id = auth.uid() and po.status = 'active'
    )
  );
