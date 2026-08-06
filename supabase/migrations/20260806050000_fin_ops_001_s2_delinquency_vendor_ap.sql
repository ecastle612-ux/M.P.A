-- FIN-OPS-001 Slice S2 — Delinquency, Late Fees & Vendor Accounts Payable
-- Operational collections + basic vendor AP. Not ERP.

-- ---------------------------------------------------------------------------
-- Late fee policies
-- ---------------------------------------------------------------------------

create table if not exists public.financial_late_fee_policies (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  property_id uuid references public.property_properties (id) on delete cascade,
  name text not null default 'Default late fee',
  grace_days int not null default 5 check (grace_days >= 0 and grace_days <= 60),
  fee_type text not null default 'flat' check (fee_type in ('flat', 'percent')),
  fee_amount numeric(14, 2) not null default 50 check (fee_amount >= 0),
  fee_percent numeric(7, 4) not null default 0 check (fee_percent >= 0 and fee_percent <= 100),
  max_fee_amount numeric(14, 2),
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists financial_late_fee_policies_org_idx
  on public.financial_late_fee_policies (organization_id, property_id, active);

-- ---------------------------------------------------------------------------
-- Delinquency cases + reminders + payment arrangements
-- ---------------------------------------------------------------------------

create table if not exists public.financial_delinquency_cases (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  property_id uuid not null references public.property_properties (id) on delete cascade,
  lease_id uuid not null references public.lease_agreements (id) on delete cascade,
  resident_id uuid references public.lease_residents (id) on delete set null,
  status text not null default 'watch'
    check (status in ('watch', 'past_due', 'in_collections', 'resolved', 'escalated')),
  open_balance numeric(14, 2) not null default 0,
  days_past_due int not null default 0,
  aging_bucket text not null default 'current'
    check (aging_bucket in ('current', '1_30', '31_60', '61_90', '90_plus')),
  last_reminder_at timestamptz,
  reminder_count int not null default 0,
  notes text,
  opened_at timestamptz not null default timezone('utc', now()),
  resolved_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, lease_id)
);

create index if not exists financial_delinquency_cases_org_status_idx
  on public.financial_delinquency_cases (organization_id, status, aging_bucket);

create table if not exists public.financial_payment_arrangements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  lease_id uuid not null references public.lease_agreements (id) on delete cascade,
  delinquency_case_id uuid references public.financial_delinquency_cases (id) on delete set null,
  status text not null default 'proposed'
    check (status in ('proposed', 'active', 'completed', 'broken', 'cancelled')),
  total_amount numeric(14, 2) not null check (total_amount > 0),
  installment_amount numeric(14, 2) not null check (installment_amount > 0),
  installments_total int not null check (installments_total >= 1),
  installments_paid int not null default 0,
  next_due_on date,
  notes text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists financial_payment_arrangements_lease_idx
  on public.financial_payment_arrangements (organization_id, lease_id, status);

-- Track which charges already received a late fee (idempotent assessment)
alter table public.financial_charges
  add column if not exists late_fee_assessed_at timestamptz;

alter table public.financial_charges
  add column if not exists source_charge_id uuid references public.financial_charges (id) on delete set null;

-- ---------------------------------------------------------------------------
-- Vendor AP (operational — mark paid; no Stripe payout execution required)
-- ---------------------------------------------------------------------------

create table if not exists public.vendor_vendors (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  email text,
  phone text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists vendor_vendors_org_idx
  on public.vendor_vendors (organization_id, name);

create table if not exists public.financial_vendor_invoices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  property_id uuid references public.property_properties (id) on delete set null,
  vendor_id uuid not null references public.vendor_vendors (id) on delete cascade,
  work_order_id uuid,
  invoice_number text not null,
  description text,
  amount numeric(14, 2) not null check (amount > 0),
  currency text not null default 'USD',
  status text not null default 'submitted'
    check (status in ('submitted', 'in_review', 'changes_requested', 'approved', 'rejected', 'scheduled', 'paid', 'void')),
  due_at date,
  submitted_at timestamptz not null default timezone('utc', now()),
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  scheduled_for date,
  paid_at timestamptz,
  rejection_reason text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, vendor_id, invoice_number)
);

create index if not exists financial_vendor_invoices_org_status_idx
  on public.financial_vendor_invoices (organization_id, status, due_at);

create table if not exists public.financial_vendor_payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  vendor_id uuid not null references public.vendor_vendors (id) on delete cascade,
  invoice_id uuid not null references public.financial_vendor_invoices (id) on delete cascade,
  property_id uuid references public.property_properties (id) on delete set null,
  amount numeric(14, 2) not null check (amount > 0),
  currency text not null default 'USD',
  status text not null default 'scheduled'
    check (status in ('scheduled', 'paid', 'cancelled')),
  method text not null default 'manual_other'
    check (method in ('manual_check', 'manual_ach', 'manual_other', 'online_stripe')),
  scheduled_for date,
  paid_at timestamptz,
  recorded_by uuid references auth.users (id) on delete set null,
  memo text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists financial_vendor_payments_org_idx
  on public.financial_vendor_payments (organization_id, status, scheduled_for);

-- Module settings defaults for S2
alter table public.financial_module_settings
  alter column late_fees_enabled set default true;

alter table public.financial_module_settings
  alter column vendor_invoices_enabled set default true;

alter table public.financial_module_settings
  alter column vendor_payments_enabled set default true;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

do $$
declare t text;
begin
  foreach t in array array[
    'financial_late_fee_policies',
    'financial_delinquency_cases',
    'financial_payment_arrangements',
    'vendor_vendors',
    'financial_vendor_invoices',
    'financial_vendor_payments'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

drop policy if exists late_fee_policies_select on public.financial_late_fee_policies;
create policy late_fee_policies_select on public.financial_late_fee_policies
for select using (public.is_org_member(organization_id));

drop policy if exists late_fee_policies_manage on public.financial_late_fee_policies;
create policy late_fee_policies_manage on public.financial_late_fee_policies
for all using (public.is_org_manager(organization_id))
with check (public.is_org_manager(organization_id));

drop policy if exists delinquency_cases_select on public.financial_delinquency_cases;
create policy delinquency_cases_select on public.financial_delinquency_cases
for select using (
  public.is_org_manager(organization_id) or public.is_lease_resident(lease_id)
);

drop policy if exists delinquency_cases_manage on public.financial_delinquency_cases;
create policy delinquency_cases_manage on public.financial_delinquency_cases
for all using (public.is_org_manager(organization_id))
with check (public.is_org_manager(organization_id));

drop policy if exists payment_arrangements_select on public.financial_payment_arrangements;
create policy payment_arrangements_select on public.financial_payment_arrangements
for select using (
  public.is_org_manager(organization_id) or public.is_lease_resident(lease_id)
);

drop policy if exists payment_arrangements_manage on public.financial_payment_arrangements;
create policy payment_arrangements_manage on public.financial_payment_arrangements
for all using (public.is_org_manager(organization_id))
with check (public.is_org_manager(organization_id));

drop policy if exists vendor_vendors_select on public.vendor_vendors;
create policy vendor_vendors_select on public.vendor_vendors
for select using (public.is_org_member(organization_id));

drop policy if exists vendor_vendors_manage on public.vendor_vendors;
create policy vendor_vendors_manage on public.vendor_vendors
for all using (public.is_org_manager(organization_id))
with check (public.is_org_manager(organization_id));

drop policy if exists vendor_invoices_select on public.financial_vendor_invoices;
create policy vendor_invoices_select on public.financial_vendor_invoices
for select using (public.is_org_member(organization_id));

drop policy if exists vendor_invoices_manage on public.financial_vendor_invoices;
create policy vendor_invoices_manage on public.financial_vendor_invoices
for all using (public.is_org_manager(organization_id))
with check (public.is_org_manager(organization_id));

drop policy if exists vendor_payments_select on public.financial_vendor_payments;
create policy vendor_payments_select on public.financial_vendor_payments
for select using (public.is_org_member(organization_id));

drop policy if exists vendor_payments_manage on public.financial_vendor_payments;
create policy vendor_payments_manage on public.financial_vendor_payments
for all using (public.is_org_manager(organization_id))
with check (public.is_org_manager(organization_id));
