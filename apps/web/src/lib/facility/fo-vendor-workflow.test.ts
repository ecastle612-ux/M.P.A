import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  createVendorDirectoryInputSchema,
  entitlementsForSku,
  evaluatePathEntitlement,
  hasEntitlement,
  ownerDay1ChecklistForSku
} from "@mpa/shared";

const webRoot = join(process.cwd(), "src");

function read(rel: string): string {
  return readFileSync(join(webRoot, rel), "utf8");
}

describe("FO vendor workflow completion", () => {
  it("exposes FO vendors API without pm.vendors entitlement or schema migration", () => {
    const route = read("app/api/facility/vendors/route.ts");
    expect(route).toMatch(/requireFacilityOperation/);
    expect(route).toMatch(/facility\.operations/);
    expect(route).toMatch(/createVendorDirectory/);
    expect(route).toMatch(/listVendors/);
    expect(route).toMatch(/Vendor email is required/);
    expect(route).not.toMatch(/pm\.vendors/);
    expect(route).not.toMatch(/alter table|create table/i);
  });

  it("wires FO vendors workspace and navigation guidance", () => {
    expect(read("app/(app)/facility/vendors/page.tsx")).toMatch(/FacilityVendorsWorkspace/);
    const workspace = read("components/facility/facility-vendors-workspace.tsx");
    expect(workspace).toMatch(/fo-add-vendor-form/);
    expect(workspace).toMatch(/\/api\/facility\/vendors/);
    expect(workspace).toMatch(/Facility Operations → Vendors/);
    expect(read("components/facility/facility-operations-workspace.tsx")).toMatch(
      /fo-assign-empty-vendors/
    );
    expect(read("components/facility/facility-mission-control-page.tsx")).toMatch(
      /\/facility\/vendors/
    );
  });

  it("keeps FO authorization on facility.operations and blocks PM vendors path", () => {
    const entitlements = entitlementsForSku("mpa_facility_operations");
    expect(hasEntitlement(entitlements, "facility.operations")).toBe(true);
    expect(hasEntitlement(entitlements, "pm.vendors")).toBe(false);
    expect(
      evaluatePathEntitlement({ pathname: "/facility/vendors", sku: "mpa_facility_operations" })
        .allowed
    ).toBe(true);
    expect(
      evaluatePathEntitlement({ pathname: "/pm/vendors", sku: "mpa_facility_operations" }).allowed
    ).toBe(false);
  });

  it("preserves PM vendor create schema and pm.vendors entitlement gate", () => {
    const parsed = createVendorDirectoryInputSchema.parse({
      name: "Acme HVAC",
      email: "dispatch@acme.example",
      phone: "555-0100"
    });
    expect(parsed.name).toBe("Acme HVAC");
    expect(parsed.email).toBe("dispatch@acme.example");
    const pmVendorsRoute = read("app/api/pm/maintenance/vendors/route.ts");
    expect(pmVendorsRoute).toMatch(/createVendorDirectory/);
    expect(pmVendorsRoute).toMatch(/pm\.vendors/);
    expect(read("components/commercial/vendors-directory.tsx")).toMatch(/\/api\/pm\/maintenance\/vendors/);
  });

  it("updates Day-1 FO guidance to include vendors", () => {
    const item = ownerDay1ChecklistForSku("mpa_facility_operations").items.find(
      (row) => row.id === "fo_vendors"
    );
    expect(item?.href).toBe("/facility/vendors");
    expect(item?.detail).toMatch(/HVAC|contractor|vendor/i);
  });

  it("reuses existing vendor_vendors insert shape (no invented columns)", () => {
    const service = read("lib/maintenance/maintenance-service.ts");
    expect(service).toMatch(/from\("vendor_vendors"\)/);
    expect(service).toMatch(/email: input\.email/);
    expect(service).toMatch(/phone: input\.phone/);
    expect(service).not.toMatch(/operational_notes|notes:/);
  });

  it("remediates FO UAT UX feedback for assign, complete, and status refresh", () => {
    const workspace = read("components/facility/facility-operations-workspace.tsx");
    expect(workspace).toMatch(/formatFacilityAssignmentNotice/);
    expect(workspace).toMatch(/formatFacilityLifecycleNotice/);
    expect(workspace).toMatch(/actionLockRef/);
    expect(workspace).toMatch(/applyWorkOrder/);
    expect(workspace).toMatch(/Assigning…/);
    expect(workspace).toMatch(/formatFacilityLifecycleNotice\(\s*"complete"/);
    expect(workspace).not.toMatch(/setNotice\("Assignment sent\."\)/);
    expect(workspace).not.toMatch(/setNotice\("Work completed and closed\."\)/);
    const media = read("components/media/media-attachment-field.tsx");
    expect(media).toMatch(/media-upload-status/);
    expect(media).toMatch(/Uploading \$\{kind\}/);
    expect(media).not.toMatch(/>Working…</);
  });
});
