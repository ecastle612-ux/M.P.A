\set ON_ERROR_STOP on

do $$
declare
  lease_n int;
  unmatched int;
  occupying_n int;
  moved_out_n int;
  binding_n int;
  invite_n int;
  charge_n int;
  payment_n int;
  receipt_n int;
  alloc_n int;
  uat_status text;
  uat_to date;
  policy_def text;
  maint_def text;
begin
  select count(*) into lease_n from public.lease_residents;
  if lease_n <> 15 then
    raise exception 'lease_residents count %', lease_n;
  end if;

  select count(*) into unmatched
  from public.lease_residents occupancy
  where occupancy.pm_resident_id is null;
  if unmatched <> 0 then
    raise exception 'unmatched occupancy rows %', unmatched;
  end if;

  select count(*) filter (where occupancy_status = 'occupying'),
         count(*) filter (where occupancy_status = 'moved_out')
    into occupying_n, moved_out_n
  from public.lease_residents;
  if occupying_n <> 14 or moved_out_n <> 1 then
    raise exception 'occupancy distribution occupying=% moved_out=%', occupying_n, moved_out_n;
  end if;

  select occupancy_status, occupy_to
    into uat_status, uat_to
  from public.lease_residents
  where id = '1275cb2e-be3c-4626-91ff-a3e1a8eee2fd';
  if uat_status <> 'occupying' or uat_to is not null then
    raise exception 'UAT tenant occupancy % / %', uat_status, uat_to;
  end if;

  select count(*) into binding_n from public.organization_invitation_tenant_bindings;
  if binding_n <> 0 then
    raise exception 'bindings %', binding_n;
  end if;

  select count(*) into invite_n from public.organization_invitations;
  if invite_n <> 14 then
    raise exception 'invitations %', invite_n;
  end if;

  select count(*) into charge_n from public.financial_charges;
  select count(*) into payment_n from public.financial_payments;
  select count(*) into receipt_n from public.financial_receipts;
  select count(*) into alloc_n from public.financial_payment_allocations;
  if charge_n <> 18 or payment_n <> 11 or receipt_n <> 1 or alloc_n <> 11 then
    raise exception 'FIN-OPS counts %/%/%/%', charge_n, payment_n, receipt_n, alloc_n;
  end if;

  select pg_get_expr(pol.polqual, pol.polrelid)
    into policy_def
  from pg_policy pol
  join pg_class c on c.oid = pol.polrelid
  where c.relname = 'financial_receipts'
    and pol.polname = 'financial_receipts_select_resident';
  if policy_def is null or position('issued_at' in policy_def) = 0 then
    raise exception 'receipt policy missing issued_at: %', policy_def;
  end if;
  if position('created_at' in policy_def) > 0 then
    raise exception 'receipt policy still references created_at: %', policy_def;
  end if;

  select pg_get_expr(pol.polwithcheck, pol.polrelid)
    into maint_def
  from pg_policy pol
  join pg_class c on c.oid = pol.polrelid
  where c.relname = 'maintenance_work_orders'
    and pol.polname = 'maintenance_work_orders_insert_resident';
  if maint_def is null or position('maintenance_work_orders.organization_id' in maint_def) = 0 then
    raise exception 'maintenance policy missing qualified organization_id: %', maint_def;
  end if;
  if position('is_org_member' in maint_def) > 0 then
    raise exception 'maintenance policy broadened to is_org_member';
  end if;

  if to_regclass('public.organization_invitation_tenant_bindings') is null then
    raise exception 'bindings table missing';
  end if;
end
$$;

alter table public.financial_receipts force row level security;
alter table public.document_documents force row level security;
alter table public.maintenance_work_orders force row level security;
grant usage on schema auth to authenticated;
grant execute on function auth.uid() to authenticated;
grant select on public.financial_receipts to authenticated;
grant select on public.document_documents to authenticated;
grant insert on public.maintenance_work_orders to authenticated;
grant execute on function public.finance_resident_can_select_charge(uuid, uuid, date, date, timestamptz) to authenticated;
grant execute on function public.tenant_can_select_document(uuid, text, uuid, timestamptz) to authenticated;
grant execute on function public.tenant_occupies_lease(uuid, uuid) to authenticated;

insert into public.lease_residents (
  id, organization_id, lease_id, user_id, email, display_name,
  pm_resident_id, occupancy_status, occupy_from, occupy_to
) values (
  'dddddddd-dddd-4ddd-8ddd-ddddddddddd1',
  'f88ee244-5343-4ddf-be48-15e96b9380ee',
  '6a620af4-03de-4292-9b83-acec48d7573c',
  'cccccccc-cccc-4ccc-8ccc-ccccccccccc1',
  'former.inwindow@example.com',
  'Former In',
  'caf3630d-8f86-4087-82da-6c9a68b2e62c',
  'moved_out',
  '2026-07-01',
  '2026-07-31'
) on conflict (id) do nothing;

insert into public.lease_residents (
  id, organization_id, lease_id, user_id, email, display_name,
  pm_resident_id, occupancy_status, occupy_from, occupy_to
) values (
  'dddddddd-dddd-4ddd-8ddd-ddddddddddd2',
  'f88ee244-5343-4ddf-be48-15e96b9380ee',
  '6a620af4-03de-4292-9b83-acec48d7573c',
  'cccccccc-cccc-4ccc-8ccc-ccccccccccc2',
  'former.after@example.com',
  'Former After',
  'caf3630d-8f86-4087-82da-6c9a68b2e62c',
  'moved_out',
  '2026-01-01',
  '2026-06-30'
) on conflict (id) do nothing;

insert into public.lease_residents (
  id, organization_id, lease_id, user_id, email, display_name,
  pm_resident_id, occupancy_status, occupy_from, occupy_to
) values (
  'dddddddd-dddd-4ddd-8ddd-ddddddddddd3',
  'f88ee244-5343-4ddf-be48-15e96b9380ee',
  '6a620af4-03de-4292-9b83-acec48d7573c',
  'cccccccc-cccc-4ccc-8ccc-ccccccccccc4',
  'future.occupant@example.com',
  'Future',
  'caf3630d-8f86-4087-82da-6c9a68b2e62c',
  'scheduled',
  '2026-09-01',
  null
) on conflict (id) do nothing;

insert into public.document_documents (
  id, organization_id, entity_type, entity_id, created_at
) values
  (
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1',
    'f88ee244-5343-4ddf-be48-15e96b9380ee',
    'lease',
    '6a620af4-03de-4292-9b83-acec48d7573c',
    '2026-07-23 01:36:00.500715+00'
  ),
  (
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee2',
    'f88ee244-5343-4ddf-be48-15e96b9380ee',
    'lease',
    '6a620af4-03de-4292-9b83-acec48d7573c',
    '2026-08-15 00:00:00+00'
  ),
  (
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee3',
    'a11ce002-0001-4000-8000-0000000000c2',
    'lease',
    'a11ce002-0001-4000-8000-000000000401',
    '2026-08-15 00:00:00+00'
  );

insert into public.property_units (id, organization_id, property_id, unit_label) values
  (
    'a11ce002-0001-4000-8000-000000000202',
    'a11ce002-0001-4000-8000-0000000000c2',
    'a11ce002-0001-4000-8000-000000000101',
    '1B'
  )
on conflict (id) do nothing;

insert into public.pm_residents (
  id, organization_id, property_id, unit_id, email, user_id, display_name
) values (
  'a11ce002-0001-4000-8000-000000000302',
  'a11ce002-0001-4000-8000-0000000000c2',
  'a11ce002-0001-4000-8000-000000000101',
  'a11ce002-0001-4000-8000-000000000202',
  'cross.unit@example.com',
  'cccccccc-cccc-4ccc-8ccc-ccccccccccc5',
  'Cross Unit'
) on conflict (id) do nothing;

insert into public.lease_agreements (
  id, organization_id, property_id, unit_id, resident_id, status, start_date, end_date
) values (
  'a11ce002-0001-4000-8000-000000000402',
  'a11ce002-0001-4000-8000-0000000000c2',
  'a11ce002-0001-4000-8000-000000000101',
  'a11ce002-0001-4000-8000-000000000202',
  'a11ce002-0001-4000-8000-000000000302',
  'active',
  '2026-08-01',
  '2027-08-01'
) on conflict (id) do nothing;

insert into public.lease_residents (
  id, organization_id, lease_id, user_id, email, display_name,
  pm_resident_id, occupancy_status, occupy_from, occupy_to
) values (
  'dddddddd-dddd-4ddd-8ddd-ddddddddddd4',
  'a11ce002-0001-4000-8000-0000000000c2',
  'a11ce002-0001-4000-8000-000000000402',
  'cccccccc-cccc-4ccc-8ccc-ccccccccccc5',
  'cross.unit@example.com',
  'Cross Unit',
  'a11ce002-0001-4000-8000-000000000302',
  'occupying',
  '2026-08-01',
  null
) on conflict (id) do nothing;

insert into public.organization_memberships (organization_id, user_id, roles, status) values
  ('a11ce002-0001-4000-8000-0000000000c2', 'cccccccc-cccc-4ccc-8ccc-ccccccccccc5', array['tenant']::text[], 'active'),
  ('a11ce002-0001-4000-8000-0000000000c2', 'cccccccc-cccc-4ccc-8ccc-ccccccccccc8', array['tenant']::text[], 'active');

do $$
declare
  seen int;
  helper_ok boolean;
  occupancy_created date;
  doc_ok boolean;
begin
  perform set_config('request.jwt.claim.sub', 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1', false);
  perform set_config('request.jwt.claim.role', 'authenticated', false);
  select (timezone('utc', occupancy.created_at))::date
    into occupancy_created
  from public.lease_residents occupancy
  where occupancy.id = 'dddddddd-dddd-4ddd-8ddd-ddddddddddd1';
  if occupancy_created <> public.utc_today() then
    raise exception 'occupancy.created_at date % is not utc_today', occupancy_created;
  end if;

  helper_ok := public.finance_resident_can_select_charge(
    'f88ee244-5343-4ddf-be48-15e96b9380ee'::uuid,
    '6a620af4-03de-4292-9b83-acec48d7573c'::uuid,
    null,
    null,
    timestamptz '2026-07-23 01:36:00.500715+00'
  );
  if helper_ok is not true then
    raise exception 'former in-window helper must use issued_at, got % (occupancy.created_at=%)', helper_ok, occupancy_created;
  end if;

  execute 'set role authenticated';
  select count(*) into seen from public.financial_receipts;
  execute 'reset role';
  if seen <> 1 then
    raise exception 'former in-window should see 1 receipt, got %', seen;
  end if;

  doc_ok := public.tenant_can_select_document(
    'f88ee244-5343-4ddf-be48-15e96b9380ee'::uuid,
    'lease',
    '6a620af4-03de-4292-9b83-acec48d7573c'::uuid,
    timestamptz '2026-07-23 01:36:00.500715+00'
  );
  if doc_ok is not true then
    raise exception 'former in-window document helper must use passed timestamp, got %', doc_ok;
  end if;
  execute 'set role authenticated';
  select count(*) into seen from public.document_documents
  where id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1';
  execute 'reset role';
  if seen <> 1 then
    raise exception 'former in-window should see historical document, got %', seen;
  end if;
  execute 'set role authenticated';
  select count(*) into seen from public.document_documents
  where id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee2';
  execute 'reset role';
  if seen <> 0 then
    raise exception 'former should not see post-occupancy document, got %', seen;
  end if;

  perform set_config('request.jwt.claim.sub', 'cccccccc-cccc-4ccc-8ccc-ccccccccccc2', false);
  execute 'set role authenticated';
  select count(*) into seen from public.financial_receipts;
  execute 'reset role';
  if seen <> 0 then
    raise exception 'former after occupy_to should see 0 receipts, got %', seen;
  end if;

  perform set_config('request.jwt.claim.sub', 'cccccccc-cccc-4ccc-8ccc-ccccccccccc4', false);
  helper_ok := public.finance_resident_can_select_charge(
    'f88ee244-5343-4ddf-be48-15e96b9380ee'::uuid,
    '6a620af4-03de-4292-9b83-acec48d7573c'::uuid,
    null,
    null,
    timestamptz '2026-07-23 01:36:00.500715+00'
  );
  if helper_ok is not false then
    raise exception 'future occupant helper should be false, got %', helper_ok;
  end if;
  execute 'set role authenticated';
  select count(*) into seen from public.financial_receipts;
  execute 'reset role';
  if seen <> 0 then
    raise exception 'future occupant should see 0 receipts, got %', seen;
  end if;

  perform set_config('request.jwt.claim.sub', '6cde6423-ad9b-49fb-aadd-3ea93ec8b040', false);
  execute 'set role authenticated';
  select count(*) into seen from public.financial_receipts;
  execute 'reset role';
  if seen <> 0 then
    raise exception 'other org tenant should see 0 receipts, got %', seen;
  end if;
  execute 'set role authenticated';
  select count(*) into seen from public.document_documents
  where organization_id = 'f88ee244-5343-4ddf-be48-15e96b9380ee';
  execute 'reset role';
  if seen <> 0 then
    raise exception 'other org tenant should see 0 receipt-org documents, got %', seen;
  end if;

  perform set_config('request.jwt.claim.sub', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1', false);
  execute 'set role authenticated';
  select count(*) into seen from public.financial_receipts;
  execute 'reset role';
  if seen <> 0 then
    raise exception 'no user-linked occupancy should see 0 receipts, got %', seen;
  end if;
  execute 'set role authenticated';
  select count(*) into seen from public.document_documents
  where organization_id = 'f88ee244-5343-4ddf-be48-15e96b9380ee';
  execute 'reset role';
  if seen <> 0 then
    raise exception 'tenant-only membership must not regain org document access, got %', seen;
  end if;

  perform set_config('request.jwt.claim.sub', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', false);
  execute 'set role authenticated';
  select count(*) into seen from public.financial_receipts;
  execute 'reset role';
  if seen <> 0 then
    raise exception 'other-org staff should see 0 receipts, got %', seen;
  end if;
end
$$;

insert into public.organization_memberships (organization_id, user_id, roles, status) values
  ('f88ee244-5343-4ddf-be48-15e96b9380ee', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', array['property_manager']::text[], 'active');

do $$
declare
  seen int;
begin
  perform set_config('request.jwt.claim.sub', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', false);
  execute 'set role authenticated';
  select count(*) into seen from public.financial_receipts;
  execute 'reset role';
  if seen <> 1 then
    raise exception 'staff pm.finance:read should see 1 receipt, got %', seen;
  end if;
  execute 'set role authenticated';
  select count(*) into seen from public.document_documents
  where organization_id = 'f88ee244-5343-4ddf-be48-15e96b9380ee';
  execute 'reset role';
  if seen <> 2 then
    raise exception 'staff org-member document SELECT should see 2 receipt-org docs, got %', seen;
  end if;
end
$$;

update public.lease_residents
set user_id = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc3',
    occupancy_status = 'occupying',
    occupy_from = '2026-07-01',
    occupy_to = null
where id = 'caf3630d-8f86-4087-82da-6c9a68b2e62c';

update public.pm_residents
set user_id = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc3'
where id = 'caf3630d-8f86-4087-82da-6c9a68b2e62c';

do $$
declare
  seen int;
begin
  perform set_config('request.jwt.claim.sub', 'cccccccc-cccc-4ccc-8ccc-ccccccccccc3', false);
  execute 'set role authenticated';
  select count(*) into seen from public.financial_receipts;
  execute 'reset role';
  if seen <> 1 then
    raise exception 'active occupant should see 1 receipt, got %', seen;
  end if;
  execute 'set role authenticated';
  select count(*) into seen from public.document_documents
  where id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1';
  execute 'reset role';
  if seen <> 1 then
    raise exception 'active occupant should see own lease document, got %', seen;
  end if;
end
$$;

do $$
declare
  wo_before int;
  wo_after int;
begin
  -- Former cannot create maintenance even if pm_residents.user_id is linked.
  -- INSERT proofs do not use RETURNING: scratch has no WO SELECT policy
  -- (Production already has PLAT-002 maintenance_work_orders_select).
  update public.pm_residents
  set user_id = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1'
  where id = 'caf3630d-8f86-4087-82da-6c9a68b2e62c';

  perform set_config('request.jwt.claim.sub', 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1', false);
  begin
    execute 'set role authenticated';
    insert into public.maintenance_work_orders (
      organization_id, property_id, unit_id, resident_id, requested_by_user_id
    ) values (
      'f88ee244-5343-4ddf-be48-15e96b9380ee',
      'f88ee244-5343-4ddf-be48-15e96b938011',
      'f88ee244-5343-4ddf-be48-15e96b938021',
      'caf3630d-8f86-4087-82da-6c9a68b2e62c',
      'cccccccc-cccc-4ccc-8ccc-ccccccccccc1'
    );
    execute 'reset role';
    raise exception 'former tenant created maintenance';
  exception
    when others then
      execute 'reset role';
      if sqlerrm like 'former tenant created maintenance%' then
        raise;
      end if;
      if sqlerrm not like '%row-level security%' then
        raise exception 'former tenant deny expected RLS, got %', sqlerrm;
      end if;
  end;

  perform set_config('request.jwt.claim.sub', 'cccccccc-cccc-4ccc-8ccc-ccccccccccc4', false);
  begin
    execute 'set role authenticated';
    insert into public.maintenance_work_orders (
      organization_id, property_id, unit_id, resident_id, requested_by_user_id
    ) values (
      'f88ee244-5343-4ddf-be48-15e96b9380ee',
      'f88ee244-5343-4ddf-be48-15e96b938011',
      'f88ee244-5343-4ddf-be48-15e96b938021',
      'caf3630d-8f86-4087-82da-6c9a68b2e62c',
      'cccccccc-cccc-4ccc-8ccc-ccccccccccc4'
    );
    execute 'reset role';
    raise exception 'future tenant created maintenance';
  exception
    when others then
      execute 'reset role';
      if sqlerrm like 'future tenant created maintenance%' then
        raise;
      end if;
      if sqlerrm not like '%row-level security%' then
        raise exception 'future tenant deny expected RLS, got %', sqlerrm;
      end if;
  end;

  perform set_config('request.jwt.claim.sub', 'cccccccc-cccc-4ccc-8ccc-ccccccccccc8', false);
  begin
    execute 'set role authenticated';
    insert into public.maintenance_work_orders (
      organization_id, property_id, unit_id, resident_id, requested_by_user_id
    ) values (
      'a11ce002-0001-4000-8000-0000000000c2',
      'a11ce002-0001-4000-8000-000000000101',
      'a11ce002-0001-4000-8000-000000000201',
      'a11ce002-0001-4000-8000-000000000301',
      'cccccccc-cccc-4ccc-8ccc-ccccccccccc8'
    );
    execute 'reset role';
    raise exception 'membership-only tenant created maintenance';
  exception
    when others then
      execute 'reset role';
      if sqlerrm like 'membership-only tenant created maintenance%' then
        raise;
      end if;
      if sqlerrm not like '%row-level security%' then
        raise exception 'membership-only deny expected RLS, got %', sqlerrm;
      end if;
  end;

  perform set_config('request.jwt.claim.sub', 'cccccccc-cccc-4ccc-8ccc-ccccccccccc5', false);
  begin
    execute 'set role authenticated';
    insert into public.maintenance_work_orders (
      organization_id, property_id, unit_id, resident_id, requested_by_user_id
    ) values (
      'a11ce002-0001-4000-8000-0000000000c2',
      'a11ce002-0001-4000-8000-000000000101',
      'a11ce002-0001-4000-8000-000000000201',
      'a11ce002-0001-4000-8000-000000000301',
      'cccccccc-cccc-4ccc-8ccc-ccccccccccc5'
    );
    execute 'reset role';
    raise exception 'cross-unit tenant created maintenance';
  exception
    when others then
      execute 'reset role';
      if sqlerrm like 'cross-unit tenant created maintenance%' then
        raise;
      end if;
      if sqlerrm not like '%row-level security%' then
        raise exception 'cross-unit deny expected RLS, got %', sqlerrm;
      end if;
  end;

  perform set_config('request.jwt.claim.sub', '6cde6423-ad9b-49fb-aadd-3ea93ec8b040', false);
  begin
    execute 'set role authenticated';
    insert into public.maintenance_work_orders (
      organization_id, property_id, unit_id, resident_id, requested_by_user_id
    ) values (
      'f88ee244-5343-4ddf-be48-15e96b9380ee',
      'f88ee244-5343-4ddf-be48-15e96b938011',
      'f88ee244-5343-4ddf-be48-15e96b938021',
      'caf3630d-8f86-4087-82da-6c9a68b2e62c',
      '6cde6423-ad9b-49fb-aadd-3ea93ec8b040'
    );
    execute 'reset role';
    raise exception 'cross-org tenant created maintenance';
  exception
    when others then
      execute 'reset role';
      if sqlerrm like 'cross-org tenant created maintenance%' then
        raise;
      end if;
      if sqlerrm not like '%row-level security%' then
        raise exception 'cross-org deny expected RLS, got %', sqlerrm;
      end if;
  end;

  perform set_config('request.jwt.claim.sub', '6cde6423-ad9b-49fb-aadd-3ea93ec8b040', false);
  begin
    execute 'set role authenticated';
    insert into public.maintenance_work_orders (
      organization_id, property_id, unit_id, resident_id, requested_by_user_id
    ) values (
      'a11ce002-0001-4000-8000-0000000000c2',
      'a11ce002-0001-4000-8000-000000000101',
      'a11ce002-0001-4000-8000-000000000201',
      'a11ce002-0001-4000-8000-000000000301',
      'cccccccc-cccc-4ccc-8ccc-ccccccccccc5'
    );
    execute 'reset role';
    raise exception 'requested_by mismatch created maintenance';
  exception
    when others then
      execute 'reset role';
      if sqlerrm like 'requested_by mismatch created maintenance%' then
        raise;
      end if;
      if sqlerrm not like '%row-level security%' then
        raise exception 'requested_by mismatch deny expected RLS, got %', sqlerrm;
      end if;
  end;

  select count(*) into wo_before from public.maintenance_work_orders;
  perform set_config('request.jwt.claim.sub', '6cde6423-ad9b-49fb-aadd-3ea93ec8b040', false);
  execute 'set role authenticated';
  insert into public.maintenance_work_orders (
    organization_id, property_id, unit_id, resident_id, requested_by_user_id
  ) values (
    'a11ce002-0001-4000-8000-0000000000c2',
    'a11ce002-0001-4000-8000-000000000101',
    'a11ce002-0001-4000-8000-000000000201',
    'a11ce002-0001-4000-8000-000000000301',
    '6cde6423-ad9b-49fb-aadd-3ea93ec8b040'
  );
  execute 'reset role';
  select count(*) into wo_after from public.maintenance_work_orders;
  if wo_after <> wo_before + 1 then
    raise exception 'active occupant should create own-unit maintenance (before=% after=%)', wo_before, wo_after;
  end if;
end
$$;

do $$
declare
  finance_args text[];
  document_args text[];
  shadow_n int;
begin
  select p.proargnames into finance_args
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname = 'finance_resident_can_select_charge';
  if finance_args is distinct from
    array['target_org_id','target_lease_id','period_start','due_at','record_timestamp']::text[]
  then
    raise exception 'finance helper args %', finance_args;
  end if;

  select p.proargnames into document_args
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname = 'tenant_can_select_document';
  if document_args is distinct from
    array['target_org_id','entity_type','entity_id','record_timestamp']::text[]
  then
    raise exception 'document helper args %', document_args;
  end if;

  -- Actual semantic shadowing: a SQL helper both queries a table and
  -- declares a parameter whose name equals a column of that table.
  -- tenant_finance_charge_date(created_at) has no FROM clause and is not a defect.
  select count(*) into shadow_n
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.prokind = 'f'
    and p.prosrc ~* 'from[[:space:]]+public\.(lease_residents|pm_residents|lease_agreements|organization_memberships)'
    and p.proargnames && array[
      'created_at','organization_id','lease_id','user_id','status',
      'resident_id','unit_id','property_id'
    ]::text[];
  if shadow_n <> 0 then
    raise exception 'unresolved semantic parameter/column shadowing in % helpers', shadow_n;
  end if;
end
$$;

select 'SCRATCH_DOCS_173_PASS' as status;
