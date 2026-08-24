-- docs/188 Tenant Stripe rent collection + admin-controlled fees
-- In-repo schema only. Do not apply to Production from this package.
-- Does not enable stripe_payment_execution_enabled.
-- Does not unfreeze July. Does not authorize M5.
-- Does not write July tables.

-- ---------------------------------------------------------------------------
-- Charge / schedule fee metadata (future-only amount changes)
-- ---------------------------------------------------------------------------

alter table public.financial_charge_schedules
  add column if not exists fee_category text not null default 'other';

alter table public.financial_charge_schedules
  add column if not exists autopay_eligible boolean not null default false;

alter table public.financial_charges
  add column if not exists fee_category text not null default 'other';

alter table public.financial_charges
  add column if not exists autopay_eligible boolean not null default false;

update public.financial_charge_schedules
set fee_category = 'rent',
    autopay_eligible = true
where charge_type = 'rent';

update public.financial_charges
set fee_category = 'rent',
    autopay_eligible = true
where charge_type = 'rent';

update public.financial_charges
set fee_category = 'late_fee'
where charge_type = 'late_fee';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'financial_charge_schedules_fee_category_check'
  ) then
    alter table public.financial_charge_schedules
      add constraint financial_charge_schedules_fee_category_check
      check (fee_category in ('rent', 'parking', 'pet', 'utilities', 'other'));
  end if;
  if not exists (
    select 1
    from pg_constraint
    where conname = 'financial_charges_fee_category_check'
  ) then
    alter table public.financial_charges
      add constraint financial_charges_fee_category_check
      check (fee_category in ('rent', 'parking', 'pet', 'utilities', 'deposit', 'damage', 'late_fee', 'other'));
  end if;
end $$;

create unique index if not exists financial_charges_schedule_period_uidx
  on public.financial_charges (schedule_id, period_start)
  where schedule_id is not null and period_start is not null;

-- ---------------------------------------------------------------------------
-- Payment destination / refund / dispute fields
-- ---------------------------------------------------------------------------

alter table public.financial_payments
  add column if not exists stripe_connect_account_id text;

alter table public.financial_payments
  add column if not exists selected_charge_ids uuid[] not null default '{}'::uuid[];

alter table public.financial_payments
  add column if not exists stripe_refund_id text;

alter table public.financial_payments
  add column if not exists stripe_dispute_id text;

alter table public.financial_payments
  add column if not exists dispute_status text;

alter table public.financial_payments
  add column if not exists metadata jsonb not null default '{}'::jsonb;

-- ---------------------------------------------------------------------------
-- Tenant AutoPay (FIN-OPS, not July autopay_enrollments)
-- ---------------------------------------------------------------------------

create table if not exists public.financial_stripe_customers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  lease_id uuid not null references public.lease_agreements (id) on delete cascade,
  resident_id uuid references public.lease_residents (id) on delete set null,
  stripe_account_id text not null,
  stripe_customer_id text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, lease_id, stripe_account_id)
);

create table if not exists public.financial_autopay_enrollments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  lease_id uuid not null references public.lease_agreements (id) on delete cascade,
  resident_id uuid references public.lease_residents (id) on delete set null,
  stripe_account_id text not null,
  stripe_customer_id text not null,
  stripe_payment_method_id text,
  payment_method_brand text,
  payment_method_last4 text,
  status text not null default 'active'
    check (status in ('active', 'revoked', 'paused')),
  consent_text text not null,
  consent_version text not null default 'docs-188-v1',
  consented_at timestamptz,
  revoked_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, lease_id)
);

alter table public.financial_stripe_customers enable row level security;
alter table public.financial_autopay_enrollments enable row level security;

drop policy if exists financial_stripe_customers_select_staff on public.financial_stripe_customers;
create policy financial_stripe_customers_select_staff
on public.financial_stripe_customers
for select
using (public.member_has_finance_capability(organization_id, 'pm.finance:read'));

drop policy if exists financial_stripe_customers_select_resident on public.financial_stripe_customers;
create policy financial_stripe_customers_select_resident
on public.financial_stripe_customers
for select
using (public.finance_resident_owns_lease(organization_id, lease_id));

drop policy if exists financial_autopay_enrollments_select_staff on public.financial_autopay_enrollments;
create policy financial_autopay_enrollments_select_staff
on public.financial_autopay_enrollments
for select
using (public.member_has_finance_capability(organization_id, 'pm.finance:read'));

drop policy if exists financial_autopay_enrollments_select_resident on public.financial_autopay_enrollments;
create policy financial_autopay_enrollments_select_resident
on public.financial_autopay_enrollments
for select
using (public.finance_resident_owns_lease(organization_id, lease_id));

do $$
declare
  t text;
begin
  foreach t in array array[
    'financial_stripe_customers',
    'financial_autopay_enrollments'
  ]
  loop
    if exists (select 1 from pg_roles where rolname = 'authenticated') then
      execute format('grant select on table public.%I to authenticated', t);
      execute format('revoke insert, update, delete on table public.%I from authenticated', t);
    end if;
    if exists (select 1 from pg_roles where rolname = 'anon') then
      execute format('revoke all on table public.%I from anon', t);
    end if;
    if to_regclass('public.' || t) is not null then
      execute format('drop trigger if exists finance_ops_write_guard on public.%I', t);
      execute format(
        'create trigger finance_ops_write_guard
           before insert or update or delete on public.%I
           for each row execute function public.finance_ops_write_guard()',
        t
      );
    end if;
  end loop;
end $$;
