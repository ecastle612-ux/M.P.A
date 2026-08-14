-- FAC-003 Phase 1: evolve facility_assets, stock ledger, WO asset FK, MEDIA parent.
-- Production-compatible: CREATE IF NOT EXISTS + additive columns. No FAC-001 row deletes.
-- Does not reuse facility_inventory_items. No new roles or SKUs.

-- ---------------------------------------------------------------------------
-- Assets (evolve Production table; create spine for fresh environments)
-- ---------------------------------------------------------------------------

create table if not exists public.facility_assets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  property_id uuid,
  building_id uuid,
  unit_id uuid,
  location_scope text not null default 'property'
    check (location_scope in ('property', 'building', 'unit', 'common_area')),
  asset_code text not null,
  name text not null,
  asset_type text not null,
  custom_type_label text,
  install_date date,
  manufacturer text,
  model text,
  serial_number text,
  expected_life_years numeric,
  warranty_placeholder text,
  status text not null default 'active',
  location_note text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users (id),
  updated_by uuid references auth.users (id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz,
  warranty_starts_on date,
  warranty_ends_on date,
  warranty_notes text,
  replacement_planned boolean not null default false,
  replacement_target_year integer,
  replacement_notes text
);

alter table public.facility_assets add column if not exists scan_code text;
alter table public.facility_assets add column if not exists floor_label text;
alter table public.facility_assets add column if not exists room_label text;
alter table public.facility_assets add column if not exists building_label text;
alter table public.facility_assets add column if not exists purchase_date date;
alter table public.facility_assets add column if not exists vendor_id uuid references public.vendor_vendors (id) on delete set null;
alter table public.facility_assets add column if not exists replaced_asset_id uuid references public.facility_assets (id) on delete set null;
alter table public.facility_assets add column if not exists property_property_id uuid references public.property_properties (id) on delete set null;
alter table public.facility_assets alter column property_id drop not null;

alter table public.facility_assets drop constraint if exists facility_assets_status_check;
alter table public.facility_assets
  add constraint facility_assets_status_check
  check (status in ('active', 'maintenance', 'retired', 'replaced'));

create unique index if not exists facility_assets_org_code_uidx
  on public.facility_assets (organization_id, asset_code)
  where deleted_at is null;

create index if not exists facility_assets_org_status_idx
  on public.facility_assets (organization_id, status)
  where deleted_at is null;

create index if not exists facility_assets_org_site_idx
  on public.facility_assets (organization_id, property_property_id)
  where deleted_at is null;

-- Compat map: when a current-stack property shares the legacy property id, copy it.
update public.facility_assets assets
set property_property_id = properties.id
from public.property_properties properties
where assets.property_property_id is null
  and assets.property_id is not null
  and properties.id = assets.property_id
  and properties.organization_id = assets.organization_id;

-- ---------------------------------------------------------------------------
-- Work orders: optional typed asset (keep facility_asset_label)
-- ---------------------------------------------------------------------------

alter table public.maintenance_work_orders
  add column if not exists facility_asset_id uuid references public.facility_assets (id) on delete set null;

create index if not exists maintenance_work_orders_facility_asset_idx
  on public.maintenance_work_orders (organization_id, facility_asset_id)
  where facility_asset_id is not null;

-- ---------------------------------------------------------------------------
-- Stock ledger (not facility_inventory_items)
-- ---------------------------------------------------------------------------

create table if not exists public.facility_stock_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  property_property_id uuid not null references public.property_properties (id) on delete restrict,
  name text not null,
  category text not null
    check (category in ('filters', 'cleaning', 'parts', 'safety', 'office', 'other')),
  quantity_on_hand numeric not null default 0 check (quantity_on_hand >= 0),
  unit_of_measure text not null
    check (unit_of_measure in ('each', 'box', 'case', 'gallon', 'liter', 'roll', 'pair')),
  storage_location_label text not null,
  min_threshold numeric check (min_threshold is null or min_threshold >= 0),
  reorder_level numeric check (reorder_level is null or reorder_level >= 0),
  vendor_id uuid references public.vendor_vendors (id) on delete set null,
  sku_code text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users (id),
  updated_by uuid references auth.users (id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create index if not exists facility_stock_items_org_idx
  on public.facility_stock_items (organization_id, status)
  where deleted_at is null;

create table if not exists public.facility_stock_movements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  stock_item_id uuid not null references public.facility_stock_items (id) on delete restrict,
  movement_type text not null check (movement_type in ('receive', 'issue', 'adjust', 'usage')),
  quantity numeric not null check (quantity <> 0),
  quantity_after numeric not null check (quantity_after >= 0),
  reason text,
  work_order_id uuid references public.maintenance_work_orders (id) on delete set null,
  actor_user_id uuid not null references auth.users (id),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists facility_stock_movements_item_idx
  on public.facility_stock_movements (stock_item_id, created_at desc);

create table if not exists public.facility_work_order_materials (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  work_order_id uuid not null references public.maintenance_work_orders (id) on delete cascade,
  name text not null,
  quantity numeric not null,
  inventory_item_id uuid,
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users (id),
  updated_by uuid references auth.users (id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.facility_work_order_materials
  add column if not exists stock_item_id uuid references public.facility_stock_items (id) on delete set null;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.can_manage_facility_ops(target_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_maintenance_manager(target_org_id)
    and public.org_allows_work_surface(target_org_id, 'facility');
$$;

create or replace function public.can_select_facility_asset(target_asset_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.facility_assets assets
    where assets.id = target_asset_id
      and assets.deleted_at is null
      and (
        public.can_manage_facility_ops(assets.organization_id)
        or exists (
          select 1
          from public.maintenance_work_orders work_orders
          where work_orders.facility_asset_id = assets.id
            and work_orders.organization_id = assets.organization_id
            and work_orders.work_surface = 'facility'
            and work_orders.technician_user_id = auth.uid()
            and public.can_select_work_order(work_orders.id)
        )
      )
  );
$$;

create or replace function public.can_select_facility_stock_item(target_stock_item_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.facility_stock_items items
    where items.id = target_stock_item_id
      and items.deleted_at is null
      and public.can_manage_facility_ops(items.organization_id)
  );
$$;

create or replace function public.apply_facility_stock_movement(
  target_stock_item_id uuid,
  target_movement_type text,
  target_quantity numeric,
  target_reason text default null,
  target_work_order_id uuid default null
)
returns public.facility_stock_movements
language plpgsql
security definer
set search_path = public
as $$
declare
  item public.facility_stock_items;
  signed_qty numeric;
  next_qty numeric;
  movement public.facility_stock_movements;
begin
  if auth.uid() is null then
    raise exception 'unauthenticated';
  end if;
  if target_movement_type not in ('receive', 'issue', 'adjust', 'usage') then
    raise exception 'invalid movement type';
  end if;
  if target_quantity is null or target_quantity = 0 then
    raise exception 'quantity must be non-zero';
  end if;

  select * into item
  from public.facility_stock_items
  where id = target_stock_item_id
    and deleted_at is null
  for update;

  if item.id is null then
    raise exception 'stock item not found';
  end if;

  if target_movement_type = 'usage' then
    if target_work_order_id is null then
      raise exception 'usage requires a work order';
    end if;
    if not public.can_select_work_order(target_work_order_id) then
      raise exception 'work order not accessible';
    end if;
    if not exists (
      select 1
      from public.maintenance_work_orders work_orders
      where work_orders.id = target_work_order_id
        and work_orders.organization_id = item.organization_id
        and work_orders.work_surface = 'facility'
        and (
          public.can_manage_facility_ops(item.organization_id)
          or work_orders.technician_user_id = auth.uid()
        )
    ) then
      raise exception 'usage not permitted on this work order';
    end if;
    signed_qty := -abs(target_quantity);
  elsif target_movement_type = 'receive' then
    if not public.can_manage_facility_ops(item.organization_id) then
      raise exception 'forbidden';
    end if;
    signed_qty := abs(target_quantity);
  elsif target_movement_type = 'issue' then
    if not public.can_manage_facility_ops(item.organization_id) then
      raise exception 'forbidden';
    end if;
    signed_qty := -abs(target_quantity);
  else
    if not public.can_manage_facility_ops(item.organization_id) then
      raise exception 'forbidden';
    end if;
    if target_reason is null or length(trim(target_reason)) = 0 then
      raise exception 'adjust requires a reason';
    end if;
    signed_qty := target_quantity;
  end if;

  next_qty := item.quantity_on_hand + signed_qty;
  if next_qty < 0 then
    raise exception 'insufficient stock';
  end if;

  update public.facility_stock_items
  set
    quantity_on_hand = next_qty,
    updated_at = timezone('utc', now()),
    updated_by = auth.uid()
  where id = item.id;

  insert into public.facility_stock_movements (
    organization_id,
    stock_item_id,
    movement_type,
    quantity,
    quantity_after,
    reason,
    work_order_id,
    actor_user_id
  ) values (
    item.organization_id,
    item.id,
    target_movement_type,
    signed_qty,
    next_qty,
    target_reason,
    target_work_order_id,
    auth.uid()
  )
  returning * into movement;

  return movement;
end;
$$;

revoke all on function public.can_manage_facility_ops(uuid) from public, anon;
revoke all on function public.can_select_facility_asset(uuid) from public, anon;
revoke all on function public.can_select_facility_stock_item(uuid) from public, anon;
revoke all on function public.apply_facility_stock_movement(uuid, text, numeric, text, uuid) from public, anon;
grant execute on function public.can_manage_facility_ops(uuid) to authenticated;
grant execute on function public.can_select_facility_asset(uuid) to authenticated;
grant execute on function public.can_select_facility_stock_item(uuid) to authenticated;
grant execute on function public.apply_facility_stock_movement(uuid, text, numeric, text, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.facility_assets enable row level security;
alter table public.facility_stock_items enable row level security;
alter table public.facility_stock_movements enable row level security;
alter table public.facility_work_order_materials enable row level security;

drop policy if exists facility_assets_select_authorized on public.facility_assets;
drop policy if exists facility_assets_insert_authorized on public.facility_assets;
drop policy if exists facility_assets_update_authorized on public.facility_assets;
drop policy if exists facility_assets_select on public.facility_assets;
drop policy if exists facility_assets_insert on public.facility_assets;
drop policy if exists facility_assets_update on public.facility_assets;

create policy facility_assets_select
on public.facility_assets
for select
to authenticated
using (public.can_select_facility_asset(id));

create policy facility_assets_insert
on public.facility_assets
for insert
to authenticated
with check (
  created_by = auth.uid()
  and public.can_manage_facility_ops(organization_id)
);

create policy facility_assets_update
on public.facility_assets
for update
to authenticated
using (public.can_manage_facility_ops(organization_id))
with check (public.can_manage_facility_ops(organization_id));

drop policy if exists facility_stock_items_select on public.facility_stock_items;
drop policy if exists facility_stock_items_insert on public.facility_stock_items;
drop policy if exists facility_stock_items_update on public.facility_stock_items;

create policy facility_stock_items_select
on public.facility_stock_items
for select
to authenticated
using (public.can_select_facility_stock_item(id));

create policy facility_stock_items_insert
on public.facility_stock_items
for insert
to authenticated
with check (
  created_by = auth.uid()
  and public.can_manage_facility_ops(organization_id)
);

create policy facility_stock_items_update
on public.facility_stock_items
for update
to authenticated
using (public.can_manage_facility_ops(organization_id))
with check (public.can_manage_facility_ops(organization_id));

drop policy if exists facility_stock_movements_select on public.facility_stock_movements;
drop policy if exists facility_stock_movements_insert on public.facility_stock_movements;

create policy facility_stock_movements_select
on public.facility_stock_movements
for select
to authenticated
using (public.can_select_facility_stock_item(stock_item_id));

-- Inserts go through apply_facility_stock_movement (security definer).
create policy facility_stock_movements_insert
on public.facility_stock_movements
for insert
to authenticated
with check (false);

drop policy if exists facility_work_order_materials_select on public.facility_work_order_materials;
drop policy if exists facility_work_order_materials_insert on public.facility_work_order_materials;
drop policy if exists facility_work_order_materials_update on public.facility_work_order_materials;
drop policy if exists facility_work_order_materials_delete on public.facility_work_order_materials;

create policy facility_work_order_materials_select
on public.facility_work_order_materials
for select
to authenticated
using (public.can_select_work_order(work_order_id));

create policy facility_work_order_materials_insert
on public.facility_work_order_materials
for insert
to authenticated
with check (public.can_select_work_order(work_order_id));

-- ---------------------------------------------------------------------------
-- MEDIA-001: facility_asset parent
-- ---------------------------------------------------------------------------

alter table public.media_attachments
  drop constraint if exists media_attachments_related_entity_type_check;

alter table public.media_attachments
  add constraint media_attachments_related_entity_type_check
  check (related_entity_type in (
    'maintenance',
    'vendor',
    'inspection',
    'incident',
    'organization',
    'conversation_message',
    'facility_asset'
  ));
