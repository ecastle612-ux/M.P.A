-- STAB-004: Facility Operations Production MVP — shared work-order surface.
-- Additive only. Reuses maintenance_work_orders (no parallel WO table).

alter table public.maintenance_work_orders
  add column if not exists work_surface text not null default 'residential',
  add column if not exists facility_asset_label text,
  add column if not exists due_at timestamptz,
  add column if not exists cancelled_at timestamptz;

alter table public.maintenance_work_orders
  drop constraint if exists maintenance_work_orders_work_surface_check;

alter table public.maintenance_work_orders
  add constraint maintenance_work_orders_work_surface_check
  check (work_surface in ('residential', 'facility'));

alter table public.maintenance_work_orders
  drop constraint if exists maintenance_work_orders_category_check;

alter table public.maintenance_work_orders
  add constraint maintenance_work_orders_category_check
  check (
    category in (
      'general',
      'plumbing',
      'electrical',
      'hvac',
      'appliance',
      'structural',
      'other',
      'preventive',
      'inspection',
      'safety',
      'compliance',
      'building_system',
      'inventory',
      'parts'
    )
  );

create index if not exists maintenance_work_orders_org_surface_status_idx
  on public.maintenance_work_orders (organization_id, work_surface, status);

comment on column public.maintenance_work_orders.work_surface is
  'STAB-004: residential (PM Maintenance home) vs facility (FO Operations home).';
comment on column public.maintenance_work_orders.facility_asset_label is
  'Optional facility asset/system label for FO work; not a parallel asset registry.';
comment on column public.maintenance_work_orders.due_at is
  'Optional due timestamp for overdue attention on Facility Mission Control.';
comment on column public.maintenance_work_orders.cancelled_at is
  'Set when work order is cancelled (STAB-010 lifecycle).';
