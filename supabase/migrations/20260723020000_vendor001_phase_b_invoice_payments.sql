-- VENDOR-001 Phase B: vendor invoices + Mark Paid payments
-- Additive only — does not alter Phase A token/QR Start→Finish semantics.

alter table public.maintenance_activity_events
  drop constraint if exists maintenance_activity_events_event_type_check;

alter table public.maintenance_activity_events
  add constraint maintenance_activity_events_event_type_check
  check (
    event_type in (
      'created',
      'status_changed',
      'assigned',
      'note_added',
      'updated',
      'completed',
      'archived',
      'restored',
      'vendor_assigned',
      'vendor_reassigned',
      'vendor_status_changed',
      'vendor_accepted',
      'vendor_arrived',
      'vendor_completed',
      'vendor_cancelled',
      'vendor_job_viewed',
      'vendor_job_started',
      'vendor_job_finished',
      'vendor_token_minted',
      'vendor_token_revoked',
      'vendor_invoice_submitted',
      'vendor_invoice_approved',
      'vendor_invoice_rejected',
      'vendor_invoice_revision_requested',
      'vendor_payment_recorded'
    )
  );

create table if not exists public.vendor_invoices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  work_order_id uuid not null,
  property_id uuid not null references public.properties (id) on delete cascade,
  vendor_id uuid null references public.vendors (id) on delete set null,
  invoice_number text null,
  amount numeric(12, 2) not null,
  currency text not null default 'usd',
  notes text null,
  contact_email text null,
  contact_phone text null,
  pdf_path text null,
  photo_paths jsonb not null default '[]'::jsonb,
  status text not null default 'awaiting_approval' check (
    status in (
      'awaiting_approval',
      'approved',
      'rejected',
      'revision_requested',
      'paid'
    )
  ),
  submitted_at timestamptz not null default timezone('utc', now()),
  reviewed_at timestamptz null,
  reviewed_by uuid null references auth.users (id) on delete set null,
  review_notes text null,
  expense_id uuid null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  constraint vendor_invoices_amount_check check (amount > 0),
  constraint vendor_invoices_wo_fk
    foreign key (work_order_id, organization_id)
    references public.maintenance_work_orders (id, organization_id)
    on delete cascade
);

create index if not exists vendor_invoices_org_wo_idx
  on public.vendor_invoices (organization_id, work_order_id, submitted_at desc);

create index if not exists vendor_invoices_org_vendor_idx
  on public.vendor_invoices (organization_id, vendor_id, submitted_at desc);

create index if not exists vendor_invoices_org_status_idx
  on public.vendor_invoices (organization_id, status, submitted_at desc);

create table if not exists public.vendor_payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  invoice_id uuid not null,
  work_order_id uuid not null,
  property_id uuid not null references public.properties (id) on delete cascade,
  vendor_id uuid null references public.vendors (id) on delete set null,
  amount numeric(12, 2) not null,
  currency text not null default 'usd',
  payment_method text not null check (
    payment_method in ('check', 'other', 'ach_future', 'mark_paid')
  ),
  reference_number text null,
  paid_at date not null,
  status text not null default 'paid' check (
    status in ('paid', 'void')
  ),
  recorded_by uuid not null references auth.users (id) on delete restrict,
  expense_id uuid null,
  notes text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  constraint vendor_payments_amount_check check (amount > 0),
  constraint vendor_payments_invoice_fk
    foreign key (invoice_id, organization_id)
    references public.vendor_invoices (id, organization_id)
    on delete restrict,
  constraint vendor_payments_wo_fk
    foreign key (work_order_id, organization_id)
    references public.maintenance_work_orders (id, organization_id)
    on delete cascade
);

create unique index if not exists vendor_payments_one_paid_per_invoice_idx
  on public.vendor_payments (organization_id, invoice_id)
  where status = 'paid';

create index if not exists vendor_payments_org_vendor_idx
  on public.vendor_payments (organization_id, vendor_id, paid_at desc);

create index if not exists vendor_payments_org_property_idx
  on public.vendor_payments (organization_id, property_id, paid_at desc);

drop trigger if exists trg_vendor_invoices_updated_at on public.vendor_invoices;
create trigger trg_vendor_invoices_updated_at
before update on public.vendor_invoices
for each row execute function public.set_updated_at();

drop trigger if exists trg_vendor_payments_updated_at on public.vendor_payments;
create trigger trg_vendor_payments_updated_at
before update on public.vendor_payments
for each row execute function public.set_updated_at();

alter table public.vendor_invoices enable row level security;
alter table public.vendor_payments enable row level security;

drop policy if exists vendor_invoices_select_org on public.vendor_invoices;
create policy vendor_invoices_select_org on public.vendor_invoices
  for select to authenticated
  using (
    public.has_org_capability(organization_id, 'maintenance:read')
    or public.has_org_capability(organization_id, 'vendor:read')
    or public.has_org_capability(organization_id, 'financial:read')
  );

drop policy if exists vendor_invoices_manage_org on public.vendor_invoices;
create policy vendor_invoices_manage_org on public.vendor_invoices
  for all to authenticated
  using (
    public.has_org_capability(organization_id, 'maintenance:update')
    or public.has_org_capability(organization_id, 'financial:update')
  )
  with check (
    public.has_org_capability(organization_id, 'maintenance:update')
    or public.has_org_capability(organization_id, 'financial:update')
  );

drop policy if exists vendor_payments_select_org on public.vendor_payments;
create policy vendor_payments_select_org on public.vendor_payments
  for select to authenticated
  using (
    public.has_org_capability(organization_id, 'maintenance:read')
    or public.has_org_capability(organization_id, 'vendor:read')
    or public.has_org_capability(organization_id, 'financial:read')
  );

drop policy if exists vendor_payments_manage_org on public.vendor_payments;
create policy vendor_payments_manage_org on public.vendor_payments
  for all to authenticated
  using (
    public.has_org_capability(organization_id, 'maintenance:update')
    or public.has_org_capability(organization_id, 'financial:update')
  )
  with check (
    public.has_org_capability(organization_id, 'maintenance:update')
    or public.has_org_capability(organization_id, 'financial:update')
  );
