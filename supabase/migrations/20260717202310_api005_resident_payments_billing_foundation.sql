-- API-005: Resident Payments & Billing foundation
-- Extends Phase 10 financial ops with provider rails, AutoPay, receipts, ledger.

-- ---------------------------------------------------------------------------
-- Extend Phase 10 enums via check constraint replacements
-- ---------------------------------------------------------------------------

alter table public.rent_charges drop constraint if exists rent_charges_status_check;
alter table public.rent_charges
  add constraint rent_charges_status_check check (
    status in (
      'draft', 'pending', 'partial', 'paid', 'overdue', 'waived', 'cancelled', 'in_collections'
    )
  );

alter table public.rent_charges drop constraint if exists rent_charges_charge_type_check;
alter table public.rent_charges
  add constraint rent_charges_charge_type_check check (
    charge_type in (
      'monthly_rent', 'custom', 'security_deposit', 'late_fee', 'adjustment', 'credit', 'other'
    )
  );

alter table public.payments drop constraint if exists payments_payment_method_check;
alter table public.payments
  add constraint payments_payment_method_check check (
    payment_method in (
      'manual', 'check', 'cash', 'ach_placeholder', 'card_placeholder',
      'ach', 'card', 'debit', 'stripe', 'provider'
    )
  );

alter table public.payments drop constraint if exists payments_status_check;
alter table public.payments
  add constraint payments_status_check check (
    status in (
      'pending', 'processing', 'requires_action', 'completed', 'failed',
      'refunded', 'partially_refunded', 'canceled', 'awaiting_reconciliation'
    )
  );

alter table public.financial_activity drop constraint if exists financial_activity_activity_type_check;
alter table public.financial_activity
  add constraint financial_activity_activity_type_check check (
    activity_type in (
      'charge_created', 'charge_published', 'payment_received', 'payment_failed',
      'payment_initiated', 'late_fee_applied', 'expense_recorded', 'statement_generated',
      'balance_updated', 'refund_completed', 'credit_applied', 'adjustment_applied',
      'receipt_issued', 'autopay_enrolled', 'autopay_disabled', 'reconciliation'
    )
  );

-- ---------------------------------------------------------------------------
-- billing_schedules
-- ---------------------------------------------------------------------------

create table if not exists public.billing_schedules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  lease_id uuid not null,
  tenant_id uuid not null references public.tenants (id) on delete restrict,
  property_id uuid not null references public.properties (id) on delete cascade,
  unit_id uuid not null references public.units (id) on delete cascade,
  amount numeric(12, 2) not null,
  currency text not null default 'usd',
  due_day_of_month integer not null default 1 check (due_day_of_month between 1 and 28),
  grace_days integer not null default 5 check (grace_days >= 0),
  late_fee_amount numeric(12, 2) not null default 0 check (late_fee_amount >= 0),
  late_fee_type text not null default 'flat' check (late_fee_type in ('flat', 'percent')),
  late_fee_percent numeric(5, 2) not null default 0 check (late_fee_percent >= 0),
  active boolean not null default true,
  next_period_start date,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users (id) on delete cascade,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  unique (organization_id, lease_id),
  constraint billing_schedules_lease_fk
    foreign key (lease_id, organization_id)
    references public.leases (id, organization_id)
    on delete cascade,
  constraint billing_schedules_amount_check check (amount >= 0)
);

create index if not exists billing_schedules_org_active_idx
  on public.billing_schedules (organization_id, active)
  where active = true;

-- ---------------------------------------------------------------------------
-- billing_invoices
-- ---------------------------------------------------------------------------

create table if not exists public.billing_invoices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  invoice_number text not null,
  lease_id uuid not null,
  tenant_id uuid not null references public.tenants (id) on delete restrict,
  property_id uuid not null references public.properties (id) on delete cascade,
  unit_id uuid not null references public.units (id) on delete cascade,
  status text not null default 'draft' check (
    status in ('draft', 'published', 'paid', 'partial', 'void', 'overdue')
  ),
  period_start date,
  period_end date,
  due_date date not null,
  total_amount numeric(12, 2) not null default 0,
  amount_paid numeric(12, 2) not null default 0,
  outstanding_balance numeric(12, 2) not null default 0,
  published_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users (id) on delete cascade,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  unique (organization_id, invoice_number),
  constraint billing_invoices_lease_fk
    foreign key (lease_id, organization_id)
    references public.leases (id, organization_id)
    on delete cascade
);

create index if not exists billing_invoices_org_tenant_idx
  on public.billing_invoices (organization_id, tenant_id, status);

-- ---------------------------------------------------------------------------
-- payment_customers (provider customer refs — no PAN)
-- ---------------------------------------------------------------------------

create table if not exists public.payment_customers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  provider text not null default 'stripe',
  external_customer_id text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  unique (organization_id, tenant_id, provider),
  unique (provider, external_customer_id)
);

-- ---------------------------------------------------------------------------
-- payment_methods (token refs only — last4/brand display)
-- ---------------------------------------------------------------------------

create table if not exists public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  payment_customer_id uuid not null,
  provider text not null default 'stripe',
  external_method_id text not null,
  method_type text not null check (method_type in ('card', 'debit', 'ach', 'other')),
  brand text,
  last4 text,
  exp_month integer,
  exp_year integer,
  bank_name text,
  is_default boolean not null default false,
  status text not null default 'active' check (status in ('active', 'detached', 'expired', 'failed')),
  detached_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  unique (provider, external_method_id),
  constraint payment_methods_customer_fk
    foreign key (payment_customer_id, organization_id)
    references public.payment_customers (id, organization_id)
    on delete cascade
);

create index if not exists payment_methods_org_tenant_idx
  on public.payment_methods (organization_id, tenant_id)
  where status = 'active';

-- ---------------------------------------------------------------------------
-- payment_attempts
-- ---------------------------------------------------------------------------

create table if not exists public.payment_attempts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  attempt_number text not null,
  tenant_id uuid not null references public.tenants (id) on delete restrict,
  lease_id uuid,
  payment_id uuid,
  payment_method_id uuid,
  provider text not null default 'stripe',
  external_attempt_id text,
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null default 'usd',
  status text not null default 'processing' check (
    status in (
      'requires_action', 'processing', 'succeeded', 'failed', 'canceled',
      'refunded', 'partially_refunded', 'awaiting_reconciliation'
    )
  ),
  source text not null default 'one_time' check (
    source in ('one_time', 'autopay', 'pm_recorded', 'retry')
  ),
  charge_ids uuid[] not null default '{}',
  failure_code text,
  failure_message text,
  client_secret text,
  retry_count integer not null default 0,
  reconciled_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  unique (organization_id, attempt_number),
  unique (provider, external_attempt_id)
);

create index if not exists payment_attempts_org_status_idx
  on public.payment_attempts (organization_id, status, created_at desc);

create index if not exists payment_attempts_reconcile_idx
  on public.payment_attempts (organization_id, status)
  where status = 'awaiting_reconciliation';

-- ---------------------------------------------------------------------------
-- autopay_enrollments
-- ---------------------------------------------------------------------------

create table if not exists public.autopay_enrollments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  lease_id uuid not null,
  payment_method_id uuid not null,
  status text not null default 'active' check (status in ('active', 'disabled', 'paused')),
  consent_version text not null,
  consented_at timestamptz not null,
  revoked_at timestamptz,
  max_amount numeric(12, 2),
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  unique (organization_id, lease_id),
  constraint autopay_enrollments_lease_fk
    foreign key (lease_id, organization_id)
    references public.leases (id, organization_id)
    on delete cascade,
  constraint autopay_enrollments_method_fk
    foreign key (payment_method_id, organization_id)
    references public.payment_methods (id, organization_id)
    on delete restrict
);

-- ---------------------------------------------------------------------------
-- payment_receipts
-- ---------------------------------------------------------------------------

create table if not exists public.payment_receipts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  receipt_number text not null,
  payment_id uuid,
  payment_attempt_id uuid,
  tenant_id uuid not null references public.tenants (id) on delete restrict,
  lease_id uuid,
  amount numeric(12, 2) not null,
  currency text not null default 'usd',
  method_summary text,
  content_hash text not null,
  payload jsonb not null default '{}'::jsonb,
  issued_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  unique (organization_id, receipt_number)
);

create index if not exists payment_receipts_org_tenant_idx
  on public.payment_receipts (organization_id, tenant_id, issued_at desc);

-- ---------------------------------------------------------------------------
-- billing_adjustments (credits / adjustments — ledger-only)
-- ---------------------------------------------------------------------------

create table if not exists public.billing_adjustments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  adjustment_number text not null,
  tenant_id uuid not null references public.tenants (id) on delete restrict,
  lease_id uuid,
  rent_charge_id uuid,
  adjustment_type text not null check (adjustment_type in ('credit', 'adjustment', 'waive')),
  amount numeric(12, 2) not null check (amount > 0),
  reason text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  unique (organization_id, adjustment_number)
);

-- ---------------------------------------------------------------------------
-- billing_ledger_entries (append-only resident ledger — never delete)
-- ---------------------------------------------------------------------------

create table if not exists public.billing_ledger_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  entry_number text not null,
  tenant_id uuid not null references public.tenants (id) on delete restrict,
  lease_id uuid,
  property_id uuid,
  entry_type text not null check (
    entry_type in (
      'charge', 'payment', 'payment_pending', 'credit', 'adjustment',
      'late_fee', 'refund', 'fee', 'receipt', 'waive'
    )
  ),
  amount numeric(12, 2) not null,
  balance_after numeric(12, 2),
  currency text not null default 'usd',
  related_entity_type text,
  related_entity_id uuid,
  summary text not null,
  payload jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  unique (organization_id, entry_number)
);

create index if not exists billing_ledger_org_tenant_idx
  on public.billing_ledger_entries (organization_id, tenant_id, created_at desc);

create index if not exists billing_ledger_org_property_idx
  on public.billing_ledger_entries (organization_id, property_id, created_at desc)
  where property_id is not null;

-- Forbid deletes on ledger (defense in depth)
create or replace function public.prevent_billing_ledger_delete()
returns trigger
language plpgsql
as $$
begin
  raise exception 'billing_ledger_entries are append-only; deletes are forbidden';
end;
$$;

drop trigger if exists trg_billing_ledger_no_delete on public.billing_ledger_entries;
create trigger trg_billing_ledger_no_delete
before delete on public.billing_ledger_entries
for each row
execute function public.prevent_billing_ledger_delete();

-- ---------------------------------------------------------------------------
-- billing_audit_events
-- ---------------------------------------------------------------------------

create table if not exists public.billing_audit_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  entity_type text not null,
  entity_id uuid,
  event_type text not null,
  summary text not null,
  actor_user_id uuid references auth.users (id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists billing_audit_org_created_idx
  on public.billing_audit_events (organization_id, created_at desc);

create index if not exists billing_audit_entity_idx
  on public.billing_audit_events (organization_id, entity_type, entity_id);

-- ---------------------------------------------------------------------------
-- capabilities
-- ---------------------------------------------------------------------------

insert into public.permission_capabilities (key, namespace, description)
values
  ('financial:admin', 'financial', 'Elevated financial ops: refunds above threshold, billing settings')
on conflict (key) do nothing;

insert into public.role_permission_grants (role, capability_key)
values
  ('property_manager', 'financial:admin'),
  ('tenant', 'financial:read'),
  ('tenant', 'financial:create')
on conflict (role, capability_key) do nothing;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.billing_schedules enable row level security;
alter table public.billing_invoices enable row level security;
alter table public.payment_customers enable row level security;
alter table public.payment_methods enable row level security;
alter table public.payment_attempts enable row level security;
alter table public.autopay_enrollments enable row level security;
alter table public.payment_receipts enable row level security;
alter table public.billing_adjustments enable row level security;
alter table public.billing_ledger_entries enable row level security;
alter table public.billing_audit_events enable row level security;

-- schedules
drop policy if exists billing_schedules_select on public.billing_schedules;
create policy billing_schedules_select on public.billing_schedules for select
using (public.has_org_capability(organization_id, 'financial:read'));

drop policy if exists billing_schedules_insert on public.billing_schedules;
create policy billing_schedules_insert on public.billing_schedules for insert
with check (public.has_org_capability(organization_id, 'financial:create') and created_by = auth.uid());

drop policy if exists billing_schedules_update on public.billing_schedules;
create policy billing_schedules_update on public.billing_schedules for update
using (public.has_org_capability(organization_id, 'financial:update'))
with check (public.has_org_capability(organization_id, 'financial:update'));

-- invoices
drop policy if exists billing_invoices_select on public.billing_invoices;
create policy billing_invoices_select on public.billing_invoices for select
using (public.has_org_capability(organization_id, 'financial:read'));

drop policy if exists billing_invoices_insert on public.billing_invoices;
create policy billing_invoices_insert on public.billing_invoices for insert
with check (public.has_org_capability(organization_id, 'financial:create') and created_by = auth.uid());

drop policy if exists billing_invoices_update on public.billing_invoices;
create policy billing_invoices_update on public.billing_invoices for update
using (public.has_org_capability(organization_id, 'financial:update'))
with check (public.has_org_capability(organization_id, 'financial:update'));

-- payment_customers
drop policy if exists payment_customers_select on public.payment_customers;
create policy payment_customers_select on public.payment_customers for select
using (public.has_org_capability(organization_id, 'financial:read'));

drop policy if exists payment_customers_insert on public.payment_customers;
create policy payment_customers_insert on public.payment_customers for insert
with check (public.has_org_capability(organization_id, 'financial:create'));

drop policy if exists payment_customers_update on public.payment_customers;
create policy payment_customers_update on public.payment_customers for update
using (public.has_org_capability(organization_id, 'financial:update'))
with check (public.has_org_capability(organization_id, 'financial:update'));

-- payment_methods
drop policy if exists payment_methods_select on public.payment_methods;
create policy payment_methods_select on public.payment_methods for select
using (public.has_org_capability(organization_id, 'financial:read'));

drop policy if exists payment_methods_insert on public.payment_methods;
create policy payment_methods_insert on public.payment_methods for insert
with check (public.has_org_capability(organization_id, 'financial:create'));

drop policy if exists payment_methods_update on public.payment_methods;
create policy payment_methods_update on public.payment_methods for update
using (public.has_org_capability(organization_id, 'financial:update'))
with check (public.has_org_capability(organization_id, 'financial:update'));

-- payment_attempts
drop policy if exists payment_attempts_select on public.payment_attempts;
create policy payment_attempts_select on public.payment_attempts for select
using (public.has_org_capability(organization_id, 'financial:read'));

drop policy if exists payment_attempts_insert on public.payment_attempts;
create policy payment_attempts_insert on public.payment_attempts for insert
with check (public.has_org_capability(organization_id, 'financial:create'));

drop policy if exists payment_attempts_update on public.payment_attempts;
create policy payment_attempts_update on public.payment_attempts for update
using (public.has_org_capability(organization_id, 'financial:update'))
with check (public.has_org_capability(organization_id, 'financial:update'));

-- autopay
drop policy if exists autopay_enrollments_select on public.autopay_enrollments;
create policy autopay_enrollments_select on public.autopay_enrollments for select
using (public.has_org_capability(organization_id, 'financial:read'));

drop policy if exists autopay_enrollments_insert on public.autopay_enrollments;
create policy autopay_enrollments_insert on public.autopay_enrollments for insert
with check (public.has_org_capability(organization_id, 'financial:create'));

drop policy if exists autopay_enrollments_update on public.autopay_enrollments;
create policy autopay_enrollments_update on public.autopay_enrollments for update
using (public.has_org_capability(organization_id, 'financial:update'))
with check (public.has_org_capability(organization_id, 'financial:update'));

-- receipts
drop policy if exists payment_receipts_select on public.payment_receipts;
create policy payment_receipts_select on public.payment_receipts for select
using (public.has_org_capability(organization_id, 'financial:read'));

drop policy if exists payment_receipts_insert on public.payment_receipts;
create policy payment_receipts_insert on public.payment_receipts for insert
with check (public.has_org_capability(organization_id, 'financial:create'));

-- adjustments
drop policy if exists billing_adjustments_select on public.billing_adjustments;
create policy billing_adjustments_select on public.billing_adjustments for select
using (public.has_org_capability(organization_id, 'financial:read'));

drop policy if exists billing_adjustments_insert on public.billing_adjustments;
create policy billing_adjustments_insert on public.billing_adjustments for insert
with check (public.has_org_capability(organization_id, 'financial:create') and created_by = auth.uid());

-- ledger (select + insert only — no update/delete policies)
drop policy if exists billing_ledger_select on public.billing_ledger_entries;
create policy billing_ledger_select on public.billing_ledger_entries for select
using (public.has_org_capability(organization_id, 'financial:read'));

drop policy if exists billing_ledger_insert on public.billing_ledger_entries;
create policy billing_ledger_insert on public.billing_ledger_entries for insert
with check (public.has_org_capability(organization_id, 'financial:create'));

-- audit
drop policy if exists billing_audit_select on public.billing_audit_events;
create policy billing_audit_select on public.billing_audit_events for select
using (public.has_org_capability(organization_id, 'financial:read'));

drop policy if exists billing_audit_insert on public.billing_audit_events;
create policy billing_audit_insert on public.billing_audit_events for insert
with check (public.has_org_capability(organization_id, 'financial:create'));
