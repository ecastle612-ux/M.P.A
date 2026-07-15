-- Phase 7 foundation: org-scoped vendor management and maintenance vendor assignments.

create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  business_name text not null,
  primary_contact_name text,
  phone text,
  email text,
  address_line_1 text,
  address_line_2 text,
  city text,
  state_region text,
  postal_code text,
  country_code text not null default 'US',
  website text,
  license_number text,
  insurance_expiration date,
  tax_id_placeholder text,
  emergency_availability text,
  after_hours_availability text,
  preferred_vendor boolean not null default false,
  rating numeric(3, 2) check (rating is null or (rating >= 0 and rating <= 5)),
  internal_notes text,
  status text not null default 'active' check (status in ('active', 'inactive', 'archived')),
  services text[] not null default '{}'::text[],
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users (id) on delete cascade,
  updated_by uuid references auth.users (id) on delete set null,
  archived_at timestamptz,
  archived_by uuid references auth.users (id) on delete set null,
  deleted_at timestamptz,
  deleted_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id)
);

create table if not exists public.vendor_contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  vendor_id uuid not null,
  name text not null,
  role_title text,
  phone text,
  email text,
  is_primary boolean not null default false,
  notes text,
  created_by uuid not null references auth.users (id) on delete cascade,
  updated_by uuid references auth.users (id) on delete set null,
  deleted_at timestamptz,
  deleted_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint vendor_contacts_vendor_fk
    foreign key (vendor_id, organization_id)
    references public.vendors (id, organization_id)
    on delete cascade
);

create table if not exists public.vendor_service_areas (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  vendor_id uuid not null,
  label text not null,
  city text,
  state_region text,
  postal_code text,
  notes text,
  created_by uuid not null references auth.users (id) on delete cascade,
  updated_by uuid references auth.users (id) on delete set null,
  deleted_at timestamptz,
  deleted_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint vendor_service_areas_vendor_fk
    foreign key (vendor_id, organization_id)
    references public.vendors (id, organization_id)
    on delete cascade
);

create table if not exists public.maintenance_vendor_assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  work_order_id uuid not null,
  vendor_id uuid not null,
  assignment_status text not null default 'pending' check (
    assignment_status in (
      'pending',
      'awaiting_response',
      'accepted',
      'en_route',
      'arrived',
      'in_progress',
      'completed',
      'cancelled'
    )
  ),
  assigned_at timestamptz not null default timezone('utc', now()),
  accepted_at timestamptz,
  arrived_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  completion_notes text,
  cancellation_reason text,
  is_current boolean not null default true,
  created_by uuid not null references auth.users (id) on delete cascade,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint maintenance_vendor_assignments_work_order_fk
    foreign key (work_order_id, organization_id)
    references public.maintenance_work_orders (id, organization_id)
    on delete cascade,
  constraint maintenance_vendor_assignments_vendor_fk
    foreign key (vendor_id, organization_id)
    references public.vendors (id, organization_id)
    on delete cascade
);

alter table public.maintenance_vendor_assignments
  add constraint maintenance_vendor_assignments_id_org_unique unique (id, organization_id);

alter table public.maintenance_work_orders
  add column if not exists vendor_id uuid,
  add column if not exists current_vendor_assignment_id uuid;

update public.maintenance_work_orders
set vendor_id = future_vendor_id
where vendor_id is null and future_vendor_id is not null;

alter table public.maintenance_work_orders
  drop constraint if exists maintenance_work_orders_vendor_fk;

alter table public.maintenance_work_orders
  add constraint maintenance_work_orders_vendor_fk
    foreign key (vendor_id, organization_id)
    references public.vendors (id, organization_id)
    on delete set null;

alter table public.maintenance_work_orders
  drop constraint if exists maintenance_work_orders_current_assignment_fk;

alter table public.maintenance_work_orders
  add constraint maintenance_work_orders_current_assignment_fk
    foreign key (current_vendor_assignment_id, organization_id)
    references public.maintenance_vendor_assignments (id, organization_id)
    on delete set null;

alter table public.maintenance_work_orders
  drop column if exists future_vendor_id;

create index if not exists vendors_org_status_idx
  on public.vendors (organization_id, status)
  where deleted_at is null;

create index if not exists vendors_org_business_name_idx
  on public.vendors (organization_id, business_name)
  where deleted_at is null;

create index if not exists vendors_org_preferred_idx
  on public.vendors (organization_id, preferred_vendor)
  where deleted_at is null;

create index if not exists vendors_org_services_gin_idx
  on public.vendors using gin (services)
  where deleted_at is null;

create index if not exists vendor_contacts_org_vendor_idx
  on public.vendor_contacts (organization_id, vendor_id)
  where deleted_at is null;

create index if not exists vendor_service_areas_org_vendor_idx
  on public.vendor_service_areas (organization_id, vendor_id)
  where deleted_at is null;

create index if not exists maintenance_vendor_assignments_org_work_order_idx
  on public.maintenance_vendor_assignments (organization_id, work_order_id, assigned_at desc);

create index if not exists maintenance_vendor_assignments_org_vendor_idx
  on public.maintenance_vendor_assignments (organization_id, vendor_id, assigned_at desc);

create index if not exists maintenance_vendor_assignments_org_status_idx
  on public.maintenance_vendor_assignments (organization_id, assignment_status)
  where is_current = true;

create unique index if not exists maintenance_vendor_assignments_one_current_per_work_order_idx
  on public.maintenance_vendor_assignments (organization_id, work_order_id)
  where is_current = true;

create index if not exists maintenance_work_orders_org_vendor_idx
  on public.maintenance_work_orders (organization_id, vendor_id)
  where deleted_at is null;

drop trigger if exists trg_vendors_updated_at on public.vendors;
create trigger trg_vendors_updated_at
before update on public.vendors
for each row
execute function public.set_updated_at();

drop trigger if exists trg_vendor_contacts_updated_at on public.vendor_contacts;
create trigger trg_vendor_contacts_updated_at
before update on public.vendor_contacts
for each row
execute function public.set_updated_at();

drop trigger if exists trg_vendor_service_areas_updated_at on public.vendor_service_areas;
create trigger trg_vendor_service_areas_updated_at
before update on public.vendor_service_areas
for each row
execute function public.set_updated_at();

drop trigger if exists trg_maintenance_vendor_assignments_updated_at on public.maintenance_vendor_assignments;
create trigger trg_maintenance_vendor_assignments_updated_at
before update on public.maintenance_vendor_assignments
for each row
execute function public.set_updated_at();

insert into public.permission_capabilities (key, namespace, description)
values
  ('vendor:create', 'vendor', 'Create vendors'),
  ('vendor:read', 'vendor', 'Read vendors'),
  ('vendor:update', 'vendor', 'Update vendors'),
  ('vendor:archive', 'vendor', 'Archive and restore vendors'),
  ('vendor:delete', 'vendor', 'Soft-delete vendors'),
  ('vendor:assign', 'vendor', 'Assign vendors to maintenance work orders')
on conflict (key) do nothing;

insert into public.role_permission_grants (role, capability_key)
values
  ('property_manager', 'vendor:create'),
  ('property_manager', 'vendor:read'),
  ('property_manager', 'vendor:update'),
  ('property_manager', 'vendor:archive'),
  ('property_manager', 'vendor:delete'),
  ('property_manager', 'vendor:assign'),
  ('property_owner', 'vendor:read')
on conflict (role, capability_key) do nothing;

alter table public.vendors enable row level security;
alter table public.vendor_contacts enable row level security;
alter table public.vendor_service_areas enable row level security;
alter table public.maintenance_vendor_assignments enable row level security;

drop policy if exists vendors_select_authorized on public.vendors;
create policy vendors_select_authorized
on public.vendors for select
using (public.has_org_capability(organization_id, 'vendor:read'));

drop policy if exists vendors_insert_authorized on public.vendors;
create policy vendors_insert_authorized
on public.vendors for insert
with check (public.has_org_capability(organization_id, 'vendor:create') and created_by = auth.uid());

drop policy if exists vendors_update_authorized on public.vendors;
create policy vendors_update_authorized
on public.vendors for update
using (
  public.has_org_capability(organization_id, 'vendor:update')
  or public.has_org_capability(organization_id, 'vendor:archive')
  or public.has_org_capability(organization_id, 'vendor:delete')
)
with check (
  public.has_org_capability(organization_id, 'vendor:update')
  or public.has_org_capability(organization_id, 'vendor:archive')
  or public.has_org_capability(organization_id, 'vendor:delete')
);

drop policy if exists vendors_delete_authorized on public.vendors;
create policy vendors_delete_authorized
on public.vendors for delete
using (public.has_org_capability(organization_id, 'vendor:delete'));

drop policy if exists vendor_contacts_select_authorized on public.vendor_contacts;
create policy vendor_contacts_select_authorized
on public.vendor_contacts for select
using (public.has_org_capability(organization_id, 'vendor:read'));

drop policy if exists vendor_contacts_insert_authorized on public.vendor_contacts;
create policy vendor_contacts_insert_authorized
on public.vendor_contacts for insert
with check (public.has_org_capability(organization_id, 'vendor:update') and created_by = auth.uid());

drop policy if exists vendor_contacts_update_authorized on public.vendor_contacts;
create policy vendor_contacts_update_authorized
on public.vendor_contacts for update
using (public.has_org_capability(organization_id, 'vendor:update'))
with check (public.has_org_capability(organization_id, 'vendor:update'));

drop policy if exists vendor_contacts_delete_authorized on public.vendor_contacts;
create policy vendor_contacts_delete_authorized
on public.vendor_contacts for delete
using (public.has_org_capability(organization_id, 'vendor:update'));

drop policy if exists vendor_service_areas_select_authorized on public.vendor_service_areas;
create policy vendor_service_areas_select_authorized
on public.vendor_service_areas for select
using (public.has_org_capability(organization_id, 'vendor:read'));

drop policy if exists vendor_service_areas_insert_authorized on public.vendor_service_areas;
create policy vendor_service_areas_insert_authorized
on public.vendor_service_areas for insert
with check (public.has_org_capability(organization_id, 'vendor:update') and created_by = auth.uid());

drop policy if exists vendor_service_areas_update_authorized on public.vendor_service_areas;
create policy vendor_service_areas_update_authorized
on public.vendor_service_areas for update
using (public.has_org_capability(organization_id, 'vendor:update'))
with check (public.has_org_capability(organization_id, 'vendor:update'));

drop policy if exists vendor_service_areas_delete_authorized on public.vendor_service_areas;
create policy vendor_service_areas_delete_authorized
on public.vendor_service_areas for delete
using (public.has_org_capability(organization_id, 'vendor:update'));

drop policy if exists maintenance_vendor_assignments_select_authorized on public.maintenance_vendor_assignments;
create policy maintenance_vendor_assignments_select_authorized
on public.maintenance_vendor_assignments for select
using (public.has_org_capability(organization_id, 'vendor:read'));

drop policy if exists maintenance_vendor_assignments_insert_authorized on public.maintenance_vendor_assignments;
create policy maintenance_vendor_assignments_insert_authorized
on public.maintenance_vendor_assignments for insert
with check (
  public.has_org_capability(organization_id, 'vendor:assign')
  and created_by = auth.uid()
);

drop policy if exists maintenance_vendor_assignments_update_authorized on public.maintenance_vendor_assignments;
create policy maintenance_vendor_assignments_update_authorized
on public.maintenance_vendor_assignments for update
using (
  public.has_org_capability(organization_id, 'vendor:assign')
  or public.has_org_capability(organization_id, 'maintenance:update')
)
with check (
  public.has_org_capability(organization_id, 'vendor:assign')
  or public.has_org_capability(organization_id, 'maintenance:update')
);

-- Extend maintenance activity event types for vendor lifecycle.
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
      'vendor_cancelled'
    )
  );
