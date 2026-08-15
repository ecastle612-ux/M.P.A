-- ADR-033 / docs/130 — data-plane member scope (Slice D remainder).
-- Repo-only. Do not apply to Production in this slice.
-- Additive. No Stripe / SKU / role catalog / FIN-OPS financial_* changes.
-- No operating_scope assignment. No customer row rewrite.
-- Successor after 20260815185722 / adr_033_member_operating_scope.

-- ---------------------------------------------------------------------------
-- Facility manager helper: SKU remains outer bound AND member scope
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
    and public.org_allows_work_surface(target_org_id, 'facility')
    and public.member_allows_work_surface(target_org_id, 'facility');
$$;

revoke all on function public.can_manage_facility_ops(uuid) from public, anon;
grant execute on function public.can_manage_facility_ops(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Work-order manager ALL: INSERT / UPDATE / DELETE per work_surface
-- ---------------------------------------------------------------------------

drop policy if exists maintenance_work_orders_manage_manager on public.maintenance_work_orders;
create policy maintenance_work_orders_manage_manager on public.maintenance_work_orders
for all
using (
  public.is_maintenance_manager(organization_id)
  and public.org_allows_work_surface(organization_id, work_surface)
  and public.member_allows_work_surface(organization_id, work_surface)
)
with check (
  public.is_maintenance_manager(organization_id)
  and public.org_allows_work_surface(organization_id, work_surface)
  and public.member_allows_work_surface(organization_id, work_surface)
);

-- ---------------------------------------------------------------------------
-- Assigned technician UPDATE: keep assignment, add member scope
-- ---------------------------------------------------------------------------

drop policy if exists maintenance_work_orders_update_technician on public.maintenance_work_orders;
create policy maintenance_work_orders_update_technician on public.maintenance_work_orders
for update
using (
  public.is_maintenance_technician(organization_id)
  and public.org_allows_work_surface(organization_id, work_surface)
  and public.member_allows_work_surface(organization_id, work_surface)
  and technician_user_id = auth.uid()
)
with check (
  public.is_maintenance_technician(organization_id)
  and public.org_allows_work_surface(organization_id, work_surface)
  and public.member_allows_work_surface(organization_id, work_surface)
  and technician_user_id = auth.uid()
);

-- ---------------------------------------------------------------------------
-- Updates INSERT: staff must already be able to select the work order
-- Resident / vendor self-access unchanged
-- ---------------------------------------------------------------------------

drop policy if exists maintenance_updates_insert on public.maintenance_work_order_updates;
create policy maintenance_updates_insert on public.maintenance_work_order_updates
for insert
with check (
  (
    (
      public.is_maintenance_manager(organization_id)
      or public.is_maintenance_technician(organization_id)
    )
    and public.can_select_work_order(work_order_id)
  )
  or public.is_work_order_resident(work_order_id)
  or public.is_linked_vendor_for_work_order(work_order_id)
);
