-- Production-shaped scratch schema for docs/170 / docs/166 apply.
-- Only the objects the unapplied tenant-lifecycle migration needs.

create extension if not exists pgcrypto;

create schema if not exists auth;

create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'org',
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.organization_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null,
  roles text[] not null default array['tenant']::text[],
  status text not null default 'active',
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.organization_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  email text not null,
  roles text[] not null default array['property_manager']::text[],
  status text not null default 'pending',
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.property_properties (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null default 'property',
  status text not null default 'active',
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.property_units (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  property_id uuid not null references public.property_properties (id) on delete cascade,
  unit_label text not null default '1A',
  status text not null default 'active',
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.pm_residents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  property_id uuid not null references public.property_properties (id),
  unit_id uuid not null references public.property_units (id),
  first_name text not null default 'A',
  last_name text not null default 'B',
  display_name text not null default 'A B',
  email text not null,
  status text not null default 'active',
  portal_status text not null default 'pending_activation',
  user_id uuid,
  lease_id uuid,
  created_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, email)
);

create table if not exists public.lease_agreements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  property_id uuid not null references public.property_properties (id),
  unit_id uuid references public.property_units (id),
  resident_id uuid references public.pm_residents (id),
  status text not null default 'active',
  start_date date not null,
  end_date date,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.pm_residents
  drop constraint if exists pm_residents_lease_id_fkey;
alter table public.pm_residents
  add constraint pm_residents_lease_id_fkey
  foreign key (lease_id) references public.lease_agreements (id) on delete set null;

create table if not exists public.lease_residents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  lease_id uuid not null references public.lease_agreements (id) on delete cascade,
  user_id uuid,
  display_name text not null default 'Resident',
  email text,
  is_primary boolean not null default true,
  financial_status text not null default 'current',
  created_at timestamptz not null default timezone('utc', now()),
  unique (lease_id, email)
);

create table if not exists public.financial_charges (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  lease_id uuid not null references public.lease_agreements (id),
  amount numeric not null default 0,
  status text not null default 'open',
  period_start date,
  due_at date,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.financial_payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  lease_id uuid not null references public.lease_agreements (id),
  amount numeric not null default 0,
  status text not null default 'succeeded',
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.financial_receipts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  payment_id uuid not null references public.financial_payments (id) on delete cascade,
  lease_id uuid not null references public.lease_agreements (id) on delete cascade,
  resident_id uuid references public.lease_residents (id) on delete set null,
  receipt_number text not null,
  amount numeric not null check (amount > 0),
  currency text not null default 'USD',
  issued_at timestamptz not null default timezone('utc', now()),
  payload jsonb not null default '{}'::jsonb,
  unique (organization_id, receipt_number),
  unique (payment_id)
);

create table if not exists public.financial_payment_allocations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  payment_id uuid not null references public.financial_payments (id),
  charge_id uuid not null references public.financial_charges (id),
  amount numeric not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.financial_ledger_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  lease_id uuid,
  entry_type text not null default 'charge',
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.financial_charge_schedules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  lease_id uuid not null references public.lease_agreements (id),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.comms_conversations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  lease_id uuid,
  tenant_account_id uuid,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.comms_conversation_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.comms_conversations (id) on delete cascade,
  sender_user_id uuid,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.maintenance_work_orders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  property_id uuid,
  unit_id uuid,
  resident_id uuid,
  requested_by_user_id uuid,
  work_surface text not null default 'residential',
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.document_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  entity_type text not null default 'organization',
  entity_id uuid not null,
  created_at timestamptz not null default timezone('utc', now())
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

create or replace function public.is_resident_writer(target_org_id uuid)
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
      and memberships.roles && array['property_manager','organization_admin']::text[]
  );
$$;

create or replace function public.is_pm_comms_staff(target_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_resident_writer(target_org_id);
$$;

create or replace function public.member_has_finance_capability(target_org_id uuid, required_capability text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_resident_writer(target_org_id) and required_capability is not null;
$$;

alter table public.financial_receipts enable row level security;
alter table public.financial_charges enable row level security;
alter table public.financial_payments enable row level security;
alter table public.pm_residents enable row level security;
alter table public.lease_agreements enable row level security;
alter table public.lease_residents enable row level security;
alter table public.document_documents enable row level security;
alter table public.comms_conversation_messages enable row level security;
alter table public.maintenance_work_orders enable row level security;
alter table public.financial_payment_allocations enable row level security;
alter table public.financial_ledger_entries enable row level security;
alter table public.financial_charge_schedules enable row level security;

drop policy if exists financial_receipts_select_staff on public.financial_receipts;
create policy financial_receipts_select_staff
on public.financial_receipts
for select
using (public.member_has_finance_capability(organization_id, 'pm.finance:read'));

drop policy if exists financial_receipts_select_resident on public.financial_receipts;
create policy financial_receipts_select_resident
on public.financial_receipts
for select
using (false);

drop policy if exists financial_charges_select_staff on public.financial_charges;
create policy financial_charges_select_staff
on public.financial_charges for select
using (public.member_has_finance_capability(organization_id, 'pm.finance:read'));

drop policy if exists financial_charges_select_resident on public.financial_charges;
create policy financial_charges_select_resident
on public.financial_charges for select using (false);

drop policy if exists financial_payments_select_staff on public.financial_payments;
create policy financial_payments_select_staff
on public.financial_payments for select
using (public.member_has_finance_capability(organization_id, 'pm.finance:read'));

drop policy if exists financial_payments_select_resident on public.financial_payments;
create policy financial_payments_select_resident
on public.financial_payments for select using (false);

drop policy if exists financial_payment_allocations_select_resident on public.financial_payment_allocations;
create policy financial_payment_allocations_select_resident
on public.financial_payment_allocations for select using (false);

drop policy if exists financial_ledger_entries_select_resident on public.financial_ledger_entries;
create policy financial_ledger_entries_select_resident
on public.financial_ledger_entries for select using (false);

drop policy if exists financial_charge_schedules_select_resident on public.financial_charge_schedules;
create policy financial_charge_schedules_select_resident
on public.financial_charge_schedules for select using (false);

drop policy if exists pm_residents_select_member on public.pm_residents;
create policy pm_residents_select_member on public.pm_residents for select using (false);

drop policy if exists lease_agreements_select_member on public.lease_agreements;
create policy lease_agreements_select_member on public.lease_agreements for select using (false);

drop policy if exists lease_residents_select on public.lease_residents;
create policy lease_residents_select on public.lease_residents for select using (false);

drop policy if exists document_documents_select_member on public.document_documents;
create policy document_documents_select_member on public.document_documents for select using (false);

drop policy if exists comms_thread_messages_insert on public.comms_conversation_messages;
create policy comms_thread_messages_insert on public.comms_conversation_messages for insert with check (false);

drop policy if exists maintenance_work_orders_insert_resident on public.maintenance_work_orders;
create policy maintenance_work_orders_insert_resident on public.maintenance_work_orders for insert with check (false);

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
end
$$;

grant usage on schema public to authenticated;
grant select on all tables in schema public to authenticated;
alter default privileges in schema public grant select on tables to authenticated;
