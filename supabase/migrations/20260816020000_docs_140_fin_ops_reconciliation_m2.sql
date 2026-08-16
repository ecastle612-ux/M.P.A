-- docs/140 FIN-OPS Production Reconciliation — Slice M2
-- Amended by docs/146 / ADR-035 (M2A currency, M2B proven units, M2C dry-run).
-- Identity materialization + July → FIN-OPS backfill + ledger reconstruction.
-- Successor after live Production tip 20260816003005 / docs_140_fin_ops_reconciliation_m1.
--
-- This file INSTALLS the trusted backfill mechanism. It does NOT execute the
-- backfill. Do not apply this file to Production without a later Owner
-- authorization. Never apply 20260816010000 (already live as 20260816003005).
-- Never replay 20260806030000 / 40000 / 50000.
--
-- Execution identity: postgres / service_role only.
-- No anon / authenticated EXECUTE.
-- No client-facing RPC.
-- July source tables are read-only (no UPDATE / DELETE / TRUNCATE).
--
-- Transaction boundaries:
--   finance_m2_run() is one outer transaction.
--   Each organization is a PL/pgSQL BEGIN/EXCEPTION subtransaction.
--   A failed org rolls back its materialization/backfill writes, then records
--   finance_lineage_map (m2_run → organization, status=failed) in the outer
--   transaction. Other orgs that already succeeded remain committed to the
--   outer transaction. Dry-run performs no writes, including no failed-state
--   lineage rows, and reports READY/BLOCKED per org without aborting the run.
-- Retry: same source + same target is idempotent. Same source + different
--   target STOPs. Re-running a previously failed org after the source is
--   repaired updates the m2_run lineage from failed → migrated.
-- Dry-run: finance_m2_run(true) returns per-org readiness. It does not write.
-- Reconciliation: finance_m2_reconcile() recomputes counts/money from tables.
-- Currency: July rent_charges/payments have no currency column. Materialize
--   USD as migration_default_usd. Do not ALTER or UPDATE July source rows.
-- Units: materialize public.units → property_units only when same UUID, org,
--   and property are proven. unit_property_mismatch STOPs. No invented units.

create or replace function public.finance_m2_version()
returns text
language sql
immutable
as $$
  select '20260816020000';
$$;

create or replace function public.finance_m2_map_charge_type(p_type text)
returns text
language plpgsql
immutable
as $$
begin
  if p_type = 'monthly_rent' then
    return 'rent';
  end if;
  if p_type in ('custom', 'other', 'security_deposit') then
    return 'one_time';
  end if;
  raise exception 'unsupported_charge_type:%', p_type;
end;
$$;

create or replace function public.finance_m2_map_charge_status(p_status text, p_amount_paid numeric)
returns text
language plpgsql
immutable
as $$
begin
  if p_status = 'paid' then
    return 'paid';
  end if;
  if p_status = 'partial' then
    return 'partially_paid';
  end if;
  if p_status = 'overdue' then
    if coalesce(p_amount_paid, 0) > 0 then
      return 'partially_paid';
    end if;
    return 'open';
  end if;
  raise exception 'unsupported_charge_status:%', p_status;
end;
$$;

create or replace function public.finance_m2_has_stripe_identity(p_metadata jsonb)
returns boolean
language sql
immutable
as $$
  select coalesce(
    nullif(btrim(p_metadata ->> 'stripe_payment_intent_id'), ''),
    nullif(btrim(p_metadata ->> 'payment_intent'), ''),
    nullif(btrim(p_metadata ->> 'stripe_checkout_session_id'), ''),
    nullif(btrim(p_metadata ->> 'checkout_session_id'), ''),
    nullif(btrim(p_metadata ->> 'stripe_charge_id'), '')
  ) is not null;
$$;

create or replace function public.finance_m2_map_payment_method(p_method text, p_metadata jsonb)
returns text
language plpgsql
immutable
as $$
begin
  if public.finance_m2_has_stripe_identity(p_metadata) then
    raise exception 'unexpected_stripe_source';
  end if;
  if p_method in ('manual', 'card') then
    return 'manual_other';
  end if;
  if p_method = 'check' then
    return 'manual_check';
  end if;
  raise exception 'unsupported_payment_method:%', p_method;
end;
$$;

create or replace function public.finance_m2_map_lease_status(p_status text)
returns text
language plpgsql
immutable
as $$
begin
  if p_status = 'draft' then
    return 'draft';
  end if;
  if p_status = 'active' then
    return 'active';
  end if;
  if p_status in ('expired', 'terminated', 'ended') then
    return 'ended';
  end if;
  raise exception 'unsupported_lease_status:%', p_status;
end;
$$;

create or replace function public.finance_m2_usable_stripe_customer_id(p_value text)
returns boolean
language sql
immutable
as $$
  select p_value ~ '^cus_[A-Za-z0-9]+$';
$$;

create or replace function public.finance_m2_relation_exists(p_table text)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = p_table
  );
$$;

create or replace function public.finance_m2_column_exists(p_table text, p_column text)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = p_table
      and column_name = p_column
  );
$$;

create or replace function public.finance_m2_normalize_currency(p_value text)
returns text
language plpgsql
immutable
as $$
begin
  if nullif(btrim(p_value), '') is null then
    return 'USD';
  end if;
  if upper(p_value) = 'USD' then
    return 'USD';
  end if;
  raise exception 'unsupported_currency:%', p_value;
end;
$$;

create or replace function public.finance_m2_source_currency(p_table text, p_id uuid)
returns text
language plpgsql
stable
as $$
declare
  v text;
begin
  if not public.finance_m2_column_exists(p_table, 'currency') then
    return 'USD';
  end if;
  execute format('select currency::text from public.%I where id = $1', p_table)
    into v
    using p_id;
  return public.finance_m2_normalize_currency(v);
end;
$$;

create or replace function public.finance_m2_currency_provenance(p_table text)
returns text
language sql
stable
as $$
  select case
    when public.finance_m2_column_exists(p_table, 'currency') then 'source'
    else 'migration_default_usd'
  end;
$$;

create or replace function public.finance_m2_legacy_unit_label(p_label text, p_number text)
returns text
language plpgsql
immutable
as $$
declare
  v text;
begin
  v := nullif(btrim(p_label), '');
  if v is not null then
    return v;
  end if;
  v := nullif(btrim(p_number), '');
  if v is not null then
    return v;
  end if;
  raise exception 'missing_unit_label';
end;
$$;

create or replace function public.finance_m2_map_legacy_unit_status(p_occupancy text)
returns text
language plpgsql
immutable
as $$
begin
  if p_occupancy = 'occupied' then
    return 'occupied';
  end if;
  if p_occupancy in ('vacant_ready', 'vacant') then
    return 'available';
  end if;
  raise exception 'unsupported_legacy_unit_occupancy:%', p_occupancy;
end;
$$;

create or replace function public.finance_m2_record_lineage(
  p_organization_id uuid,
  p_source_table text,
  p_source_id uuid,
  p_target_table text,
  p_target_id uuid,
  p_status text,
  p_error text default null
)
returns void
language plpgsql
as $$
declare
  existing record;
begin
  select *
  into existing
  from public.finance_lineage_map
  where source_table = p_source_table
    and source_id = p_source_id
    and target_table = p_target_table;

  if found then
    if existing.target_id is distinct from p_target_id then
      raise exception 'conflicting_lineage:%:%:%', p_source_table, p_source_id, p_target_table;
    end if;
    update public.finance_lineage_map
    set
      organization_id = p_organization_id,
      target_id = p_target_id,
      status = p_status,
      error = p_error,
      migration_version = public.finance_m2_version(),
      updated_at = timezone('utc', now())
    where id = existing.id;
    return;
  end if;

  insert into public.finance_lineage_map (
    organization_id,
    source_table,
    source_id,
    target_table,
    target_id,
    migration_version,
    status,
    error
  ) values (
    p_organization_id,
    p_source_table,
    p_source_id,
    p_target_table,
    p_target_id,
    public.finance_m2_version(),
    p_status,
    p_error
  );
end;
$$;

create or replace function public.finance_m2_preflight(p_organization_id uuid default null)
returns table (
  organization_id uuid,
  severity text,
  code text,
  detail text
)
language plpgsql
stable
as $$
begin
  return query
  select rc.organization_id, 'error'::text, 'missing_organization'::text, rc.id::text
  from public.rent_charges rc
  where (p_organization_id is null or rc.organization_id = p_organization_id)
    and not exists (select 1 from public.organizations o where o.id = rc.organization_id);

  return query
  select rc.organization_id, 'error', 'missing_property', rc.id::text
  from public.rent_charges rc
  where (p_organization_id is null or rc.organization_id = p_organization_id)
    and not exists (select 1 from public.property_properties p where p.id = rc.property_id);

  return query
  select rc.organization_id, 'error', 'missing_july_lease', rc.id::text
  from public.rent_charges rc
  where (p_organization_id is null or rc.organization_id = p_organization_id)
    and not exists (select 1 from public.leases l where l.id = rc.lease_id);

  return query
  select rc.organization_id, 'error', 'missing_july_tenant', rc.id::text
  from public.rent_charges rc
  where (p_organization_id is null or rc.organization_id = p_organization_id)
    and not exists (select 1 from public.tenants t where t.id = rc.tenant_id);

  return query
  select rc.organization_id, 'error', 'negative_charge_amount', rc.id::text
  from public.rent_charges rc
  where (p_organization_id is null or rc.organization_id = p_organization_id)
    and (rc.amount < 0 or rc.amount_paid < 0);

  return query
  select p.organization_id, 'error', 'missing_payment_charge', p.id::text
  from public.payments p
  where (p_organization_id is null or p.organization_id = p_organization_id)
    and (p.rent_charge_id is null
      or not exists (select 1 from public.rent_charges rc where rc.id = p.rent_charge_id));

  return query
  select p.organization_id, 'error', 'payment_org_mismatch', p.id::text
  from public.payments p
  join public.rent_charges rc on rc.id = p.rent_charge_id
  where (p_organization_id is null or p.organization_id = p_organization_id)
    and p.organization_id is distinct from rc.organization_id;

  return query
  select p.organization_id, 'error', 'payment_relationship_mismatch', p.id::text
  from public.payments p
  join public.rent_charges rc on rc.id = p.rent_charge_id
  where (p_organization_id is null or p.organization_id = p_organization_id)
    and (
      (p.lease_id is not null and p.lease_id is distinct from rc.lease_id)
      or (p.property_id is not null and p.property_id is distinct from rc.property_id)
      or (p.tenant_id is not null and p.tenant_id is distinct from rc.tenant_id)
    );

  return query
  select p.organization_id, 'error', 'negative_payment_amount', p.id::text
  from public.payments p
  where (p_organization_id is null or p.organization_id = p_organization_id)
    and p.amount <= 0;

  return query
  select p.organization_id, 'error', 'unsupported_payment_status', p.id::text
  from public.payments p
  where (p_organization_id is null or p.organization_id = p_organization_id)
    and p.status is distinct from 'completed';

  if public.finance_m2_column_exists('rent_charges', 'currency') then
    return query
    execute
      $q$
        select rc.organization_id, 'error'::text, 'unsupported_currency'::text, rc.id::text
        from public.rent_charges rc
        where ($1 is null or rc.organization_id = $1)
          and nullif(btrim(rc.currency), '') is not null
          and upper(rc.currency) is distinct from 'USD'
      $q$
      using p_organization_id;
  end if;

  if public.finance_m2_column_exists('payments', 'currency') then
    return query
    execute
      $q$
        select p.organization_id, 'error'::text, 'unsupported_currency'::text, p.id::text
        from public.payments p
        where ($1 is null or p.organization_id = $1)
          and nullif(btrim(p.currency), '') is not null
          and upper(p.currency) is distinct from 'USD'
      $q$
      using p_organization_id;
  end if;

  return query
  select p.organization_id, 'error',
    case
      when public.finance_m2_has_stripe_identity(p.metadata) then 'unexpected_stripe_source'
      else 'unsupported_payment_method'
    end,
    p.id::text
  from public.payments p
  where (p_organization_id is null or p.organization_id = p_organization_id)
    and (
      public.finance_m2_has_stripe_identity(p.metadata)
      or p.payment_method not in ('manual', 'check', 'card')
    );

  return query
  select vi.organization_id, 'error', 'missing_canonical_vendor', vi.id::text
  from public.vendor_invoices vi
  where (p_organization_id is null or vi.organization_id = p_organization_id)
    and (
      vi.vendor_id is null
      or not exists (select 1 from public.vendor_vendors v where v.id = vi.vendor_id)
    );

  return query
  select vp.organization_id, 'error', 'vendor_payment_invoice_mismatch', vp.id::text
  from public.vendor_payments vp
  where (p_organization_id is null or vp.organization_id = p_organization_id)
    and not exists (
      select 1
      from public.vendor_invoices vi
      where vi.id = vp.invoice_id
        and vi.organization_id = vp.organization_id
    );

  return query
  select la.organization_id, 'error', 'incompatible_canonical_lease', l.id::text
  from public.leases l
  join public.lease_agreements la on la.id = l.id
  where (p_organization_id is null or l.organization_id = p_organization_id)
    and exists (
      select 1 from public.rent_charges rc where rc.lease_id = l.id
      union
      select 1 from public.payments p where p.lease_id = l.id
    )
    and (
      la.organization_id is distinct from l.organization_id
      or la.property_id is distinct from l.property_id
    );

  return query
  select lr.organization_id, 'error', 'incompatible_canonical_resident', t.id::text
  from public.tenants t
  join public.lease_residents lr on lr.id = t.id
  where (p_organization_id is null or t.organization_id = p_organization_id)
    and exists (
      select 1 from public.rent_charges rc where rc.tenant_id = t.id
      union
      select 1 from public.payments p where p.tenant_id = t.id
    )
    and lr.organization_id is distinct from t.organization_id;

  return query
  select lm.organization_id, 'error', 'conflicting_lineage', lm.source_table || ':' || lm.source_id::text
  from public.finance_lineage_map lm
  where (p_organization_id is null or lm.organization_id = p_organization_id)
    and lm.status = 'migrated'
    and lm.migration_version is distinct from public.finance_m2_version()
    and lm.target_table like 'financial_%';

  return query
  select rc.organization_id, 'error', 'unit_chain_mismatch', rc.id::text
  from public.rent_charges rc
  left join public.leases l on l.id = rc.lease_id
  left join public.tenants t on t.id = rc.tenant_id
  where (p_organization_id is null or rc.organization_id = p_organization_id)
    and (
      (l.unit_id is not null and l.unit_id is distinct from rc.unit_id)
      or (t.unit_id is not null and t.unit_id is distinct from rc.unit_id)
      or (l.property_id is not null and l.property_id is distinct from rc.property_id)
      or (t.property_id is not null and t.property_id is distinct from rc.property_id)
    );

  return query
  select rc.organization_id, 'error', 'unit_org_mismatch', rc.id::text
  from public.rent_charges rc
  join public.property_units pu on pu.id = rc.unit_id
  where (p_organization_id is null or rc.organization_id = p_organization_id)
    and pu.organization_id is distinct from rc.organization_id;

  return query
  select rc.organization_id, 'error', 'unit_property_mismatch', rc.id::text
  from public.rent_charges rc
  join public.property_units pu on pu.id = rc.unit_id
  left join public.leases l on l.id = rc.lease_id
  left join public.tenants t on t.id = rc.tenant_id
  where (p_organization_id is null or rc.organization_id = p_organization_id)
    and pu.organization_id = rc.organization_id
    and (
      pu.property_id is distinct from rc.property_id
      or (l.property_id is not null and pu.property_id is distinct from l.property_id)
      or (t.property_id is not null and pu.property_id is distinct from t.property_id)
    );

  if public.finance_m2_relation_exists('units') then
    return query
    execute
      $q$
        select rc.organization_id, 'error'::text, 'unit_org_mismatch'::text, rc.id::text
        from public.rent_charges rc
        join public.units u on u.id = rc.unit_id
        where ($1 is null or rc.organization_id = $1)
          and u.organization_id is distinct from rc.organization_id
      $q$
      using p_organization_id;

    return query
    execute
      $q$
        select rc.organization_id, 'error'::text, 'unit_property_mismatch'::text, rc.id::text
        from public.rent_charges rc
        join public.units u on u.id = rc.unit_id
        left join public.leases l on l.id = rc.lease_id
        left join public.tenants t on t.id = rc.tenant_id
        where ($1 is null or rc.organization_id = $1)
          and u.organization_id = rc.organization_id
          and (
            u.property_id is distinct from rc.property_id
            or (l.property_id is not null and u.property_id is distinct from l.property_id)
            or (t.property_id is not null and u.property_id is distinct from t.property_id)
          )
      $q$
      using p_organization_id;

    return query
    execute
      $q$
        select rc.organization_id, 'error'::text, 'legacy_unit_not_usable'::text, rc.id::text
        from public.rent_charges rc
        join public.units u on u.id = rc.unit_id
        where ($1 is null or rc.organization_id = $1)
          and u.organization_id = rc.organization_id
          and u.property_id = rc.property_id
          and (u.deleted_at is not null or u.archived_at is not null)
      $q$
      using p_organization_id;

    return query
    execute
      $q$
        select rc.organization_id, 'error'::text, 'ambiguous_unit'::text, rc.id::text
        from public.rent_charges rc
        join public.units u on u.id = rc.unit_id
        join public.property_units pu
          on pu.property_id = u.property_id
         and pu.unit_label = coalesce(nullif(btrim(u.unit_label), ''), nullif(btrim(u.unit_number), ''))
         and pu.id is distinct from u.id
        where ($1 is null or rc.organization_id = $1)
          and u.organization_id = rc.organization_id
          and u.property_id = rc.property_id
          and not exists (select 1 from public.property_units existing where existing.id = u.id)
      $q$
      using p_organization_id;

    return query
    execute
      $q$
        select rc.organization_id, 'error'::text, 'conflicting_canonical_unit'::text, rc.id::text
        from public.rent_charges rc
        join public.units u on u.id = rc.unit_id
        join public.property_units pu on pu.id = u.id
        where ($1 is null or rc.organization_id = $1)
          and (
            pu.organization_id is distinct from u.organization_id
            or pu.property_id is distinct from u.property_id
            or pu.unit_label is distinct from coalesce(nullif(btrim(u.unit_label), ''), nullif(btrim(u.unit_number), ''))
          )
      $q$
      using p_organization_id;

    return query
    execute
      $q$
        select rc.organization_id, 'error'::text, 'missing_unit_for_resident'::text, rc.id::text
        from public.rent_charges rc
        where ($1 is null or rc.organization_id = $1)
          and rc.unit_id is not null
          and not exists (
            select 1
            from public.property_units pu
            where pu.id = rc.unit_id
              and pu.organization_id = rc.organization_id
              and pu.property_id = rc.property_id
          )
          and not exists (
            select 1
            from public.units u
            where u.id = rc.unit_id
              and u.organization_id = rc.organization_id
              and u.property_id = rc.property_id
              and u.deleted_at is null
              and u.archived_at is null
          )
      $q$
      using p_organization_id;
  else
    return query
    select rc.organization_id, 'error', 'missing_unit_for_resident', rc.id::text
    from public.rent_charges rc
    where (p_organization_id is null or rc.organization_id = p_organization_id)
      and rc.unit_id is not null
      and not exists (
        select 1
        from public.property_units pu
        where pu.id = rc.unit_id
          and pu.organization_id = rc.organization_id
          and pu.property_id = rc.property_id
      );
  end if;
end;
$$;

create or replace function public.finance_m2_ensure_canonical_unit(
  p_organization_id uuid,
  p_property_id uuid,
  p_unit_id uuid
)
returns uuid
language plpgsql
as $$
declare
  pu public.property_units%rowtype;
  legacy_org uuid;
  legacy_property uuid;
  legacy_label text;
  legacy_number text;
  legacy_occupancy text;
  legacy_deleted timestamptz;
  legacy_archived timestamptz;
  mapped_label text;
  mapped_status text;
begin
  if p_unit_id is null then
    raise exception 'missing_unit_for_resident';
  end if;

  select * into pu from public.property_units where id = p_unit_id;
  if found then
    if pu.organization_id is distinct from p_organization_id then
      raise exception 'unit_org_mismatch:%', p_unit_id;
    end if;
    if pu.property_id is distinct from p_property_id then
      raise exception 'unit_property_mismatch:%', p_unit_id;
    end if;
    return p_unit_id;
  end if;

  if not public.finance_m2_relation_exists('units') then
    raise exception 'missing_unit_for_resident:%', p_unit_id;
  end if;

  execute
    $q$
      select organization_id, property_id, unit_label, unit_number, occupancy_status, deleted_at, archived_at
      from public.units
      where id = $1
    $q$
    into legacy_org, legacy_property, legacy_label, legacy_number, legacy_occupancy, legacy_deleted, legacy_archived
    using p_unit_id;

  if legacy_org is null then
    raise exception 'missing_unit_for_resident:%', p_unit_id;
  end if;
  if legacy_org is distinct from p_organization_id then
    raise exception 'unit_org_mismatch:%', p_unit_id;
  end if;
  if legacy_property is distinct from p_property_id then
    raise exception 'unit_property_mismatch:%', p_unit_id;
  end if;
  if legacy_deleted is not null or legacy_archived is not null then
    raise exception 'legacy_unit_not_usable:%', p_unit_id;
  end if;

  mapped_label := public.finance_m2_legacy_unit_label(legacy_label, legacy_number);
  mapped_status := public.finance_m2_map_legacy_unit_status(legacy_occupancy);

  if exists (
    select 1
    from public.property_units existing
    where existing.property_id = p_property_id
      and existing.unit_label = mapped_label
      and existing.id is distinct from p_unit_id
  ) then
    raise exception 'ambiguous_unit:%', p_unit_id;
  end if;

  insert into public.property_units (
    id,
    organization_id,
    property_id,
    unit_label,
    status,
    created_at
  ) values (
    p_unit_id,
    p_organization_id,
    p_property_id,
    mapped_label,
    mapped_status,
    timezone('utc', now())
  );

  perform public.finance_m2_record_lineage(
    p_organization_id,
    'units',
    p_unit_id,
    'property_units',
    p_unit_id,
    'migrated'
  );

  return p_unit_id;
end;
$$;

create or replace function public.finance_m2_org_report(p_organization_id uuid)
returns jsonb
language plpgsql
stable
as $$
declare
  issues jsonb := '[]'::jsonb;
  issue record;
  org_name text;
  charge_count int;
  charge_total numeric;
  paid_total numeric;
  payment_count int;
  payment_total numeric;
  vendor_invoices int;
  vendor_payments int;
  vendor_total numeric;
  receipt_count int;
  customer_count int;
  leases_to_materialize int;
  residents_to_materialize int;
  existing_leases int;
  existing_residents int;
  units_to_materialize int;
  existing_units int;
  missing_units int := 0;
  unit_property_mismatches int := 0;
  unit_org_mismatches int := 0;
  missing_leases int := 0;
  missing_residents int := 0;
  target_conflicts int := 0;
  lineage_conflicts int := 0;
  currency_blockers int := 0;
  readiness text := 'READY';
  money_ok boolean;
begin
  if public.finance_m2_column_exists('organizations', 'name') then
    execute 'select name from public.organizations where id = $1'
      into org_name
      using p_organization_id;
  end if;

  select count(*), coalesce(sum(amount), 0), coalesce(sum(amount_paid), 0)
  into charge_count, charge_total, paid_total
  from public.rent_charges
  where organization_id = p_organization_id;

  select count(*), coalesce(sum(amount), 0)
  into payment_count, payment_total
  from public.payments
  where organization_id = p_organization_id;

  select count(*), coalesce(sum(amount), 0)
  into vendor_invoices, vendor_total
  from public.vendor_invoices
  where organization_id = p_organization_id;

  select count(*)
  into vendor_payments
  from public.vendor_payments
  where organization_id = p_organization_id;

  select count(*)
  into receipt_count
  from public.payment_receipts
  where organization_id = p_organization_id;

  select count(*)
  into customer_count
  from public.payment_customers
  where organization_id = p_organization_id;

  select count(*)
  into existing_leases
  from public.leases l
  join public.lease_agreements la on la.id = l.id
  where l.organization_id = p_organization_id
    and exists (
      select 1 from public.rent_charges rc where rc.lease_id = l.id
      union
      select 1 from public.payments p where p.lease_id = l.id
    );

  select count(*)
  into leases_to_materialize
  from public.leases l
  where l.organization_id = p_organization_id
    and exists (
      select 1 from public.rent_charges rc where rc.lease_id = l.id
      union
      select 1 from public.payments p where p.lease_id = l.id
    )
    and not exists (select 1 from public.lease_agreements la where la.id = l.id);

  select count(*)
  into existing_residents
  from public.tenants t
  join public.lease_residents lr on lr.id = t.id
  where t.organization_id = p_organization_id
    and exists (select 1 from public.rent_charges rc where rc.tenant_id = t.id);

  select count(*)
  into residents_to_materialize
  from public.tenants t
  where t.organization_id = p_organization_id
    and exists (select 1 from public.rent_charges rc where rc.tenant_id = t.id)
    and not exists (select 1 from public.lease_residents lr where lr.id = t.id);

  select count(*)
  into existing_units
  from public.rent_charges rc
  where rc.organization_id = p_organization_id
    and exists (
      select 1
      from public.property_units pu
      where pu.id = rc.unit_id
        and pu.organization_id = rc.organization_id
        and pu.property_id = rc.property_id
    );

  if public.finance_m2_relation_exists('units') then
    execute
      $q$
        select count(*)
        from public.rent_charges rc
        where rc.organization_id = $1
          and not exists (
            select 1 from public.property_units pu
            where pu.id = rc.unit_id
              and pu.organization_id = rc.organization_id
              and pu.property_id = rc.property_id
          )
          and exists (
            select 1 from public.units u
            where u.id = rc.unit_id
              and u.organization_id = rc.organization_id
              and u.property_id = rc.property_id
              and u.deleted_at is null
              and u.archived_at is null
          )
      $q$
      into units_to_materialize
      using p_organization_id;
  else
    units_to_materialize := 0;
  end if;

  for issue in
    select * from public.finance_m2_preflight(p_organization_id)
  loop
    issues := issues || jsonb_build_array(
      jsonb_build_object('code', issue.code, 'detail', issue.detail, 'severity', issue.severity)
    );
    if issue.code = 'missing_unit_for_resident' then
      missing_units := missing_units + 1;
    elsif issue.code = 'unit_property_mismatch' then
      unit_property_mismatches := unit_property_mismatches + 1;
    elsif issue.code = 'unit_org_mismatch' then
      unit_org_mismatches := unit_org_mismatches + 1;
    elsif issue.code = 'missing_july_lease' then
      missing_leases := missing_leases + 1;
    elsif issue.code = 'missing_july_tenant' then
      missing_residents := missing_residents + 1;
    elsif issue.code in ('conflicting_lineage', 'conflicting_canonical_unit') then
      lineage_conflicts := lineage_conflicts + 1;
    elsif issue.code in ('incompatible_canonical_lease', 'incompatible_canonical_resident') then
      target_conflicts := target_conflicts + 1;
    elsif issue.code = 'unsupported_currency' then
      currency_blockers := currency_blockers + 1;
    end if;
  end loop;

  money_ok := paid_total is not distinct from payment_total;
  if not money_ok then
    issues := issues || jsonb_build_array(
      jsonb_build_object(
        'code', 'money_reconciliation_mismatch',
        'detail', format('amount_paid %s payments %s', paid_total, payment_total),
        'severity', 'error'
      )
    );
  end if;

  if jsonb_array_length(issues) > 0 then
    readiness := 'BLOCKED';
  end if;

  return jsonb_build_object(
    'organization_id', p_organization_id,
    'organization_name', org_name,
    'readiness', readiness,
    'blockers', issues,
    'charges', jsonb_build_object('count', charge_count, 'total', charge_total, 'amount_paid', paid_total),
    'payments', jsonb_build_object('count', payment_count, 'total', payment_total),
    'allocations', jsonb_build_object('count', payment_count, 'amount', payment_total),
    'outstanding', charge_total - paid_total,
    'currency_provenance', public.finance_m2_currency_provenance('rent_charges'),
    'identity', jsonb_build_object(
      'leases_to_materialize', leases_to_materialize,
      'residents_to_materialize', residents_to_materialize,
      'units_to_materialize', units_to_materialize,
      'existing_canonical_leases', existing_leases,
      'existing_canonical_residents', existing_residents,
      'existing_canonical_units', existing_units,
      'missing_units', missing_units,
      'unit_property_mismatches', unit_property_mismatches,
      'unit_org_mismatches', unit_org_mismatches,
      'missing_leases', missing_leases,
      'missing_residents', missing_residents
    ),
    'vendor_ap', jsonb_build_object(
      'invoices', vendor_invoices,
      'payments', vendor_payments,
      'total', vendor_total
    ),
    'receipts', receipt_count,
    'customers', customer_count,
    'target_conflicts', target_conflicts,
    'lineage_conflicts', lineage_conflicts,
    'currency_blockers', currency_blockers,
    'reconciliation', jsonb_build_object('amount_paid_equals_payments', money_ok)
  );
end;
$$;

create or replace function public.finance_m2_backfill_org(p_organization_id uuid, p_dry_run boolean)
returns jsonb
language plpgsql
as $$
declare
  report jsonb;
  lease_row record;
  tenant_row record;
  charge_row record;
  payment_row record;
  receipt_row record;
  invoice_row record;
  vendor_pay_row record;
  customer_row record;
  mapped_type text;
  mapped_status text;
  mapped_method text;
  mapped_lease_status text;
  charge_status text;
  unit_ok uuid;
  display_name text;
  pm_id uuid;
  invoice_number text;
  receipt_number text;
  paid_at timestamptz;
  created_by uuid;
  charge_count int;
  payment_count int;
  allocation_count int;
  source_charge_count int;
  source_payment_count int;
  source_charge_total numeric;
  source_paid_total numeric;
  source_payment_total numeric;
  target_charge_total numeric;
  target_paid_total numeric;
  target_payment_total numeric;
  target_alloc_total numeric;
  outstanding numeric;
begin
  report := public.finance_m2_org_report(p_organization_id);
  report := report || jsonb_build_object('dry_run', p_dry_run);

  if p_dry_run then
    return report;
  end if;

  if (report ->> 'readiness') is distinct from 'READY' then
    raise exception '%:%',
      coalesce(report -> 'blockers' -> 0 ->> 'code', 'blocked'),
      coalesce(report -> 'blockers' -> 0 ->> 'detail', p_organization_id::text);
  end if;

  select count(*), coalesce(sum(amount), 0), coalesce(sum(amount_paid), 0)
  into source_charge_count, source_charge_total, source_paid_total
  from public.rent_charges
  where organization_id = p_organization_id;

  select count(*), coalesce(sum(amount), 0)
  into source_payment_count, source_payment_total
  from public.payments
  where organization_id = p_organization_id;

  if source_paid_total is distinct from source_payment_total then
    raise exception 'money_reconciliation_mismatch:amount_paid % payments %', source_paid_total, source_payment_total;
  end if;

  for lease_row in
    select distinct l.*
    from public.leases l
    where l.organization_id = p_organization_id
      and (
        exists (select 1 from public.rent_charges rc where rc.lease_id = l.id)
        or exists (select 1 from public.payments p where p.lease_id = l.id)
      )
  loop
    mapped_lease_status := public.finance_m2_map_lease_status(lease_row.status);
    if exists (select 1 from public.lease_agreements la where la.id = lease_row.id) then
      if exists (
        select 1
        from public.lease_agreements la
        where la.id = lease_row.id
          and (
            la.organization_id is distinct from lease_row.organization_id
            or la.property_id is distinct from lease_row.property_id
          )
      ) then
        raise exception 'incompatible_canonical_lease:%', lease_row.id;
      end if;
    else
      unit_ok := public.finance_m2_ensure_canonical_unit(
        lease_row.organization_id,
        lease_row.property_id,
        lease_row.unit_id
      );
      insert into public.lease_agreements (
        id,
        organization_id,
        property_id,
        unit_id,
        status,
        start_date,
        end_date,
        rent_amount,
        currency,
        require_manager_signature,
        rent_day_of_month,
        created_at,
        updated_at
      ) values (
        lease_row.id,
        lease_row.organization_id,
        lease_row.property_id,
        unit_ok,
        mapped_lease_status,
        lease_row.start_date,
        lease_row.end_date,
        lease_row.rent_amount,
        'USD',
        true,
        1,
        lease_row.created_at,
        lease_row.updated_at
      );
    end if;
    perform public.finance_m2_record_lineage(
      p_organization_id, 'leases', lease_row.id, 'lease_agreements', lease_row.id, 'migrated'
    );
  end loop;

  for tenant_row in
    select distinct t.*, rc.lease_id as finance_lease_id, rc.property_id as finance_property_id, rc.unit_id as finance_unit_id
    from public.tenants t
    join public.rent_charges rc on rc.tenant_id = t.id
    where t.organization_id = p_organization_id
  loop
    display_name := trim(both from concat_ws(' ', tenant_row.first_name, tenant_row.last_name));
    if display_name = '' then
      display_name := coalesce(tenant_row.email, 'July resident');
    end if;

    if exists (select 1 from public.lease_residents lr where lr.id = tenant_row.id) then
      if exists (
        select 1
        from public.lease_residents lr
        where lr.id = tenant_row.id
          and lr.organization_id is distinct from tenant_row.organization_id
      ) then
        raise exception 'incompatible_canonical_resident:%', tenant_row.id;
      end if;
    else
      insert into public.lease_residents (
        id,
        organization_id,
        lease_id,
        user_id,
        display_name,
        email,
        is_primary,
        financial_status,
        created_at
      ) values (
        tenant_row.id,
        tenant_row.organization_id,
        tenant_row.finance_lease_id,
        tenant_row.user_id,
        display_name,
        tenant_row.email,
        true,
        'current',
        tenant_row.created_at
      );
    end if;
    perform public.finance_m2_record_lineage(
      p_organization_id, 'tenants', tenant_row.id, 'lease_residents', tenant_row.id, 'migrated'
    );

    select id into pm_id
    from public.pm_residents
    where organization_id = tenant_row.organization_id
      and lower(email) = lower(tenant_row.email)
    limit 1;

    if pm_id is null and exists (select 1 from public.pm_residents pr where pr.id = tenant_row.id) then
      if exists (
        select 1
        from public.pm_residents pr
        where pr.id = tenant_row.id
          and pr.organization_id is distinct from tenant_row.organization_id
      ) then
        raise exception 'incompatible_canonical_resident:%', tenant_row.id;
      end if;
      pm_id := tenant_row.id;
    elsif pm_id is null then
      unit_ok := public.finance_m2_ensure_canonical_unit(
        tenant_row.organization_id,
        tenant_row.finance_property_id,
        coalesce(tenant_row.finance_unit_id, tenant_row.unit_id)
      );
      insert into public.pm_residents (
        id,
        organization_id,
        property_id,
        unit_id,
        first_name,
        last_name,
        display_name,
        email,
        phone,
        status,
        portal_status,
        user_id,
        lease_id,
        created_at,
        updated_at
      ) values (
        tenant_row.id,
        tenant_row.organization_id,
        tenant_row.finance_property_id,
        unit_ok,
        tenant_row.first_name,
        tenant_row.last_name,
        display_name,
        tenant_row.email,
        tenant_row.phone,
        'active',
        'pending_activation',
        tenant_row.user_id,
        tenant_row.finance_lease_id,
        tenant_row.created_at,
        tenant_row.updated_at
      );
      pm_id := tenant_row.id;
    end if;

    update public.lease_agreements
    set resident_id = pm_id
    where id = tenant_row.finance_lease_id
      and resident_id is null;

    perform public.finance_m2_record_lineage(
      p_organization_id, 'tenants', tenant_row.id, 'pm_residents', pm_id, 'migrated'
    );
  end loop;

  for charge_row in
    select * from public.rent_charges where organization_id = p_organization_id
  loop
    mapped_type := public.finance_m2_map_charge_type(charge_row.charge_type);
    mapped_status := public.finance_m2_map_charge_status(charge_row.status, charge_row.amount_paid);
    if charge_row.deleted_at is not null then
      mapped_status := 'void';
    end if;
    created_by := null;
    if exists (select 1 from auth.users u where u.id = charge_row.created_by) then
      created_by := charge_row.created_by;
    end if;
    unit_ok := public.finance_m2_ensure_canonical_unit(
      charge_row.organization_id,
      charge_row.property_id,
      charge_row.unit_id
    );

    if exists (select 1 from public.financial_charges fc where fc.id = charge_row.id) then
      if exists (
        select 1
        from public.financial_charges fc
        where fc.id = charge_row.id
          and fc.organization_id is distinct from charge_row.organization_id
      ) then
        raise exception 'conflicting_lineage:rent_charges:%:financial_charges', charge_row.id;
      end if;
    else
      insert into public.financial_charges (
        id,
        organization_id,
        property_id,
        unit_id,
        lease_id,
        resident_id,
        schedule_id,
        charge_type,
        label,
        memo,
        amount,
        amount_paid,
        currency,
        status,
        due_at,
        period_start,
        period_end,
        created_by,
        voided_at,
        void_reason,
        created_at,
        updated_at
      ) values (
        charge_row.id,
        charge_row.organization_id,
        charge_row.property_id,
        unit_ok,
        charge_row.lease_id,
        charge_row.tenant_id,
        null,
        mapped_type,
        coalesce(nullif(charge_row.description, ''), charge_row.charge_number),
        charge_row.charge_number,
        charge_row.amount,
        charge_row.amount_paid,
        public.finance_m2_source_currency('rent_charges', charge_row.id),
        mapped_status,
        charge_row.due_date,
        charge_row.period_start,
        charge_row.period_end,
        created_by,
        charge_row.deleted_at,
        case when charge_row.deleted_at is not null then 'july_soft_delete' end,
        charge_row.created_at,
        charge_row.updated_at
      );
    end if;

    perform public.finance_m2_record_lineage(
      p_organization_id, 'rent_charges', charge_row.id, 'financial_charges', charge_row.id, 'migrated'
    );

    insert into public.financial_ledger_entries (
      organization_id,
      property_id,
      lease_id,
      resident_id,
      entry_type,
      direction,
      amount,
      currency,
      source_type,
      source_id,
      description,
      idempotency_key,
      occurred_at,
      created_by
    ) values (
      charge_row.organization_id,
      charge_row.property_id,
      charge_row.lease_id,
      charge_row.tenant_id,
      'charge',
      'debit',
      charge_row.amount,
      public.finance_m2_source_currency('rent_charges', charge_row.id),
      'rent_charges',
      charge_row.id,
      charge_row.description,
      'july-charge:' || charge_row.id::text,
      charge_row.created_at,
      created_by
    )
    on conflict (organization_id, idempotency_key) do nothing;

    perform public.finance_m2_record_lineage(
      p_organization_id, 'rent_charges', charge_row.id, 'financial_ledger_entries', charge_row.id, 'migrated'
    );
  end loop;

  for payment_row in
    select * from public.payments where organization_id = p_organization_id
  loop
    mapped_method := public.finance_m2_map_payment_method(payment_row.payment_method, payment_row.metadata);
    created_by := null;
    if exists (select 1 from auth.users u where u.id = payment_row.created_by) then
      created_by := payment_row.created_by;
    end if;
    paid_at := (payment_row.payment_date::timestamp at time zone 'utc');

    if exists (select 1 from public.financial_payments fp where fp.id = payment_row.id) then
      if exists (
        select 1
        from public.financial_payments fp
        where fp.id = payment_row.id
          and fp.organization_id is distinct from payment_row.organization_id
      ) then
        raise exception 'conflicting_lineage:payments:%:financial_payments', payment_row.id;
      end if;
    else
      insert into public.financial_payments (
        id,
        organization_id,
        property_id,
        lease_id,
        resident_id,
        amount,
        currency,
        status,
        method,
        stripe_checkout_session_id,
        stripe_payment_intent_id,
        recorded_by,
        paid_at,
        created_at,
        updated_at
      ) values (
        payment_row.id,
        payment_row.organization_id,
        payment_row.property_id,
        payment_row.lease_id,
        payment_row.tenant_id,
        payment_row.amount,
        public.finance_m2_source_currency('payments', payment_row.id),
        'succeeded',
        mapped_method,
        null,
        null,
        created_by,
        paid_at,
        payment_row.created_at,
        payment_row.updated_at
      );
    end if;

    perform public.finance_m2_record_lineage(
      p_organization_id, 'payments', payment_row.id, 'financial_payments', payment_row.id, 'migrated'
    );

    if exists (
      select 1
      from public.financial_payment_allocations a
      where a.payment_id = payment_row.id
        and a.charge_id = payment_row.rent_charge_id
        and a.amount is distinct from payment_row.amount
    ) then
      raise exception 'duplicate_payment_allocation:%', payment_row.id;
    end if;

    insert into public.financial_payment_allocations (
      organization_id,
      payment_id,
      charge_id,
      amount
    ) values (
      payment_row.organization_id,
      payment_row.id,
      payment_row.rent_charge_id,
      payment_row.amount
    )
    on conflict (payment_id, charge_id) do nothing;

    perform public.finance_m2_record_lineage(
      p_organization_id, 'payments', payment_row.id, 'financial_payment_allocations', payment_row.rent_charge_id, 'migrated'
    );

    insert into public.financial_ledger_entries (
      organization_id,
      property_id,
      lease_id,
      resident_id,
      entry_type,
      direction,
      amount,
      currency,
      source_type,
      source_id,
      description,
      idempotency_key,
      occurred_at,
      created_by
    ) values (
      payment_row.organization_id,
      payment_row.property_id,
      payment_row.lease_id,
      payment_row.tenant_id,
      'payment',
      'credit',
      payment_row.amount,
      public.finance_m2_source_currency('payments', payment_row.id),
      'payments',
      payment_row.id,
      'July payment ' || payment_row.payment_number,
      'july-payment:' || payment_row.id::text,
      paid_at,
      created_by
    )
    on conflict (organization_id, idempotency_key) do nothing;

    insert into public.financial_ledger_entries (
      organization_id,
      property_id,
      lease_id,
      resident_id,
      entry_type,
      direction,
      amount,
      currency,
      source_type,
      source_id,
      description,
      idempotency_key,
      occurred_at,
      created_by
    ) values (
      payment_row.organization_id,
      payment_row.property_id,
      payment_row.lease_id,
      payment_row.tenant_id,
      'allocation',
      'debit',
      payment_row.amount,
      public.finance_m2_source_currency('payments', payment_row.id),
      'payments',
      payment_row.id,
      'July allocation',
      'july-allocation:' || payment_row.id::text || ':' || payment_row.rent_charge_id::text,
      paid_at,
      created_by
    )
    on conflict (organization_id, idempotency_key) do nothing;

    perform public.finance_m2_record_lineage(
      p_organization_id, 'payments', payment_row.id, 'financial_ledger_entries', payment_row.id, 'migrated'
    );
  end loop;

  for receipt_row in
    select * from public.payment_receipts where organization_id = p_organization_id
  loop
    if receipt_row.payment_id is null
      or not exists (select 1 from public.financial_payments fp where fp.id = receipt_row.payment_id) then
      perform public.finance_m2_record_lineage(
        p_organization_id,
        'payment_receipts',
        receipt_row.id,
        'unmapped_payment_receipt',
        receipt_row.id,
        'skipped',
        'parent_payment_not_migrated'
      );
      continue;
    end if;
    receipt_number := receipt_row.receipt_number;
    if exists (
      select 1
      from public.financial_receipts fr
      where fr.id = receipt_row.id
         or fr.payment_id = receipt_row.payment_id
    ) then
      perform public.finance_m2_record_lineage(
        p_organization_id, 'payment_receipts', receipt_row.id, 'financial_receipts', receipt_row.id, 'migrated'
      );
      continue;
    end if;
    insert into public.financial_receipts (
      id,
      organization_id,
      payment_id,
      lease_id,
      resident_id,
      receipt_number,
      amount,
      currency,
      issued_at,
      payload
    ) values (
      receipt_row.id,
      receipt_row.organization_id,
      receipt_row.payment_id,
      coalesce(
        receipt_row.lease_id,
        (select fp.lease_id from public.financial_payments fp where fp.id = receipt_row.payment_id)
      ),
      coalesce(
        receipt_row.tenant_id,
        (select fp.resident_id from public.financial_payments fp where fp.id = receipt_row.payment_id)
      ),
      receipt_number,
      receipt_row.amount,
      coalesce(nullif(receipt_row.currency, ''), 'USD'),
      receipt_row.issued_at,
      receipt_row.payload
    );
    perform public.finance_m2_record_lineage(
      p_organization_id, 'payment_receipts', receipt_row.id, 'financial_receipts', receipt_row.id, 'migrated'
    );
  end loop;

  for customer_row in
    select * from public.payment_customers where organization_id = p_organization_id
  loop
    if public.finance_m2_usable_stripe_customer_id(customer_row.external_customer_id) then
      perform public.finance_m2_record_lineage(
        p_organization_id,
        'payment_customers',
        customer_row.id,
        'mapped_stripe_customer_metadata',
        customer_row.id,
        'migrated'
      );
    else
      perform public.finance_m2_record_lineage(
        p_organization_id,
        'payment_customers',
        customer_row.id,
        'unmapped_payment_customer',
        customer_row.id,
        'skipped',
        'no_valid_stripe_customer_id'
      );
    end if;
  end loop;

  for invoice_row in
    select * from public.vendor_invoices where organization_id = p_organization_id
  loop
    invoice_number := coalesce(nullif(invoice_row.invoice_number, ''), 'july-' || invoice_row.id::text);
    created_by := null;
    if invoice_row.reviewed_by is not null
      and exists (select 1 from auth.users u where u.id = invoice_row.reviewed_by) then
      created_by := invoice_row.reviewed_by;
    end if;
    if not exists (select 1 from public.financial_vendor_invoices fvi where fvi.id = invoice_row.id) then
      insert into public.financial_vendor_invoices (
        id,
        organization_id,
        property_id,
        vendor_id,
        work_order_id,
        invoice_number,
        description,
        amount,
        currency,
        status,
        submitted_at,
        reviewed_by,
        reviewed_at,
        paid_at,
        created_at,
        updated_at
      ) values (
        invoice_row.id,
        invoice_row.organization_id,
        invoice_row.property_id,
        invoice_row.vendor_id,
        invoice_row.work_order_id,
        invoice_number,
        invoice_row.notes,
        invoice_row.amount,
        coalesce(nullif(invoice_row.currency, ''), 'USD'),
        'paid',
        invoice_row.submitted_at,
        created_by,
        invoice_row.reviewed_at,
        invoice_row.reviewed_at,
        invoice_row.created_at,
        invoice_row.updated_at
      );
    end if;
    perform public.finance_m2_record_lineage(
      p_organization_id, 'vendor_invoices', invoice_row.id, 'financial_vendor_invoices', invoice_row.id, 'migrated'
    );
    perform public.finance_m2_record_lineage(
      p_organization_id, 'vendor_invoices', invoice_row.id, 'financial_ledger_entries', invoice_row.id, 'migrated'
    );
    insert into public.financial_ledger_entries (
      organization_id,
      property_id,
      entry_type,
      direction,
      amount,
      currency,
      source_type,
      source_id,
      description,
      idempotency_key,
      occurred_at
    ) values (
      invoice_row.organization_id,
      invoice_row.property_id,
      'charge',
      'debit',
      invoice_row.amount,
      coalesce(nullif(invoice_row.currency, ''), 'USD'),
      'vendor_invoices',
      invoice_row.id,
      coalesce(invoice_number, 'July vendor invoice'),
      'july-vendor-invoice:' || invoice_row.id::text,
      invoice_row.submitted_at
    )
    on conflict (organization_id, idempotency_key) do nothing;
  end loop;

  for vendor_pay_row in
    select * from public.vendor_payments where organization_id = p_organization_id
  loop
    mapped_method := case
      when vendor_pay_row.payment_method = 'check' then 'manual_check'
      when vendor_pay_row.payment_method in ('manual', 'card') then 'manual_other'
      when vendor_pay_row.payment_method in ('manual_check', 'manual_ach', 'manual_other', 'online_stripe')
        then vendor_pay_row.payment_method
      else 'manual_other'
    end;
    created_by := null;
    if exists (select 1 from auth.users u where u.id = vendor_pay_row.recorded_by) then
      created_by := vendor_pay_row.recorded_by;
    end if;
    if not exists (select 1 from public.financial_vendor_payments fvp where fvp.id = vendor_pay_row.id) then
      insert into public.financial_vendor_payments (
        id,
        organization_id,
        vendor_id,
        invoice_id,
        property_id,
        amount,
        currency,
        status,
        method,
        scheduled_for,
        paid_at,
        recorded_by,
        memo,
        created_at,
        updated_at
      ) values (
        vendor_pay_row.id,
        vendor_pay_row.organization_id,
        vendor_pay_row.vendor_id,
        vendor_pay_row.invoice_id,
        vendor_pay_row.property_id,
        vendor_pay_row.amount,
        coalesce(nullif(vendor_pay_row.currency, ''), 'USD'),
        'paid',
        mapped_method,
        vendor_pay_row.paid_at,
        vendor_pay_row.paid_at::timestamp at time zone 'utc',
        created_by,
        vendor_pay_row.notes,
        vendor_pay_row.created_at,
        vendor_pay_row.updated_at
      );
    end if;
    perform public.finance_m2_record_lineage(
      p_organization_id, 'vendor_payments', vendor_pay_row.id, 'financial_vendor_payments', vendor_pay_row.id, 'migrated'
    );
    perform public.finance_m2_record_lineage(
      p_organization_id, 'vendor_payments', vendor_pay_row.id, 'financial_ledger_entries', vendor_pay_row.id, 'migrated'
    );
    insert into public.financial_ledger_entries (
      organization_id,
      property_id,
      entry_type,
      direction,
      amount,
      currency,
      source_type,
      source_id,
      description,
      idempotency_key,
      occurred_at,
      created_by
    ) values (
      vendor_pay_row.organization_id,
      vendor_pay_row.property_id,
      'payment',
      'credit',
      vendor_pay_row.amount,
      coalesce(nullif(vendor_pay_row.currency, ''), 'USD'),
      'vendor_payments',
      vendor_pay_row.id,
      'July vendor payment',
      'july-vendor-payment:' || vendor_pay_row.id::text,
      vendor_pay_row.paid_at::timestamp at time zone 'utc',
      created_by
    )
    on conflict (organization_id, idempotency_key) do nothing;
  end loop;

  select count(*), coalesce(sum(amount), 0), coalesce(sum(amount_paid), 0)
  into charge_count, target_charge_total, target_paid_total
  from public.financial_charges
  where organization_id = p_organization_id;

  select count(*), coalesce(sum(amount), 0)
  into payment_count, target_payment_total
  from public.financial_payments
  where organization_id = p_organization_id;

  select count(*), coalesce(sum(amount), 0)
  into allocation_count, target_alloc_total
  from public.financial_payment_allocations
  where organization_id = p_organization_id;

  if charge_count is distinct from source_charge_count
    or payment_count is distinct from source_payment_count
    or target_charge_total is distinct from source_charge_total
    or target_paid_total is distinct from source_paid_total
    or target_payment_total is distinct from source_payment_total
    or target_alloc_total is distinct from source_payment_total
  then
    raise exception 'money_reconciliation_mismatch';
  end if;

  outstanding := target_charge_total - target_paid_total;

  return report || jsonb_build_object(
    'dry_run', false,
    'readiness', 'READY',
    'charges', jsonb_build_object('count', charge_count, 'total', target_charge_total, 'amount_paid', target_paid_total),
    'payments', jsonb_build_object('count', payment_count, 'total', target_payment_total),
    'allocations', jsonb_build_object('count', allocation_count, 'amount', target_alloc_total),
    'outstanding', outstanding
  );
end;
$$;

create or replace function public.finance_m2_seed_entitled_settings()
returns integer
language plpgsql
as $$
declare
  org_row record;
  n int := 0;
begin
  for org_row in
    select s.organization_id
    from public.organization_subscriptions s
    where s.status = 'active'
      and s.sku_code in ('mpa_property_manager', 'mpa_complete_platform')
  loop
    insert into public.financial_module_settings (
      organization_id,
      foundation_enabled,
      charges_enabled,
      payments_enabled,
      late_fees_enabled,
      vendor_invoices_enabled,
      vendor_payments_enabled,
      reports_enabled,
      stripe_payment_execution_enabled
    ) values (
      org_row.organization_id,
      true,
      true,
      true,
      false,
      true,
      true,
      false,
      false
    )
    on conflict (organization_id) do nothing;

    insert into public.financial_connect_accounts (
      organization_id,
      stripe_account_id,
      status,
      charges_enabled,
      payouts_enabled
    ) values (
      org_row.organization_id,
      null,
      'not_started',
      false,
      false
    )
    on conflict (organization_id) do nothing;

    n := n + 1;
  end loop;
  return n;
end;
$$;

create or replace function public.finance_m2_run(p_dry_run boolean default true, p_organization_id uuid default null)
returns jsonb
language plpgsql
as $$
declare
  org_id uuid;
  org_result jsonb;
  results jsonb := '[]'::jsonb;
  failures jsonb := '[]'::jsonb;
begin
  if p_organization_id is not null then
    begin
      org_result := public.finance_m2_backfill_org(p_organization_id, p_dry_run);
      results := results || jsonb_build_array(org_result);
      if not p_dry_run then
        perform public.finance_m2_record_lineage(
          p_organization_id,
          'm2_run',
          p_organization_id,
          'organization',
          p_organization_id,
          'migrated',
          null
        );
      end if;
    exception
      when others then
        if not p_dry_run then
          perform public.finance_m2_record_lineage(
            p_organization_id,
            'm2_run',
            p_organization_id,
            'organization',
            p_organization_id,
            'failed',
            sqlerrm
          );
        end if;
        failures := failures || jsonb_build_array(
          jsonb_build_object('organization_id', p_organization_id, 'error', sqlerrm)
        );
    end;
  else
    for org_id in
      select distinct organization_id
      from (
        select organization_id from public.rent_charges
        union
        select organization_id from public.payments
        union
        select organization_id from public.vendor_invoices
      ) orgs
    loop
      begin
        org_result := public.finance_m2_backfill_org(org_id, p_dry_run);
        results := results || jsonb_build_array(org_result);
        if not p_dry_run then
          perform public.finance_m2_record_lineage(
            org_id, 'm2_run', org_id, 'organization', org_id, 'migrated', null
          );
        end if;
      exception
        when others then
          if not p_dry_run then
            perform public.finance_m2_record_lineage(
              org_id, 'm2_run', org_id, 'organization', org_id, 'failed', sqlerrm
            );
          end if;
          failures := failures || jsonb_build_array(
            jsonb_build_object('organization_id', org_id, 'error', sqlerrm)
          );
      end;
    end loop;
  end if;

  if not p_dry_run then
    perform public.finance_m2_seed_entitled_settings();
  end if;

  return jsonb_build_object(
    'version', public.finance_m2_version(),
    'dry_run', p_dry_run,
    'organizations', results,
    'failures', failures,
    'ready_count', (
      select count(*)
      from jsonb_array_elements(results) org
      where org ->> 'readiness' = 'READY'
    ),
    'blocked_count', (
      select count(*)
      from jsonb_array_elements(results) org
      where org ->> 'readiness' = 'BLOCKED'
    )
  );
end;
$$;

create or replace function public.finance_m2_reconcile()
returns jsonb
language sql
stable
as $$
  select jsonb_build_object(
    'source_charges', (select count(*) from public.rent_charges),
    'source_charge_total', (select coalesce(sum(amount), 0) from public.rent_charges),
    'source_amount_paid', (select coalesce(sum(amount_paid), 0) from public.rent_charges),
    'source_payments', (select count(*) from public.payments),
    'source_payment_total', (select coalesce(sum(amount), 0) from public.payments),
    'target_charges', (select count(*) from public.financial_charges),
    'target_charge_total', (select coalesce(sum(amount), 0) from public.financial_charges),
    'target_amount_paid', (select coalesce(sum(amount_paid), 0) from public.financial_charges),
    'target_payments', (select count(*) from public.financial_payments),
    'target_payment_total', (select coalesce(sum(amount), 0) from public.financial_payments),
    'target_allocations', (select count(*) from public.financial_payment_allocations),
    'target_allocation_total', (select coalesce(sum(amount), 0) from public.financial_payment_allocations),
    'outstanding', (
      select coalesce(sum(amount - amount_paid), 0)
      from public.financial_charges
      where status is distinct from 'void'
    ),
    'vendor_invoices', (select count(*) from public.financial_vendor_invoices),
    'vendor_payments', (select count(*) from public.financial_vendor_payments),
    'vendor_invoice_total', (select coalesce(sum(amount), 0) from public.financial_vendor_invoices),
    'vendor_payment_total', (select coalesce(sum(amount), 0) from public.financial_vendor_payments),
    'late_fee_policies', (select count(*) from public.financial_late_fee_policies),
    'delinquency_cases', (select count(*) from public.financial_delinquency_cases),
    'arrangements', (select count(*) from public.financial_payment_arrangements),
    'stripe_webhook_events', (select count(*) from public.financial_stripe_webhook_events),
    'july_expenses', (select count(*) from public.expenses),
    'july_owner_statements', (select count(*) from public.owner_statements),
    'july_activity', (select count(*) from public.financial_activity),
    'july_billing_ledger', (select count(*) from public.billing_ledger_entries)
  );
$$;

create or replace function public.finance_m2_july_fingerprint()
returns jsonb
language sql
stable
as $$
  select jsonb_build_object(
    'rent_charges', (
      select coalesce(md5(string_agg(id::text || ':' || amount::text || ':' || amount_paid::text || ':' || status, ',' order by id)), '')
      from public.rent_charges
    ),
    'payments', (
      select coalesce(md5(string_agg(id::text || ':' || amount::text || ':' || status || ':' || payment_method, ',' order by id)), '')
      from public.payments
    ),
    'vendor_invoices', (
      select coalesce(md5(string_agg(id::text || ':' || amount::text, ',' order by id)), '')
      from public.vendor_invoices
    ),
    'vendor_payments', (
      select coalesce(md5(string_agg(id::text || ':' || amount::text, ',' order by id)), '')
      from public.vendor_payments
    ),
    'billing_ledger_entries', (
      select coalesce(md5(string_agg(id::text, ',' order by id)), '')
      from public.billing_ledger_entries
    ),
    'financial_activity', (
      select coalesce(md5(string_agg(id::text, ',' order by id)), '')
      from public.financial_activity
    ),
    'expenses', (
      select coalesce(md5(string_agg(id::text, ',' order by id)), '')
      from public.expenses
    ),
    'owner_statements', (
      select coalesce(md5(string_agg(id::text, ',' order by id)), '')
      from public.owner_statements
    ),
    'payment_receipts', (
      select coalesce(md5(string_agg(id::text, ',' order by id)), '')
      from public.payment_receipts
    ),
    'payment_customers', (
      select coalesce(md5(string_agg(id::text, ',' order by id)), '')
      from public.payment_customers
    )
  );
$$;

revoke all on function public.finance_m2_version() from public, anon, authenticated;
revoke all on function public.finance_m2_map_charge_type(text) from public, anon, authenticated;
revoke all on function public.finance_m2_map_charge_status(text, numeric) from public, anon, authenticated;
revoke all on function public.finance_m2_has_stripe_identity(jsonb) from public, anon, authenticated;
revoke all on function public.finance_m2_map_payment_method(text, jsonb) from public, anon, authenticated;
revoke all on function public.finance_m2_map_lease_status(text) from public, anon, authenticated;
revoke all on function public.finance_m2_usable_stripe_customer_id(text) from public, anon, authenticated;
revoke all on function public.finance_m2_relation_exists(text) from public, anon, authenticated;
revoke all on function public.finance_m2_column_exists(text, text) from public, anon, authenticated;
revoke all on function public.finance_m2_normalize_currency(text) from public, anon, authenticated;
revoke all on function public.finance_m2_source_currency(text, uuid) from public, anon, authenticated;
revoke all on function public.finance_m2_currency_provenance(text) from public, anon, authenticated;
revoke all on function public.finance_m2_legacy_unit_label(text, text) from public, anon, authenticated;
revoke all on function public.finance_m2_map_legacy_unit_status(text) from public, anon, authenticated;
revoke all on function public.finance_m2_record_lineage(uuid, text, uuid, text, uuid, text, text) from public, anon, authenticated;
revoke all on function public.finance_m2_ensure_canonical_unit(uuid, uuid, uuid) from public, anon, authenticated;
revoke all on function public.finance_m2_org_report(uuid) from public, anon, authenticated;
revoke all on function public.finance_m2_preflight(uuid) from public, anon, authenticated;
revoke all on function public.finance_m2_backfill_org(uuid, boolean) from public, anon, authenticated;
revoke all on function public.finance_m2_seed_entitled_settings() from public, anon, authenticated;
revoke all on function public.finance_m2_run(boolean, uuid) from public, anon, authenticated;
revoke all on function public.finance_m2_reconcile() from public, anon, authenticated;
revoke all on function public.finance_m2_july_fingerprint() from public, anon, authenticated;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function public.finance_m2_version() to service_role;
    grant execute on function public.finance_m2_preflight(uuid) to service_role;
    grant execute on function public.finance_m2_org_report(uuid) to service_role;
    grant execute on function public.finance_m2_run(boolean, uuid) to service_role;
    grant execute on function public.finance_m2_reconcile() to service_role;
    grant execute on function public.finance_m2_july_fingerprint() to service_role;
  end if;
end $$;
