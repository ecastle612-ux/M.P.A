\set ON_ERROR_STOP on

do $$
begin
  if to_regclass('public.maintenance_notifications') is null then
    raise exception 'maintenance_notifications missing after apply';
  end if;
end
$$;

grant usage on schema auth to authenticated;
grant execute on function auth.uid() to authenticated;

-- Recipient A can insert and read own org A row.
set role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', false);

insert into public.maintenance_notifications (
  organization_id, user_id, work_order_id, notification_key, title, body, href, channel
) values (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '11111111-1111-1111-1111-111111111111',
  'aaaaaaaa-0000-0000-0000-000000000001',
  'work_order.assigned',
  'Assigned',
  'You were assigned',
  '/pm/maintenance',
  'in_app'
);

do $$
declare
  n int;
begin
  select count(*) into n from public.maintenance_notifications;
  if n <> 1 then
    raise exception 'recipient A should see own row, got %', n;
  end if;
end
$$;

-- Cross-user: B cannot read A's row.
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', false);
do $$
declare
  n int;
begin
  select count(*) into n from public.maintenance_notifications;
  if n <> 0 then
    raise exception 'cross-user read should be denied, got %', n;
  end if;
end
$$;

-- Cross-org: B inserts own org B row; still cannot see org A.
insert into public.maintenance_notifications (
  organization_id, user_id, work_order_id, notification_key, title, body, channel
) values (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  '22222222-2222-2222-2222-222222222222',
  'bbbbbbbb-0000-0000-0000-000000000001',
  'work_order.started',
  'Started',
  'Started',
  'in_app'
);

do $$
declare
  n int;
begin
  select count(*) into n from public.maintenance_notifications;
  if n <> 1 then
    raise exception 'user B should see only org B row, got %', n;
  end if;
end
$$;

-- Cross-org insert as B into org A for A should fail RLS.
do $$
begin
  begin
    insert into public.maintenance_notifications (
      organization_id, user_id, work_order_id, notification_key, title, body
    ) values (
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      '11111111-1111-1111-1111-111111111111',
      'aaaaaaaa-0000-0000-0000-000000000001',
      'work_order.closed',
      'Closed',
      'Closed'
    );
    raise exception 'cross-org insert should have been denied';
  exception
    when insufficient_privilege then
      null;
    when others then
      if sqlerrm not ilike '%row-level security%' and sqlerrm not ilike '%policy%' then
        raise;
      end if;
  end;
end
$$;

reset role;
select 'SCRATCH_DOCS_180_VERIFY_PASS' as status;
