-- LAUNCH-001 Journey J6 — First Maintenance Request
-- Canonical work-order workflow under Property Manager Maintenance.

-- ---------------------------------------------------------------------------
-- Capabilities
-- ---------------------------------------------------------------------------

insert into public.permission_capabilities (key, namespace, description)
values
  ('pm.maintenance:read', 'pm.maintenance', 'Read maintenance work orders and Maintenance Command Center'),
  ('pm.maintenance:write', 'pm.maintenance', 'Update work-order progress, notes, and completion'),
  ('pm.maintenance:assign', 'pm.maintenance', 'Prioritize and assign technicians or vendors')
on conflict (key) do nothing;

insert into public.role_permission_grants (role, capability_key)
values
  ('organization_admin', 'pm.maintenance:read'),
  ('organization_admin', 'pm.maintenance:write'),
  ('organization_admin', 'pm.maintenance:assign'),
  ('property_manager', 'pm.maintenance:read'),
  ('property_manager', 'pm.maintenance:write'),
  ('property_manager', 'pm.maintenance:assign'),
  ('maintenance_technician', 'pm.maintenance:read'),
  ('maintenance_technician', 'pm.maintenance:write'),
  ('property_owner', 'pm.maintenance:read'),
  ('vendor', 'pm.maintenance:read'),
  ('vendor', 'pm.maintenance:write')
on conflict (role, capability_key) do nothing;

-- Link org vendors to portal users for Vendor Operations assignments
alter table public.vendor_vendors
  add column if not exists user_id uuid references auth.users (id) on delete set null;

create index if not exists vendor_vendors_user_idx
  on public.vendor_vendors (organization_id, user_id)
  where user_id is not null;

-- ---------------------------------------------------------------------------
-- Work orders
-- ---------------------------------------------------------------------------

create table if not exists public.maintenance_work_orders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  property_id uuid not null references public.property_properties (id) on delete restrict,
  unit_id uuid references public.property_units (id) on delete set null,
  resident_id uuid references public.pm_residents (id) on delete set null,
  requested_by_user_id uuid references auth.users (id) on delete set null,
  title text not null,
  description text not null default '',
  category text not null default 'general'
    check (category in ('general', 'plumbing', 'electrical', 'hvac', 'appliance', 'structural', 'other')),
  priority text not null default 'normal'
    check (priority in ('low', 'normal', 'high', 'emergency')),
  status text not null default 'submitted'
    check (status in (
      'submitted',
      'triaged',
      'assigned',
      'in_progress',
      'completed',
      'closed',
      'cancelled'
    )),
  assignee_type text not null default 'unassigned'
    check (assignee_type in ('unassigned', 'technician', 'vendor')),
  technician_user_id uuid references auth.users (id) on delete set null,
  vendor_id uuid references public.vendor_vendors (id) on delete set null,
  submitted_at timestamptz not null default timezone('utc', now()),
  triaged_at timestamptz,
  assigned_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  resident_confirmed_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists maintenance_work_orders_org_status_idx
  on public.maintenance_work_orders (organization_id, status, priority, submitted_at desc);

create index if not exists maintenance_work_orders_property_idx
  on public.maintenance_work_orders (organization_id, property_id, status);

create index if not exists maintenance_work_orders_resident_idx
  on public.maintenance_work_orders (organization_id, resident_id);

create index if not exists maintenance_work_orders_technician_idx
  on public.maintenance_work_orders (organization_id, technician_user_id)
  where technician_user_id is not null;

create index if not exists maintenance_work_orders_vendor_idx
  on public.maintenance_work_orders (organization_id, vendor_id)
  where vendor_id is not null;

create table if not exists public.maintenance_work_order_updates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  work_order_id uuid not null references public.maintenance_work_orders (id) on delete cascade,
  actor_user_id uuid references auth.users (id) on delete set null,
  actor_role text not null default 'staff'
    check (actor_role in ('resident', 'manager', 'technician', 'vendor', 'system')),
  body text not null,
  status_from text,
  status_to text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists maintenance_work_order_updates_wo_idx
  on public.maintenance_work_order_updates (work_order_id, created_at desc);

create table if not exists public.maintenance_notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  work_order_id uuid references public.maintenance_work_orders (id) on delete cascade,
  notification_key text not null,
  title text not null,
  body text not null,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists maintenance_notifications_user_idx
  on public.maintenance_notifications (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.is_maintenance_manager(target_org_id uuid)
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

create or replace function public.is_maintenance_technician(target_org_id uuid)
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
      and 'maintenance_technician' = any(memberships.roles)
  );
$$;

create or replace function public.is_linked_vendor_for_work_order(target_work_order_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.maintenance_work_orders wo
    join public.vendor_vendors v on v.id = wo.vendor_id
    where wo.id = target_work_order_id
      and v.user_id = auth.uid()
  );
$$;

create or replace function public.is_work_order_resident(target_work_order_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.maintenance_work_orders wo
    left join public.pm_residents r on r.id = wo.resident_id
    where wo.id = target_work_order_id
      and (
        wo.requested_by_user_id = auth.uid()
        or r.user_id = auth.uid()
      )
  );
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.maintenance_work_orders enable row level security;
alter table public.maintenance_work_order_updates enable row level security;
alter table public.maintenance_notifications enable row level security;

drop policy if exists maintenance_work_orders_select on public.maintenance_work_orders;
create policy maintenance_work_orders_select on public.maintenance_work_orders
for select using (
  public.is_maintenance_manager(organization_id)
  or (
    public.is_maintenance_technician(organization_id)
    and (technician_user_id = auth.uid() or technician_user_id is null or status in ('submitted', 'triaged'))
  )
  or requested_by_user_id = auth.uid()
  or exists (
    select 1 from public.pm_residents r
    where r.id = resident_id and r.user_id = auth.uid()
  )
  or exists (
    select 1 from public.vendor_vendors v
    where v.id = vendor_id and v.user_id = auth.uid()
  )
  or public.is_org_member(organization_id)
);

drop policy if exists maintenance_work_orders_insert_resident on public.maintenance_work_orders;
create policy maintenance_work_orders_insert_resident on public.maintenance_work_orders
for insert with check (
  requested_by_user_id = auth.uid()
  and exists (
    select 1 from public.pm_residents r
    where r.id = resident_id
      and r.organization_id = organization_id
      and r.user_id = auth.uid()
      and r.portal_status = 'active'
  )
);

drop policy if exists maintenance_work_orders_manage_manager on public.maintenance_work_orders;
create policy maintenance_work_orders_manage_manager on public.maintenance_work_orders
for all using (public.is_maintenance_manager(organization_id))
with check (public.is_maintenance_manager(organization_id));

drop policy if exists maintenance_work_orders_update_technician on public.maintenance_work_orders;
create policy maintenance_work_orders_update_technician on public.maintenance_work_orders
for update using (
  public.is_maintenance_technician(organization_id)
  and technician_user_id = auth.uid()
)
with check (
  public.is_maintenance_technician(organization_id)
  and technician_user_id = auth.uid()
);

drop policy if exists maintenance_work_orders_update_vendor on public.maintenance_work_orders;
create policy maintenance_work_orders_update_vendor on public.maintenance_work_orders
for update using (public.is_linked_vendor_for_work_order(id))
with check (public.is_linked_vendor_for_work_order(id));

drop policy if exists maintenance_work_orders_update_resident on public.maintenance_work_orders;
create policy maintenance_work_orders_update_resident on public.maintenance_work_orders
for update using (public.is_work_order_resident(id))
with check (public.is_work_order_resident(id));

drop policy if exists maintenance_updates_select on public.maintenance_work_order_updates;
create policy maintenance_updates_select on public.maintenance_work_order_updates
for select using (
  public.is_org_member(organization_id)
  or public.is_work_order_resident(work_order_id)
  or public.is_linked_vendor_for_work_order(work_order_id)
);

drop policy if exists maintenance_updates_insert on public.maintenance_work_order_updates;
create policy maintenance_updates_insert on public.maintenance_work_order_updates
for insert with check (
  public.is_maintenance_manager(organization_id)
  or public.is_maintenance_technician(organization_id)
  or public.is_work_order_resident(work_order_id)
  or public.is_linked_vendor_for_work_order(work_order_id)
);

drop policy if exists maintenance_notifications_select_own on public.maintenance_notifications;
create policy maintenance_notifications_select_own on public.maintenance_notifications
for select using (user_id = auth.uid() or public.is_maintenance_manager(organization_id));

drop policy if exists maintenance_notifications_insert on public.maintenance_notifications;
create policy maintenance_notifications_insert on public.maintenance_notifications
for insert with check (
  public.is_maintenance_manager(organization_id)
  or public.is_org_member(organization_id)
  or user_id = auth.uid()
);
