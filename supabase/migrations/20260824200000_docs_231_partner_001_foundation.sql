-- PARTNER-001 / docs/231 — Partner Program foundation
-- Applications, approved partners, referral attribution, and commission *tracking*.
-- This is not a payment system. Do not apply this file to Production from the
-- implement package. Owner Production authorization is a separate gate.

create table if not exists public.platform_partners (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  contact_name text not null,
  email text not null,
  phone text not null,
  website text,
  city text not null,
  state text not null,
  service_area text not null,
  company_service_type text not null,
  services_offered text not null,
  customers_served text,
  mpa_account_email text,
  interested_partner_type text not null
    check (interested_partner_type in ('referral', 'certified_service', 'strategic')),
  notes text,
  partner_type text not null default 'referral'
    check (partner_type in ('referral', 'certified_service', 'strategic')),
  status text not null default 'applied'
    check (status in ('applied', 'approved', 'active', 'suspended', 'rejected')),
  public_slug text,
  commission_bps integer not null default 2000
    check (commission_bps >= 0 and commission_bps <= 5000),
  approved_at timestamptz,
  activated_at timestamptz,
  rejected_at timestamptz,
  suspended_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references auth.users (id) on delete set null,
  constraint platform_partners_slug_format_chk
    check (
      public_slug is null
      or public_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    )
);

create unique index if not exists platform_partners_public_slug_uidx
  on public.platform_partners (lower(public_slug))
  where public_slug is not null;

create index if not exists platform_partners_status_idx
  on public.platform_partners (status, created_at desc);

create index if not exists platform_partners_email_idx
  on public.platform_partners (lower(email));

create table if not exists public.platform_partner_referrals (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.platform_partners (id) on delete restrict,
  organization_id uuid not null references public.organizations (id) on delete restrict,
  slug_snapshot text not null,
  source text not null default 'checkout_ref',
  flagged_reason text,
  created_at timestamptz not null default timezone('utc', now()),
  constraint platform_partner_referrals_org_uidx unique (organization_id)
);

create index if not exists platform_partner_referrals_partner_idx
  on public.platform_partner_referrals (partner_id, created_at desc);

create table if not exists public.platform_partner_commissions (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.platform_partners (id) on delete restrict,
  organization_id uuid not null references public.organizations (id) on delete restrict,
  referral_id uuid references public.platform_partner_referrals (id) on delete set null,
  stripe_event_id text,
  stripe_invoice_id text,
  stripe_subscription_id text,
  eligible_revenue_cents integer not null check (eligible_revenue_cents >= 0),
  commission_bps integer not null check (commission_bps >= 0),
  commission_cents integer not null check (commission_cents >= 0),
  qualifying_month_index integer not null check (qualifying_month_index >= 1),
  status text not null default 'earned'
    check (status in ('pending', 'earned', 'paid', 'void')),
  offset_required boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  paid_at timestamptz,
  paid_by uuid references auth.users (id) on delete set null
);

create unique index if not exists platform_partner_commissions_event_uidx
  on public.platform_partner_commissions (stripe_event_id)
  where stripe_event_id is not null;

create unique index if not exists platform_partner_commissions_invoice_uidx
  on public.platform_partner_commissions (stripe_invoice_id)
  where stripe_invoice_id is not null;

create index if not exists platform_partner_commissions_partner_idx
  on public.platform_partner_commissions (partner_id, status, created_at desc);

create table if not exists public.platform_partner_events (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid references public.platform_partners (id) on delete cascade,
  action text not null,
  actor_user_id uuid references auth.users (id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists platform_partner_events_partner_idx
  on public.platform_partner_events (partner_id, created_at desc);

drop trigger if exists trg_platform_partners_updated_at on public.platform_partners;
create trigger trg_platform_partners_updated_at
before update on public.platform_partners
for each row
execute function public.set_updated_at();

drop trigger if exists trg_platform_partner_commissions_updated_at on public.platform_partner_commissions;
create trigger trg_platform_partner_commissions_updated_at
before update on public.platform_partner_commissions
for each row
execute function public.set_updated_at();

alter table public.platform_partners enable row level security;
alter table public.platform_partner_referrals enable row level security;
alter table public.platform_partner_commissions enable row level security;
alter table public.platform_partner_events enable row level security;

drop policy if exists platform_partners_select_operator on public.platform_partners;
create policy platform_partners_select_operator
on public.platform_partners
for select
using (public.is_platform_operator());

drop policy if exists platform_partner_referrals_select_operator on public.platform_partner_referrals;
create policy platform_partner_referrals_select_operator
on public.platform_partner_referrals
for select
using (public.is_platform_operator());

drop policy if exists platform_partner_commissions_select_operator on public.platform_partner_commissions;
create policy platform_partner_commissions_select_operator
on public.platform_partner_commissions
for select
using (public.is_platform_operator());

drop policy if exists platform_partner_events_select_operator on public.platform_partner_events;
create policy platform_partner_events_select_operator
on public.platform_partner_events
for select
using (public.is_platform_operator());

revoke all on public.platform_partners from public, anon;
revoke all on public.platform_partner_referrals from public, anon;
revoke all on public.platform_partner_commissions from public, anon;
revoke all on public.platform_partner_events from public, anon;

grant select on public.platform_partners to authenticated;
grant select on public.platform_partner_referrals to authenticated;
grant select on public.platform_partner_commissions to authenticated;
grant select on public.platform_partner_events to authenticated;

comment on table public.platform_partners is
  'PARTNER-001 partner applications and approved partners. Service-role writes only. Not a marketplace.';
comment on table public.platform_partner_referrals is
  'PARTNER-001 first-wins organization attribution. Acquisition metadata only.';
comment on table public.platform_partner_commissions is
  'PARTNER-001 commission tracking ledger. Manual payout outside this schema. No Stripe transfers.';
comment on table public.platform_partner_events is
  'PARTNER-001 partner audit history. Operator-readable.';
