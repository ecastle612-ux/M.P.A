-- Assertions after successor apply. Uses RAISE EXCEPTION so psql -v ON_ERROR_STOP=1 fails the run.

do $assert$
declare
  leftover int;
  helper_missing int;
  select_using text;
  manage_using text;
  child_using text;
  comms_def text;
  wo_count int;
  sub_count int;
begin
  select count(*) into leftover
  from pg_policy
  where polrelid = 'public.maintenance_work_orders'::regclass
    and polname in (
      'maintenance_work_orders_select_authorized',
      'maintenance_work_orders_insert_authorized',
      'maintenance_work_orders_update_authorized',
      'maintenance_work_orders_delete_authorized'
    );
  if leftover <> 0 then
    raise exception 'leftover *_authorized policies still present: %', leftover;
  end if;

  select count(*) into helper_missing
  from (values
    ('org_sku'),
    ('org_allows_work_surface'),
    ('can_select_work_order'),
    ('is_pm_comms_staff')
  ) as required(name)
  where not exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = required.name
  );
  if helper_missing <> 0 then
    raise exception 'missing PLAT-002 helpers: %', helper_missing;
  end if;

  select pg_get_expr(polqual, polrelid) into select_using
  from pg_policy
  where polrelid = 'public.maintenance_work_orders'::regclass
    and polname = 'maintenance_work_orders_select';
  if select_using is null or select_using not like '%can_select_work_order%' then
    raise exception 'select policy missing can_select_work_order: %', select_using;
  end if;
  if select_using like '%is_org_member%' then
    raise exception 'select policy still uses is_org_member: %', select_using;
  end if;

  select pg_get_expr(polqual, polrelid) into manage_using
  from pg_policy
  where polrelid = 'public.maintenance_work_orders'::regclass
    and polname = 'maintenance_work_orders_manage_manager';
  if manage_using is null or manage_using not like '%org_allows_work_surface%' then
    raise exception 'manage_manager missing org_allows_work_surface: %', manage_using;
  end if;

  select pg_get_expr(polqual, polrelid) into child_using
  from pg_policy
  where polrelid = 'public.maintenance_work_order_updates'::regclass
    and polname = 'maintenance_updates_select';
  if child_using is null or child_using not like '%can_select_work_order%' then
    raise exception 'child select missing can_select_work_order: %', child_using;
  end if;

  select pg_get_functiondef(p.oid) into comms_def
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'can_access_tenant_conversation';
  if comms_def not like '%is_pm_comms_staff%' then
    raise exception 'can_access_tenant_conversation does not use is_pm_comms_staff';
  end if;
  if comms_def like '%is_pm_staff(target_org_id)%' then
    raise exception 'can_access_tenant_conversation still calls is_pm_staff';
  end if;

  select count(*) into wo_count from public.maintenance_work_orders;
  select count(*) into sub_count from public.organization_subscriptions;
  if wo_count <> 6 then
    raise exception 'work order count changed: %', wo_count;
  end if;
  if sub_count <> 3 then
    raise exception 'subscription count changed: %', sub_count;
  end if;

  if public.org_allows_work_surface('11111111-1111-4111-8111-111111111111', 'residential') is not true then
    raise exception 'PM residential should be allowed';
  end if;
  if public.org_allows_work_surface('11111111-1111-4111-8111-111111111111', 'facility') is not false then
    raise exception 'PM facility should be denied';
  end if;
  if public.org_allows_work_surface('22222222-2222-4222-8222-222222222222', 'facility') is not true then
    raise exception 'FO facility should be allowed';
  end if;
  if public.org_allows_work_surface('22222222-2222-4222-8222-222222222222', 'residential') is not false then
    raise exception 'FO residential should be denied';
  end if;
  if public.org_allows_work_surface('33333333-3333-4333-8333-333333333333', 'residential') is not true
     or public.org_allows_work_surface('33333333-3333-4333-8333-333333333333', 'facility') is not true then
    raise exception 'Complete union failed';
  end if;
  if public.org_allows_work_surface('11111111-1111-4111-8111-111111111111', 'unknown') is not false then
    raise exception 'unknown surface should be denied';
  end if;
end
$assert$;

-- Role + RLS: PM manager sees residential only
select set_config('request.jwt.claim.sub', 'aaaaaaa1-0000-4000-8000-000000000001', false);
set role authenticated;
do $pm$
declare
  surfaces text[];
begin
  select array_agg(work_surface order by work_surface) into surfaces
  from public.maintenance_work_orders
  where organization_id = '11111111-1111-4111-8111-111111111111';
  if surfaces is distinct from array['residential']::text[] then
    raise exception 'PM manager surfaces: %', surfaces;
  end if;
  if public.is_pm_comms_staff('11111111-1111-4111-8111-111111111111') is not true then
    raise exception 'PM manager should be comms staff';
  end if;
end
$pm$;
reset role;

-- FO manager sees facility only; not comms staff
select set_config('request.jwt.claim.sub', 'aaaaaaa2-0000-4000-8000-000000000002', false);
set role authenticated;
do $fo$
declare
  surfaces text[];
begin
  select array_agg(work_surface order by work_surface) into surfaces
  from public.maintenance_work_orders
  where organization_id = '22222222-2222-4222-8222-222222222222';
  if surfaces is distinct from array['facility']::text[] then
    raise exception 'FO manager surfaces: %', surfaces;
  end if;
  if public.is_pm_comms_staff('22222222-2222-4222-8222-222222222222') is not false then
    raise exception 'FO manager must not be comms staff';
  end if;
end
$fo$;
reset role;

-- Complete manager sees union
select set_config('request.jwt.claim.sub', 'aaaaaaa3-0000-4000-8000-000000000003', false);
set role authenticated;
do $cp$
declare
  surfaces text[];
begin
  select array_agg(work_surface order by work_surface) into surfaces
  from public.maintenance_work_orders
  where organization_id = '33333333-3333-4333-8333-333333333333';
  if surfaces is distinct from array['facility', 'residential']::text[] then
    raise exception 'Complete manager surfaces: %', surfaces;
  end if;
  if public.is_pm_comms_staff('33333333-3333-4333-8333-333333333333') is not true then
    raise exception 'Complete PM role should be comms staff';
  end if;
end
$cp$;
reset role;

-- Complete technician is not comms staff
select set_config('request.jwt.claim.sub', 'aaaaaaa4-0000-4000-8000-000000000004', false);
set role authenticated;
do $tech$
begin
  if public.is_pm_comms_staff('33333333-3333-4333-8333-333333333333') is not false then
    raise exception 'Complete technician must not be comms staff';
  end if;
end
$tech$;
reset role;

-- Tenant sees own residential only
select set_config('request.jwt.claim.sub', 'aaaaaaa5-0000-4000-8000-000000000005', false);
set role authenticated;
do $tenant$
declare
  n int;
  fac int;
begin
  select count(*) into n from public.maintenance_work_orders;
  select count(*) into fac from public.maintenance_work_orders where work_surface = 'facility';
  if n <> 1 then
    raise exception 'tenant work-order count: %', n;
  end if;
  if fac <> 0 then
    raise exception 'tenant saw facility rows';
  end if;
  if public.is_pm_comms_staff('11111111-1111-4111-8111-111111111111') is not false then
    raise exception 'tenant must not be comms staff';
  end if;
  if public.can_access_tenant_conversation(
    '11111111-1111-4111-8111-111111111111',
    'cccccccc-0000-4000-8000-000000000001',
    'bbbbbbbb-0000-4000-8000-000000000001'
  ) is not true then
    raise exception 'tenant should access own conversation';
  end if;
end
$tenant$;
reset role;
