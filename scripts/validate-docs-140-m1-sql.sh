#!/usr/bin/env bash
# Apply docs/140 M1 against a scratch Postgres that mimics the live Production
# parent lineage. Does not touch mpa-prod.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MIGRATION="$ROOT/supabase/migrations/20260816010000_docs_140_fin_ops_reconciliation_m1.sql"
DB="docs140_m1_scratch"
PSQL=(sudo -n -u postgres psql -v ON_ERROR_STOP=1)

if [[ ! -f "$MIGRATION" ]]; then
  echo "missing $MIGRATION" >&2
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
  id uuid primary key default gen_random_uuid()
);

create table public.property_properties (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id)
);

create table public.property_units (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  property_id uuid not null references public.property_properties (id)
);

create table public.lease_agreements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  property_id uuid not null references public.property_properties (id)
);

create table public.lease_residents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  lease_id uuid not null references public.lease_agreements (id)
);

create table public.vendor_vendors (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id)
);

create table public.rent_charges (
  id uuid primary key default gen_random_uuid(),
  marker text not null default 'july'
);
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  marker text not null default 'july'
);
create table public.vendor_invoices (
  id uuid primary key default gen_random_uuid(),
  marker text not null default 'july'
);
create table public.vendor_payments (
  id uuid primary key default gen_random_uuid(),
  marker text not null default 'july'
);
create table public.billing_ledger_entries (
  id uuid primary key default gen_random_uuid(),
  marker text not null default 'july'
);
create table public.financial_activity (
  id uuid primary key default gen_random_uuid(),
  marker text not null default 'july'
);
create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  marker text not null default 'july'
);
create table public.owner_statements (
  id uuid primary key default gen_random_uuid(),
  marker text not null default 'july'
);

insert into public.rent_charges default values;
insert into public.payments default values;
insert into public.vendor_invoices default values;
insert into public.vendor_payments default values;
insert into public.billing_ledger_entries default values;
insert into public.financial_activity default values;
insert into public.expenses default values;
insert into public.owner_statements default values;

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

"${PSQL[@]}" -d "$DB" -f "$MIGRATION"
"${PSQL[@]}" -d "$DB" -f "$MIGRATION"

"${PSQL[@]}" -d "$DB" <<'SQL'
do $$
declare
  t text;
  n bigint;
  pol int;
  late_default text;
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
    execute format('select count(*) from public.%I', t) into n;
    if n <> 0 then
      raise exception '% is not empty: %', t, n;
    end if;
    select count(*) into pol
    from pg_policies
    where schemaname = 'public' and tablename = t;
    if pol <> 0 then
      raise exception '% has % M1 policies; expected fail-closed with zero policies', t, pol;
    end if;
  end loop;

  foreach t in array array[
    'rent_charges','payments','vendor_invoices','vendor_payments',
    'billing_ledger_entries','financial_activity','expenses','owner_statements'
  ]
  loop
    execute format('select count(*) from public.%I', t) into n;
    if n <> 1 then
      raise exception 'July table % changed: %', t, n;
    end if;
  end loop;

  select column_default into late_default
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'financial_module_settings'
    and column_name = 'late_fees_enabled';
  if late_default is distinct from 'false' then
    raise exception 'late_fees_enabled default is %, expected false', late_default;
  end if;

  if not exists (
    select 1
    from pg_constraint c
    join pg_class src on src.oid = c.conrelid
    join pg_class dst on dst.oid = c.confrelid
    where src.relname = 'financial_vendor_invoices'
      and dst.relname = 'vendor_vendors'
      and c.contype = 'f'
  ) then
    raise exception 'financial_vendor_invoices missing vendor_vendors FK';
  end if;

  if not exists (
    select 1
    from pg_constraint c
    join pg_class src on src.oid = c.conrelid
    join pg_class dst on dst.oid = c.confrelid
    where src.relname = 'financial_charges'
      and dst.relname = 'lease_agreements'
      and c.contype = 'f'
  ) then
    raise exception 'financial_charges does not reference lease_agreements';
  end if;
end $$;
SQL

"${PSQL[@]}" -d postgres -c "drop database ${DB};"
echo "docs/140 M1 scratch apply: PASS"
