-- Local Production-shaped fixture for PLAT-002 successor validation.
-- Not applied to mpa-prod. No J6 replay beyond the stubs the successor needs.

create schema if not exists auth;

do $roles$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
end
$roles$;

create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

create table public.organizations (
  id uuid primary key,
  name text not null
);

create table public.organization_subscriptions (
  organization_id uuid not null references public.organizations (id),
  sku_code text not null,
  status text not null
);

create table public.organization_memberships (
  organization_id uuid not null references public.organizations (id),
  user_id uuid not null,
  status text not null,
  roles text[] not null
);

create table public.pm_residents (
  id uuid primary key,
  organization_id uuid not null references public.organizations (id),
  user_id uuid,
  lease_id uuid,
  portal_status text
);

create table public.lease_residents (
  lease_id uuid not null,
  user_id uuid not null
);

create table public.vendor_vendors (
  id uuid primary key,
  user_id uuid
);

create table public.maintenance_work_orders (
  id uuid primary key,
  organization_id uuid not null references public.organizations (id),
  work_surface text not null,
  technician_user_id uuid,
  requested_by_user_id uuid,
  resident_id uuid,
  vendor_id uuid,
  status text not null default 'submitted',
  created_by uuid
);

create table public.maintenance_work_order_updates (
  id uuid primary key,
  work_order_id uuid not null references public.maintenance_work_orders (id),
  organization_id uuid not null references public.organizations (id),
  body text
);

create table public.comms_conversations (
  id uuid primary key,
  organization_id uuid not null references public.organizations (id),
  lease_id uuid not null,
  tenant_account_id uuid not null
);

create table public.comms_conversation_messages (
  id uuid primary key,
  conversation_id uuid not null references public.comms_conversations (id),
  organization_id uuid not null references public.organizations (id),
  hidden_at timestamptz,
  sender_user_id uuid
);

create or replace function public.is_org_member(target_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_memberships memberships
    where memberships.organization_id = target_org_id
      and memberships.user_id = auth.uid()
      and memberships.status = 'active'
  );
$$;

create or replace function public.is_maintenance_manager(target_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_memberships memberships
    where memberships.organization_id = target_org_id
      and memberships.user_id = auth.uid()
      and memberships.status = 'active'
      and (
        'property_manager' = any(memberships.roles)
        or 'organization_admin' = any(memberships.roles)
      )
  );
$$;

create or replace function public.is_maintenance_technician(target_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_memberships memberships
    where memberships.organization_id = target_org_id
      and memberships.user_id = auth.uid()
      and memberships.status = 'active'
      and 'maintenance_technician' = any(memberships.roles)
  );
$$;

create or replace function public.is_work_order_resident(target_work_order_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.maintenance_work_orders wo
    left join public.pm_residents r on r.id = wo.resident_id
    where wo.id = target_work_order_id
      and (
        wo.requested_by_user_id = auth.uid()
        or r.user_id = auth.uid()
      )
  );
$$;

create or replace function public.is_lease_resident(target_lease_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.lease_residents residents
    where residents.lease_id = target_lease_id
      and residents.user_id = auth.uid()
  );
$$;

create or replace function public.is_pm_staff(target_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_memberships memberships
    where memberships.organization_id = target_org_id
      and memberships.user_id = auth.uid()
      and memberships.status = 'active'
      and memberships.roles && array[
        'organization_admin',
        'property_manager',
        'leasing_agent',
        'maintenance_technician'
      ]::text[]
  );
$$;

create or replace function public.can_access_tenant_conversation(
  target_org_id uuid,
  target_lease_id uuid,
  target_tenant_account_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_pm_staff(target_org_id)
    or (
      public.is_lease_resident(target_lease_id)
      and exists (
        select 1
        from public.pm_residents residents
        where residents.id = target_tenant_account_id
          and residents.organization_id = target_org_id
          and residents.lease_id = target_lease_id
          and residents.user_id = auth.uid()
      )
    );
$$;

alter table public.maintenance_work_orders enable row level security;
alter table public.maintenance_work_orders force row level security;
alter table public.maintenance_work_order_updates enable row level security;
alter table public.maintenance_work_order_updates force row level security;
alter table public.comms_conversations enable row level security;
alter table public.comms_conversations force row level security;
alter table public.comms_conversation_messages enable row level security;
alter table public.comms_conversation_messages force row level security;

create policy maintenance_work_orders_select on public.maintenance_work_orders
for select using (public.is_org_member(organization_id));

create policy maintenance_work_orders_manage_manager on public.maintenance_work_orders
for all using (public.is_maintenance_manager(organization_id))
with check (public.is_maintenance_manager(organization_id));

create policy maintenance_work_orders_select_authorized on public.maintenance_work_orders
for select using (true);

create policy maintenance_work_orders_insert_authorized on public.maintenance_work_orders
for insert with check (true);

create policy maintenance_work_orders_update_authorized on public.maintenance_work_orders
for update using (true) with check (true);

create policy maintenance_work_orders_delete_authorized on public.maintenance_work_orders
for delete using (true);

create policy maintenance_updates_select on public.maintenance_work_order_updates
for select using (public.is_org_member(organization_id));

create policy comms_conversations_insert_staff on public.comms_conversations
for insert to authenticated with check (public.is_pm_staff(organization_id));

create policy comms_thread_messages_select on public.comms_conversation_messages
for select to authenticated using (public.is_pm_staff(organization_id));

create policy comms_thread_messages_update_staff on public.comms_conversation_messages
for update to authenticated
using (public.is_pm_staff(organization_id))
with check (public.is_pm_staff(organization_id));

-- Seed: three SKUs, leftover-bypass-shaped rows
insert into public.organizations (id, name) values
  ('11111111-1111-4111-8111-111111111111', 'PM Org'),
  ('22222222-2222-4222-8222-222222222222', 'FO Org'),
  ('33333333-3333-4333-8333-333333333333', 'Complete Org');

insert into public.organization_subscriptions (organization_id, sku_code, status) values
  ('11111111-1111-4111-8111-111111111111', 'mpa_property_manager', 'active'),
  ('22222222-2222-4222-8222-222222222222', 'mpa_facility_operations', 'active'),
  ('33333333-3333-4333-8333-333333333333', 'mpa_complete_platform', 'active');

insert into public.organization_memberships (organization_id, user_id, status, roles) values
  ('11111111-1111-4111-8111-111111111111', 'aaaaaaa1-0000-4000-8000-000000000001', 'active', array['property_manager']),
  ('22222222-2222-4222-8222-222222222222', 'aaaaaaa2-0000-4000-8000-000000000002', 'active', array['organization_admin', 'property_manager']),
  ('33333333-3333-4333-8333-333333333333', 'aaaaaaa3-0000-4000-8000-000000000003', 'active', array['organization_admin', 'property_manager']),
  ('33333333-3333-4333-8333-333333333333', 'aaaaaaa4-0000-4000-8000-000000000004', 'active', array['maintenance_technician']),
  ('11111111-1111-4111-8111-111111111111', 'aaaaaaa5-0000-4000-8000-000000000005', 'active', array['tenant']);

insert into public.pm_residents (id, organization_id, user_id, lease_id, portal_status) values
  ('bbbbbbbb-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'aaaaaaa5-0000-4000-8000-000000000005', 'cccccccc-0000-4000-8000-000000000001', 'active');

insert into public.lease_residents (lease_id, user_id) values
  ('cccccccc-0000-4000-8000-000000000001', 'aaaaaaa5-0000-4000-8000-000000000005');

insert into public.maintenance_work_orders (
  id, organization_id, work_surface, requested_by_user_id, resident_id, status
) values
  ('dddddddd-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'residential', 'aaaaaaa5-0000-4000-8000-000000000005', 'bbbbbbbb-0000-4000-8000-000000000001', 'submitted'),
  ('dddddddd-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 'facility', null, null, 'submitted'),
  ('dddddddd-0000-4000-8000-000000000003', '22222222-2222-4222-8222-222222222222', 'facility', null, null, 'submitted'),
  ('dddddddd-0000-4000-8000-000000000004', '22222222-2222-4222-8222-222222222222', 'residential', null, null, 'submitted'),
  ('dddddddd-0000-4000-8000-000000000005', '33333333-3333-4333-8333-333333333333', 'residential', null, null, 'submitted'),
  ('dddddddd-0000-4000-8000-000000000006', '33333333-3333-4333-8333-333333333333', 'facility', null, null, 'submitted');

insert into public.maintenance_work_order_updates (id, work_order_id, organization_id, body) values
  ('eeeeeeee-0000-4000-8000-000000000001', 'dddddddd-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'pm res'),
  ('eeeeeeee-0000-4000-8000-000000000002', 'dddddddd-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 'pm fac'),
  ('eeeeeeee-0000-4000-8000-000000000003', 'dddddddd-0000-4000-8000-000000000005', '33333333-3333-4333-8333-333333333333', 'cp res'),
  ('eeeeeeee-0000-4000-8000-000000000004', 'dddddddd-0000-4000-8000-000000000006', '33333333-3333-4333-8333-333333333333', 'cp fac');

insert into public.comms_conversations (id, organization_id, lease_id, tenant_account_id) values
  ('ffffffff-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'cccccccc-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000001');

insert into public.comms_conversation_messages (id, conversation_id, organization_id, hidden_at, sender_user_id) values
  ('99999999-0000-4000-8000-000000000001', 'ffffffff-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', null, 'aaaaaaa5-0000-4000-8000-000000000005');

grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant execute on all functions in schema public to authenticated;
