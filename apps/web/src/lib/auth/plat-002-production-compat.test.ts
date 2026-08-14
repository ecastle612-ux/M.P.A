import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const successor = readFileSync(
  resolve(process.cwd(), "../../supabase/migrations/20260814180000_plat_002_production_compat.sql"),
  "utf8"
);

const historical = readFileSync(
  resolve(process.cwd(), "../../supabase/migrations/20260814160000_plat_002_authorization_hardening.sql"),
  "utf8"
);

describe("PLAT-002 production compat successor contract", () => {
  it("keeps approved SKU surface helpers and can_select_work_order", () => {
    expect(successor).toContain("create or replace function public.org_sku");
    expect(successor).toContain("create or replace function public.org_allows_work_surface");
    expect(successor).toContain("create or replace function public.can_select_work_order");
    expect(successor).toContain("mpa_property_manager");
    expect(successor).toContain("mpa_facility_operations");
    expect(successor).toContain("mpa_complete_platform");
    expect(successor).toContain("using (public.can_select_work_order(id))");
    expect(successor).toContain("using (public.can_select_work_order(work_order_id))");
    expect(successor).toContain("public.org_allows_work_surface(organization_id, work_surface)");
  });

  it("skips notifications policy when the relation is absent", () => {
    expect(successor).toContain("to_regclass('public.maintenance_notifications')");
    expect(successor).toContain("Do not create maintenance_notifications");
    expect(successor).not.toMatch(/create table[\s\S]*maintenance_notifications/);
    expect(successor).not.toMatch(/^drop policy if exists maintenance_notifications_insert/m);
  });

  it("drops leftover authorized work-order policies", () => {
    expect(successor).toContain(
      "drop policy if exists maintenance_work_orders_select_authorized on public.maintenance_work_orders"
    );
    expect(successor).toContain(
      "drop policy if exists maintenance_work_orders_insert_authorized on public.maintenance_work_orders"
    );
    expect(successor).toContain(
      "drop policy if exists maintenance_work_orders_update_authorized on public.maintenance_work_orders"
    );
    expect(successor).toContain(
      "drop policy if exists maintenance_work_orders_delete_authorized on public.maintenance_work_orders"
    );
  });

  it("defines is_pm_comms_staff without technicians", () => {
    expect(successor).toContain("create or replace function public.is_pm_comms_staff");
    expect(successor).toContain("and not memberships.roles && array['maintenance_technician']::text[]");
    expect(successor).toContain("public.is_pm_comms_staff(target_org_id)");
    expect(successor).not.toMatch(/can_access_tenant_conversation[\s\S]*public\.is_pm_staff\(target_org_id\)/);
  });

  it("does not add roles, SKUs, or replay J6", () => {
    expect(successor).not.toContain("facility_manager");
    expect(successor).not.toContain("facility_technician");
    expect(successor).not.toContain("insert into public.product_skus");
    expect(successor).not.toContain("20260806110000");
  });

  it("leaves the historical 160000 file unchanged as a non-Production artifact", () => {
    expect(historical).toContain("drop policy if exists maintenance_notifications_insert on public.maintenance_notifications");
    expect(historical).not.toContain("maintenance_work_orders_select_authorized");
  });
});
