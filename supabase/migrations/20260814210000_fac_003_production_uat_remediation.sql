-- FAC-003 production UAT remediation (docs/109, ADR-029)
-- RETURNING-safe SELECT policies. Equivalent privileges to ADR-028.
-- Does not change INSERT / UPDATE or movement RPC. No new tables.

-- ---------------------------------------------------------------------------
-- facility_assets SELECT: evaluate the current row, do not re-select this table
-- ---------------------------------------------------------------------------
drop policy if exists facility_assets_select on public.facility_assets;

create policy facility_assets_select
on public.facility_assets
for select
to authenticated
using (
  deleted_at is null
  and (
    public.can_manage_facility_ops(organization_id)
    or exists (
      select 1
      from public.maintenance_work_orders work_orders
      where work_orders.facility_asset_id = facility_assets.id
        and work_orders.organization_id = facility_assets.organization_id
        and work_orders.work_surface = 'facility'
        and work_orders.technician_user_id = auth.uid()
        and public.can_select_work_order(work_orders.id)
    )
  )
);

-- ---------------------------------------------------------------------------
-- facility_stock_items SELECT: manager-only, current-row organization_id
-- ---------------------------------------------------------------------------
drop policy if exists facility_stock_items_select on public.facility_stock_items;

create policy facility_stock_items_select
on public.facility_stock_items
for select
to authenticated
using (
  deleted_at is null
  and public.can_manage_facility_ops(organization_id)
);

-- Helpers remain for child-table checks (e.g. facility_stock_movements).
-- They must not be the USING body of the parent table SELECT policies.
