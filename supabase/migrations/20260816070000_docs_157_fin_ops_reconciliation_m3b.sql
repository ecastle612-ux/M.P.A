-- docs/157 FIN-OPS Production Reconciliation — Slice M3B
-- Successor after live Production tip 20260816060336 / docs_152_fin_ops_m2d_development_identity_repair.
--
-- Installs:
--   FIN-OPS write-guard (default OFF)
--   July write freeze (privileges + write-policy removal + triggers)
--   finance_m3_preflight() reconciliation gate (does NOT execute itself)
--
-- THIS FILE DOES NOT APPLY ITSELF TO PRODUCTION IN THIS PACKAGE.
-- Do not freeze Production July by committing this file.
-- A later Owner-authorized M3D apply must call finance_m3_assert_preflight()
-- first and STOP on drift.
--
-- Intentionally omitted:
--   M3A SELECT policies / authenticated SELECT grants (next stamp)
--   M4 write policies / finance_ops_writes_set(true)
--   M5 collections
--   S0/S1/S2 replay
--   Stripe / SKU / subscription / role / entitlement mutations
--   July DELETE/DROP/truncate/rewrite

-- ---------------------------------------------------------------------------
-- Cutover state (durable flags; not entitlements)
-- ---------------------------------------------------------------------------

create table if not exists public.finance_ops_cutover_state (
  singleton boolean primary key default true check (singleton),
  writes_enabled boolean not null default false,
  july_freeze_enabled boolean not null default true,
  updated_at timestamptz not null default timezone('utc', now())
);

insert into public.finance_ops_cutover_state (singleton, writes_enabled, july_freeze_enabled)
values (true, false, true)
on conflict (singleton) do nothing;

alter table public.finance_ops_cutover_state enable row level security;

revoke all on table public.finance_ops_cutover_state from public;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on table public.finance_ops_cutover_state from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke all on table public.finance_ops_cutover_state from authenticated';
  end if;
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'grant select, update on table public.finance_ops_cutover_state to service_role';
  end if;
end $$;

create or replace function public.finance_m3_version()
returns text
language sql
immutable
as $$
  select '20260816070000';
$$;

create or replace function public.finance_ops_writes_enabled()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce(current_setting('mpa.finance_ops_maintenance', true), '') = 'on'
    or exists (
      select 1
      from public.finance_ops_cutover_state state
      where state.singleton
        and state.writes_enabled
    );
$$;

create or replace function public.finance_july_freeze_enabled()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce(current_setting('mpa.finance_july_maintenance', true), '') is distinct from 'on'
    and exists (
      select 1
      from public.finance_ops_cutover_state state
      where state.singleton
        and state.july_freeze_enabled
    );
$$;

create or replace function public.finance_ops_writes_set(p_enabled boolean)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.finance_ops_cutover_state
  set writes_enabled = p_enabled,
      updated_at = timezone('utc', now())
  where singleton;
  return public.finance_ops_writes_enabled();
end;
$$;

create or replace function public.finance_july_freeze_set(p_enabled boolean)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.finance_ops_cutover_state
  set july_freeze_enabled = p_enabled,
      updated_at = timezone('utc', now())
  where singleton;
  return public.finance_july_freeze_enabled();
end;
$$;

create or replace function public.finance_ops_write_guard()
returns trigger
language plpgsql
as $$
begin
  if not public.finance_ops_writes_enabled() then
    raise exception 'finance_ops_writes_frozen'
      using errcode = 'P0001',
            hint = 'M3 write-guard. M4 lifts finance_ops_writes_set(true) after Owner authorization.';
  end if;
  return coalesce(new, old);
end;
$$;

create or replace function public.finance_july_write_guard()
returns trigger
language plpgsql
as $$
begin
  if public.finance_july_freeze_enabled() then
    raise exception 'finance_july_frozen'
      using errcode = 'P0001',
            hint = 'July finance is read-only after M3. Do not write rent_charges/payments or siblings.';
  end if;
  return coalesce(new, old);
end;
$$;

-- ---------------------------------------------------------------------------
-- Attach FIN-OPS write-guard (service_role included; RLS is not enough)
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
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
    'financial_vendor_payments'
  ]
  loop
    if to_regclass('public.' || t) is null then
      continue;
    end if;
    execute format('drop trigger if exists finance_ops_write_guard on public.%I', t);
    execute format(
      'create trigger finance_ops_write_guard
         before insert or update or delete on public.%I
         for each row execute function public.finance_ops_write_guard()',
      t
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- July freeze inventory
-- ---------------------------------------------------------------------------

create or replace function public.finance_m3_july_freeze_tables()
returns text[]
language sql
immutable
as $$
  select array[
    'rent_charges',
    'payments',
    'payment_receipts',
    'payment_customers',
    'payment_attempts',
    'payment_methods',
    'billing_ledger_entries',
    'financial_activity',
    'expenses',
    'owner_statements',
    'vendor_invoices',
    'vendor_payments',
    'late_fees',
    'billing_schedules',
    'billing_invoices',
    'billing_adjustments',
    'autopay_enrollments'
  ];
$$;

do $$
declare
  t text;
  pol record;
begin
  foreach t in array public.finance_m3_july_freeze_tables()
  loop
    if to_regclass('public.' || t) is null then
      continue;
    end if;

    execute format('revoke insert, update, delete, truncate on table public.%I from public', t);
    if exists (select 1 from pg_roles where rolname = 'anon') then
      execute format('revoke insert, update, delete, truncate on table public.%I from anon', t);
    end if;
    if exists (select 1 from pg_roles where rolname = 'authenticated') then
      execute format('revoke insert, update, delete, truncate on table public.%I from authenticated', t);
    end if;

    for pol in
      select p.polname
      from pg_policy p
      join pg_class c on c.oid = p.polrelid
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relname = t
        and p.polcmd <> 'r'
    loop
      execute format('drop policy if exists %I on public.%I', pol.polname, t);
    end loop;

    execute format('drop trigger if exists finance_july_write_guard on public.%I', t);
    execute format(
      'create trigger finance_july_write_guard
         before insert or update or delete on public.%I
         for each row execute function public.finance_july_write_guard()',
      t
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Pre-apply reconciliation gate (recomputes; never hard-codes success)
-- ---------------------------------------------------------------------------

create or replace function public.finance_m3_expected_money()
returns jsonb
language sql
immutable
as $$
  select jsonb_build_object(
    'charges', 17,
    'gross', 24691.00,
    'paid', 11111.00,
    'payments', 11,
    'allocations', 11,
    'outstanding', 13580.00,
    'vendor_ap', 125.50,
    'canopy', jsonb_build_object(
      'id', 'f88ee244-5343-4ddf-be48-15e96b9380ee',
      'charges', 4, 'gross', 4951.00, 'paid', 1651.00, 'outstanding', 3300.00
    ),
    'pmx', jsonb_build_object(
      'id', '90af697c-461f-4652-8dc2-2ccf43346e11',
      'charges', 1, 'gross', 1500.00, 'paid', 500.00, 'outstanding', 1000.00
    ),
    'development', jsonb_build_object(
      'id', 'f8232926-149d-46b3-829f-c84b55378718',
      'charges', 12, 'gross', 18240.00, 'paid', 8960.00, 'outstanding', 9280.00
    )
  );
$$;

create or replace function public.finance_m3_org_money(p_organization_id uuid)
returns jsonb
language sql
stable
as $$
  select jsonb_build_object(
    'charges', (select count(*) from public.financial_charges c where c.organization_id = p_organization_id),
    'gross', (select coalesce(sum(c.amount), 0) from public.financial_charges c where c.organization_id = p_organization_id),
    'paid', (select coalesce(sum(c.amount_paid), 0) from public.financial_charges c where c.organization_id = p_organization_id),
    'outstanding', (
      select coalesce(sum(c.amount - c.amount_paid), 0)
      from public.financial_charges c
      where c.organization_id = p_organization_id
        and c.status is distinct from 'void'
    ),
    'july_charges', (select count(*) from public.rent_charges c where c.organization_id = p_organization_id),
    'july_gross', (select coalesce(sum(c.amount), 0) from public.rent_charges c where c.organization_id = p_organization_id),
    'july_paid', (select coalesce(sum(c.amount_paid), 0) from public.rent_charges c where c.organization_id = p_organization_id)
  );
$$;

create or replace function public.finance_m3_preflight()
returns jsonb
language plpgsql
stable
as $$
declare
  expected jsonb := public.finance_m3_expected_money();
  july_charges int;
  july_gross numeric;
  july_paid numeric;
  july_payments int;
  july_outstanding numeric;
  july_vendor numeric;
  fin_charges int;
  fin_gross numeric;
  fin_paid numeric;
  fin_payments int;
  fin_allocations int;
  fin_outstanding numeric;
  fin_vendor numeric;
  blockers text[] := '{}';
  canopy jsonb;
  pmx jsonb;
  development jsonb;
begin
  select count(*), coalesce(sum(amount), 0), coalesce(sum(amount_paid), 0)
  into july_charges, july_gross, july_paid
  from public.rent_charges;

  select count(*) into july_payments from public.payments;
  july_outstanding := july_gross - july_paid;
  select coalesce(sum(amount), 0) into july_vendor from public.vendor_invoices;

  select count(*), coalesce(sum(amount), 0), coalesce(sum(amount_paid), 0)
  into fin_charges, fin_gross, fin_paid
  from public.financial_charges;

  select count(*) into fin_payments from public.financial_payments;
  select count(*) into fin_allocations from public.financial_payment_allocations;
  select coalesce(sum(amount - amount_paid), 0)
  into fin_outstanding
  from public.financial_charges
  where status is distinct from 'void';
  select coalesce(sum(amount), 0) into fin_vendor from public.financial_vendor_invoices;

  if july_charges is distinct from (expected->>'charges')::int
     or fin_charges is distinct from (expected->>'charges')::int then
    blockers := blockers || array['charge_count'];
  end if;
  if july_gross is distinct from (expected->>'gross')::numeric
     or fin_gross is distinct from (expected->>'gross')::numeric then
    blockers := blockers || array['gross'];
  end if;
  if july_paid is distinct from (expected->>'paid')::numeric
     or fin_paid is distinct from (expected->>'paid')::numeric then
    blockers := blockers || array['paid'];
  end if;
  if july_payments is distinct from (expected->>'payments')::int
     or fin_payments is distinct from (expected->>'payments')::int then
    blockers := blockers || array['payments'];
  end if;
  if fin_allocations is distinct from (expected->>'allocations')::int then
    blockers := blockers || array['allocations'];
  end if;
  if july_outstanding is distinct from (expected->>'outstanding')::numeric
     or fin_outstanding is distinct from (expected->>'outstanding')::numeric then
    blockers := blockers || array['outstanding'];
  end if;
  if july_vendor is distinct from (expected->>'vendor_ap')::numeric
     or fin_vendor is distinct from (expected->>'vendor_ap')::numeric then
    blockers := blockers || array['vendor_ap'];
  end if;

  canopy := public.finance_m3_org_money((expected->'canopy'->>'id')::uuid);
  pmx := public.finance_m3_org_money((expected->'pmx'->>'id')::uuid);
  development := public.finance_m3_org_money((expected->'development'->>'id')::uuid);

  if (canopy->>'charges')::int is distinct from (expected->'canopy'->>'charges')::int
     or (canopy->>'gross')::numeric is distinct from (expected->'canopy'->>'gross')::numeric
     or (canopy->>'paid')::numeric is distinct from (expected->'canopy'->>'paid')::numeric
     or (canopy->>'outstanding')::numeric is distinct from (expected->'canopy'->>'outstanding')::numeric
     or (canopy->>'july_charges')::int is distinct from (expected->'canopy'->>'charges')::int then
    blockers := blockers || array['canopy'];
  end if;
  if (pmx->>'charges')::int is distinct from (expected->'pmx'->>'charges')::int
     or (pmx->>'gross')::numeric is distinct from (expected->'pmx'->>'gross')::numeric
     or (pmx->>'paid')::numeric is distinct from (expected->'pmx'->>'paid')::numeric
     or (pmx->>'outstanding')::numeric is distinct from (expected->'pmx'->>'outstanding')::numeric
     or (pmx->>'july_charges')::int is distinct from (expected->'pmx'->>'charges')::int then
    blockers := blockers || array['pmx'];
  end if;
  if (development->>'charges')::int is distinct from (expected->'development'->>'charges')::int
     or (development->>'gross')::numeric is distinct from (expected->'development'->>'gross')::numeric
     or (development->>'paid')::numeric is distinct from (expected->'development'->>'paid')::numeric
     or (development->>'outstanding')::numeric is distinct from (expected->'development'->>'outstanding')::numeric
     or (development->>'july_charges')::int is distinct from (expected->'development'->>'charges')::int then
    blockers := blockers || array['development'];
  end if;

  return jsonb_build_object(
    'ready', coalesce(array_length(blockers, 1), 0) = 0,
    'blockers', to_jsonb(blockers),
    'expected', expected,
    'july', jsonb_build_object(
      'charges', july_charges, 'gross', july_gross, 'paid', july_paid,
      'payments', july_payments, 'outstanding', july_outstanding, 'vendor_ap', july_vendor
    ),
    'finops', jsonb_build_object(
      'charges', fin_charges, 'gross', fin_gross, 'paid', fin_paid,
      'payments', fin_payments, 'allocations', fin_allocations,
      'outstanding', fin_outstanding, 'vendor_ap', fin_vendor
    ),
    'canopy', canopy,
    'pmx', pmx,
    'development', development
  );
end;
$$;

create or replace function public.finance_m3_assert_preflight()
returns jsonb
language plpgsql
as $$
declare
  report jsonb;
begin
  report := public.finance_m3_preflight();
  if not coalesce((report->>'ready')::boolean, false) then
    raise exception 'finance_m3_reconciliation_drift'
      using errcode = 'P0001',
            detail = report::text,
            hint = 'STOP. Do not freeze July until July and FIN-OPS match docs/156/157.';
  end if;
  return report;
end;
$$;

-- Privileged surface: no client EXECUTE on setters, preflight assert, or version is ok to read.
revoke all on function public.finance_ops_writes_enabled() from public, anon;
revoke all on function public.finance_july_freeze_enabled() from public, anon;
revoke all on function public.finance_ops_writes_set(boolean) from public, anon, authenticated;
revoke all on function public.finance_july_freeze_set(boolean) from public, anon, authenticated;
revoke all on function public.finance_m3_assert_preflight() from public, anon, authenticated;
revoke all on function public.finance_m3_preflight() from public, anon, authenticated;
revoke all on function public.finance_m3_expected_money() from public, anon, authenticated;
revoke all on function public.finance_m3_org_money(uuid) from public, anon, authenticated;
revoke all on function public.finance_m3_july_freeze_tables() from public, anon, authenticated;
revoke all on function public.finance_m3_version() from public, anon, authenticated;
revoke all on function public.finance_ops_write_guard() from public, anon, authenticated;
revoke all on function public.finance_july_write_guard() from public, anon, authenticated;

grant execute on function public.finance_ops_writes_enabled() to authenticated;
grant execute on function public.finance_july_freeze_enabled() to authenticated;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'grant execute on function public.finance_ops_writes_enabled() to service_role';
    execute 'grant execute on function public.finance_july_freeze_enabled() to service_role';
    execute 'grant execute on function public.finance_ops_writes_set(boolean) to service_role';
    execute 'grant execute on function public.finance_july_freeze_set(boolean) to service_role';
    execute 'grant execute on function public.finance_m3_preflight() to service_role';
    execute 'grant execute on function public.finance_m3_assert_preflight() to service_role';
    execute 'grant execute on function public.finance_m3_version() to service_role';
  end if;
end $$;
