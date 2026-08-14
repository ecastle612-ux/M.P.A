import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(process.cwd(), "../../supabase/migrations/20260814160000_plat_002_authorization_hardening.sql"),
  "utf8"
);

describe("PLAT-002 RLS migration contract", () => {
  it("adds SKU surface helpers and can_select_work_order", () => {
    expect(migration).toContain("create or replace function public.org_sku");
    expect(migration).toContain("create or replace function public.org_allows_work_surface");
    expect(migration).toContain("create or replace function public.can_select_work_order");
    expect(migration).toContain("mpa_property_manager");
    expect(migration).toContain("mpa_facility_operations");
    expect(migration).toContain("mpa_complete_platform");
  });

  it("drops org-member SELECT on work orders and child updates inherit parent", () => {
    expect(migration).toContain("using (public.can_select_work_order(id))");
    expect(migration).toContain("using (public.can_select_work_order(work_order_id))");
    expect(migration).not.toMatch(
      /maintenance_work_orders_select[\s\S]*or public\.is_org_member\(organization_id\)/
    );
  });

  it("defines is_pm_comms_staff without technicians", () => {
    expect(migration).toContain("create or replace function public.is_pm_comms_staff");
    expect(migration).toContain("'organization_admin'");
    expect(migration).toContain("'property_manager'");
    expect(migration).toContain("'leasing_agent'");
    expect(migration).toContain("and not memberships.roles && array['maintenance_technician']::text[]");
    expect(migration).toContain("public.is_pm_comms_staff(target_org_id)");
    expect(migration).not.toMatch(/can_access_tenant_conversation[\s\S]*public\.is_pm_staff\(target_org_id\)/);
  });

  it("revokes anon execute on new helpers", () => {
    expect(migration).toContain("revoke all on function public.org_sku(uuid) from public, anon");
    expect(migration).toContain("revoke all on function public.is_pm_comms_staff(uuid) from public, anon");
    expect(migration).toContain("revoke all on function public.can_select_work_order(uuid) from public, anon");
  });

  it("does not add roles or SKUs", () => {
    expect(migration).not.toContain("facility_manager");
    expect(migration).not.toContain("facility_technician");
    expect(migration).not.toContain("insert into public.product_skus");
  });
});
