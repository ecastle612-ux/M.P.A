import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(process.cwd(), "../../supabase/migrations/20260815210000_adr_033_dataplane_member_scope.sql"),
  "utf8"
);

const predecessor = readFileSync(
  resolve(process.cwd(), "../../supabase/migrations/20260815185722_adr_033_member_operating_scope.sql"),
  "utf8"
);

type Sku = "mpa_property_manager" | "mpa_facility_operations" | "mpa_complete_platform";
type Scope = "property_operations" | "facility_operations" | "both" | null;
type Role = "organization_admin" | "property_manager" | "maintenance_technician" | "tenant" | "vendor";
type Surface = "residential" | "facility";

const SKUS: Sku[] = ["mpa_property_manager", "mpa_facility_operations", "mpa_complete_platform"];
const SCOPES: Scope[] = ["property_operations", "facility_operations", "both", null];

function orgAllows(sku: Sku, surface: Surface): boolean {
  if (surface === "residential") {
    return sku === "mpa_property_manager" || sku === "mpa_complete_platform";
  }
  return sku === "mpa_facility_operations" || sku === "mpa_complete_platform";
}

function isPortalOnly(roles: readonly Role[]): boolean {
  const staff = roles.some(
    (role) =>
      role === "organization_admin" ||
      role === "property_manager" ||
      role === "maintenance_technician"
  );
  return !staff && roles.some((role) => role === "tenant" || role === "vendor");
}

function memberOperatingScope(sku: Sku, roles: readonly Role[], stored: Scope): Scope {
  if (isPortalOnly(roles)) {
    return null;
  }
  if (stored) {
    return stored;
  }
  if (sku === "mpa_property_manager") {
    return "property_operations";
  }
  if (sku === "mpa_facility_operations") {
    return "facility_operations";
  }
  return "both";
}

function memberAllows(sku: Sku, roles: readonly Role[], stored: Scope, surface: Surface): boolean {
  if (!orgAllows(sku, surface)) {
    return false;
  }
  if (sku !== "mpa_complete_platform") {
    return true;
  }
  const scope = memberOperatingScope(sku, roles, stored);
  if (surface === "residential") {
    return scope === "property_operations" || scope === "both";
  }
  return scope === "facility_operations" || scope === "both";
}

function isManager(roles: readonly Role[]): boolean {
  return roles.includes("organization_admin") || roles.includes("property_manager");
}

function canManageFacilityOps(sku: Sku, roles: readonly Role[], stored: Scope): boolean {
  return isManager(roles) && orgAllows(sku, "facility") && memberAllows(sku, roles, stored, "facility");
}

function managerMutate(sku: Sku, roles: readonly Role[], stored: Scope, surface: Surface): boolean {
  return isManager(roles) && orgAllows(sku, surface) && memberAllows(sku, roles, stored, surface);
}

function techUpdate(sku: Sku, roles: readonly Role[], stored: Scope, surface: Surface, assigned: boolean): boolean {
  return (
    roles.includes("maintenance_technician") &&
    assigned &&
    orgAllows(sku, surface) &&
    memberAllows(sku, roles, stored, surface)
  );
}

describe("ADR-033 Slice D dataplane migration contract", () => {
  it("is a successor after the Production ADR-033 stamp", () => {
    expect(migration).toContain("Successor after 20260815185722");
    expect(migration).toContain("create or replace function public.can_manage_facility_ops");
    expect("20260815210000" > "20260815185722").toBe(true);
    expect("20260815210000" > "20260815200000").toBe(true);
  });

  it("ANDs Facility member scope without dropping the SKU bound", () => {
    expect(migration).toContain("public.is_maintenance_manager(target_org_id)");
    expect(migration).toContain("public.org_allows_work_surface(target_org_id, 'facility')");
    expect(migration).toContain("public.member_allows_work_surface(target_org_id, 'facility')");
    expect(migration).not.toMatch(/can_manage_facility_ops[\s\S]*is_org_member/);
    expect(migration).not.toContain("using (true)");
    expect(migration).not.toContain("USING (true)");
  });

  it("replaces the three designed work-order policies only", () => {
    expect(migration).toContain("drop policy if exists maintenance_work_orders_manage_manager");
    expect(migration).toContain("create policy maintenance_work_orders_manage_manager");
    expect(migration).toContain("drop policy if exists maintenance_work_orders_update_technician");
    expect(migration).toContain("create policy maintenance_work_orders_update_technician");
    expect(migration).toContain("drop policy if exists maintenance_updates_insert");
    expect(migration).toContain("create policy maintenance_updates_insert");
    expect(migration).toContain("technician_user_id = auth.uid()");
    expect(migration).toContain("public.can_select_work_order(work_order_id)");
    expect(migration).toContain("public.is_work_order_resident(work_order_id)");
    expect(migration).toContain("public.is_linked_vendor_for_work_order(work_order_id)");
  });

  it("does not rewrite FAC-003 policies, assign scopes, or touch FIN-OPS", () => {
    expect(migration).not.toContain("create policy facility_assets");
    expect(migration).not.toContain("create policy facility_stock");
    expect(migration).not.toContain("operating_scope =");
    expect(migration).not.toContain("update public.organization_memberships");
    expect(migration).not.toContain("financial_charges");
    expect(migration).not.toContain("insert into public.product_skus");
    expect(migration).not.toContain("delete from");
    expect(migration).not.toContain("drop table");
    expect(migration).not.toContain("drop column");
  });

  it("keeps helper execute on authenticated only", () => {
    expect(migration).toContain("revoke all on function public.can_manage_facility_ops(uuid) from public, anon");
    expect(migration).toContain("grant execute on function public.can_manage_facility_ops(uuid) to authenticated");
  });

  it("does not replay the first ADR-033 migration", () => {
    expect(migration).not.toContain("create table if not exists public.organization_operating_scope_events");
    expect(predecessor).toContain("create table if not exists public.organization_operating_scope_events");
  });
});

describe("ADR-033 Slice D access matrix", () => {
  const manager: Role[] = ["property_manager"];
  const admin: Role[] = ["organization_admin"];

  it.each(SKUS)("PM/FO stored BOTH cannot expand %s beyond the SKU", (sku) => {
    if (sku === "mpa_complete_platform") {
      expect(canManageFacilityOps(sku, manager, "both")).toBe(true);
      return;
    }
    expect(canManageFacilityOps(sku, manager, "both")).toBe(sku === "mpa_facility_operations");
    expect(managerMutate(sku, manager, "both", "facility")).toBe(sku === "mpa_facility_operations");
    expect(managerMutate(sku, manager, "both", "residential")).toBe(sku === "mpa_property_manager");
  });

  it.each(SCOPES)("PM SKU × %s stays Property-only for a manager", (stored) => {
    expect(managerMutate("mpa_property_manager", manager, stored, "residential")).toBe(true);
    expect(managerMutate("mpa_property_manager", manager, stored, "facility")).toBe(false);
    expect(canManageFacilityOps("mpa_property_manager", manager, stored)).toBe(false);
  });

  it.each(SCOPES)("FO SKU × %s stays Facility-only for a manager", (stored) => {
    expect(managerMutate("mpa_facility_operations", manager, stored, "facility")).toBe(true);
    expect(managerMutate("mpa_facility_operations", manager, stored, "residential")).toBe(false);
    expect(canManageFacilityOps("mpa_facility_operations", manager, stored)).toBe(true);
  });

  it("Sarah: Complete PROPERTY manager is denied Facility data-plane writes", () => {
    const sku: Sku = "mpa_complete_platform";
    const stored: Scope = "property_operations";
    expect(managerMutate(sku, manager, stored, "residential")).toBe(true);
    expect(managerMutate(sku, manager, stored, "facility")).toBe(false);
    expect(canManageFacilityOps(sku, manager, stored)).toBe(false);
  });

  it("Mike: Complete FACILITY manager is denied residential manager mutation", () => {
    const sku: Sku = "mpa_complete_platform";
    const stored: Scope = "facility_operations";
    expect(managerMutate(sku, manager, stored, "facility")).toBe(true);
    expect(canManageFacilityOps(sku, manager, stored)).toBe(true);
    expect(managerMutate(sku, manager, stored, "residential")).toBe(false);
  });

  it("Erick: Complete BOTH admin keeps the union", () => {
    const sku: Sku = "mpa_complete_platform";
    expect(managerMutate(sku, admin, "both", "residential")).toBe(true);
    expect(managerMutate(sku, admin, "both", "facility")).toBe(true);
    expect(canManageFacilityOps(sku, admin, "both")).toBe(true);
  });

  it("Complete NULL compatibility stays BOTH", () => {
    const sku: Sku = "mpa_complete_platform";
    expect(memberOperatingScope(sku, admin, null)).toBe("both");
    expect(managerMutate(sku, admin, null, "residential")).toBe(true);
    expect(managerMutate(sku, admin, null, "facility")).toBe(true);
    expect(canManageFacilityOps(sku, admin, null)).toBe(true);
  });

  it("assigned technician UPDATE requires matching member scope", () => {
    const sku: Sku = "mpa_complete_platform";
    const tech: Role[] = ["maintenance_technician"];
    expect(techUpdate(sku, tech, "property_operations", "facility", true)).toBe(false);
    expect(techUpdate(sku, tech, "facility_operations", "facility", true)).toBe(true);
    expect(techUpdate(sku, tech, "facility_operations", "facility", false)).toBe(false);
    expect(techUpdate(sku, tech, "property_operations", "residential", true)).toBe(true);
  });

  it("portal resident and vendor are not managers", () => {
    expect(isManager(["tenant"])).toBe(false);
    expect(isManager(["vendor"])).toBe(false);
    expect(canManageFacilityOps("mpa_complete_platform", ["tenant"], null)).toBe(false);
    expect(canManageFacilityOps("mpa_complete_platform", ["vendor"], null)).toBe(false);
  });
});
