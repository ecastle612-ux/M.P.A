-- docs/152 FIN-OPS M2D — M.P.A. Development identity-only unit_id repair
-- Owner-approved synthetic/demo map. Not recovered historical occupancy.
--
-- This file INSTALLS the trusted repair mechanism. It does NOT mutate
-- Production. Do not apply this file to mpa-prod without a later Owner
-- authorization. Do not call finance_m2_run(false).
--
-- Scope: eight Development seed identities only.
-- Updates unit_id only on rent_charges, leases, tenants, and payments
-- (payments only when the column exists).
-- Does not change property_id, organization_id, or money fields.
-- Cameron Lopez / Harbor 003 / 2649465e-… remains OPTION_B_PROVEN and is
-- not repaired here.
--
-- Execution identity: postgres / service_role only.
-- No anon / authenticated EXECUTE.
-- No security definer.

create or replace function public.finance_m2d_version()
returns text
language sql
immutable
as $$
  select 'docs_152_m2d_owner_unit_map';
$$;

create or replace function public.finance_m2d_development_org_id()
returns uuid
language sql
immutable
as $$
  select 'f8232926-149d-46b3-829f-c84b55378718'::uuid;
$$;

create or replace function public.finance_m2d_option_b_unit_id()
returns uuid
language sql
immutable
as $$
  select '2649465e-1894-4c19-b699-457c8570a7f3'::uuid;
$$;

create or replace function public.finance_m2d_approved_map()
returns table (
  resident_name text,
  charge_id uuid,
  lease_id uuid,
  tenant_id uuid,
  property_id uuid,
  current_unit_id uuid,
  new_unit_id uuid,
  new_unit_number text
)
language sql
immutable
as $$
  select *
  from (
    values
      (
        'Reese Kim',
        'de460536-d3c9-45c6-bfcd-4f14c42f3991'::uuid,
        '0c4f5b19-7d0b-41e2-ae23-bb692273a4f0'::uuid,
        'c88f5430-3dfb-4712-8731-47f43f315950'::uuid,
        '737977ae-1f08-4e4e-8368-545e91f05fac'::uuid,
        '03dc55de-6395-41cf-b187-e36e18e2d307'::uuid,
        'a8259856-39aa-42f4-9db3-43870243f790'::uuid,
        '002'
      ),
      (
        'Riley Foster',
        '888c5d4b-d3e1-4e30-9d7b-397baa6f8e7e'::uuid,
        'e0596f95-99ca-48c8-be94-16b19eb329b4'::uuid,
        'fc9b6cec-3f1f-4f17-9d31-ca07061899ac'::uuid,
        'd22cb503-eebf-436f-906d-503fe61207a4'::uuid,
        '9e345d47-1d11-4d5c-b4ff-164cfaf81eb0'::uuid,
        '6c1cb9e3-fb36-474a-b600-ba13f7258dc2'::uuid,
        '001'
      ),
      (
        'Jordan Chen',
        'c38053b1-621f-49bb-a2fb-33d621279ff5'::uuid,
        'dcf2faa2-16bc-4bad-83da-5b05d84aba90'::uuid,
        'b17e92f9-52ee-4a15-bb58-2a2da488decd'::uuid,
        'd22cb503-eebf-436f-906d-503fe61207a4'::uuid,
        'a8259856-39aa-42f4-9db3-43870243f790'::uuid,
        '03dc55de-6395-41cf-b187-e36e18e2d307'::uuid,
        '002'
      ),
      (
        'Hayden Ibrahim',
        'daa44657-291b-4e76-a7c5-a1a312ad647a'::uuid,
        '78af7e29-629b-478a-bd3f-e249b8ba865e'::uuid,
        '7ffbf72c-0c65-4c6c-aa32-e21fd8de8d7a'::uuid,
        'd22cb503-eebf-436f-906d-503fe61207a4'::uuid,
        '61ddf528-832d-4730-b788-249344f4c9fb'::uuid,
        'e24d173b-bd7b-4b20-97f2-cc83d146d34e'::uuid,
        '004'
      ),
      (
        'Dakota Martin',
        '5fada492-d95f-492c-b612-8126fcf63cc9'::uuid,
        '085aff65-15dc-4753-b560-5eec2b1fd10e'::uuid,
        '3153d61e-5784-4fe8-b962-c70a4149e7be'::uuid,
        '5ea87ad9-0d9b-4af3-9775-e02f8e3ac25a'::uuid,
        'e24d173b-bd7b-4b20-97f2-cc83d146d34e'::uuid,
        '261524d5-c2d6-4d4b-9149-8b86ac3b5633'::uuid,
        '003'
      ),
      (
        'Taylor Diaz',
        '6405eeca-afba-42e7-a077-ceccec85b6bd'::uuid,
        '35e5bda1-a404-4823-9b16-aa84c92a35c5'::uuid,
        'ce8d6c0b-5128-44e9-bb8e-b5dc0772c68c'::uuid,
        '5ea87ad9-0d9b-4af3-9775-e02f8e3ac25a'::uuid,
        '93033440-87eb-4919-93b8-c8b4b09b6f69'::uuid,
        'a87fb591-d655-4a85-9b65-e9788337417f'::uuid,
        '004'
      ),
      (
        'Parker Johnson',
        'ca4288cb-ebe9-4a8d-b7e3-5a8ba6f96fdc'::uuid,
        'ff4e7e91-b26d-407a-a94e-e7b71c4c8fad'::uuid,
        '51b047bb-3d55-4516-ad82-399c027dda03'::uuid,
        '5ea87ad9-0d9b-4af3-9775-e02f8e3ac25a'::uuid,
        '6c1cb9e3-fb36-474a-b600-ba13f7258dc2'::uuid,
        'd2c1a9ed-a555-437b-90c5-032a0e2da3de'::uuid,
        '005'
      ),
      (
        'Casey Garcia',
        'd4fadeac-adf8-4ba0-a84a-76c9a9b41633'::uuid,
        'e348d409-be75-465e-bdba-8d1168a0de74'::uuid,
        '281486d5-cfed-4ce9-bba4-4667401fd559'::uuid,
        '5ea87ad9-0d9b-4af3-9775-e02f8e3ac25a'::uuid,
        '8f02b5b5-1935-4a84-8d28-237dcbabd38e'::uuid,
        'ef390c04-4586-430c-96fe-25b3df117f04'::uuid,
        '006'
      )
  ) as t(
    resident_name,
    charge_id,
    lease_id,
    tenant_id,
    property_id,
    current_unit_id,
    new_unit_id,
    new_unit_number
  );
$$;

create or replace function public.finance_m2d_development_money()
returns jsonb
language sql
stable
as $$
  select jsonb_build_object(
    'charges', (select count(*) from public.rent_charges where organization_id = public.finance_m2d_development_org_id()),
    'gross', (select coalesce(sum(amount), 0) from public.rent_charges where organization_id = public.finance_m2d_development_org_id()),
    'paid', (select coalesce(sum(amount_paid), 0) from public.rent_charges where organization_id = public.finance_m2d_development_org_id()),
    'payments', (select count(*) from public.payments where organization_id = public.finance_m2d_development_org_id()),
    'outstanding', (
      select coalesce(sum(amount - amount_paid), 0)
      from public.rent_charges
      where organization_id = public.finance_m2d_development_org_id()
    )
  );
$$;

create or replace function public.finance_m2d_record_audit(
  p_run_id uuid,
  p_source_table text,
  p_source_id uuid,
  p_old_unit_id uuid,
  p_new_unit_id uuid,
  p_property_id uuid,
  p_unit_number text,
  p_resident_name text
)
returns void
language plpgsql
as $$
declare
  existing record;
  payload text;
begin
  payload := jsonb_build_object(
    'kind', 'm2d_unit_id_repair',
    'resident', p_resident_name,
    'table', p_source_table,
    'row_id', p_source_id,
    'old_unit_id', p_old_unit_id,
    'new_unit_id', p_new_unit_id,
    'property_id', p_property_id,
    'unit_number', p_unit_number,
    'owner_decision', 'docs/152',
    'run_id', p_run_id
  )::text;

  select *
  into existing
  from public.finance_lineage_map
  where source_table = p_source_table
    and source_id = p_source_id
    and target_table = 'm2d_unit_repair';

  if found then
    if existing.target_id is distinct from p_new_unit_id then
      raise exception 'conflicting_m2d_lineage:%:%', p_source_table, p_source_id;
    end if;
    update public.finance_lineage_map
    set
      organization_id = public.finance_m2d_development_org_id(),
      status = 'migrated',
      error = payload,
      run_id = p_run_id,
      migration_version = public.finance_m2d_version(),
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
    run_id,
    status,
    error
  ) values (
    public.finance_m2d_development_org_id(),
    p_source_table,
    p_source_id,
    'm2d_unit_repair',
    p_new_unit_id,
    public.finance_m2d_version(),
    p_run_id,
    'migrated',
    payload
  );
end;
$$;

create or replace function public.finance_m2d_repair(p_dry_run boolean default true)
returns jsonb
language plpgsql
as $$
declare
  org uuid := public.finance_m2d_development_org_id();
  v_run_id uuid := gen_random_uuid();
  money_before jsonb;
  money_after jsonb;
  expected jsonb := jsonb_build_object(
    'charges', 12,
    'gross', 18240.00,
    'paid', 8960.00,
    'payments', 8,
    'outstanding', 9280.00
  );
  rec record;
  unit_rec record;
  canonical_property uuid;
  occupant_lease uuid;
  occupant_tenant uuid;
  already int := 0;
  pending int := 0;
  mixed int := 0;
  payments_have_unit boolean;
  parking uuid;
  moved int;
  stuck int;
  loops int := 0;
  rows_changed int := 0;
  audit_rows int := 0;
  touched int := 0;
begin
  if to_regclass('public.finance_lineage_map') is null then
    raise exception 'm2d_missing_finance_lineage_map';
  end if;

  money_before := public.finance_m2d_development_money();
  if money_before is distinct from expected then
    raise exception 'm2d_money_fingerprint_mismatch:%', money_before;
  end if;

  payments_have_unit := exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'payments'
      and column_name = 'unit_id'
  );

  if (
    select count(distinct new_unit_id)
    from public.finance_m2d_approved_map()
  ) <> 8 then
    raise exception 'm2d_duplicate_target_unit';
  end if;

  for rec in select * from public.finance_m2d_approved_map()
  loop
    if rec.new_unit_id = public.finance_m2d_option_b_unit_id() then
      raise exception 'm2d_cameron_option_b_collision:%', rec.resident_name;
    end if;

    select *
    into unit_rec
    from public.units u
    where u.id = rec.new_unit_id;

    if not found then
      raise exception 'm2d_missing_target_unit:%', rec.new_unit_id;
    end if;
    if unit_rec.organization_id is distinct from org then
      raise exception 'm2d_wrong_org_unit:%', rec.new_unit_id;
    end if;
    if unit_rec.property_id is distinct from rec.property_id then
      raise exception 'm2d_wrong_property:%:%', rec.resident_name, rec.new_unit_id;
    end if;
    if unit_rec.unit_number is distinct from rec.new_unit_number then
      raise exception 'm2d_wrong_unit_number:%:%', rec.resident_name, rec.new_unit_number;
    end if;
    if unit_rec.deleted_at is not null or unit_rec.archived_at is not null then
      raise exception 'm2d_target_unit_inactive:%', rec.new_unit_id;
    end if;

    select pu.property_id
    into canonical_property
    from public.property_units pu
    where pu.id = rec.new_unit_id;

    if found and canonical_property is distinct from rec.property_id then
      raise exception 'm2d_incompatible_canonical_unit:%', rec.new_unit_id;
    end if;

    if not exists (
      select 1
      from public.rent_charges rc
      where rc.id = rec.charge_id
        and rc.organization_id = org
        and rc.property_id = rec.property_id
        and rc.lease_id = rec.lease_id
        and rc.tenant_id = rec.tenant_id
        and rc.unit_id in (rec.current_unit_id, rec.new_unit_id)
    ) then
      raise exception 'm2d_unexpected_charge_identity:%', rec.charge_id;
    end if;

    if not exists (
      select 1
      from public.leases l
      where l.id = rec.lease_id
        and l.organization_id = org
        and l.property_id = rec.property_id
        and l.unit_id in (rec.current_unit_id, rec.new_unit_id)
    ) then
      raise exception 'm2d_unexpected_lease_identity:%', rec.lease_id;
    end if;

    if not exists (
      select 1
      from public.tenants t
      where t.id = rec.tenant_id
        and t.organization_id = org
        and t.property_id = rec.property_id
        and t.unit_id in (rec.current_unit_id, rec.new_unit_id)
    ) then
      raise exception 'm2d_unexpected_tenant_identity:%', rec.tenant_id;
    end if;

    if exists (
      select 1
      from public.rent_charges rc
      where rc.id = rec.charge_id
        and rc.unit_id = rec.new_unit_id
    ) then
      already := already + 1;
    elsif exists (
      select 1
      from public.rent_charges rc
      where rc.id = rec.charge_id
        and rc.unit_id = rec.current_unit_id
    ) then
      pending := pending + 1;
    else
      mixed := mixed + 1;
    end if;

    select l.id
    into occupant_lease
    from public.leases l
    where l.unit_id = rec.new_unit_id
      and l.organization_id = org
      and l.status = 'active'
      and l.deleted_at is null
      and l.id not in (select lease_id from public.finance_m2d_approved_map());

    if occupant_lease is not null then
      raise exception 'm2d_occupied_unit_lease:%:%', rec.new_unit_id, occupant_lease;
    end if;

    select t.id
    into occupant_tenant
    from public.tenants t
    where t.unit_id = rec.new_unit_id
      and t.organization_id = org
      and coalesce(t.status, 'active') = 'active'
      and t.deleted_at is null
      and t.id not in (select tenant_id from public.finance_m2d_approved_map());

    if occupant_tenant is not null then
      raise exception 'm2d_occupied_unit_tenant:%:%', rec.new_unit_id, occupant_tenant;
    end if;
  end loop;

  if mixed > 0 then
    raise exception 'm2d_partial_state_not_repairable';
  end if;
  if already not in (0, 8) or pending not in (0, 8) or already + pending <> 8 then
    raise exception 'm2d_unexpected_current_unit_id';
  end if;

  if p_dry_run then
    return jsonb_build_object(
      'dry_run', true,
      'version', public.finance_m2d_version(),
      'organization_id', org,
      'already_applied', already = 8,
      'money', money_before,
      'rows', coalesce((
        select jsonb_agg(jsonb_build_object(
          'resident', m.resident_name,
          'charge_id', m.charge_id,
          'lease_id', m.lease_id,
          'tenant_id', m.tenant_id,
          'property_id', m.property_id,
          'current_unit_id', m.current_unit_id,
          'new_unit_id', m.new_unit_id,
          'new_unit_number', m.new_unit_number
        ) order by m.resident_name)
        from public.finance_m2d_approved_map() m
      ), '[]'::jsonb)
    );
  end if;

  if already = 8 then
    money_after := public.finance_m2d_development_money();
    if money_after is distinct from expected then
      raise exception 'm2d_money_changed:%', money_after;
    end if;
    return jsonb_build_object(
      'dry_run', false,
      'version', public.finance_m2d_version(),
      'organization_id', org,
      'already_applied', true,
      'rows_changed', 0,
      'money', money_after,
      'run_id', v_run_id
    );
  end if;

  select u.id
  into parking
  from public.units u
  where u.organization_id = org
    and u.deleted_at is null
    and u.archived_at is null
    and u.id <> public.finance_m2d_option_b_unit_id()
    and u.id not in (
      select current_unit_id from public.finance_m2d_approved_map()
      union
      select new_unit_id from public.finance_m2d_approved_map()
    )
    and not exists (
      select 1
      from public.leases l
      where l.unit_id = u.id
        and l.status = 'active'
        and l.deleted_at is null
    )
    and not exists (
      select 1
      from public.tenants t
      where t.unit_id = u.id
        and coalesce(t.status, 'active') = 'active'
        and t.deleted_at is null
    )
  order by u.created_at, u.id
  limit 1;

  if parking is null then
    raise exception 'm2d_no_swap_parking_unit';
  end if;

  loop
    moved := 0;
    for rec in
      select m.*
      from public.finance_m2d_approved_map() m
      join public.leases l on l.id = m.lease_id
      where l.unit_id is distinct from m.new_unit_id
    loop
      if not exists (
        select 1
        from public.leases l
        where l.organization_id = org
          and l.unit_id = rec.new_unit_id
          and l.status = 'active'
          and l.deleted_at is null
          and l.id is distinct from rec.lease_id
      ) then
        update public.leases
        set unit_id = rec.new_unit_id, updated_at = timezone('utc', now())
        where id = rec.lease_id
          and organization_id = org
          and property_id = rec.property_id
          and unit_id is distinct from rec.new_unit_id;
        get diagnostics touched = row_count;
        moved := moved + 1;
        rows_changed := rows_changed + touched;
      end if;
    end loop;

    select count(*)
    into stuck
    from public.finance_m2d_approved_map() m
    join public.leases l on l.id = m.lease_id
    where l.unit_id is distinct from m.new_unit_id;

    exit when stuck = 0;

    if moved = 0 then
      update public.leases l
      set unit_id = parking, updated_at = timezone('utc', now())
      from public.finance_m2d_approved_map() m
      where l.id = m.lease_id
        and l.organization_id = org
        and l.unit_id is distinct from m.new_unit_id
        and l.id = (
          select m2.lease_id
          from public.finance_m2d_approved_map() m2
          join public.leases l2 on l2.id = m2.lease_id
          where l2.unit_id is distinct from m2.new_unit_id
          order by m2.resident_name
          limit 1
        );
      if not found then
        raise exception 'm2d_lease_swap_deadlock';
      end if;
      rows_changed := rows_changed + 1;
    end if;

    loops := loops + 1;
    if loops > 16 then
      raise exception 'm2d_lease_swap_exceeded';
    end if;
  end loop;

  for rec in select * from public.finance_m2d_approved_map()
  loop
    update public.rent_charges
    set unit_id = rec.new_unit_id, updated_at = timezone('utc', now())
    where id = rec.charge_id
      and organization_id = org
      and property_id = rec.property_id
      and unit_id is distinct from rec.new_unit_id;
    get diagnostics touched = row_count;
    rows_changed := rows_changed + touched;

    update public.tenants
    set unit_id = rec.new_unit_id, updated_at = timezone('utc', now())
    where id = rec.tenant_id
      and organization_id = org
      and property_id = rec.property_id
      and unit_id is distinct from rec.new_unit_id;
    get diagnostics touched = row_count;
    rows_changed := rows_changed + touched;

    if payments_have_unit then
      execute
        'update public.payments
         set unit_id = $1, updated_at = timezone(''utc'', now())
         where rent_charge_id = $2
           and organization_id = $3
           and property_id = $4
           and unit_id is distinct from $1'
      using rec.new_unit_id, rec.charge_id, org, rec.property_id;
      get diagnostics touched = row_count;
      rows_changed := rows_changed + touched;
    end if;

    perform public.finance_m2d_record_audit(
      v_run_id, 'rent_charges', rec.charge_id, rec.current_unit_id, rec.new_unit_id,
      rec.property_id, rec.new_unit_number, rec.resident_name
    );
    perform public.finance_m2d_record_audit(
      v_run_id, 'leases', rec.lease_id, rec.current_unit_id, rec.new_unit_id,
      rec.property_id, rec.new_unit_number, rec.resident_name
    );
    perform public.finance_m2d_record_audit(
      v_run_id, 'tenants', rec.tenant_id, rec.current_unit_id, rec.new_unit_id,
      rec.property_id, rec.new_unit_number, rec.resident_name
    );
    if payments_have_unit then
      for occupant_lease in
        execute
          'select id from public.payments
           where rent_charge_id = $1 and organization_id = $2'
        using rec.charge_id, org
      loop
        perform public.finance_m2d_record_audit(
          v_run_id, 'payments', occupant_lease, rec.current_unit_id, rec.new_unit_id,
          rec.property_id, rec.new_unit_number, rec.resident_name
        );
      end loop;
    end if;
  end loop;

  if exists (
    select 1
    from public.rent_charges rc
    where rc.organization_id = org
      and rc.property_id is distinct from (
        select m.property_id from public.finance_m2d_approved_map() m where m.charge_id = rc.id
      )
      and rc.id in (select charge_id from public.finance_m2d_approved_map())
  ) then
    raise exception 'm2d_property_id_changed';
  end if;

  money_after := public.finance_m2d_development_money();
  if money_after is distinct from expected then
    raise exception 'm2d_money_changed:%', money_after;
  end if;

  if exists (
    select 1
    from public.finance_m2d_approved_map() m
    join public.rent_charges rc on rc.id = m.charge_id
    where rc.unit_id is distinct from m.new_unit_id
       or rc.property_id is distinct from m.property_id
  ) then
    raise exception 'm2d_charge_not_retargeted';
  end if;

  select count(*)
  into audit_rows
  from public.finance_lineage_map lm
  where lm.run_id = v_run_id
    and lm.target_table = 'm2d_unit_repair';

  return jsonb_build_object(
    'dry_run', false,
    'version', public.finance_m2d_version(),
    'organization_id', org,
    'already_applied', false,
    'rows_changed', rows_changed,
    'audit_rows', audit_rows,
    'money', money_after,
    'run_id', v_run_id
  );
end;
$$;

revoke all on function public.finance_m2d_version() from public, anon, authenticated;
revoke all on function public.finance_m2d_development_org_id() from public, anon, authenticated;
revoke all on function public.finance_m2d_option_b_unit_id() from public, anon, authenticated;
revoke all on function public.finance_m2d_approved_map() from public, anon, authenticated;
revoke all on function public.finance_m2d_development_money() from public, anon, authenticated;
revoke all on function public.finance_m2d_record_audit(uuid, text, uuid, uuid, uuid, uuid, text, text) from public, anon, authenticated;
revoke all on function public.finance_m2d_repair(boolean) from public, anon, authenticated;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function public.finance_m2d_version() to service_role;
    grant execute on function public.finance_m2d_development_org_id() to service_role;
    grant execute on function public.finance_m2d_option_b_unit_id() to service_role;
    grant execute on function public.finance_m2d_approved_map() to service_role;
    grant execute on function public.finance_m2d_development_money() to service_role;
    grant execute on function public.finance_m2d_record_audit(uuid, text, uuid, uuid, uuid, uuid, text, text) to service_role;
    grant execute on function public.finance_m2d_repair(boolean) to service_role;
  end if;
end
$$;
