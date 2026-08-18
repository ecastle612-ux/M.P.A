import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { authorizedSearchDomains, entitlementsForMember } from "@mpa/shared";

const webRoot = join(process.cwd(), "src");

function read(rel: string): string {
  return readFileSync(join(webRoot, rel), "utf8");
}

describe("SIMPLICITY SLICE 4 — federated search service contracts", () => {
  it("never queries unauthorized domains then hides them in UI", () => {
    const source = read("lib/simplicity/staff-search-service.ts");
    expect(source).toMatch(/if \(domains\.includes\(domain\)\)/);
    expect(source).not.toMatch(/filter\(\(.*unauthorized/);
    expect(read("lib/simplicity/staff-search-authz.ts")).toContain('entitlement: "platform.search"');
  });

  it("does not introduce finance global search or intake tokens", () => {
    const source = read("lib/simplicity/staff-search-service.ts");
    expect(source).not.toMatch(/finance_charges|ledger_entries|stripe|public_token|status_token/);
    expect(source).toMatch(/request_number/);
    expect(source).toMatch(/asset_code/);
    expect(source).toMatch(/technician_user_id/);
  });

  it("reuses Slice 1–3 deep links and org-scoped tables", () => {
    const source = read("lib/simplicity/staff-search-service.ts");
    expect(source).toMatch(/\.eq\("organization_id", organizationId\)/);
    expect(source).toMatch(/staffWorkOrderHref/);
    expect(source).toMatch(/staffAssetHref/);
    expect(source).toMatch(/facility_assets/);
    expect(source).toMatch(/facility_pm_plans/);
    expect(source).toMatch(/staffPmPlanHref/);
    expect(source).toMatch(/maintenance_work_orders/);
  });

  it("Complete FO-scoped entitlements omit PM search domains", () => {
    const entitlements = entitlementsForMember({
      sku: "mpa_complete_platform",
      roles: ["property_manager"],
      storedScope: "facility_operations"
    });
    const domains = authorizedSearchDomains({
      sku: "mpa_complete_platform",
      roles: ["property_manager"],
      storedScope: "facility_operations",
      entitlements,
      userId: "u1"
    });
    expect(domains).not.toContain("resident");
    expect(domains).toContain("asset");
    expect(domains).toContain("pm_plan");
  });
});

describe("SIMPLICITY SLICE 4 — API and shell wiring", () => {
  it("registers /api/shared/search before the shared deny catch-all", () => {
    const source = readFileSync(
      join(process.cwd(), "../..", "packages/shared/src/commercial/route-entitlements.ts"),
      "utf8"
    );
    const searchIndex = source.indexOf('path.startsWith("/api/shared/search")');
    const denyIndex = source.indexOf('path.startsWith("/api/shared/")');
    expect(searchIndex).toBeGreaterThan(-1);
    expect(searchIndex).toBeLessThan(denyIndex);
  });

  it("staff search route uses server-side requireStaffSearch", () => {
    expect(read("app/api/shared/search/route.ts")).toMatch(/requireStaffSearch/);
    expect(read("app/api/shared/search/resolve/route.ts")).toMatch(/requireStaffSearch/);
    expect(read("lib/simplicity/staff-search-authz.ts")).toMatch(/isPortalOnlyRoles/);
    expect(read("lib/simplicity/staff-search-authz.ts")).toMatch(/isStaffSearchActor/);
  });

  it("does not add sidebar rows for search or create", () => {
    const sidebar = read("components/shell/sidebar.tsx");
    expect(sidebar).not.toMatch(/Global Search/);
    expect(sidebar).not.toMatch(/Quick Create/);
    const top = read("components/shell/top-navigation.tsx");
    expect(top).toMatch(/CommandPalette/);
    expect(top).toMatch(/QuickCreateButton/);
  });
});
