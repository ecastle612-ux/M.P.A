-- docs/140 FIN-OPS Production Reconciliation — Slice M1
-- Production-compatible EMPTY August financial_* schema.
-- Successor after live Production tip 20260815222252 / docs_135_invitation_acceptance_remediation.
--
-- Extracted object definitions from (do NOT replay these files):
--   20260806030000_fin_ops_001_s0_foundation.sql
--   20260806040000_fin_ops_001_s1_resident_billing.sql
--   20260806050000_fin_ops_001_s2_delinquency_vendor_ap.sql
-- Adapted to the live Production lineage (docs/126 / docs/140).
--
-- Intentionally omitted from S0/S1/S2:
--   property_properties / property_units / lease_agreements / lease_residents CREATE
--   vendor_vendors CREATE
--   event_domain_events / audit_events CREATE or RLS replace
--   is_org_member / is_org_manager / is_lease_resident CREATE OR REPLACE
--   permission_capabilities / role_permission_grants inserts (PLAT-006 is live)
--   tenant/vendor pm.finance:read grants
--   S1/S2 org-member / is_org_manager finance policies (M3)
--   July data backfill (M2)
--   Stripe / SKU / subscription / role / entitlement mutations
--
-- M1 is schema only. All new operational tables begin empty.
-- RLS is enabled with no authenticated/anon policies (fail closed until M3).
-- service_role retains trusted maintenance access.

-- ---------------------------------------------------------------------------
-- Connect + module settings (S0 objects; safe column defaults)
-- ---------------------------------------------------------------------------

create table if not exists public.financial_connect_accounts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  stripe_account_id text,
  status text not null default 'not_started'
    check (status in ('not_started', 'pending', 'restricted', 'ready', 'disabled')),
  charges_enabled boolean not null default false,
  payouts_enabled boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id)
);

create index if not exists financial_connect_accounts_status_idx
  on public.financial_connect_accounts (status);

create table if not exists public.financial_module_settings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  foundation_enabled boolean not null default true,
  charges_enabled boolean not null default true,
  payments_enabled boolean not null default true,
  late_fees_enabled boolean not null default false,
  vendor_invoices_enabled boolean not null default false,
  vendor_payments_enabled boolean not null default false,
  reports_enabled boolean not null default false,
  stripe_payment_execution_enabled boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id)
);

-- ---------------------------------------------------------------------------
-- Charge schedules & charges (S1 + S2 late-fee columns in one CREATE)
-- Canonical identity: property_properties / property_units / lease_agreements / lease_residents
-- ---------------------------------------------------------------------------

create table if not exists public.financial_charge_schedules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  property_id uuid not null references public.property_properties (id) on delete cascade,
  lease_id uuid not null references public.lease_agreements (id) on delete cascade,
  charge_type text not null check (charge_type in ('rent', 'recurring_fee')),
  label text not null,
  amount numeric(14, 2) not null check (amount > 0),
  currency text not null default 'USD',
  frequency text not null default 'monthly' check (frequency in ('monthly')),
  day_of_month int not null default 1 check (day_of_month between 1 and 28),
  active boolean not null default true,
  next_run_on date not null,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.financial_charges (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  property_id uuid not null references public.property_properties (id) on delete cascade,
  unit_id uuid references public.property_units (id) on delete set null,
  lease_id uuid not null references public.lease_agreements (id) on delete cascade,
  resident_id uuid references public.lease_residents (id) on delete set null,
  schedule_id uuid references public.financial_charge_schedules (id) on delete set null,
  charge_type text not null check (charge_type in ('rent', 'recurring_fee', 'one_time', 'late_fee', 'credit', 'adjustment')),
  label text not null,
  memo text,
  amount numeric(14, 2) not null check (amount >= 0),
  amount_paid numeric(14, 2) not null default 0 check (amount_paid >= 0),
  currency text not null default 'USD',
  status text not null default 'open'
    check (status in ('draft', 'open', 'partially_paid', 'paid', 'void', 'written_off')),
  due_at date not null,
  period_start date,
  period_end date,
  created_by uuid references auth.users (id) on delete set null,
  voided_at timestamptz,
  void_reason text,
  late_fee_assessed_at timestamptz,
  source_charge_id uuid references public.financial_charges (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists financial_charges_org_lease_idx
  on public.financial_charges (organization_id, lease_id, status, due_at);

create index if not exists financial_charges_org_property_idx
  on public.financial_charges (organization_id, property_id, status);

create index if not exists financial_charges_due_idx
  on public.financial_charges (organization_id, due_at)
  where status in ('open', 'partially_paid');

-- ---------------------------------------------------------------------------
-- Payments, allocations, ledger, receipts, webhook inbox, notifications
-- ---------------------------------------------------------------------------

create table if not exists public.financial_payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  property_id uuid not null references public.property_properties (id) on delete cascade,
  lease_id uuid not null references public.lease_agreements (id) on delete cascade,
  resident_id uuid references public.lease_residents (id) on delete set null,
  amount numeric(14, 2) not null check (amount > 0),
  currency text not null default 'USD',
  status text not null default 'pending'
    check (status in ('pending', 'succeeded', 'failed', 'refunded', 'partially_refunded')),
  method text not null check (method in ('online_stripe', 'manual_cash', 'manual_check', 'manual_other', 'credit_applied')),
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  failure_reason text,
  recorded_by uuid references auth.users (id) on delete set null,
  paid_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists financial_payments_stripe_session_uidx
  on public.financial_payments (stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

create index if not exists financial_payments_org_lease_idx
  on public.financial_payments (organization_id, lease_id, created_at desc);

create table if not exists public.financial_payment_allocations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  payment_id uuid not null references public.financial_payments (id) on delete cascade,
  charge_id uuid not null references public.financial_charges (id) on delete cascade,
  amount numeric(14, 2) not null check (amount > 0),
  created_at timestamptz not null default timezone('utc', now()),
  unique (payment_id, charge_id)
);

create table if not exists public.financial_ledger_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  property_id uuid references public.property_properties (id) on delete set null,
  lease_id uuid references public.lease_agreements (id) on delete set null,
  resident_id uuid references public.lease_residents (id) on delete set null,
  entry_type text not null
    check (entry_type in ('charge', 'payment', 'allocation', 'credit', 'void', 'adjustment')),
  direction text not null check (direction in ('debit', 'credit')),
  amount numeric(14, 2) not null check (amount >= 0),
  currency text not null default 'USD',
  source_type text not null,
  source_id uuid not null,
  description text not null,
  stripe_object_id text,
  idempotency_key text not null,
  occurred_at timestamptz not null default timezone('utc', now()),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, idempotency_key)
);

create index if not exists financial_ledger_org_lease_idx
  on public.financial_ledger_entries (organization_id, lease_id, occurred_at desc);

create table if not exists public.financial_receipts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  payment_id uuid not null references public.financial_payments (id) on delete cascade,
  lease_id uuid not null references public.lease_agreements (id) on delete cascade,
  resident_id uuid references public.lease_residents (id) on delete set null,
  receipt_number text not null,
  amount numeric(14, 2) not null check (amount > 0),
  currency text not null default 'USD',
  issued_at timestamptz not null default timezone('utc', now()),
  payload jsonb not null default '{}'::jsonb,
  unique (organization_id, receipt_number),
  unique (payment_id)
);

create table if not exists public.financial_stripe_webhook_events (
  id uuid primary key default gen_random_uuid(),
  stripe_event_id text not null unique,
  event_type text not null,
  organization_id uuid references public.organizations (id) on delete set null,
  payment_id uuid references public.financial_payments (id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz,
  error text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.financial_notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid references auth.users (id) on delete cascade,
  lease_id uuid references public.lease_agreements (id) on delete set null,
  notification_key text not null,
  title text not null,
  body text not null,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists financial_notifications_user_idx
  on public.financial_notifications (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Collections + vendor AP (S2 objects; vendor_vendors is the live identity)
-- ---------------------------------------------------------------------------

create table if not exists public.financial_late_fee_policies (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  property_id uuid references public.property_properties (id) on delete cascade,
  name text not null default 'Default late fee',
  grace_days int not null default 5 check (grace_days >= 0 and grace_days <= 60),
  fee_type text not null default 'flat' check (fee_type in ('flat', 'percent')),
  fee_amount numeric(14, 2) not null default 50 check (fee_amount >= 0),
  fee_percent numeric(7, 4) not null default 0 check (fee_percent >= 0 and fee_percent <= 100),
  max_fee_amount numeric(14, 2),
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists financial_late_fee_policies_org_idx
  on public.financial_late_fee_policies (organization_id, property_id, active);

create table if not exists public.financial_delinquency_cases (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  property_id uuid not null references public.property_properties (id) on delete cascade,
  lease_id uuid not null references public.lease_agreements (id) on delete cascade,
  resident_id uuid references public.lease_residents (id) on delete set null,
  status text not null default 'watch'
    check (status in ('watch', 'past_due', 'in_collections', 'resolved', 'escalated')),
  open_balance numeric(14, 2) not null default 0,
  days_past_due int not null default 0,
  aging_bucket text not null default 'current'
    check (aging_bucket in ('current', '1_30', '31_60', '61_90', '90_plus')),
  last_reminder_at timestamptz,
  reminder_count int not null default 0,
  notes text,
  opened_at timestamptz not null default timezone('utc', now()),
  resolved_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, lease_id)
);

create index if not exists financial_delinquency_cases_org_status_idx
  on public.financial_delinquency_cases (organization_id, status, aging_bucket);

create table if not exists public.financial_payment_arrangements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  lease_id uuid not null references public.lease_agreements (id) on delete cascade,
  delinquency_case_id uuid references public.financial_delinquency_cases (id) on delete set null,
  status text not null default 'proposed'
    check (status in ('proposed', 'active', 'completed', 'broken', 'cancelled')),
  total_amount numeric(14, 2) not null check (total_amount > 0),
  installment_amount numeric(14, 2) not null check (installment_amount > 0),
  installments_total int not null check (installments_total >= 1),
  installments_paid int not null default 0,
  next_due_on date,
  notes text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists financial_payment_arrangements_lease_idx
  on public.financial_payment_arrangements (organization_id, lease_id, status);

create table if not exists public.financial_vendor_invoices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  property_id uuid references public.property_properties (id) on delete set null,
  vendor_id uuid not null references public.vendor_vendors (id) on delete cascade,
  work_order_id uuid,
  invoice_number text not null,
  description text,
  amount numeric(14, 2) not null check (amount > 0),
  currency text not null default 'USD',
  status text not null default 'submitted'
    check (status in ('submitted', 'in_review', 'changes_requested', 'approved', 'rejected', 'scheduled', 'paid', 'void')),
  due_at date,
  submitted_at timestamptz not null default timezone('utc', now()),
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  scheduled_for date,
  paid_at timestamptz,
  rejection_reason text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, vendor_id, invoice_number)
);

create index if not exists financial_vendor_invoices_org_status_idx
  on public.financial_vendor_invoices (organization_id, status, due_at);

create table if not exists public.financial_vendor_payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  vendor_id uuid not null references public.vendor_vendors (id) on delete cascade,
  invoice_id uuid not null references public.financial_vendor_invoices (id) on delete cascade,
  property_id uuid references public.property_properties (id) on delete set null,
  amount numeric(14, 2) not null check (amount > 0),
  currency text not null default 'USD',
  status text not null default 'scheduled'
    check (status in ('scheduled', 'paid', 'cancelled')),
  method text not null default 'manual_other'
    check (method in ('manual_check', 'manual_ach', 'manual_other', 'online_stripe')),
  scheduled_for date,
  paid_at timestamptz,
  recorded_by uuid references auth.users (id) on delete set null,
  memo text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists financial_vendor_payments_org_idx
  on public.financial_vendor_payments (organization_id, status, scheduled_for);

-- ---------------------------------------------------------------------------
-- Lineage map for M2 (empty). Does not modify July source rows.
-- ---------------------------------------------------------------------------

create table if not exists public.finance_lineage_map (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations (id) on delete cascade,
  source_table text not null,
  source_id uuid not null,
  target_table text not null,
  target_id uuid not null,
  migration_version text not null,
  run_id uuid,
  status text not null default 'pending'
    check (status in ('pending', 'migrated', 'skipped', 'failed')),
  error text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (source_table, source_id, target_table)
);

create index if not exists finance_lineage_map_target_idx
  on public.finance_lineage_map (target_table, target_id);

create index if not exists finance_lineage_map_org_idx
  on public.finance_lineage_map (organization_id, status);

-- ---------------------------------------------------------------------------
-- Fail-closed RLS. No org-member / tenant / vendor / manager policies in M1.
-- M3 owns pm.finance:* ∩ member operating scope.
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
  r text;
begin
  foreach t in array array[
    'financial_connect_accounts',
    'financial_module_settings',
    'financial_charge_schedules',
    'financial_charges',
    'financial_payments',
    'financial_payment_allocations',
    'financial_ledger_entries',
    'financial_receipts',
    'financial_stripe_webhook_events',
    'financial_notifications',
    'financial_late_fee_policies',
    'financial_delinquency_cases',
    'financial_payment_arrangements',
    'financial_vendor_invoices',
    'financial_vendor_payments',
    'finance_lineage_map'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from public', t);
    foreach r in array array['anon', 'authenticated']
    loop
      if exists (select 1 from pg_roles where rolname = r) then
        execute format('revoke all on table public.%I from %I', t, r);
      end if;
    end loop;
    if exists (select 1 from pg_roles where rolname = 'service_role') then
      execute format('grant all on table public.%I to service_role', t);
    end if;
  end loop;
end $$;
