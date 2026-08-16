#!/usr/bin/env bash
# Apply docs/140 M1 + M2 functions against a scratch Postgres that mimics the
# certified July baseline. Does not touch mpa-prod. Does not apply M2 to Production.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
M1="$ROOT/supabase/migrations/20260816010000_docs_140_fin_ops_reconciliation_m1.sql"
M2="$ROOT/supabase/migrations/20260816020000_docs_140_fin_ops_reconciliation_m2.sql"
FIXTURE="$ROOT/scripts/fixtures/docs-140-m2-july-snapshot.sql"
DB="docs140_m2_scratch"
PSQL=(sudo -n -u postgres psql -v ON_ERROR_STOP=1)

if [[ ! -f "$M1" || ! -f "$M2" || ! -f "$FIXTURE" ]]; then
  echo "missing M1, M2, or fixture" >&2
  exit 1
fi

"${PSQL[@]}" -d postgres -c "drop database if exists ${DB};"
"${PSQL[@]}" -d postgres -c "create database ${DB};"

"${PSQL[@]}" -d "$DB" <<'SQL'
create schema if not exists auth;
create table if not exists auth.users (
  id uuid primary key
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text
);

create table public.organization_subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references public.organizations (id),
  sku_code text not null,
  status text not null
);

create table public.property_properties (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id)
);

create table public.property_units (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  property_id uuid not null references public.property_properties (id),
  unit_label text not null,
  status text not null default 'available'
    check (status in ('available', 'occupied', 'offline')),
  created_at timestamptz not null default timezone('utc', now()),
  unique (property_id, unit_label)
);

create table public.units (
  id uuid primary key,
  organization_id uuid not null references public.organizations (id),
  property_id uuid not null references public.property_properties (id),
  unit_number text,
  unit_label text,
  occupancy_status text,
  status text,
  archived_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.lease_agreements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  property_id uuid not null references public.property_properties (id),
  unit_id uuid references public.property_units (id),
  status text not null default 'active'
    check (status in ('draft', 'pending_signature', 'signed', 'active', 'ended')),
  start_date date not null default (timezone('utc', now()))::date,
  end_date date,
  rent_amount numeric(14, 2) not null default 0,
  currency text not null default 'USD',
  require_manager_signature boolean not null default true,
  rent_day_of_month int not null default 1,
  resident_id uuid,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.lease_residents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  lease_id uuid not null references public.lease_agreements (id),
  user_id uuid,
  display_name text not null,
  email text,
  is_primary boolean not null default true,
  financial_status text not null default 'current',
  created_at timestamptz not null default timezone('utc', now()),
  unique (lease_id, email)
);

create table public.pm_residents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  property_id uuid not null references public.property_properties (id),
  unit_id uuid not null references public.property_units (id),
  first_name text not null,
  last_name text not null,
  display_name text not null,
  email text not null,
  phone text,
  status text not null default 'active',
  portal_status text not null default 'pending_activation',
  user_id uuid,
  lease_id uuid references public.lease_agreements (id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, email)
);

alter table public.lease_agreements
  add constraint lease_agreements_resident_fk
  foreign key (resident_id) references public.pm_residents (id);

create table public.vendor_vendors (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id)
);

create table public.leases (
  id uuid primary key,
  organization_id uuid not null references public.organizations (id),
  property_id uuid not null references public.property_properties (id),
  unit_id uuid,
  status text not null,
  start_date date,
  end_date date,
  rent_amount numeric(14, 2),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.tenants (
  id uuid primary key,
  organization_id uuid not null references public.organizations (id),
  property_id uuid,
  unit_id uuid,
  first_name text,
  last_name text,
  email text,
  phone text,
  user_id uuid,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.rent_charges (
  id uuid primary key,
  organization_id uuid not null references public.organizations (id),
  property_id uuid not null references public.property_properties (id),
  unit_id uuid,
  lease_id uuid not null,
  tenant_id uuid not null,
  charge_type text not null,
  status text not null,
  late_status text,
  amount numeric(14, 2) not null,
  amount_paid numeric(14, 2) not null default 0,
  due_date date not null,
  period_start date,
  period_end date,
  description text,
  charge_number text,
  created_by uuid,
  deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.payments (
  id uuid primary key,
  organization_id uuid not null references public.organizations (id),
  property_id uuid,
  lease_id uuid,
  tenant_id uuid,
  rent_charge_id uuid,
  amount numeric(14, 2) not null,
  status text not null,
  payment_method text not null,
  payment_date date not null,
  payment_number text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.vendor_invoices (
  id uuid primary key,
  organization_id uuid not null references public.organizations (id),
  property_id uuid,
  vendor_id uuid,
  work_order_id uuid,
  expense_id uuid,
  invoice_number text,
  notes text,
  amount numeric(14, 2) not null,
  currency text,
  status text not null,
  submitted_at timestamptz,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.vendor_payments (
  id uuid primary key,
  organization_id uuid not null references public.organizations (id),
  vendor_id uuid,
  invoice_id uuid,
  property_id uuid,
  amount numeric(14, 2) not null,
  currency text,
  status text not null,
  payment_method text,
  paid_at date,
  recorded_by uuid,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.payment_receipts (
  id uuid primary key,
  organization_id uuid not null references public.organizations (id),
  payment_id uuid,
  lease_id uuid,
  tenant_id uuid,
  receipt_number text,
  amount numeric(14, 2),
  currency text,
  issued_at timestamptz,
  payload jsonb not null default '{}'::jsonb
);

create table public.payment_customers (
  id uuid primary key,
  organization_id uuid not null references public.organizations (id),
  provider text,
  external_customer_id text
);

create table public.expenses (
  id uuid primary key,
  organization_id uuid not null references public.organizations (id),
  amount numeric(14, 2)
);

create table public.owner_statements (
  id uuid primary key,
  organization_id uuid not null references public.organizations (id)
);

create table public.financial_activity (
  id uuid primary key,
  organization_id uuid not null references public.organizations (id)
);

create table public.billing_ledger_entries (
  id uuid primary key,
  organization_id uuid not null references public.organizations (id),
  amount numeric(14, 2)
);

do $roles$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin bypassrls;
  end if;
end
$roles$;
SQL

"${PSQL[@]}" -d "$DB" -f "$M1"
"${PSQL[@]}" -d "$DB" -f "$M2"
"${PSQL[@]}" -d "$DB" -f "$FIXTURE"

"${PSQL[@]}" -d "$DB" <<'SQL'
do $$
declare
  before_fp jsonb;
  after_fp jsonb;
  dry jsonb;
  first_run jsonb;
  second_run jsonb;
  rec jsonb;
  src_charges int;
  src_charge_total numeric;
  src_paid numeric;
  src_payments int;
  src_payment_total numeric;
  fail jsonb;
  fail_org uuid;
  ok_org uuid := 'aaaa0000-0000-4000-8000-000000000001';
  bad_org uuid := 'bbbb0000-0000-4000-8000-000000000001';
  n int;
  code text;
begin
  select count(*), coalesce(sum(amount), 0), coalesce(sum(amount_paid), 0)
  into src_charges, src_charge_total, src_paid
  from public.rent_charges;

  select count(*), coalesce(sum(amount), 0)
  into src_payments, src_payment_total
  from public.payments;

  if src_charges <> 17 or src_payments <> 11 then
    raise exception 'fixture shape count mismatch % %', src_charges, src_payments;
  end if;
  if src_charge_total <> 24691.00 or src_paid <> 11111.00 or src_payment_total <> 11111.00 then
    raise exception 'fixture money mismatch charges=% paid=% payments=%', src_charge_total, src_paid, src_payment_total;
  end if;
  if src_paid <> src_payment_total then
    raise exception 'fixture source paid/payment mismatch';
  end if;

  before_fp := public.finance_m2_july_fingerprint();

  dry := public.finance_m2_run(true);
  if (dry ->> 'dry_run') is distinct from 'true' then
    raise exception 'dry-run flag missing';
  end if;
  if (dry ->> 'ready_count')::int <> 3 or (dry ->> 'blocked_count')::int <> 0 then
    raise exception 'expected three READY fixture orgs: %', dry;
  end if;
  if exists (
    select 1
    from jsonb_array_elements(dry -> 'organizations') org
    where org ->> 'readiness' is distinct from 'READY'
      or org ->> 'currency_provenance' is distinct from 'migration_default_usd'
  ) then
    raise exception 'dry-run missing READY/USD provenance: %', dry;
  end if;
  if (select count(*) from public.financial_charges) <> 0
    or (select count(*) from public.lease_agreements) <> 0
    or (select count(*) from public.pm_residents) <> 0
    or (select count(*) from public.finance_lineage_map) <> 0
    or exists (
      select 1 from public.property_units
      where id = '33333333-3333-4333-8333-000000000017'
    )
  then
    raise exception 'dry-run wrote finance, identity, lineage, or Option B unit';
  end if;

  first_run := public.finance_m2_run(false);
  if jsonb_array_length(first_run -> 'failures') <> 0 then
    raise exception 'first run failed: %', first_run -> 'failures';
  end if;

  rec := public.finance_m2_reconcile();
  if (rec ->> 'target_charges')::int is distinct from src_charges
    or (rec ->> 'target_payments')::int is distinct from src_payments
    or (rec ->> 'target_allocations')::int is distinct from src_payments
    or (rec ->> 'target_charge_total')::numeric is distinct from src_charge_total
    or (rec ->> 'target_amount_paid')::numeric is distinct from src_paid
    or (rec ->> 'target_payment_total')::numeric is distinct from src_payment_total
    or (rec ->> 'target_allocation_total')::numeric is distinct from src_payment_total
    or (rec ->> 'outstanding')::numeric is distinct from (src_charge_total - src_paid)
    or (rec ->> 'vendor_invoices')::int <> 1
    or (rec ->> 'vendor_payments')::int <> 1
    or (rec ->> 'vendor_invoice_total')::numeric <> 125.50
    or (rec ->> 'vendor_payment_total')::numeric <> 125.50
    or (rec ->> 'late_fee_policies')::int <> 0
    or (rec ->> 'delinquency_cases')::int <> 0
    or (rec ->> 'arrangements')::int <> 0
    or (rec ->> 'stripe_webhook_events')::int <> 0
  then
    raise exception 'reconciliation failed: %', rec;
  end if;

  if exists (select 1 from public.financial_charges where currency is distinct from 'USD')
    or exists (select 1 from public.financial_payments where currency is distinct from 'USD')
  then
    raise exception 'historical rows were not materialized as USD';
  end if;
  if not exists (
    select 1 from public.property_units
    where id = '33333333-3333-4333-8333-000000000017'
      and organization_id = '11111111-1111-4111-8111-1111111111c3'
      and property_id = '22222222-2222-4222-8222-000000000003'
      and unit_label = 'Unit 17'
  ) then
    raise exception 'Option B did not preserve legacy unit UUID';
  end if;
  if not exists (
    select 1 from public.finance_lineage_map
    where source_table = 'units'
      and source_id = '33333333-3333-4333-8333-000000000017'
      and target_table = 'property_units'
      and target_id = '33333333-3333-4333-8333-000000000017'
      and status = 'migrated'
  ) then
    raise exception 'Option B missing units lineage';
  end if;

  if exists (select 1 from public.financial_charges where charge_type = 'late_fee') then
    raise exception 'retroactive late fee created';
  end if;
  if exists (select 1 from public.financial_charge_schedules) then
    raise exception 'charge schedule invented';
  end if;
  if exists (
    select 1 from public.financial_payments
    where stripe_payment_intent_id is not null
       or stripe_checkout_session_id is not null
       or method = 'online_stripe'
  ) then
    raise exception 'stripe identity fabricated';
  end if;
  if (select count(*) from public.financial_receipts) <> 1 then
    raise exception 'receipt count %', (select count(*) from public.financial_receipts);
  end if;
  if exists (select 1 from public.financial_connect_accounts where stripe_account_id is not null) then
    raise exception 'connect account invented';
  end if;
  if (select count(*) from public.financial_module_settings) <> 2 then
    raise exception 'settings seeded for unexpected orgs: %', (select count(*) from public.financial_module_settings);
  end if;
  if exists (
    select 1
    from public.financial_module_settings
    where organization_id in (
      '11111111-1111-4111-8111-1111111111a1',
      '11111111-1111-4111-8111-1111111111b2',
      '11111111-1111-4111-8111-1111111111c3',
      '11111111-1111-4111-8111-1111111111f6'
    )
  ) then
    raise exception 'settings seeded for unsubscribed or FO org';
  end if;
  if exists (
    select 1 from public.finance_lineage_map
    where source_table = 'payment_customers'
      and target_table is distinct from 'mapped_stripe_customer_metadata'
  ) then
    raise exception 'payment customer created an operational row';
  end if;
  if (select count(*) from public.lease_agreements) < 17
    or (select count(*) from public.lease_residents) < 17
    or (select count(*) from public.pm_residents) < 17
  then
    raise exception 'identity materialization incomplete';
  end if;
  if exists (
    select 1 from public.financial_charges fc
    where not exists (
      select 1 from public.finance_lineage_map lm
      where lm.source_table = 'rent_charges'
        and lm.source_id = fc.id
        and lm.target_table = 'financial_charges'
        and lm.target_id = fc.id
        and lm.status = 'migrated'
    )
  ) then
    raise exception 'charge without lineage';
  end if;

  second_run := public.finance_m2_run(false);
  if jsonb_array_length(second_run -> 'failures') <> 0 then
    raise exception 'second run failed: %', second_run -> 'failures';
  end if;
  if (select count(*) from public.financial_charges) <> src_charges
    or (select count(*) from public.financial_payments) <> src_payments
    or (select count(*) from public.financial_payment_allocations) <> src_payments
    or (select count(*) from public.financial_vendor_invoices) <> 1
    or (select count(*) from public.financial_vendor_payments) <> 1
    or (select count(*) from public.financial_receipts) <> 1
    or (select count(*) from public.financial_ledger_entries)
      is distinct from (select count(distinct idempotency_key) from public.financial_ledger_entries)
  then
    raise exception 'idempotency produced duplicates';
  end if;
  if (select count(*) from public.finance_lineage_map)
    is distinct from (select count(distinct (source_table, source_id, target_table)) from public.finance_lineage_map)
  then
    raise exception 'duplicate lineage facts';
  end if;

  after_fp := public.finance_m2_july_fingerprint();
  if before_fp is distinct from after_fp then
    raise exception 'july source mutated: % %', before_fp, after_fp;
  end if;

  -- Mixed dry-run: READY org remains visible beside a BLOCKED mismatch org
  fail_org := 'cccc0000-0000-4000-8000-0000000000d1';
  insert into public.organizations (id, name) values (fail_org, 'Mismatch Org');
  insert into public.property_properties (id, organization_id) values
    ('22222222-2222-4222-8222-0000000000d1', fail_org),
    ('22222222-2222-4222-8222-0000000000d2', fail_org);
  insert into public.property_units (id, organization_id, property_id, unit_label)
  values ('33333333-3333-4333-8333-0000000000d1', fail_org, '22222222-2222-4222-8222-0000000000d2', 'Wrong Property Unit');
  insert into public.leases (id, organization_id, property_id, unit_id, status, start_date, rent_amount)
  values ('44444444-4444-4444-8444-0000000000d1', fail_org, '22222222-2222-4222-8222-0000000000d1', '33333333-3333-4333-8333-0000000000d1', 'active', '2026-01-01', 10);
  insert into public.tenants (id, organization_id, property_id, unit_id, first_name, last_name, email)
  values ('55555555-5555-4555-8555-0000000000d1', fail_org, '22222222-2222-4222-8222-0000000000d1', '33333333-3333-4333-8333-0000000000d1', 'Mismatch', 'Unit', 'mismatch-unit@fixture.test');
  insert into public.rent_charges (
    id, organization_id, property_id, unit_id, lease_id, tenant_id, charge_type, status, amount, amount_paid, due_date, description, charge_number
  ) values (
    '66666666-6666-4666-8666-0000000000d1', fail_org, '22222222-2222-4222-8222-0000000000d1', '33333333-3333-4333-8333-0000000000d1',
    '44444444-4444-4444-8444-0000000000d1', '55555555-5555-4555-8555-0000000000d1',
    'monthly_rent', 'paid', 10, 0, '2026-07-01', 'property mismatch', 'RC-PM'
  );
  dry := public.finance_m2_run(true);
  if not exists (
    select 1 from jsonb_array_elements(dry -> 'organizations') org
    where org ->> 'organization_id' = '11111111-1111-4111-8111-1111111111a1'
      and org ->> 'readiness' = 'READY'
  ) or not exists (
    select 1 from jsonb_array_elements(dry -> 'organizations') org
    where org ->> 'organization_id' = fail_org::text
      and org ->> 'readiness' = 'BLOCKED'
      and org -> 'identity' ->> 'unit_property_mismatches' <> '0'
  ) then
    raise exception 'mixed dry-run hid READY or missed mismatch: %', dry;
  end if;
  if exists (select 1 from public.financial_charges where organization_id = fail_org)
    or exists (select 1 from public.finance_lineage_map where organization_id = fail_org)
  then
    raise exception 'dry-run wrote blocked org rows';
  end if;
  fail := public.finance_m2_run(false, fail_org);
  if fail -> 'failures' -> 0 ->> 'error' not like 'unit_property_mismatch%' then
    raise exception 'property mismatch did not fail closed: %', fail;
  end if;
  if exists (select 1 from public.financial_charges where organization_id = fail_org)
    or exists (select 1 from public.pm_residents where organization_id = fail_org)
  then
    raise exception 'property mismatch silently attached a resident';
  end if;

  -- Failure: missing unit
  fail_org := 'cccc0000-0000-4000-8000-0000000000d3';
  insert into public.organizations (id, name) values (fail_org, 'Missing Unit Org');
  insert into public.property_properties (id, organization_id)
  values ('22222222-2222-4222-8222-0000000000d3', fail_org);
  insert into public.leases (id, organization_id, property_id, unit_id, status, start_date, rent_amount)
  values ('44444444-4444-4444-8444-0000000000d3', fail_org, '22222222-2222-4222-8222-0000000000d3', '33333333-3333-4333-8333-0000000000d3', 'active', '2026-01-01', 10);
  insert into public.tenants (id, organization_id, property_id, unit_id, first_name, last_name, email)
  values ('55555555-5555-4555-8555-0000000000d3', fail_org, '22222222-2222-4222-8222-0000000000d3', '33333333-3333-4333-8333-0000000000d3', 'Missing', 'Unit', 'missing-unit@fixture.test');
  insert into public.rent_charges (
    id, organization_id, property_id, unit_id, lease_id, tenant_id, charge_type, status, amount, amount_paid, due_date, description, charge_number
  ) values (
    '66666666-6666-4666-8666-0000000000d3', fail_org, '22222222-2222-4222-8222-0000000000d3', '33333333-3333-4333-8333-0000000000d3',
    '44444444-4444-4444-8444-0000000000d3', '55555555-5555-4555-8555-0000000000d3',
    'monthly_rent', 'paid', 10, 0, '2026-07-01', 'missing unit', 'RC-MU'
  );
  fail := public.finance_m2_run(false, fail_org);
  if fail -> 'failures' -> 0 ->> 'error' not like 'missing_unit_for_resident%' then
    raise exception 'missing unit did not fail closed: %', fail;
  end if;

  -- Failure: wrong-org legacy unit
  fail_org := 'cccc0000-0000-4000-8000-0000000000d4';
  insert into public.organizations (id, name) values
    (fail_org, 'Wrong Org Unit'),
    ('cccc0000-0000-4000-8000-0000000000d5', 'Other Org');
  insert into public.property_properties (id, organization_id) values
    ('22222222-2222-4222-8222-0000000000d4', fail_org),
    ('22222222-2222-4222-8222-0000000000d5', 'cccc0000-0000-4000-8000-0000000000d5');
  insert into public.units (id, organization_id, property_id, unit_number, unit_label, occupancy_status, status)
  values ('33333333-3333-4333-8333-0000000000d4', 'cccc0000-0000-4000-8000-0000000000d5', '22222222-2222-4222-8222-0000000000d5', '101', 'Other Org Unit', 'occupied', 'active');
  insert into public.leases (id, organization_id, property_id, unit_id, status, start_date, rent_amount)
  values ('44444444-4444-4444-8444-0000000000d4', fail_org, '22222222-2222-4222-8222-0000000000d4', '33333333-3333-4333-8333-0000000000d4', 'active', '2026-01-01', 10);
  insert into public.tenants (id, organization_id, property_id, unit_id, first_name, last_name, email)
  values ('55555555-5555-4555-8555-0000000000d4', fail_org, '22222222-2222-4222-8222-0000000000d4', '33333333-3333-4333-8333-0000000000d4', 'Wrong', 'Org', 'wrong-org-unit@fixture.test');
  insert into public.rent_charges (
    id, organization_id, property_id, unit_id, lease_id, tenant_id, charge_type, status, amount, amount_paid, due_date, description, charge_number
  ) values (
    '66666666-6666-4666-8666-0000000000d4', fail_org, '22222222-2222-4222-8222-0000000000d4', '33333333-3333-4333-8333-0000000000d4',
    '44444444-4444-4444-8444-0000000000d4', '55555555-5555-4555-8555-0000000000d4',
    'monthly_rent', 'paid', 10, 0, '2026-07-01', 'wrong org unit', 'RC-WO'
  );
  fail := public.finance_m2_run(false, fail_org);
  if fail -> 'failures' -> 0 ->> 'error' not like 'unit_org_mismatch%' then
    raise exception 'wrong-org unit did not fail closed: %', fail;
  end if;

  -- Failure: ambiguous legacy label
  fail_org := 'cccc0000-0000-4000-8000-0000000000d6';
  insert into public.organizations (id, name) values (fail_org, 'Ambiguous Unit');
  insert into public.property_properties (id, organization_id)
  values ('22222222-2222-4222-8222-0000000000d6', fail_org);
  insert into public.property_units (id, organization_id, property_id, unit_label)
  values ('33333333-3333-4333-8333-0000000000d7', fail_org, '22222222-2222-4222-8222-0000000000d6', 'Dup Label');
  insert into public.units (id, organization_id, property_id, unit_number, unit_label, occupancy_status, status)
  values ('33333333-3333-4333-8333-0000000000d6', fail_org, '22222222-2222-4222-8222-0000000000d6', '102', 'Dup Label', 'occupied', 'active');
  insert into public.leases (id, organization_id, property_id, unit_id, status, start_date, rent_amount)
  values ('44444444-4444-4444-8444-0000000000d6', fail_org, '22222222-2222-4222-8222-0000000000d6', '33333333-3333-4333-8333-0000000000d6', 'active', '2026-01-01', 10);
  insert into public.tenants (id, organization_id, property_id, unit_id, first_name, last_name, email)
  values ('55555555-5555-4555-8555-0000000000d6', fail_org, '22222222-2222-4222-8222-0000000000d6', '33333333-3333-4333-8333-0000000000d6', 'Ambiguous', 'Unit', 'ambiguous-unit@fixture.test');
  insert into public.rent_charges (
    id, organization_id, property_id, unit_id, lease_id, tenant_id, charge_type, status, amount, amount_paid, due_date, description, charge_number
  ) values (
    '66666666-6666-4666-8666-0000000000d6', fail_org, '22222222-2222-4222-8222-0000000000d6', '33333333-3333-4333-8333-0000000000d6',
    '44444444-4444-4444-8444-0000000000d6', '55555555-5555-4555-8555-0000000000d6',
    'monthly_rent', 'paid', 10, 0, '2026-07-01', 'ambiguous unit', 'RC-AU'
  );
  fail := public.finance_m2_run(false, fail_org);
  if fail -> 'failures' -> 0 ->> 'error' not like 'ambiguous_unit%' then
    raise exception 'ambiguous unit did not fail closed: %', fail;
  end if;

  -- Failure: conflicting canonical unit
  fail_org := 'cccc0000-0000-4000-8000-0000000000d8';
  insert into public.organizations (id, name) values (fail_org, 'Conflict Unit');
  insert into public.property_properties (id, organization_id) values
    ('22222222-2222-4222-8222-0000000000d8', fail_org),
    ('22222222-2222-4222-8222-0000000000d9', fail_org);
  insert into public.units (id, organization_id, property_id, unit_number, unit_label, occupancy_status, status)
  values ('33333333-3333-4333-8333-0000000000d8', fail_org, '22222222-2222-4222-8222-0000000000d8', '103', 'Conflict Label', 'occupied', 'active');
  insert into public.property_units (id, organization_id, property_id, unit_label)
  values ('33333333-3333-4333-8333-0000000000d8', fail_org, '22222222-2222-4222-8222-0000000000d9', 'Other Label');
  insert into public.leases (id, organization_id, property_id, unit_id, status, start_date, rent_amount)
  values ('44444444-4444-4444-8444-0000000000d8', fail_org, '22222222-2222-4222-8222-0000000000d8', '33333333-3333-4333-8333-0000000000d8', 'active', '2026-01-01', 10);
  insert into public.tenants (id, organization_id, property_id, unit_id, first_name, last_name, email)
  values ('55555555-5555-4555-8555-0000000000d8', fail_org, '22222222-2222-4222-8222-0000000000d8', '33333333-3333-4333-8333-0000000000d8', 'Conflict', 'Unit', 'conflict-unit@fixture.test');
  insert into public.rent_charges (
    id, organization_id, property_id, unit_id, lease_id, tenant_id, charge_type, status, amount, amount_paid, due_date, description, charge_number
  ) values (
    '66666666-6666-4666-8666-0000000000d8', fail_org, '22222222-2222-4222-8222-0000000000d8', '33333333-3333-4333-8333-0000000000d8',
    '44444444-4444-4444-8444-0000000000d8', '55555555-5555-4555-8555-0000000000d8',
    'monthly_rent', 'paid', 10, 0, '2026-07-01', 'conflict unit', 'RC-CU'
  );
  fail := public.finance_m2_run(false, fail_org);
  if fail -> 'failures' -> 0 ->> 'error' not like 'unit_property_mismatch%'
    and fail -> 'failures' -> 0 ->> 'error' not like 'conflicting_canonical_unit%' then
    raise exception 'conflicting canonical unit did not fail closed: %', fail;
  end if;

  -- Failure: future explicit non-USD currency
  fail_org := 'cccc0000-0000-4000-8000-0000000000e1';
  alter table public.rent_charges add column currency text;
  alter table public.payments add column currency text;
  insert into public.organizations (id, name) values (fail_org, 'Euro Org');
  insert into public.property_properties (id, organization_id)
  values ('22222222-2222-4222-8222-0000000000e1', fail_org);
  insert into public.property_units (id, organization_id, property_id, unit_label)
  values ('33333333-3333-4333-8333-0000000000e1', fail_org, '22222222-2222-4222-8222-0000000000e1', 'Euro Unit');
  insert into public.leases (id, organization_id, property_id, unit_id, status, start_date, rent_amount)
  values ('44444444-4444-4444-8444-0000000000e1', fail_org, '22222222-2222-4222-8222-0000000000e1', '33333333-3333-4333-8333-0000000000e1', 'active', '2026-01-01', 10);
  insert into public.tenants (id, organization_id, property_id, unit_id, first_name, last_name, email)
  values ('55555555-5555-4555-8555-0000000000e1', fail_org, '22222222-2222-4222-8222-0000000000e1', '33333333-3333-4333-8333-0000000000e1', 'Euro', 'Charge', 'euro@fixture.test');
  insert into public.rent_charges (
    id, organization_id, property_id, unit_id, lease_id, tenant_id, charge_type, status, amount, amount_paid, due_date, description, charge_number, currency
  ) values (
    '66666666-6666-4666-8666-0000000000e1', fail_org, '22222222-2222-4222-8222-0000000000e1', '33333333-3333-4333-8333-0000000000e1',
    '44444444-4444-4444-8444-0000000000e1', '55555555-5555-4555-8555-0000000000e1',
    'monthly_rent', 'paid', 10, 0, '2026-07-01', 'euro charge', 'RC-EU', 'EUR'
  );
  fail := public.finance_m2_run(false, fail_org);
  if fail -> 'failures' -> 0 ->> 'error' not like 'unsupported_currency%' then
    raise exception 'explicit non-USD currency did not fail closed: %', fail;
  end if;

  -- Failure: missing tenant
  fail_org := 'cccc0000-0000-4000-8000-000000000001';
  insert into public.organizations (id) values (fail_org);
  insert into public.property_properties (id, organization_id)
  values ('22222222-2222-4222-8222-0000000000aa', fail_org);
  insert into public.property_units (id, organization_id, property_id, unit_label)
  values ('33333333-3333-4333-8333-0000000000aa', fail_org, '22222222-2222-4222-8222-0000000000aa', 'Unit 33333333-3333-4333-8333-0000000000aa');

  insert into public.leases (id, organization_id, property_id, unit_id, status, start_date, rent_amount)
  values ('44444444-4444-4444-8444-0000000000aa', fail_org, '22222222-2222-4222-8222-0000000000aa', '33333333-3333-4333-8333-0000000000aa', 'active', '2026-01-01', 10);
  insert into public.rent_charges (
    id, organization_id, property_id, unit_id, lease_id, tenant_id, charge_type, status, amount, amount_paid, due_date, description, charge_number
  ) values (
    '66666666-6666-4666-8666-0000000000aa', fail_org, '22222222-2222-4222-8222-0000000000aa', '33333333-3333-4333-8333-0000000000aa',
    '44444444-4444-4444-8444-0000000000aa', '55555555-5555-4555-8555-0000000000aa',
    'monthly_rent', 'paid', 10, 10, '2026-07-01', 'missing tenant', 'RC-MT'
  );
  fail := public.finance_m2_run(false, fail_org);
  if fail -> 'failures' -> 0 ->> 'error' not like 'missing_july_tenant%' then
    raise exception 'missing tenant did not fail closed: %', fail;
  end if;
  if exists (select 1 from public.financial_charges where organization_id = fail_org) then
    raise exception 'missing tenant left migrated charges';
  end if;
  if not exists (
    select 1 from public.finance_lineage_map
    where source_table = 'm2_run' and source_id = fail_org and status = 'failed'
  ) then
    raise exception 'missing tenant left no failed state';
  end if;

  -- Failure: missing lease
  fail_org := 'cccc0000-0000-4000-8000-000000000002';
  insert into public.organizations (id) values (fail_org);
  insert into public.property_properties (id, organization_id)
  values ('22222222-2222-4222-8222-0000000000ab', fail_org);
  insert into public.property_units (id, organization_id, property_id, unit_label)
  values ('33333333-3333-4333-8333-0000000000ab', fail_org, '22222222-2222-4222-8222-0000000000ab', 'Unit 33333333-3333-4333-8333-0000000000ab');

  insert into public.tenants (id, organization_id, first_name, last_name, email)
  values ('55555555-5555-4555-8555-0000000000ab', fail_org, 'Missing', 'Lease', 'missing-lease@fixture.test');
  insert into public.rent_charges (
    id, organization_id, property_id, unit_id, lease_id, tenant_id, charge_type, status, amount, amount_paid, due_date, description, charge_number
  ) values (
    '66666666-6666-4666-8666-0000000000ab', fail_org, '22222222-2222-4222-8222-0000000000ab', '33333333-3333-4333-8333-0000000000ab',
    '44444444-4444-4444-8444-0000000000ab', '55555555-5555-4555-8555-0000000000ab',
    'monthly_rent', 'paid', 10, 0, '2026-07-01', 'missing lease', 'RC-ML'
  );
  fail := public.finance_m2_run(false, fail_org);
  if fail -> 'failures' -> 0 ->> 'error' not like 'missing_july_lease%' then
    raise exception 'missing lease did not fail closed: %', fail;
  end if;

  -- Failure: org mismatch
  fail_org := 'cccc0000-0000-4000-8000-000000000003';
  insert into public.organizations (id) values (fail_org);
  insert into public.property_properties (id, organization_id)
  values ('22222222-2222-4222-8222-0000000000ac', fail_org);
  insert into public.property_units (id, organization_id, property_id, unit_label)
  values ('33333333-3333-4333-8333-0000000000ac', fail_org, '22222222-2222-4222-8222-0000000000ac', 'Unit 33333333-3333-4333-8333-0000000000ac');

  insert into public.leases (id, organization_id, property_id, unit_id, status, start_date, rent_amount)
  values ('44444444-4444-4444-8444-0000000000ac', fail_org, '22222222-2222-4222-8222-0000000000ac', '33333333-3333-4333-8333-0000000000ac', 'active', '2026-01-01', 10);
  insert into public.tenants (id, organization_id, first_name, last_name, email)
  values ('55555555-5555-4555-8555-0000000000ac', fail_org, 'Org', 'Mismatch', 'org-mismatch@fixture.test');
  insert into public.rent_charges (
    id, organization_id, property_id, unit_id, lease_id, tenant_id, charge_type, status, amount, amount_paid, due_date, description, charge_number
  ) values (
    '66666666-6666-4666-8666-0000000000ac', fail_org, '22222222-2222-4222-8222-0000000000ac', '33333333-3333-4333-8333-0000000000ac',
    '44444444-4444-4444-8444-0000000000ac', '55555555-5555-4555-8555-0000000000ac',
    'monthly_rent', 'paid', 10, 10, '2026-07-01', 'org mismatch', 'RC-OM'
  );
  insert into public.payments (
    id, organization_id, property_id, lease_id, tenant_id, rent_charge_id, amount, status, payment_method, payment_date, payment_number
  ) values (
    '77777777-7777-4777-8777-0000000000ac', fail_org,
    '22222222-2222-4222-8222-000000000001', '44444444-4444-4444-8444-000000000001',
    '55555555-5555-4555-8555-000000000001', '66666666-6666-4666-8666-000000000001',
    10, 'completed', 'manual', '2026-07-01', 'PAY-OM'
  );
  fail := public.finance_m2_run(false, fail_org);
  if fail -> 'failures' -> 0 ->> 'error' not like 'payment_org_mismatch%'
    and fail -> 'failures' -> 0 ->> 'error' not like 'money_reconciliation_mismatch%' then
    raise exception 'org mismatch did not fail closed: %', fail;
  end if;

  -- Failure: missing payment charge
  fail_org := 'cccc0000-0000-4000-8000-000000000004';
  insert into public.organizations (id) values (fail_org);
  insert into public.property_properties (id, organization_id)
  values ('22222222-2222-4222-8222-0000000000ad', fail_org);
  insert into public.payments (
    id, organization_id, property_id, amount, status, payment_method, payment_date, payment_number, rent_charge_id
  ) values (
    '77777777-7777-4777-8777-0000000000ad', fail_org, '22222222-2222-4222-8222-0000000000ad',
    10, 'completed', 'manual', '2026-07-01', 'PAY-MC', '66666666-6666-4666-8666-0000000000ad'
  );
  fail := public.finance_m2_run(false, fail_org);
  if fail -> 'failures' -> 0 ->> 'error' not like 'missing_payment_charge%' then
    raise exception 'missing payment charge did not fail closed: %', fail;
  end if;

  -- Failure: incompatible canonical lease
  fail_org := 'cccc0000-0000-4000-8000-000000000005';
  insert into public.organizations (id) values (fail_org), ('cccc0000-0000-4000-8000-000000000099');
  insert into public.property_properties (id, organization_id) values
    ('22222222-2222-4222-8222-0000000000ae', fail_org),
    ('22222222-2222-4222-8222-000000000099', 'cccc0000-0000-4000-8000-000000000099');
  insert into public.property_units (id, organization_id, property_id, unit_label)
  values ('33333333-3333-4333-8333-0000000000ae', fail_org, '22222222-2222-4222-8222-0000000000ae', 'Unit 33333333-3333-4333-8333-0000000000ae');

  insert into public.leases (id, organization_id, property_id, unit_id, status, start_date, rent_amount)
  values ('44444444-4444-4444-8444-0000000000ae', fail_org, '22222222-2222-4222-8222-0000000000ae', '33333333-3333-4333-8333-0000000000ae', 'active', '2026-01-01', 10);
  insert into public.tenants (id, organization_id, first_name, last_name, email)
  values ('55555555-5555-4555-8555-0000000000ae', fail_org, 'Bad', 'Lease', 'bad-lease@fixture.test');
  insert into public.lease_agreements (id, organization_id, property_id, status, start_date, rent_amount)
  values ('44444444-4444-4444-8444-0000000000ae', 'cccc0000-0000-4000-8000-000000000099', '22222222-2222-4222-8222-000000000099', 'active', '2026-01-01', 10);
  insert into public.rent_charges (
    id, organization_id, property_id, unit_id, lease_id, tenant_id, charge_type, status, amount, amount_paid, due_date, description, charge_number
  ) values (
    '66666666-6666-4666-8666-0000000000ae', fail_org, '22222222-2222-4222-8222-0000000000ae', '33333333-3333-4333-8333-0000000000ae',
    '44444444-4444-4444-8444-0000000000ae', '55555555-5555-4555-8555-0000000000ae',
    'monthly_rent', 'paid', 10, 0, '2026-07-01', 'incompatible lease', 'RC-IL'
  );
  fail := public.finance_m2_run(false, fail_org);
  if fail -> 'failures' -> 0 ->> 'error' not like 'incompatible_canonical_lease%' then
    raise exception 'incompatible lease did not fail closed: %', fail;
  end if;

  -- Failure: incompatible canonical resident
  fail_org := 'cccc0000-0000-4000-8000-000000000006';
  insert into public.organizations (id) values (fail_org);
  insert into public.property_properties (id, organization_id)
  values ('22222222-2222-4222-8222-0000000000af', fail_org);
  insert into public.property_units (id, organization_id, property_id, unit_label)
  values ('33333333-3333-4333-8333-0000000000af', fail_org, '22222222-2222-4222-8222-0000000000af', 'Unit 33333333-3333-4333-8333-0000000000af');

  insert into public.leases (id, organization_id, property_id, unit_id, status, start_date, rent_amount)
  values ('44444444-4444-4444-8444-0000000000af', fail_org, '22222222-2222-4222-8222-0000000000af', '33333333-3333-4333-8333-0000000000af', 'active', '2026-01-01', 10);
  insert into public.tenants (id, organization_id, first_name, last_name, email)
  values ('55555555-5555-4555-8555-0000000000af', fail_org, 'Bad', 'Resident', 'bad-resident@fixture.test');
  insert into public.lease_agreements (id, organization_id, property_id, unit_id, status, start_date, rent_amount)
  values ('44444444-4444-4444-8444-0000000000af', fail_org, '22222222-2222-4222-8222-0000000000af', '33333333-3333-4333-8333-0000000000af', 'active', '2026-01-01', 10);
  insert into public.lease_residents (id, organization_id, lease_id, display_name, email)
  values ('55555555-5555-4555-8555-0000000000af', '11111111-1111-4111-8111-1111111111a1', '44444444-4444-4444-8444-000000000001', 'Wrong org resident', 'wrong@fixture.test');
  insert into public.rent_charges (
    id, organization_id, property_id, unit_id, lease_id, tenant_id, charge_type, status, amount, amount_paid, due_date, description, charge_number
  ) values (
    '66666666-6666-4666-8666-0000000000af', fail_org, '22222222-2222-4222-8222-0000000000af', '33333333-3333-4333-8333-0000000000af',
    '44444444-4444-4444-8444-0000000000af', '55555555-5555-4555-8555-0000000000af',
    'monthly_rent', 'paid', 10, 0, '2026-07-01', 'incompatible resident', 'RC-IR'
  );
  fail := public.finance_m2_run(false, fail_org);
  if fail -> 'failures' -> 0 ->> 'error' not like 'incompatible_canonical_resident%' then
    raise exception 'incompatible resident did not fail closed: %', fail;
  end if;

  -- Failure: conflicting lineage
  fail_org := 'cccc0000-0000-4000-8000-000000000007';
  insert into public.organizations (id) values (fail_org);
  insert into public.property_properties (id, organization_id)
  values ('22222222-2222-4222-8222-0000000000b0', fail_org);
  insert into public.property_units (id, organization_id, property_id, unit_label)
  values ('33333333-3333-4333-8333-0000000000b0', fail_org, '22222222-2222-4222-8222-0000000000b0', 'Unit 33333333-3333-4333-8333-0000000000b0');

  insert into public.leases (id, organization_id, property_id, unit_id, status, start_date, rent_amount)
  values ('44444444-4444-4444-8444-0000000000b0', fail_org, '22222222-2222-4222-8222-0000000000b0', '33333333-3333-4333-8333-0000000000b0', 'active', '2026-01-01', 10);
  insert into public.tenants (id, organization_id, first_name, last_name, email)
  values ('55555555-5555-4555-8555-0000000000b0', fail_org, 'Conflict', 'Lineage', 'conflict@fixture.test');
  insert into public.rent_charges (
    id, organization_id, property_id, unit_id, lease_id, tenant_id, charge_type, status, amount, amount_paid, due_date, description, charge_number
  ) values (
    '66666666-6666-4666-8666-0000000000b0', fail_org, '22222222-2222-4222-8222-0000000000b0', '33333333-3333-4333-8333-0000000000b0',
    '44444444-4444-4444-8444-0000000000b0', '55555555-5555-4555-8555-0000000000b0',
    'monthly_rent', 'paid', 10, 0, '2026-07-01', 'conflict lineage', 'RC-CL'
  );
  insert into public.finance_lineage_map (
    organization_id, source_table, source_id, target_table, target_id, migration_version, status
  ) values (
    fail_org, 'rent_charges', '66666666-6666-4666-8666-0000000000b0', 'financial_charges',
    '66666666-6666-4666-8666-00000000ffff', '20260816020000', 'migrated'
  );
  fail := public.finance_m2_run(false, fail_org);
  if fail -> 'failures' -> 0 ->> 'error' not like 'conflicting_lineage%' then
    raise exception 'conflicting lineage did not fail closed: %', fail;
  end if;

  -- Failure: unsupported payment method
  fail_org := 'cccc0000-0000-4000-8000-000000000008';
  insert into public.organizations (id) values (fail_org);
  insert into public.property_properties (id, organization_id)
  values ('22222222-2222-4222-8222-0000000000b1', fail_org);
  insert into public.property_units (id, organization_id, property_id, unit_label)
  values ('33333333-3333-4333-8333-0000000000b1', fail_org, '22222222-2222-4222-8222-0000000000b1', 'Unit 33333333-3333-4333-8333-0000000000b1');

  insert into public.leases (id, organization_id, property_id, unit_id, status, start_date, rent_amount)
  values ('44444444-4444-4444-8444-0000000000b1', fail_org, '22222222-2222-4222-8222-0000000000b1', '33333333-3333-4333-8333-0000000000b1', 'active', '2026-01-01', 10);
  insert into public.tenants (id, organization_id, first_name, last_name, email)
  values ('55555555-5555-4555-8555-0000000000b1', fail_org, 'Bad', 'Method', 'bad-method@fixture.test');
  insert into public.rent_charges (
    id, organization_id, property_id, unit_id, lease_id, tenant_id, charge_type, status, amount, amount_paid, due_date, description, charge_number
  ) values (
    '66666666-6666-4666-8666-0000000000b1', fail_org, '22222222-2222-4222-8222-0000000000b1', '33333333-3333-4333-8333-0000000000b1',
    '44444444-4444-4444-8444-0000000000b1', '55555555-5555-4555-8555-0000000000b1',
    'monthly_rent', 'paid', 10, 10, '2026-07-01', 'bad method', 'RC-BM'
  );
  insert into public.payments (
    id, organization_id, property_id, lease_id, tenant_id, rent_charge_id, amount, status, payment_method, payment_date, payment_number
  ) values (
    '77777777-7777-4777-8777-0000000000b1', fail_org, '22222222-2222-4222-8222-0000000000b1',
    '44444444-4444-4444-8444-0000000000b1', '55555555-5555-4555-8555-0000000000b1',
    '66666666-6666-4666-8666-0000000000b1', 10, 'completed', 'crypto', '2026-07-01', 'PAY-BM'
  );
  fail := public.finance_m2_run(false, fail_org);
  if fail -> 'failures' -> 0 ->> 'error' not like 'unsupported_payment_method%' then
    raise exception 'unsupported method did not fail closed: %', fail;
  end if;

  -- Failure: unexpected Stripe-like source
  fail_org := 'cccc0000-0000-4000-8000-000000000009';
  insert into public.organizations (id) values (fail_org);
  insert into public.property_properties (id, organization_id)
  values ('22222222-2222-4222-8222-0000000000b2', fail_org);
  insert into public.property_units (id, organization_id, property_id, unit_label)
  values ('33333333-3333-4333-8333-0000000000b2', fail_org, '22222222-2222-4222-8222-0000000000b2', 'Unit 33333333-3333-4333-8333-0000000000b2');

  insert into public.leases (id, organization_id, property_id, unit_id, status, start_date, rent_amount)
  values ('44444444-4444-4444-8444-0000000000b2', fail_org, '22222222-2222-4222-8222-0000000000b2', '33333333-3333-4333-8333-0000000000b2', 'active', '2026-01-01', 10);
  insert into public.tenants (id, organization_id, first_name, last_name, email)
  values ('55555555-5555-4555-8555-0000000000b2', fail_org, 'Stripe', 'Like', 'stripe-like@fixture.test');
  insert into public.rent_charges (
    id, organization_id, property_id, unit_id, lease_id, tenant_id, charge_type, status, amount, amount_paid, due_date, description, charge_number
  ) values (
    '66666666-6666-4666-8666-0000000000b2', fail_org, '22222222-2222-4222-8222-0000000000b2', '33333333-3333-4333-8333-0000000000b2',
    '44444444-4444-4444-8444-0000000000b2', '55555555-5555-4555-8555-0000000000b2',
    'monthly_rent', 'paid', 10, 10, '2026-07-01', 'stripe like', 'RC-SL'
  );
  insert into public.payments (
    id, organization_id, property_id, lease_id, tenant_id, rent_charge_id, amount, status, payment_method, payment_date, payment_number, metadata
  ) values (
    '77777777-7777-4777-8777-0000000000b2', fail_org, '22222222-2222-4222-8222-0000000000b2',
    '44444444-4444-4444-8444-0000000000b2', '55555555-5555-4555-8555-0000000000b2',
    '66666666-6666-4666-8666-0000000000b2', 10, 'completed', 'card', '2026-07-01', 'PAY-SL',
    '{"stripe_payment_intent_id":"pi_fixture"}'
  );
  fail := public.finance_m2_run(false, fail_org);
  if fail -> 'failures' -> 0 ->> 'error' not like 'unexpected_stripe_source%' then
    raise exception 'unexpected stripe source did not fail closed: %', fail;
  end if;

  -- Failure: money mismatch
  fail_org := 'cccc0000-0000-4000-8000-00000000000a';
  insert into public.organizations (id) values (fail_org);
  insert into public.property_properties (id, organization_id)
  values ('22222222-2222-4222-8222-0000000000b3', fail_org);
  insert into public.property_units (id, organization_id, property_id, unit_label)
  values ('33333333-3333-4333-8333-0000000000b3', fail_org, '22222222-2222-4222-8222-0000000000b3', 'Unit 33333333-3333-4333-8333-0000000000b3');

  insert into public.leases (id, organization_id, property_id, unit_id, status, start_date, rent_amount)
  values ('44444444-4444-4444-8444-0000000000b3', fail_org, '22222222-2222-4222-8222-0000000000b3', '33333333-3333-4333-8333-0000000000b3', 'active', '2026-01-01', 10);
  insert into public.tenants (id, organization_id, first_name, last_name, email)
  values ('55555555-5555-4555-8555-0000000000b3', fail_org, 'Money', 'Mismatch', 'money@fixture.test');
  insert into public.rent_charges (
    id, organization_id, property_id, unit_id, lease_id, tenant_id, charge_type, status, amount, amount_paid, due_date, description, charge_number
  ) values (
    '66666666-6666-4666-8666-0000000000b3', fail_org, '22222222-2222-4222-8222-0000000000b3', '33333333-3333-4333-8333-0000000000b3',
    '44444444-4444-4444-8444-0000000000b3', '55555555-5555-4555-8555-0000000000b3',
    'monthly_rent', 'paid', 10, 10, '2026-07-01', 'money mismatch', 'RC-MM'
  );
  insert into public.payments (
    id, organization_id, property_id, lease_id, tenant_id, rent_charge_id, amount, status, payment_method, payment_date, payment_number
  ) values (
    '77777777-7777-4777-8777-0000000000b3', fail_org, '22222222-2222-4222-8222-0000000000b3',
    '44444444-4444-4444-8444-0000000000b3', '55555555-5555-4555-8555-0000000000b3',
    '66666666-6666-4666-8666-0000000000b3', 7, 'completed', 'manual', '2026-07-01', 'PAY-MM'
  );
  fail := public.finance_m2_run(false, fail_org);
  if fail -> 'failures' -> 0 ->> 'error' not like 'money_reconciliation_mismatch%' then
    raise exception 'money mismatch did not fail closed: %', fail;
  end if;

  -- Failure: duplicate payment allocation with incompatible amount
  fail_org := 'cccc0000-0000-4000-8000-00000000000b';
  insert into public.organizations (id) values (fail_org);
  insert into public.property_properties (id, organization_id)
  values ('22222222-2222-4222-8222-0000000000b4', fail_org);
  insert into public.property_units (id, organization_id, property_id, unit_label)
  values ('33333333-3333-4333-8333-0000000000b4', fail_org, '22222222-2222-4222-8222-0000000000b4', 'Unit 33333333-3333-4333-8333-0000000000b4');

  insert into public.leases (id, organization_id, property_id, unit_id, status, start_date, rent_amount)
  values ('44444444-4444-4444-8444-0000000000b4', fail_org, '22222222-2222-4222-8222-0000000000b4', '33333333-3333-4333-8333-0000000000b4', 'active', '2026-01-01', 10);
  insert into public.tenants (id, organization_id, first_name, last_name, email)
  values ('55555555-5555-4555-8555-0000000000b4', fail_org, 'Dup', 'Alloc', 'dup-alloc@fixture.test');
  insert into public.rent_charges (
    id, organization_id, property_id, unit_id, lease_id, tenant_id, charge_type, status, amount, amount_paid, due_date, description, charge_number
  ) values (
    '66666666-6666-4666-8666-0000000000b4', fail_org, '22222222-2222-4222-8222-0000000000b4', '33333333-3333-4333-8333-0000000000b4',
    '44444444-4444-4444-8444-0000000000b4', '55555555-5555-4555-8555-0000000000b4',
    'monthly_rent', 'paid', 10, 10, '2026-07-01', 'dup alloc', 'RC-DA'
  );
  insert into public.payments (
    id, organization_id, property_id, lease_id, tenant_id, rent_charge_id, amount, status, payment_method, payment_date, payment_number
  ) values (
    '77777777-7777-4777-8777-0000000000b4', fail_org, '22222222-2222-4222-8222-0000000000b4',
    '44444444-4444-4444-8444-0000000000b4', '55555555-5555-4555-8555-0000000000b4',
    '66666666-6666-4666-8666-0000000000b4', 10, 'completed', 'manual', '2026-07-01', 'PAY-DA'
  );
  perform public.finance_m2_backfill_org(fail_org, false);
  update public.financial_payment_allocations
  set amount = 3
  where payment_id = '77777777-7777-4777-8777-0000000000b4';
  fail := public.finance_m2_run(false, fail_org);
  if fail -> 'failures' -> 0 ->> 'error' not like 'duplicate_payment_allocation%' then
    raise exception 'duplicate allocation did not fail closed: %', fail;
  end if;

  -- Per-org isolation: good org commits, bad org rolls back with failed state
  insert into public.organizations (id) values (ok_org), (bad_org);
  insert into public.property_properties (id, organization_id) values
    ('22222222-2222-4222-8222-0000000000c1', ok_org),
    ('22222222-2222-4222-8222-0000000000c2', bad_org);
  insert into public.property_units (id, organization_id, property_id, unit_label) values
    ('33333333-3333-4333-8333-0000000000c1', ok_org, '22222222-2222-4222-8222-0000000000c1', 'Unit C1'),
    ('33333333-3333-4333-8333-0000000000c2', bad_org, '22222222-2222-4222-8222-0000000000c2', 'Unit C2');
  insert into public.leases (id, organization_id, property_id, unit_id, status, start_date, rent_amount) values
    ('44444444-4444-4444-8444-0000000000c1', ok_org, '22222222-2222-4222-8222-0000000000c1', '33333333-3333-4333-8333-0000000000c1', 'active', '2026-01-01', 20),
    ('44444444-4444-4444-8444-0000000000c2', bad_org, '22222222-2222-4222-8222-0000000000c2', '33333333-3333-4333-8333-0000000000c2', 'active', '2026-01-01', 20);
  insert into public.tenants (id, organization_id, first_name, last_name, email) values
    ('55555555-5555-4555-8555-0000000000c1', ok_org, 'Ok', 'Org', 'ok-org@fixture.test');
  insert into public.rent_charges (
    id, organization_id, property_id, unit_id, lease_id, tenant_id, charge_type, status, amount, amount_paid, due_date, description, charge_number
  ) values
    ('66666666-6666-4666-8666-0000000000c1', ok_org, '22222222-2222-4222-8222-0000000000c1', '33333333-3333-4333-8333-0000000000c1',
     '44444444-4444-4444-8444-0000000000c1', '55555555-5555-4555-8555-0000000000c1',
     'monthly_rent', 'paid', 20, 20, '2026-07-01', 'ok org', 'RC-OK'),
    ('66666666-6666-4666-8666-0000000000c2', bad_org, '22222222-2222-4222-8222-0000000000c2', '33333333-3333-4333-8333-0000000000c2',
     '44444444-4444-4444-8444-0000000000c2', '55555555-5555-4555-8555-0000000000c2',
     'monthly_rent', 'paid', 20, 20, '2026-07-01', 'bad org', 'RC-BAD');
  insert into public.payments (
    id, organization_id, property_id, lease_id, tenant_id, rent_charge_id, amount, status, payment_method, payment_date, payment_number
  ) values (
    '77777777-7777-4777-8777-0000000000c1', ok_org, '22222222-2222-4222-8222-0000000000c1',
    '44444444-4444-4444-8444-0000000000c1', '55555555-5555-4555-8555-0000000000c1',
    '66666666-6666-4666-8666-0000000000c1', 20, 'completed', 'manual', '2026-07-01', 'PAY-OK'
  );
  fail := public.finance_m2_run(false);
  if not exists (select 1 from public.financial_charges where organization_id = ok_org) then
    raise exception 'good org rolled back during isolation test';
  end if;
  if exists (select 1 from public.financial_charges where organization_id = bad_org) then
    raise exception 'bad org left half-migrated charges';
  end if;
  if not exists (
    select 1 from public.finance_lineage_map
    where source_table = 'm2_run' and source_id = bad_org and status = 'failed'
  ) then
    raise exception 'bad org has no failed state';
  end if;

  if exists (
    select 1
    from information_schema.role_routine_grants
    where routine_schema = 'public'
      and routine_name like 'finance_m2_%'
      and grantee in ('anon', 'authenticated', 'PUBLIC')
  ) then
    raise exception 'client execute grant present';
  end if;

  raise notice 'docs/140 M2 scratch apply: PASS';
end;
$$;
SQL

echo "docs/140 M2 scratch apply: PASS"
