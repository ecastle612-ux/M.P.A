-- Phase 8 foundation: org-scoped lease management, documents placeholders, and permanent event history.

create table if not exists public.leases (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  lease_number text not null,
  property_id uuid not null references public.properties (id) on delete cascade,
  unit_id uuid not null references public.units (id) on delete cascade,
  primary_tenant_id uuid not null references public.tenants (id) on delete restrict,
  co_tenant_placeholder text,
  lease_type text not null default 'residential' check (
    lease_type in ('residential', 'commercial', 'month_to_month', 'corporate', 'other')
  ),
  status text not null default 'draft' check (
    status in ('draft', 'signed', 'active', 'expired', 'terminated')
  ),
  start_date date not null,
  end_date date not null,
  move_in_date date,
  move_out_date date,
  rent_amount numeric(12, 2) not null,
  security_deposit numeric(12, 2) not null default 0,
  late_fee_placeholder text,
  renewal_option boolean not null default false,
  notice_period_days integer check (notice_period_days is null or notice_period_days >= 0),
  renewal_status text not null default 'none' check (
    renewal_status in ('none', 'offered', 'pending', 'renewed', 'declined', 'notice_given')
  ),
  internal_notes text,
  signed_at timestamptz,
  activated_at timestamptz,
  expired_at timestamptz,
  terminated_at timestamptz,
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
  unique (organization_id, lease_number),
  constraint leases_date_range_check check (start_date <= end_date),
  constraint leases_rent_amount_check check (rent_amount >= 0),
  constraint leases_security_deposit_check check (security_deposit >= 0)
);

create table if not exists public.lease_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  lease_id uuid not null,
  document_type text not null check (
    document_type in ('lease_pdf', 'signed_lease', 'amendment', 'addendum')
  ),
  title text not null,
  file_url_placeholder text,
  ocr_ready boolean not null default false,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users (id) on delete cascade,
  updated_by uuid references auth.users (id) on delete set null,
  deleted_at timestamptz,
  deleted_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint lease_documents_lease_fk
    foreign key (lease_id, organization_id)
    references public.leases (id, organization_id)
    on delete cascade
);

create table if not exists public.lease_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  lease_id uuid not null,
  event_type text not null check (
    event_type in (
      'lease_created',
      'signed',
      'activated',
      'renewal_offered',
      'renewed',
      'notice_given',
      'expired',
      'terminated',
      'move_out'
    )
  ),
  summary text not null,
  payload jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  constraint lease_events_lease_fk
    foreign key (lease_id, organization_id)
    references public.leases (id, organization_id)
    on delete cascade
);

create index if not exists leases_org_status_idx
  on public.leases (organization_id, status)
  where deleted_at is null;

create index if not exists leases_org_end_date_idx
  on public.leases (organization_id, end_date)
  where deleted_at is null;

create index if not exists leases_org_renewal_status_idx
  on public.leases (organization_id, renewal_status)
  where deleted_at is null;

create index if not exists leases_org_property_idx
  on public.leases (organization_id, property_id)
  where deleted_at is null;

create index if not exists leases_org_unit_idx
  on public.leases (organization_id, unit_id)
  where deleted_at is null;

create index if not exists leases_org_tenant_idx
  on public.leases (organization_id, primary_tenant_id)
  where deleted_at is null;

create index if not exists leases_org_lease_number_idx
  on public.leases (organization_id, lease_number)
  where deleted_at is null;

create unique index if not exists leases_one_active_per_unit_idx
  on public.leases (organization_id, unit_id)
  where status = 'active' and deleted_at is null;

create index if not exists lease_documents_org_lease_idx
  on public.lease_documents (organization_id, lease_id)
  where deleted_at is null;

create index if not exists lease_events_org_lease_idx
  on public.lease_events (organization_id, lease_id, created_at desc);

create index if not exists lease_events_org_type_idx
  on public.lease_events (organization_id, event_type, created_at desc);

drop trigger if exists trg_leases_updated_at on public.leases;
create trigger trg_leases_updated_at
before update on public.leases
for each row
execute function public.set_updated_at();

drop trigger if exists trg_lease_documents_updated_at on public.lease_documents;
create trigger trg_lease_documents_updated_at
before update on public.lease_documents
for each row
execute function public.set_updated_at();

insert into public.permission_capabilities (key, namespace, description)
values
  ('lease:create', 'lease', 'Create leases'),
  ('lease:read', 'lease', 'Read leases'),
  ('lease:update', 'lease', 'Update leases'),
  ('lease:archive', 'lease', 'Archive and restore leases'),
  ('lease:delete', 'lease', 'Soft-delete leases')
on conflict (key) do nothing;

insert into public.role_permission_grants (role, capability_key)
values
  ('property_manager', 'lease:create'),
  ('property_manager', 'lease:read'),
  ('property_manager', 'lease:update'),
  ('property_manager', 'lease:archive'),
  ('property_manager', 'lease:delete'),
  ('property_owner', 'lease:read')
on conflict (role, capability_key) do nothing;

alter table public.leases enable row level security;
alter table public.lease_documents enable row level security;
alter table public.lease_events enable row level security;

drop policy if exists leases_select_authorized on public.leases;
create policy leases_select_authorized
on public.leases for select
using (public.has_org_capability(organization_id, 'lease:read'));

drop policy if exists leases_insert_authorized on public.leases;
create policy leases_insert_authorized
on public.leases for insert
with check (public.has_org_capability(organization_id, 'lease:create') and created_by = auth.uid());

drop policy if exists leases_update_authorized on public.leases;
create policy leases_update_authorized
on public.leases for update
using (
  public.has_org_capability(organization_id, 'lease:update')
  or public.has_org_capability(organization_id, 'lease:archive')
  or public.has_org_capability(organization_id, 'lease:delete')
)
with check (
  public.has_org_capability(organization_id, 'lease:update')
  or public.has_org_capability(organization_id, 'lease:archive')
  or public.has_org_capability(organization_id, 'lease:delete')
);

drop policy if exists leases_delete_authorized on public.leases;
create policy leases_delete_authorized
on public.leases for delete
using (public.has_org_capability(organization_id, 'lease:delete'));

drop policy if exists lease_documents_select_authorized on public.lease_documents;
create policy lease_documents_select_authorized
on public.lease_documents for select
using (public.has_org_capability(organization_id, 'lease:read'));

drop policy if exists lease_documents_insert_authorized on public.lease_documents;
create policy lease_documents_insert_authorized
on public.lease_documents for insert
with check (public.has_org_capability(organization_id, 'lease:update') and created_by = auth.uid());

drop policy if exists lease_documents_update_authorized on public.lease_documents;
create policy lease_documents_update_authorized
on public.lease_documents for update
using (public.has_org_capability(organization_id, 'lease:update'))
with check (public.has_org_capability(organization_id, 'lease:update'));

drop policy if exists lease_documents_delete_authorized on public.lease_documents;
create policy lease_documents_delete_authorized
on public.lease_documents for delete
using (public.has_org_capability(organization_id, 'lease:update'));

drop policy if exists lease_events_select_authorized on public.lease_events;
create policy lease_events_select_authorized
on public.lease_events for select
using (public.has_org_capability(organization_id, 'lease:read'));

drop policy if exists lease_events_insert_authorized on public.lease_events;
create policy lease_events_insert_authorized
on public.lease_events for insert
with check (
  (
    public.has_org_capability(organization_id, 'lease:update')
    or public.has_org_capability(organization_id, 'lease:create')
  )
  and created_by = auth.uid()
);
