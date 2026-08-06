-- FIN-OPS-001 Slice S1 — Resident Billing & Rent Collection
-- Minimal property/lease scaffolding for charge FKs + financial operational tables.
-- Includes resident online payments / webhook idempotency (authorized in S1 scope).

-- ---------------------------------------------------------------------------
-- Minimal property / lease scaffolding (billing integration only)
-- ---------------------------------------------------------------------------

create table if not exists public.property_properties (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  address_line1 text,
  city text,
  region text,
  postal_code text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists property_properties_org_idx
  on public.property_properties (organization_id, name);

create table if not exists public.property_units (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  property_id uuid not null references public.property_properties (id) on delete cascade,
  unit_label text not null,
  status text not null default 'available' check (status in ('available', 'occupied', 'offline')),
  created_at timestamptz not null default timezone('utc', now()),
  unique (property_id, unit_label)
);

create table if not exists public.lease_agreements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  property_id uuid not null references public.property_properties (id) on delete cascade,
  unit_id uuid references public.property_units (id) on delete set null,
  status text not null default 'active' check (status in ('draft', 'active', 'ended')),
  start_date date not null default (timezone('utc', now()))::date,
  end_date date,
  rent_amount numeric(14, 2) not null default 0 check (rent_amount >= 0),
  currency text not null default 'USD',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists lease_agreements_org_property_idx
  on public.lease_agreements (organization_id, property_id, status);

create table if not exists public.lease_residents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  lease_id uuid not null references public.lease_agreements (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  display_name text not null,
  email text,
  is_primary boolean not null default true,
  financial_status text not null default 'current'
    check (financial_status in ('current', 'delinquent', 'prepaid', 'closed')),
  created_at timestamptz not null default timezone('utc', now()),
  unique (lease_id, email)
);

create index if not exists lease_residents_user_idx
  on public.lease_residents (user_id)
  where user_id is not null;

-- ---------------------------------------------------------------------------
-- Charge schedules & charges
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
-- Payments, allocations, ledger, receipts
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
-- Enable charges/payments flags by default for entitled orgs (settings row)
-- ---------------------------------------------------------------------------

alter table public.financial_module_settings
  alter column charges_enabled set default true;

alter table public.financial_module_settings
  alter column payments_enabled set default true;

alter table public.financial_module_settings
  alter column stripe_payment_execution_enabled set default true;

-- ---------------------------------------------------------------------------
-- RLS helpers & policies
-- ---------------------------------------------------------------------------

create or replace function public.is_org_member(target_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_memberships memberships
    where memberships.organization_id = target_org_id
      and memberships.user_id = auth.uid()
      and memberships.status = 'active'
  );
$$;

create or replace function public.is_lease_resident(target_lease_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.lease_residents residents
    where residents.lease_id = target_lease_id
      and residents.user_id = auth.uid()
  );
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'property_properties',
    'property_units',
    'lease_agreements',
    'lease_residents',
    'financial_charge_schedules',
    'financial_charges',
    'financial_payments',
    'financial_payment_allocations',
    'financial_ledger_entries',
    'financial_receipts',
    'financial_stripe_webhook_events',
    'financial_notifications'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- Property / lease: members read; managers write
drop policy if exists property_properties_select_member on public.property_properties;
create policy property_properties_select_member on public.property_properties
for select using (public.is_org_member(organization_id));

drop policy if exists property_properties_manage_manager on public.property_properties;
create policy property_properties_manage_manager on public.property_properties
for all using (public.is_org_manager(organization_id))
with check (public.is_org_manager(organization_id));

drop policy if exists property_units_select_member on public.property_units;
create policy property_units_select_member on public.property_units
for select using (public.is_org_member(organization_id));

drop policy if exists property_units_manage_manager on public.property_units;
create policy property_units_manage_manager on public.property_units
for all using (public.is_org_manager(organization_id))
with check (public.is_org_manager(organization_id));

drop policy if exists lease_agreements_select_member on public.lease_agreements;
create policy lease_agreements_select_member on public.lease_agreements
for select using (
  public.is_org_member(organization_id) or public.is_lease_resident(id)
);

drop policy if exists lease_agreements_manage_manager on public.lease_agreements;
create policy lease_agreements_manage_manager on public.lease_agreements
for all using (public.is_org_manager(organization_id))
with check (public.is_org_manager(organization_id));

drop policy if exists lease_residents_select on public.lease_residents;
create policy lease_residents_select on public.lease_residents
for select using (
  public.is_org_member(organization_id) or user_id = auth.uid()
);

drop policy if exists lease_residents_manage_manager on public.lease_residents;
create policy lease_residents_manage_manager on public.lease_residents
for all using (public.is_org_manager(organization_id))
with check (public.is_org_manager(organization_id));

-- Finance tables: managers full; residents read own lease rows
drop policy if exists financial_charge_schedules_select on public.financial_charge_schedules;
create policy financial_charge_schedules_select on public.financial_charge_schedules
for select using (
  public.is_org_manager(organization_id) or public.is_lease_resident(lease_id)
);

drop policy if exists financial_charge_schedules_manage on public.financial_charge_schedules;
create policy financial_charge_schedules_manage on public.financial_charge_schedules
for all using (public.is_org_manager(organization_id))
with check (public.is_org_manager(organization_id));

drop policy if exists financial_charges_select on public.financial_charges;
create policy financial_charges_select on public.financial_charges
for select using (
  public.is_org_manager(organization_id) or public.is_lease_resident(lease_id)
);

drop policy if exists financial_charges_manage on public.financial_charges;
create policy financial_charges_manage on public.financial_charges
for all using (public.is_org_manager(organization_id))
with check (public.is_org_manager(organization_id));

drop policy if exists financial_payments_select on public.financial_payments;
create policy financial_payments_select on public.financial_payments
for select using (
  public.is_org_manager(organization_id) or public.is_lease_resident(lease_id)
);

drop policy if exists financial_payments_manage on public.financial_payments;
create policy financial_payments_manage on public.financial_payments
for all using (public.is_org_manager(organization_id))
with check (public.is_org_manager(organization_id));

drop policy if exists financial_payment_allocations_select on public.financial_payment_allocations;
create policy financial_payment_allocations_select on public.financial_payment_allocations
for select using (public.is_org_member(organization_id));

drop policy if exists financial_payment_allocations_manage on public.financial_payment_allocations;
create policy financial_payment_allocations_manage on public.financial_payment_allocations
for all using (public.is_org_manager(organization_id))
with check (public.is_org_manager(organization_id));

drop policy if exists financial_ledger_select on public.financial_ledger_entries;
create policy financial_ledger_select on public.financial_ledger_entries
for select using (
  public.is_org_manager(organization_id)
  or (lease_id is not null and public.is_lease_resident(lease_id))
);

drop policy if exists financial_ledger_insert on public.financial_ledger_entries;
create policy financial_ledger_insert on public.financial_ledger_entries
for insert with check (public.is_org_manager(organization_id));

drop policy if exists financial_receipts_select on public.financial_receipts;
create policy financial_receipts_select on public.financial_receipts
for select using (
  public.is_org_manager(organization_id) or public.is_lease_resident(lease_id)
);

drop policy if exists financial_receipts_manage on public.financial_receipts;
create policy financial_receipts_manage on public.financial_receipts
for all using (public.is_org_manager(organization_id))
with check (public.is_org_manager(organization_id));

drop policy if exists financial_stripe_webhook_events_select_manager on public.financial_stripe_webhook_events;
create policy financial_stripe_webhook_events_select_manager on public.financial_stripe_webhook_events
for select using (
  organization_id is null or public.is_org_manager(organization_id)
);

drop policy if exists financial_notifications_select_own on public.financial_notifications;
create policy financial_notifications_select_own on public.financial_notifications
for select using (
  user_id = auth.uid() or public.is_org_manager(organization_id)
);

drop policy if exists financial_notifications_insert_manager on public.financial_notifications;
create policy financial_notifications_insert_manager on public.financial_notifications
for all using (public.is_org_manager(organization_id))
with check (public.is_org_manager(organization_id));
