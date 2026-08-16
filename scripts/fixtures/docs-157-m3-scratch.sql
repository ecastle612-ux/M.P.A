-- docs/157 M3 scratch identity, July tables, and authorization helpers.
-- Does not touch mpa-prod. Does not create financial_* (M1 does that).

create schema if not exists auth;

create table if not exists auth.users (
  id uuid primary key
);

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
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references public.organizations (id),
  sku_code text not null,
  status text not null
);

create table public.organization_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  user_id uuid not null,
  roles text[] not null default '{}',
  status text not null default 'active',
  operating_scope text,
  unique (organization_id, user_id)
);

create table public.permission_capabilities (
  key text primary key,
  namespace text,
  description text
);

create table public.role_permission_grants (
  role text not null,
  capability_key text not null references public.permission_capabilities (key),
  primary key (role, capability_key)
);

create table public.organization_permission_overrides (
  organization_id uuid not null,
  role text not null,
  capability_key text not null,
  effect text not null
);

create table public.property_properties (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  name text not null default 'Property'
);

create table public.property_units (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  property_id uuid not null references public.property_properties (id),
  unit_label text not null default '1',
  status text not null default 'occupied'
);

create table public.lease_agreements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  property_id uuid not null references public.property_properties (id),
  unit_id uuid references public.property_units (id),
  status text not null default 'active',
  start_date date not null default current_date,
  end_date date,
  rent_amount numeric(14, 2) not null default 0,
  currency text not null default 'USD',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.lease_residents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  lease_id uuid not null references public.lease_agreements (id),
  user_id uuid,
  display_name text not null default 'Resident',
  email text,
  is_primary boolean not null default true,
  financial_status text not null default 'current',
  created_at timestamptz not null default timezone('utc', now())
);

create table public.pm_residents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  property_id uuid,
  unit_id uuid,
  first_name text,
  last_name text,
  display_name text,
  email text,
  user_id uuid,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.vendor_vendors (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  user_id uuid
);

create or replace function public.has_org_capability(target_org_id uuid, required_capability text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with member_roles as (
    select distinct unnest(memberships.roles) as role
    from public.organization_memberships memberships
    where memberships.organization_id = target_org_id
      and memberships.user_id = auth.uid()
      and memberships.status = 'active'
  ),
  base_grants as (
    select grants.capability_key
    from public.role_permission_grants grants
    join member_roles on member_roles.role = grants.role
    where grants.capability_key = required_capability
       or grants.capability_key = split_part(required_capability, ':', 1) || ':*'
  ),
  deny_overrides as (
    select 1
    from public.organization_permission_overrides overrides
    join member_roles on member_roles.role = overrides.role
    where overrides.organization_id = target_org_id
      and overrides.effect = 'deny'
      and (
        overrides.capability_key = required_capability
        or overrides.capability_key = split_part(required_capability, ':', 1) || ':*'
      )
    limit 1
  ),
  allow_overrides as (
    select 1
    from public.organization_permission_overrides overrides
    join member_roles on member_roles.role = overrides.role
    where overrides.organization_id = target_org_id
      and overrides.effect = 'allow'
      and (
        overrides.capability_key = required_capability
        or overrides.capability_key = split_part(required_capability, ':', 1) || ':*'
      )
    limit 1
  )
  select case
    when exists (select 1 from deny_overrides) then false
    when exists (select 1 from allow_overrides) then true
    else exists (select 1 from base_grants)
  end;
$$;

create or replace function public.org_sku(target_org_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select subscriptions.sku_code
  from public.organization_subscriptions subscriptions
  where subscriptions.organization_id = target_org_id
    and subscriptions.status is distinct from 'canceled'
  limit 1;
$$;

create or replace function public.org_allows_work_surface(target_org_id uuid, target_surface text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when target_surface = 'residential' then
      public.org_sku(target_org_id) in ('mpa_property_manager', 'mpa_complete_platform')
    when target_surface = 'facility' then
      public.org_sku(target_org_id) in ('mpa_facility_operations', 'mpa_complete_platform')
    else false
  end;
$$;

create or replace function public.member_operating_scope(target_org_id uuid, target_user_id uuid default auth.uid())
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when memberships.roles && array['tenant', 'vendor', 'property_owner']::text[]
      and not memberships.roles && array[
        'organization_admin',
        'property_manager',
        'leasing_agent',
        'maintenance_technician'
      ]::text[]
    then null
    when memberships.operating_scope in ('property_operations', 'facility_operations', 'both')
    then memberships.operating_scope
    when public.org_sku(target_org_id) = 'mpa_property_manager' then 'property_operations'
    when public.org_sku(target_org_id) = 'mpa_facility_operations' then 'facility_operations'
    when public.org_sku(target_org_id) = 'mpa_complete_platform' then 'both'
    else null
  end
  from public.organization_memberships memberships
  where memberships.organization_id = target_org_id
    and memberships.user_id = target_user_id
    and memberships.status = 'active'
  limit 1;
$$;

create or replace function public.member_allows_work_surface(
  target_org_id uuid,
  target_surface text,
  target_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.org_allows_work_surface(target_org_id, target_surface)
    and (
      public.org_sku(target_org_id) is distinct from 'mpa_complete_platform'
      or (
        case
          when target_surface = 'residential' then
            public.member_operating_scope(target_org_id, target_user_id) in ('property_operations', 'both')
          when target_surface = 'facility' then
            public.member_operating_scope(target_org_id, target_user_id) in ('facility_operations', 'both')
          else false
        end
      )
    );
$$;

create or replace function public.is_org_manager(target_org_id uuid)
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

insert into public.permission_capabilities (key, namespace, description) values
  ('pm.finance:read', 'pm.finance', 'read'),
  ('pm.finance:charge.write', 'pm.finance', 'charge write'),
  ('pm.finance:payment.refund', 'pm.finance', 'refund'),
  ('pm.finance:late_fee.manage', 'pm.finance', 'late fee'),
  ('pm.finance:vendor_invoice.review', 'pm.finance', 'vendor invoice'),
  ('pm.finance:vendor_payment.release', 'pm.finance', 'vendor payment'),
  ('pm.finance:reports.read', 'pm.finance', 'reports'),
  ('pm.finance:settings.manage', 'pm.finance', 'settings'),
  ('financial:read', 'financial', 'legacy read'),
  ('financial:create', 'financial', 'legacy create');

insert into public.role_permission_grants (role, capability_key) values
  ('organization_admin', 'pm.finance:read'),
  ('organization_admin', 'pm.finance:charge.write'),
  ('organization_admin', 'pm.finance:payment.refund'),
  ('organization_admin', 'pm.finance:late_fee.manage'),
  ('organization_admin', 'pm.finance:vendor_invoice.review'),
  ('organization_admin', 'pm.finance:vendor_payment.release'),
  ('organization_admin', 'pm.finance:reports.read'),
  ('organization_admin', 'pm.finance:settings.manage'),
  ('property_manager', 'pm.finance:read'),
  ('property_manager', 'pm.finance:charge.write'),
  ('property_manager', 'pm.finance:payment.refund'),
  ('property_manager', 'pm.finance:late_fee.manage'),
  ('property_manager', 'pm.finance:vendor_invoice.review'),
  ('property_manager', 'pm.finance:vendor_payment.release'),
  ('property_manager', 'pm.finance:reports.read'),
  ('property_manager', 'pm.finance:settings.manage'),
  ('leasing_agent', 'pm.finance:read'),
  ('property_owner', 'pm.finance:read'),
  ('property_owner', 'pm.finance:reports.read'),
  ('organization_admin', 'financial:read'),
  ('organization_admin', 'financial:create'),
  ('property_manager', 'financial:read'),
  ('property_manager', 'financial:create'),
  ('tenant', 'financial:read'),
  ('tenant', 'financial:create');

create table public.rent_charges (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  property_id uuid,
  lease_id uuid,
  tenant_id uuid,
  amount numeric(14, 2) not null,
  amount_paid numeric(14, 2) not null default 0,
  status text not null default 'open'
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  amount numeric(14, 2) not null,
  created_by uuid
);

create table public.payment_receipts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id)
);

create table public.payment_customers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id)
);

create table public.payment_attempts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id)
);

create table public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id)
);

create table public.billing_ledger_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id)
);

create table public.financial_activity (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id)
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id)
);

create table public.owner_statements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id)
);

create table public.vendor_invoices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  amount numeric(14, 2) not null
);

create table public.vendor_payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  amount numeric(14, 2) not null
);

create table public.late_fees (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id)
);

create table public.billing_schedules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id)
);

create table public.billing_invoices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id)
);

create table public.billing_adjustments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id)
);

create table public.autopay_enrollments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id)
);

alter table public.rent_charges enable row level security;
alter table public.payments enable row level security;
alter table public.vendor_invoices enable row level security;

create policy rent_charges_select_authorized on public.rent_charges
  for select using (public.has_org_capability(organization_id, 'financial:read'));
create policy rent_charges_insert_authorized on public.rent_charges
  for insert with check (public.has_org_capability(organization_id, 'financial:create'));
create policy rent_charges_update_authorized on public.rent_charges
  for update using (public.has_org_capability(organization_id, 'financial:create'));
create policy rent_charges_delete_authorized on public.rent_charges
  for delete using (public.has_org_capability(organization_id, 'financial:create'));

create policy payments_select_authorized on public.payments
  for select using (public.has_org_capability(organization_id, 'financial:read'));
create policy payments_insert_authorized on public.payments
  for insert with check (public.has_org_capability(organization_id, 'financial:create'));

create policy vendor_invoices_select_org on public.vendor_invoices
  for select using (public.has_org_capability(organization_id, 'financial:read'));
create policy vendor_invoices_manage_org on public.vendor_invoices
  for all using (public.has_org_capability(organization_id, 'financial:create'))
  with check (public.has_org_capability(organization_id, 'financial:create'));
