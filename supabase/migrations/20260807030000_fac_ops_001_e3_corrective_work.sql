-- FAC-OPS-001 Phase E.3 — Corrective facility work (shared WO product_context)
-- Extends maintenance_work_orders. No second WO engine.
-- Out of scope: inventory, parts, PM programs, inspections, safety, compliance, capital.

insert into public.permission_capabilities (key, namespace, description)
values
  ('facility.operations:read', 'facility.operations', 'Read Facility Operations corrective work queue'),
  ('facility.operations:write', 'facility.operations', 'Create facility corrective work and record progress'),
  ('facility.operations:assign', 'facility.operations', 'Prioritize and assign facility corrective work')
on conflict (key) do nothing;

insert into public.role_permission_grants (role, capability_key)
values
  ('organization_admin', 'facility.operations:read'),
  ('organization_admin', 'facility.operations:write'),
  ('organization_admin', 'facility.operations:assign'),
  ('property_manager', 'facility.operations:read'),
  ('property_manager', 'facility.operations:write'),
  ('property_manager', 'facility.operations:assign'),
  ('maintenance_technician', 'facility.operations:read'),
  ('maintenance_technician', 'facility.operations:write'),
  ('property_owner', 'facility.operations:read')
on conflict (role, capability_key) do nothing;

-- Shared WO product context (FAC-OPS-001 §07)
alter table public.maintenance_work_orders
  alter column property_id drop not null;

alter table public.maintenance_work_orders
  add column if not exists product_context text not null default 'property_manager',
  add column if not exists work_kind text not null default 'other',
  add column if not exists source text not null default 'system',
  add column if not exists site_id uuid references public.facility_sites (id) on delete set null,
  add column if not exists asset_id uuid references public.facility_assets (id) on delete set null,
  add column if not exists system_id uuid references public.facility_systems (id) on delete set null;

update public.maintenance_work_orders
set
  product_context = coalesce(nullif(product_context, ''), 'property_manager'),
  work_kind = case
    when work_kind is null or work_kind = 'other' then 'resident_request'
    else work_kind
  end,
  source = case
    when source is null or source = 'system' then 'portal_tenant'
    else source
  end
where product_context = 'property_manager'
  or product_context is null
  or product_context = '';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'maintenance_work_orders_product_context_check'
  ) then
    alter table public.maintenance_work_orders
      add constraint maintenance_work_orders_product_context_check
      check (product_context in ('property_manager', 'facility'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'maintenance_work_orders_work_kind_check'
  ) then
    alter table public.maintenance_work_orders
      add constraint maintenance_work_orders_work_kind_check
      check (work_kind in (
        'resident_request',
        'unit_turnover',
        'facility_corrective',
        'facility_preventive',
        'facility_inspection_corrective',
        'facility_safety_corrective',
        'other'
      ));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'maintenance_work_orders_source_check'
  ) then
    alter table public.maintenance_work_orders
      add constraint maintenance_work_orders_source_check
      check (source in (
        'portal_tenant',
        'pm_desk',
        'facility_ops',
        'facility_pm_generator',
        'facility_inspection',
        'facility_safety',
        'system'
      ));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'maintenance_work_orders_facility_context_check'
  ) then
    alter table public.maintenance_work_orders
      add constraint maintenance_work_orders_facility_context_check
      check (
        (product_context = 'property_manager' and property_id is not null)
        or (product_context = 'facility' and site_id is not null)
      );
  end if;
end $$;

create index if not exists maintenance_work_orders_product_context_idx
  on public.maintenance_work_orders (organization_id, product_context, status, priority, submitted_at desc);

create index if not exists maintenance_work_orders_site_idx
  on public.maintenance_work_orders (organization_id, site_id, status)
  where site_id is not null;

create index if not exists maintenance_work_orders_asset_idx
  on public.maintenance_work_orders (organization_id, asset_id)
  where asset_id is not null;

create index if not exists maintenance_work_orders_system_idx
  on public.maintenance_work_orders (organization_id, system_id)
  where system_id is not null;

-- Facility Operations actors may create/manage facility-context work orders
-- (reuse shared table; facility-only orgs do not need PM SKU for RLS).
create or replace function public.is_facility_operations_manager(target_org_id uuid)
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

drop policy if exists maintenance_work_orders_insert_facility on public.maintenance_work_orders;
create policy maintenance_work_orders_insert_facility on public.maintenance_work_orders
for insert with check (
  product_context = 'facility'
  and site_id is not null
  and (
    public.is_facility_operations_manager(organization_id)
    or public.is_maintenance_manager(organization_id)
  )
);

drop policy if exists maintenance_work_orders_update_facility_manager on public.maintenance_work_orders;
create policy maintenance_work_orders_update_facility_manager on public.maintenance_work_orders
for update using (
  product_context = 'facility'
  and public.is_facility_operations_manager(organization_id)
)
with check (
  product_context = 'facility'
  and public.is_facility_operations_manager(organization_id)
);
