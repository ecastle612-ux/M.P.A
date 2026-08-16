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

  if to_regclass('public.organization_invitation_tenant_bindings') is null then
    raise exception 'bindings table missing';
  end if;
end
$$;

alter table public.financial_receipts force row level security;
grant select on public.financial_receipts to authenticated;
grant execute on function public.finance_resident_can_select_charge(uuid, uuid, date, date, timestamptz) to authenticated;
grant execute on function public.tenant_occupies_lease(uuid, uuid) to authenticated;

-- Fixture occupancies for receipt authorization cases
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

-- UNIQUE (lease_id, email) may conflict if we reuse. emails are unique.

do $$
declare
  seen int;
  helper_ok boolean;
  occupancy_created date;
begin
  -- Discovered live incompatibility (do not patch certified SQL in this package):
  -- finance_resident_can_select_charge's created_at parameter is shadowed by
  -- lease_residents.created_at inside the EXISTS query, so the 5th argument
  -- (receipt issued_at / payment created_at) is ignored on the historical path.
  perform set_config('request.jwt.claim.sub', 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1', false);
  perform set_config('request.jwt.claim.role', 'authenticated', false);
  select (timezone('utc', occupancy.created_at))::date
    into occupancy_created
  from public.lease_residents occupancy
  where occupancy.id = 'dddddddd-dddd-4ddd-8ddd-ddddddddddd1';
  helper_ok := public.finance_resident_can_select_charge(
    'f88ee244-5343-4ddf-be48-15e96b9380ee'::uuid,
    '6a620af4-03de-4292-9b83-acec48d7573c'::uuid,
    null,
    null,
    timestamptz '2026-07-23 01:36:00.500715+00'
  );
  if helper_ok is true then
    raise exception 'expected helper shadowing: issued_at in-window should still be false when occupancy.created_at is %', occupancy_created;
  end if;
  if occupancy_created <> public.utc_today() then
    raise exception 'occupancy.created_at date % is not utc_today; shadowing proof needs today', occupancy_created;
  end if;
  execute 'set role authenticated';
  select count(*) into seen from public.financial_receipts;
  execute 'reset role';
  if seen <> 0 then
    raise exception 'former in-window currently denied by helper shadowing, got %', seen;
  end if;
  raise notice 'DISCOVERED_BLOCKER helper_created_at_shadowed occupancy_created=% issued_at=2026-07-23', occupancy_created;

  perform set_config('request.jwt.claim.sub', 'cccccccc-cccc-4ccc-8ccc-ccccccccccc2', false);
  execute 'set role authenticated';
  select count(*) into seen from public.financial_receipts;
  execute 'reset role';
  if seen <> 0 then
    raise exception 'former after occupy_to should see 0, got %', seen;
  end if;

  perform set_config('request.jwt.claim.sub', '6cde6423-ad9b-49fb-aadd-3ea93ec8b040', false);
  execute 'set role authenticated';
  select count(*) into seen from public.financial_receipts;
  execute 'reset role';
  if seen <> 0 then
    raise exception 'other org tenant should see 0, got %', seen;
  end if;

  perform set_config('request.jwt.claim.sub', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1', false);
  execute 'set role authenticated';
  select count(*) into seen from public.financial_receipts;
  execute 'reset role';
  if seen <> 0 then
    raise exception 'no user-linked occupancy should see 0, got %', seen;
  end if;

  perform set_config('request.jwt.claim.sub', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', false);
  execute 'set role authenticated';
  select count(*) into seen from public.financial_receipts;
  execute 'reset role';
  -- staff helper is org-scoped; this staff is Property Demo, receipt is other org
  if seen <> 0 then
    raise exception 'other-org staff should see 0 via staff policy, got %', seen;
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
end
$$;

-- Active occupant on receipt lease
update public.lease_residents
set user_id = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc3',
    occupancy_status = 'occupying',
    occupy_from = '2026-07-01',
    occupy_to = null
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
end
$$;

select 'SCRATCH_DOCS_170_OCCUPANCY_AND_DENY_PASS_HELPER_SHADOWED' as status;
