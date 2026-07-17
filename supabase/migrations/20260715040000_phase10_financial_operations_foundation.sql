-- Phase 10 foundation: org-scoped financial operations — rent, payments, expenses, owner statements.

-- ---------------------------------------------------------------------------
-- rent_charges
-- ---------------------------------------------------------------------------

create table if not exists public.rent_charges (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  charge_number text not null,
  lease_id uuid not null,
  property_id uuid not null references public.properties (id) on delete cascade,
  unit_id uuid not null references public.units (id) on delete cascade,
  tenant_id uuid not null references public.tenants (id) on delete restrict,
  charge_type text not null default 'monthly_rent' check (
    charge_type in ('monthly_rent', 'custom', 'security_deposit')
  ),
  description text not null,
  amount numeric(12, 2) not null,
  amount_paid numeric(12, 2) not null default 0,
  outstanding_balance numeric(12, 2) not null default 0,
  due_date date not null,
  period_start date,
  period_end date,
  status text not null default 'pending' check (
    status in ('pending', 'partial', 'paid', 'overdue', 'waived', 'cancelled')
  ),
  late_status text not null default 'none' check (
    late_status in ('none', 'grace_period', 'late', 'severe')
  ),
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users (id) on delete cascade,
  updated_by uuid references auth.users (id) on delete set null,
  archived_at timestamptz,
  archived_by uuid references auth.users (id) on delete set null,
  deleted_at timestamptz,
  deleted_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  unique (organization_id, charge_number),
  constraint rent_charges_lease_fk
    foreign key (lease_id, organization_id)
    references public.leases (id, organization_id)
    on delete cascade,
  constraint rent_charges_amount_check check (amount >= 0),
  constraint rent_charges_amount_paid_check check (amount_paid >= 0),
  constraint rent_charges_outstanding_check check (outstanding_balance >= 0),
  constraint rent_charges_paid_not_exceed check (amount_paid <= amount)
);

-- ---------------------------------------------------------------------------
-- payments
-- ---------------------------------------------------------------------------

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  payment_number text not null,
  rent_charge_id uuid,
  lease_id uuid,
  property_id uuid references public.properties (id) on delete set null,
  unit_id uuid references public.units (id) on delete set null,
  tenant_id uuid references public.tenants (id) on delete set null,
  amount numeric(12, 2) not null,
  payment_method text not null default 'manual' check (
    payment_method in ('manual', 'check', 'cash', 'ach_placeholder', 'card_placeholder')
  ),
  payment_date date not null default (timezone('utc', now()))::date,
  status text not null default 'completed' check (
    status in ('pending', 'completed', 'failed', 'refunded')
  ),
  reference_note text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users (id) on delete cascade,
  updated_by uuid references auth.users (id) on delete set null,
  archived_at timestamptz,
  archived_by uuid references auth.users (id) on delete set null,
  deleted_at timestamptz,
  deleted_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  unique (organization_id, payment_number),
  constraint payments_rent_charge_fk
    foreign key (rent_charge_id, organization_id)
    references public.rent_charges (id, organization_id)
    on delete set null,
  constraint payments_lease_fk
    foreign key (lease_id, organization_id)
    references public.leases (id, organization_id)
    on delete set null,
  constraint payments_amount_check check (amount > 0)
);

-- ---------------------------------------------------------------------------
-- late_fees
-- ---------------------------------------------------------------------------

create table if not exists public.late_fees (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  rent_charge_id uuid not null,
  lease_id uuid not null,
  property_id uuid not null references public.properties (id) on delete cascade,
  tenant_id uuid not null references public.tenants (id) on delete restrict,
  fee_amount numeric(12, 2) not null,
  applied_at timestamptz not null default timezone('utc', now()),
  status text not null default 'applied' check (
    status in ('pending', 'applied', 'waived')
  ),
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users (id) on delete cascade,
  updated_by uuid references auth.users (id) on delete set null,
  deleted_at timestamptz,
  deleted_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  constraint late_fees_rent_charge_fk
    foreign key (rent_charge_id, organization_id)
    references public.rent_charges (id, organization_id)
    on delete cascade,
  constraint late_fees_lease_fk
    foreign key (lease_id, organization_id)
    references public.leases (id, organization_id)
    on delete cascade,
  constraint late_fees_amount_check check (fee_amount >= 0)
);

-- ---------------------------------------------------------------------------
-- expenses
-- ---------------------------------------------------------------------------

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  expense_number text not null,
  property_id uuid not null references public.properties (id) on delete cascade,
  vendor_id uuid,
  work_order_id uuid,
  category text not null default 'maintenance' check (
    category in (
      'maintenance',
      'vendor_bill',
      'utilities',
      'insurance',
      'taxes',
      'repairs',
      'capital_improvement',
      'custom'
    )
  ),
  custom_category text,
  description text not null,
  amount numeric(12, 2) not null,
  expense_date date not null default (timezone('utc', now()))::date,
  status text not null default 'pending' check (
    status in ('pending', 'approved', 'paid', 'archived')
  ),
  vendor_bill_placeholder text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users (id) on delete cascade,
  updated_by uuid references auth.users (id) on delete set null,
  archived_at timestamptz,
  archived_by uuid references auth.users (id) on delete set null,
  deleted_at timestamptz,
  deleted_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  unique (organization_id, expense_number),
  constraint expenses_vendor_fk
    foreign key (vendor_id, organization_id)
    references public.vendors (id, organization_id)
    on delete set null,
  constraint expenses_work_order_fk
    foreign key (work_order_id, organization_id)
    references public.maintenance_work_orders (id, organization_id)
    on delete set null,
  constraint expenses_amount_check check (amount >= 0)
);

-- ---------------------------------------------------------------------------
-- owner_statements
-- ---------------------------------------------------------------------------

create table if not exists public.owner_statements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  statement_number text not null,
  property_id uuid not null references public.properties (id) on delete cascade,
  owner_placeholder text,
  statement_period_start date not null,
  statement_period_end date not null,
  status text not null default 'draft' check (
    status in ('draft', 'generated', 'sent', 'archived')
  ),
  total_income numeric(12, 2) not null default 0,
  total_expenses numeric(12, 2) not null default 0,
  net_income numeric(12, 2) not null default 0,
  occupancy_rate numeric(5, 2) not null default 0,
  maintenance_cost numeric(12, 2) not null default 0,
  outstanding_balances numeric(12, 2) not null default 0,
  generated_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users (id) on delete cascade,
  updated_by uuid references auth.users (id) on delete set null,
  archived_at timestamptz,
  archived_by uuid references auth.users (id) on delete set null,
  deleted_at timestamptz,
  deleted_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  unique (organization_id, statement_number),
  constraint owner_statements_period_check check (statement_period_start <= statement_period_end)
);

-- ---------------------------------------------------------------------------
-- property_budgets
-- ---------------------------------------------------------------------------

create table if not exists public.property_budgets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  property_id uuid not null references public.properties (id) on delete cascade,
  budget_year integer not null,
  budget_month integer check (budget_month is null or (budget_month >= 1 and budget_month <= 12)),
  category text not null,
  budgeted_amount numeric(12, 2) not null default 0,
  actual_amount numeric(12, 2) not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users (id) on delete cascade,
  updated_by uuid references auth.users (id) on delete set null,
  deleted_at timestamptz,
  deleted_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  constraint property_budgets_amount_check check (budgeted_amount >= 0 and actual_amount >= 0)
);

-- ---------------------------------------------------------------------------
-- financial_activity (append-only ledger)
-- ---------------------------------------------------------------------------

create table if not exists public.financial_activity (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  activity_type text not null check (
    activity_type in (
      'charge_created',
      'payment_received',
      'late_fee_applied',
      'expense_recorded',
      'statement_generated',
      'balance_updated'
    )
  ),
  entity_type text not null,
  entity_id uuid not null,
  lease_id uuid,
  property_id uuid,
  tenant_id uuid,
  amount numeric(12, 2) not null default 0,
  balance_after numeric(12, 2),
  summary text not null,
  payload jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now())
);

-- ---------------------------------------------------------------------------
-- indexes
-- ---------------------------------------------------------------------------

create index if not exists rent_charges_org_status_idx
  on public.rent_charges (organization_id, status)
  where deleted_at is null;

create index if not exists rent_charges_org_due_date_idx
  on public.rent_charges (organization_id, due_date)
  where deleted_at is null;

create index if not exists rent_charges_org_late_status_idx
  on public.rent_charges (organization_id, late_status)
  where deleted_at is null;

create index if not exists rent_charges_org_lease_idx
  on public.rent_charges (organization_id, lease_id)
  where deleted_at is null;

create index if not exists rent_charges_org_property_idx
  on public.rent_charges (organization_id, property_id)
  where deleted_at is null;

create index if not exists rent_charges_org_tenant_idx
  on public.rent_charges (organization_id, tenant_id)
  where deleted_at is null;

create index if not exists payments_org_status_idx
  on public.payments (organization_id, status)
  where deleted_at is null;

create index if not exists payments_org_date_idx
  on public.payments (organization_id, payment_date desc)
  where deleted_at is null;

create index if not exists payments_org_charge_idx
  on public.payments (organization_id, rent_charge_id)
  where deleted_at is null;

create index if not exists payments_org_tenant_idx
  on public.payments (organization_id, tenant_id)
  where deleted_at is null;

create index if not exists late_fees_org_charge_idx
  on public.late_fees (organization_id, rent_charge_id)
  where deleted_at is null;

create index if not exists expenses_org_status_idx
  on public.expenses (organization_id, status)
  where deleted_at is null;

create index if not exists expenses_org_property_idx
  on public.expenses (organization_id, property_id)
  where deleted_at is null;

create index if not exists expenses_org_category_idx
  on public.expenses (organization_id, category)
  where deleted_at is null;

create index if not exists expenses_org_date_idx
  on public.expenses (organization_id, expense_date desc)
  where deleted_at is null;

create index if not exists owner_statements_org_status_idx
  on public.owner_statements (organization_id, status)
  where deleted_at is null;

create index if not exists owner_statements_org_property_idx
  on public.owner_statements (organization_id, property_id)
  where deleted_at is null;

create index if not exists property_budgets_org_property_idx
  on public.property_budgets (organization_id, property_id)
  where deleted_at is null;

create index if not exists financial_activity_org_created_idx
  on public.financial_activity (organization_id, created_at desc);

create index if not exists financial_activity_org_type_idx
  on public.financial_activity (organization_id, activity_type, created_at desc);

create index if not exists financial_activity_org_property_idx
  on public.financial_activity (organization_id, property_id, created_at desc)
  where property_id is not null;

-- ---------------------------------------------------------------------------
-- triggers
-- ---------------------------------------------------------------------------

drop trigger if exists trg_rent_charges_updated_at on public.rent_charges;
create trigger trg_rent_charges_updated_at
before update on public.rent_charges
for each row
execute function public.set_updated_at();

drop trigger if exists trg_payments_updated_at on public.payments;
create trigger trg_payments_updated_at
before update on public.payments
for each row
execute function public.set_updated_at();

drop trigger if exists trg_late_fees_updated_at on public.late_fees;
create trigger trg_late_fees_updated_at
before update on public.late_fees
for each row
execute function public.set_updated_at();

drop trigger if exists trg_expenses_updated_at on public.expenses;
create trigger trg_expenses_updated_at
before update on public.expenses
for each row
execute function public.set_updated_at();

drop trigger if exists trg_owner_statements_updated_at on public.owner_statements;
create trigger trg_owner_statements_updated_at
before update on public.owner_statements
for each row
execute function public.set_updated_at();

drop trigger if exists trg_property_budgets_updated_at on public.property_budgets;
create trigger trg_property_budgets_updated_at
before update on public.property_budgets
for each row
execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- helpers
-- ---------------------------------------------------------------------------

create or replace function public.generate_financial_number(prefix text)
returns text
language plpgsql
as $$
declare
  candidate text;
begin
  candidate := prefix || '-' || to_char(timezone('utc', now()), 'YYYYMMDD') || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6);
  return candidate;
end;
$$;

create or replace function public.sync_rent_charge_balance()
returns trigger
language plpgsql
as $$
begin
  new.outstanding_balance := greatest(new.amount - new.amount_paid, 0);
  if new.outstanding_balance = 0 and new.status not in ('waived', 'cancelled') then
    new.status := 'paid';
    new.late_status := 'none';
  elsif new.amount_paid > 0 and new.outstanding_balance > 0 and new.status not in ('waived', 'cancelled', 'overdue') then
    new.status := 'partial';
  end if;
  if new.due_date < (timezone('utc', now()))::date
     and new.outstanding_balance > 0
     and new.status not in ('paid', 'waived', 'cancelled') then
    new.status := 'overdue';
    if new.late_status = 'none' then
      new.late_status := 'late';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_rent_charges_balance on public.rent_charges;
create trigger trg_rent_charges_balance
before insert or update of amount, amount_paid, due_date, status on public.rent_charges
for each row
execute function public.sync_rent_charge_balance();

-- ---------------------------------------------------------------------------
-- capabilities
-- ---------------------------------------------------------------------------

insert into public.permission_capabilities (key, namespace, description)
values
  ('financial:create', 'financial', 'Create rent charges, payments, and expenses'),
  ('financial:read', 'financial', 'Read financial records and reports'),
  ('financial:update', 'financial', 'Update financial records'),
  ('financial:archive', 'financial', 'Archive financial records'),
  ('financial:delete', 'financial', 'Soft-delete financial records')
on conflict (key) do nothing;

insert into public.role_permission_grants (role, capability_key)
values
  ('property_manager', 'financial:create'),
  ('property_manager', 'financial:read'),
  ('property_manager', 'financial:update'),
  ('property_manager', 'financial:archive'),
  ('property_manager', 'financial:delete'),
  ('property_owner', 'financial:read')
on conflict (role, capability_key) do nothing;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.rent_charges enable row level security;
alter table public.payments enable row level security;
alter table public.late_fees enable row level security;
alter table public.expenses enable row level security;
alter table public.owner_statements enable row level security;
alter table public.property_budgets enable row level security;
alter table public.financial_activity enable row level security;

-- rent_charges
drop policy if exists rent_charges_select_authorized on public.rent_charges;
create policy rent_charges_select_authorized
on public.rent_charges for select
using (public.has_org_capability(organization_id, 'financial:read'));

drop policy if exists rent_charges_insert_authorized on public.rent_charges;
create policy rent_charges_insert_authorized
on public.rent_charges for insert
with check (public.has_org_capability(organization_id, 'financial:create') and created_by = auth.uid());

drop policy if exists rent_charges_update_authorized on public.rent_charges;
create policy rent_charges_update_authorized
on public.rent_charges for update
using (
  public.has_org_capability(organization_id, 'financial:update')
  or public.has_org_capability(organization_id, 'financial:archive')
  or public.has_org_capability(organization_id, 'financial:delete')
)
with check (
  public.has_org_capability(organization_id, 'financial:update')
  or public.has_org_capability(organization_id, 'financial:archive')
  or public.has_org_capability(organization_id, 'financial:delete')
);

drop policy if exists rent_charges_delete_authorized on public.rent_charges;
create policy rent_charges_delete_authorized
on public.rent_charges for delete
using (public.has_org_capability(organization_id, 'financial:delete'));

-- payments
drop policy if exists payments_select_authorized on public.payments;
create policy payments_select_authorized
on public.payments for select
using (public.has_org_capability(organization_id, 'financial:read'));

drop policy if exists payments_insert_authorized on public.payments;
create policy payments_insert_authorized
on public.payments for insert
with check (public.has_org_capability(organization_id, 'financial:create') and created_by = auth.uid());

drop policy if exists payments_update_authorized on public.payments;
create policy payments_update_authorized
on public.payments for update
using (
  public.has_org_capability(organization_id, 'financial:update')
  or public.has_org_capability(organization_id, 'financial:archive')
  or public.has_org_capability(organization_id, 'financial:delete')
)
with check (
  public.has_org_capability(organization_id, 'financial:update')
  or public.has_org_capability(organization_id, 'financial:archive')
  or public.has_org_capability(organization_id, 'financial:delete')
);

drop policy if exists payments_delete_authorized on public.payments;
create policy payments_delete_authorized
on public.payments for delete
using (public.has_org_capability(organization_id, 'financial:delete'));

-- late_fees
drop policy if exists late_fees_select_authorized on public.late_fees;
create policy late_fees_select_authorized
on public.late_fees for select
using (public.has_org_capability(organization_id, 'financial:read'));

drop policy if exists late_fees_insert_authorized on public.late_fees;
create policy late_fees_insert_authorized
on public.late_fees for insert
with check (public.has_org_capability(organization_id, 'financial:create') and created_by = auth.uid());

drop policy if exists late_fees_update_authorized on public.late_fees;
create policy late_fees_update_authorized
on public.late_fees for update
using (public.has_org_capability(organization_id, 'financial:update'))
with check (public.has_org_capability(organization_id, 'financial:update'));

-- expenses
drop policy if exists expenses_select_authorized on public.expenses;
create policy expenses_select_authorized
on public.expenses for select
using (public.has_org_capability(organization_id, 'financial:read'));

drop policy if exists expenses_insert_authorized on public.expenses;
create policy expenses_insert_authorized
on public.expenses for insert
with check (public.has_org_capability(organization_id, 'financial:create') and created_by = auth.uid());

drop policy if exists expenses_update_authorized on public.expenses;
create policy expenses_update_authorized
on public.expenses for update
using (
  public.has_org_capability(organization_id, 'financial:update')
  or public.has_org_capability(organization_id, 'financial:archive')
  or public.has_org_capability(organization_id, 'financial:delete')
)
with check (
  public.has_org_capability(organization_id, 'financial:update')
  or public.has_org_capability(organization_id, 'financial:archive')
  or public.has_org_capability(organization_id, 'financial:delete')
);

drop policy if exists expenses_delete_authorized on public.expenses;
create policy expenses_delete_authorized
on public.expenses for delete
using (public.has_org_capability(organization_id, 'financial:delete'));

-- owner_statements
drop policy if exists owner_statements_select_authorized on public.owner_statements;
create policy owner_statements_select_authorized
on public.owner_statements for select
using (public.has_org_capability(organization_id, 'financial:read'));

drop policy if exists owner_statements_insert_authorized on public.owner_statements;
create policy owner_statements_insert_authorized
on public.owner_statements for insert
with check (public.has_org_capability(organization_id, 'financial:create') and created_by = auth.uid());

drop policy if exists owner_statements_update_authorized on public.owner_statements;
create policy owner_statements_update_authorized
on public.owner_statements for update
using (
  public.has_org_capability(organization_id, 'financial:update')
  or public.has_org_capability(organization_id, 'financial:archive')
)
with check (
  public.has_org_capability(organization_id, 'financial:update')
  or public.has_org_capability(organization_id, 'financial:archive')
);

-- property_budgets
drop policy if exists property_budgets_select_authorized on public.property_budgets;
create policy property_budgets_select_authorized
on public.property_budgets for select
using (public.has_org_capability(organization_id, 'financial:read'));

drop policy if exists property_budgets_insert_authorized on public.property_budgets;
create policy property_budgets_insert_authorized
on public.property_budgets for insert
with check (public.has_org_capability(organization_id, 'financial:create') and created_by = auth.uid());

drop policy if exists property_budgets_update_authorized on public.property_budgets;
create policy property_budgets_update_authorized
on public.property_budgets for update
using (public.has_org_capability(organization_id, 'financial:update'))
with check (public.has_org_capability(organization_id, 'financial:update'));

-- financial_activity (append-only: insert + select)
drop policy if exists financial_activity_select_authorized on public.financial_activity;
create policy financial_activity_select_authorized
on public.financial_activity for select
using (public.has_org_capability(organization_id, 'financial:read'));

drop policy if exists financial_activity_insert_authorized on public.financial_activity;
create policy financial_activity_insert_authorized
on public.financial_activity for insert
with check (
  public.has_org_capability(organization_id, 'financial:create')
  or public.has_org_capability(organization_id, 'financial:update')
);
