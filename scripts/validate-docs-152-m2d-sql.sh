#!/usr/bin/env bash
# Apply M1 + M2 + M2D against a scratch Development snapshot.
# Does not touch mpa-prod. Does not call finance_m2_run(false).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
M1="$ROOT/supabase/migrations/20260816010000_docs_140_fin_ops_reconciliation_m1.sql"
M2="$ROOT/supabase/migrations/20260816020000_docs_140_fin_ops_reconciliation_m2.sql"
M2D="$ROOT/supabase/migrations/20260816054252_docs_152_fin_ops_m2d_development_identity_repair.sql"
FIXTURE="$ROOT/scripts/fixtures/docs-152-m2d-development-snapshot.sql"
DB="docs152_m2d_scratch"
PSQL=(sudo -n -u postgres psql -v ON_ERROR_STOP=1)

if [[ ! -f "$M1" || ! -f "$M2" || ! -f "$M2D" || ! -f "$FIXTURE" ]]; then
  echo "missing M1, M2, M2D, or fixture" >&2
  exit 1
fi

if grep -E "select public\.finance_m2_run\(false|perform public\.finance_m2_run\(false" "$M2D"; then
  echo "M2D installer must not call finance_m2_run(false)" >&2
  exit 1
fi

"${PSQL[@]}" -d postgres -c "drop database if exists ${DB};"
"${PSQL[@]}" -d postgres -c "create database ${DB};"

"${PSQL[@]}" -d "$DB" <<'SQL'
create schema if not exists auth;
create table if not exists auth.users (id uuid primary key);

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
  unit_id uuid not null,
  status text not null,
  start_date date,
  end_date date,
  rent_amount numeric(14, 2),
  deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index leases_one_active_per_unit_idx
  on public.leases (organization_id, unit_id)
  where status = 'active' and deleted_at is null;

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
  status text not null default 'active',
  deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.rent_charges (
  id uuid primary key,
  organization_id uuid not null references public.organizations (id),
  property_id uuid not null references public.property_properties (id),
  unit_id uuid not null,
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
  unit_id uuid,
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
"${PSQL[@]}" -d "$DB" -f "$M2D"
"${PSQL[@]}" -d "$DB" -f "$FIXTURE"

"${PSQL[@]}" -d "$DB" <<'SQL'
do $$
declare
  dev uuid := 'f8232926-149d-46b3-829f-c84b55378718';
  dry jsonb;
  applied jsonb;
  again jsonb;
  blocked jsonb;
  err text;
  canopy_unit uuid;
  pmx_unit uuid;
  unused_unit uuid;
  cameron_unit uuid;
  n int;
begin
  if public.finance_m2d_version() is distinct from 'docs_152_m2d_owner_unit_map' then
    raise exception 'bad m2d version';
  end if;
  if public.finance_m2d_development_money() is distinct from jsonb_build_object(
    'charges', 12, 'gross', 18240.00, 'paid', 8960.00, 'payments', 8, 'outstanding', 9280.00
  ) then
    raise exception 'fixture money mismatch %', public.finance_m2d_development_money();
  end if;

  select unit_id into canopy_unit from public.rent_charges where id = 'aaaaaaaa-aaaa-4aaa-8aaa-0000000000c2';
  select unit_id into pmx_unit from public.rent_charges where id = 'bbbbbbbb-bbbb-4bbb-8bbb-0000000000c2';
  select unit_id into unused_unit from public.tenants where id = '4c0a32bc-81ea-468e-bc39-fc4f55e53d30';
  select unit_id into cameron_unit from public.rent_charges where id = '7e07b737-bcb6-495a-aefd-f787cdb159e2';

  blocked := public.finance_m2_run(true, dev);
  if blocked -> 'organizations' -> 0 ->> 'readiness' is distinct from 'BLOCKED' then
    raise exception 'expected Development BLOCKED before repair: %', blocked;
  end if;
  if (blocked -> 'organizations' -> 0 -> 'identity' ->> 'unit_property_mismatches')::int = 0 then
    raise exception 'expected mismatches before repair: %', blocked;
  end if;

  dry := public.finance_m2d_repair(true);
  if (dry ->> 'dry_run') is distinct from 'true' then
    raise exception 'dry-run flag missing';
  end if;
  if (select count(*) from public.rent_charges rc join public.finance_m2d_approved_map() m on m.charge_id = rc.id where rc.unit_id is distinct from m.current_unit_id) <> 0 then
    raise exception 'dry-run mutated charges';
  end if;

  begin
    insert into public.leases (
      id, organization_id, property_id, unit_id, status, start_date, end_date, rent_amount
    ) values (
      '99999999-9999-4999-8999-000000000001',
      dev,
      '5ea87ad9-0d9b-4af3-9775-e02f8e3ac25a',
      '261524d5-c2d6-4d4b-9149-8b86ac3b5633',
      'active',
      '2025-07-01',
      '2026-06-30',
      1
    );
    perform public.finance_m2d_repair(false);
    raise exception 'occupied-unit rejection failed';
  exception
    when others then
      err := sqlerrm;
      if err not like 'm2d_occupied_unit_lease%' then
        if err = 'occupied-unit rejection failed' then
          raise;
        end if;
        if err not like 'm2d_occupied_unit_lease%' then
          raise exception 'expected occupied lease stop, got %', err;
        end if;
      end if;
  end;
  delete from public.leases where id = '99999999-9999-4999-8999-000000000001';

  begin
    insert into public.tenants (
      id, organization_id, property_id, unit_id, first_name, last_name, email, status
    ) values (
      '99999999-9999-4999-8999-000000000002',
      dev,
      '5ea87ad9-0d9b-4af3-9775-e02f8e3ac25a',
      'a87fb591-d655-4a85-9b65-e9788337417f',
      'Outsider',
      'Tenant',
      'outsider@fixture.test',
      'active'
    );
    perform public.finance_m2d_repair(false);
    raise exception 'occupied-tenant rejection failed';
  exception
    when others then
      err := sqlerrm;
      if err not like 'm2d_occupied_unit_tenant%' then
        raise exception 'expected occupied tenant stop, got %', err;
      end if;
  end;
  delete from public.tenants where id = '99999999-9999-4999-8999-000000000002';

  update public.units
  set property_id = '737977ae-1f08-4e4e-8368-545e91f05fac'
  where id = '261524d5-c2d6-4d4b-9149-8b86ac3b5633';
  begin
    perform public.finance_m2d_repair(false);
    raise exception 'wrong-property rejection failed';
  exception
    when others then
      err := sqlerrm;
      if err not like 'm2d_wrong_property%' then
        raise exception 'expected wrong-property stop, got %', err;
      end if;
  end;
  update public.units
  set property_id = '5ea87ad9-0d9b-4af3-9775-e02f8e3ac25a'
  where id = '261524d5-c2d6-4d4b-9149-8b86ac3b5633';

  update public.rent_charges
  set unit_id = '766d0b17-5196-41e2-aa40-d0048bc33c87'
  where id = 'de460536-d3c9-45c6-bfcd-4f14c42f3991';
  begin
    perform public.finance_m2d_repair(false);
    raise exception 'unexpected current unit rejection failed';
  exception
    when others then
      err := sqlerrm;
      if err not like 'm2d_unexpected_charge_identity%' and err not like 'm2d_partial_state%' and err not like 'm2d_unexpected_current_unit_id%' then
        raise exception 'expected unexpected unit_id stop, got %', err;
      end if;
  end;
  update public.rent_charges
  set unit_id = '03dc55de-6395-41cf-b187-e36e18e2d307'
  where id = 'de460536-d3c9-45c6-bfcd-4f14c42f3991';

  applied := public.finance_m2d_repair(false);
  if (applied ->> 'dry_run') is distinct from 'false' then
    raise exception 'execute flag missing';
  end if;
  if public.finance_m2d_development_money() is distinct from jsonb_build_object(
    'charges', 12, 'gross', 18240.00, 'paid', 8960.00, 'payments', 8, 'outstanding', 9280.00
  ) then
    raise exception 'money changed after repair %', public.finance_m2d_development_money();
  end if;

  if exists (
    select 1
    from public.finance_m2d_approved_map() m
    join public.rent_charges rc on rc.id = m.charge_id
    where rc.unit_id is distinct from m.new_unit_id
       or rc.property_id is distinct from m.property_id
       or rc.organization_id is distinct from dev
       or rc.amount is distinct from (
         select amount from public.rent_charges x where x.id = rc.id
       )
  ) then
    raise exception 'approved charges not retargeted';
  end if;

  select count(*) into n
  from public.finance_m2d_approved_map() m
  join public.leases l on l.id = m.lease_id
  where l.unit_id = m.new_unit_id and l.property_id = m.property_id;
  if n <> 8 then
    raise exception 'leases not retargeted %', n;
  end if;

  select count(*) into n
  from public.finance_m2d_approved_map() m
  join public.tenants t on t.id = m.tenant_id
  where t.unit_id = m.new_unit_id and t.property_id = m.property_id;
  if n <> 8 then
    raise exception 'tenants not retargeted %', n;
  end if;

  select count(*) into n
  from public.payments p
  join public.finance_m2d_approved_map() m on m.charge_id = p.rent_charge_id
  where p.unit_id = m.new_unit_id;
  if n <> 4 then
    raise exception 'expected 4 remapped payments, got %', n;
  end if;

  if (select unit_id from public.rent_charges where id = '7e07b737-bcb6-495a-aefd-f787cdb159e2')
     is distinct from '2649465e-1894-4c19-b699-457c8570a7f3'::uuid then
    raise exception 'Cameron Option B unit changed';
  end if;
  if (select unit_id from public.tenants where id = '4c0a32bc-81ea-468e-bc39-fc4f55e53d30')
     is distinct from unused_unit then
    raise exception 'unrelated unused tenant changed';
  end if;
  if (select unit_id from public.rent_charges where id = 'aaaaaaaa-aaaa-4aaa-8aaa-0000000000c2')
     is distinct from canopy_unit then
    raise exception 'Canopy changed';
  end if;
  if (select unit_id from public.rent_charges where id = 'bbbbbbbb-bbbb-4bbb-8bbb-0000000000c2')
     is distinct from pmx_unit then
    raise exception 'PMX changed';
  end if;
  if (select count(*) from public.property_units where id = '2649465e-1894-4c19-b699-457c8570a7f3') <> 0 then
    raise exception 'Cameron Option B was materialized';
  end if;

  if exists (
    select 1 from public.rent_charges
    where organization_id = dev
      and id in (select charge_id from public.finance_m2d_approved_map())
      and (
        amount is null
        or due_date is distinct from date '2025-07-01'
        or charge_type is distinct from 'monthly_rent'
      )
  ) then
    raise exception 'protected charge fields changed';
  end if;

  dry := public.finance_m2_run(true, dev);
  if dry -> 'organizations' -> 0 ->> 'readiness' is distinct from 'READY' then
    raise exception 'expected Development READY after repair: %', dry;
  end if;
  if (dry -> 'organizations' -> 0 -> 'identity' ->> 'unit_property_mismatches')::int <> 0 then
    raise exception 'mismatches remain: %', dry;
  end if;
  if (dry -> 'organizations' -> 0 -> 'identity' ->> 'missing_units')::int <> 0 then
    raise exception 'missing units remain: %', dry;
  end if;
  if (select count(*) from public.financial_charges) <> 0 then
    raise exception 'dry-run wrote financial_charges';
  end if;

  again := public.finance_m2d_repair(false);
  if (again ->> 'already_applied') is distinct from 'true' then
    raise exception 'expected idempotent already_applied: %', again;
  end if;
  if public.finance_m2d_development_money() is distinct from jsonb_build_object(
    'charges', 12, 'gross', 18240.00, 'paid', 8960.00, 'payments', 8, 'outstanding', 9280.00
  ) then
    raise exception 'money changed on rerun';
  end if;

  if (select count(*) from public.finance_lineage_map where target_table = 'm2d_unit_repair') < 8 then
    raise exception 'missing m2d audit rows';
  end if;
end
$$;
SQL

echo "docs/152 M2D scratch apply: PASS"
