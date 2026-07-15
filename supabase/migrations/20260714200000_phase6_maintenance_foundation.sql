-- Phase 6 foundation: maintenance work orders and activity timeline.

create table if not exists public.maintenance_work_orders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  property_id uuid not null references public.properties (id) on delete cascade,
  unit_id uuid references public.units (id) on delete set null,
  tenant_id uuid references public.tenants (id) on delete set null,
  work_order_number text not null,
  title text not null,
  description text,
  category text not null default 'general' check (
    category in ('general', 'plumbing', 'electrical', 'hvac', 'appliance', 'structural', 'landscaping', 'pest', 'other')
  ),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'emergency')),
  status text not null default 'submitted' check (
    status in ('submitted', 'triaged', 'assigned', 'in_progress', 'on_hold', 'completed', 'cancelled')
  ),
  due_date date,
  assigned_to_user_id uuid references auth.users (id) on delete set null,
  future_vendor_id uuid,
  internal_notes text,
  tenant_notes text,
  photo_placeholder text,
  document_placeholder text,
  recurring_maintenance_placeholder text,
  preventive_maintenance_placeholder text,
  completed_at timestamptz,
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
  unique (organization_id, work_order_number)
);

create table if not exists public.maintenance_activity_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  work_order_id uuid not null,
  event_type text not null check (
    event_type in ('created', 'status_changed', 'assigned', 'note_added', 'updated', 'completed', 'archived', 'restored')
  ),
  summary text not null,
  details jsonb not null default '{}'::jsonb,
  actor_user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint maintenance_activity_work_order_fk
    foreign key (work_order_id, organization_id)
    references public.maintenance_work_orders (id, organization_id)
    on delete cascade
);

create index if not exists maintenance_work_orders_org_status_idx
  on public.maintenance_work_orders (organization_id, status)
  where deleted_at is null;

create index if not exists maintenance_work_orders_org_priority_idx
  on public.maintenance_work_orders (organization_id, priority)
  where deleted_at is null;

create index if not exists maintenance_work_orders_org_due_date_idx
  on public.maintenance_work_orders (organization_id, due_date)
  where deleted_at is null;

create index if not exists maintenance_work_orders_org_property_idx
  on public.maintenance_work_orders (organization_id, property_id)
  where deleted_at is null;

create index if not exists maintenance_work_orders_org_unit_idx
  on public.maintenance_work_orders (organization_id, unit_id)
  where deleted_at is null;

create index if not exists maintenance_work_orders_org_tenant_idx
  on public.maintenance_work_orders (organization_id, tenant_id)
  where deleted_at is null;

create index if not exists maintenance_work_orders_org_assigned_idx
  on public.maintenance_work_orders (organization_id, assigned_to_user_id)
  where deleted_at is null;

create index if not exists maintenance_activity_org_work_order_idx
  on public.maintenance_activity_events (organization_id, work_order_id, created_at desc);

drop trigger if exists trg_maintenance_work_orders_updated_at on public.maintenance_work_orders;
create trigger trg_maintenance_work_orders_updated_at
before update on public.maintenance_work_orders
for each row
execute function public.set_updated_at();

insert into public.permission_capabilities (key, namespace, description)
values
  ('maintenance:create', 'maintenance', 'Create maintenance work orders'),
  ('maintenance:read', 'maintenance', 'Read maintenance work orders'),
  ('maintenance:update', 'maintenance', 'Update maintenance work orders'),
  ('maintenance:assign', 'maintenance', 'Assign maintenance work orders'),
  ('maintenance:archive', 'maintenance', 'Archive and restore maintenance work orders'),
  ('maintenance:delete', 'maintenance', 'Soft-delete maintenance work orders')
on conflict (key) do nothing;

insert into public.role_permission_grants (role, capability_key)
values
  ('property_manager', 'maintenance:create'),
  ('property_manager', 'maintenance:read'),
  ('property_manager', 'maintenance:update'),
  ('property_manager', 'maintenance:assign'),
  ('property_manager', 'maintenance:archive'),
  ('property_manager', 'maintenance:delete'),
  ('property_owner', 'maintenance:read')
on conflict (role, capability_key) do nothing;

alter table public.maintenance_work_orders enable row level security;
alter table public.maintenance_activity_events enable row level security;

drop policy if exists maintenance_work_orders_select_authorized on public.maintenance_work_orders;
create policy maintenance_work_orders_select_authorized
on public.maintenance_work_orders
for select
using (public.has_org_capability(organization_id, 'maintenance:read'));

drop policy if exists maintenance_work_orders_insert_authorized on public.maintenance_work_orders;
create policy maintenance_work_orders_insert_authorized
on public.maintenance_work_orders
for insert
with check (
  public.has_org_capability(organization_id, 'maintenance:create')
  and created_by = auth.uid()
);

drop policy if exists maintenance_work_orders_update_authorized on public.maintenance_work_orders;
create policy maintenance_work_orders_update_authorized
on public.maintenance_work_orders
for update
using (
  public.has_org_capability(organization_id, 'maintenance:update')
  or public.has_org_capability(organization_id, 'maintenance:assign')
  or public.has_org_capability(organization_id, 'maintenance:archive')
  or public.has_org_capability(organization_id, 'maintenance:delete')
)
with check (
  public.has_org_capability(organization_id, 'maintenance:update')
  or public.has_org_capability(organization_id, 'maintenance:assign')
  or public.has_org_capability(organization_id, 'maintenance:archive')
  or public.has_org_capability(organization_id, 'maintenance:delete')
);

drop policy if exists maintenance_work_orders_delete_authorized on public.maintenance_work_orders;
create policy maintenance_work_orders_delete_authorized
on public.maintenance_work_orders
for delete
using (public.has_org_capability(organization_id, 'maintenance:delete'));

drop policy if exists maintenance_activity_select_authorized on public.maintenance_activity_events;
create policy maintenance_activity_select_authorized
on public.maintenance_activity_events
for select
using (public.has_org_capability(organization_id, 'maintenance:read'));

drop policy if exists maintenance_activity_insert_authorized on public.maintenance_activity_events;
create policy maintenance_activity_insert_authorized
on public.maintenance_activity_events
for insert
with check (public.has_org_capability(organization_id, 'maintenance:update'));
