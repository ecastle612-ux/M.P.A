import { describe, expect, it } from "vitest";
import { entitlementsForMember, hasEntitlement } from "@mpa/shared";
import { assertMediaEntityAccess, mediaActorPlane } from "./authz";

describe("REC-001 receipt parent authorization", () => {
  it("allows an in-org vendor invoice and 404s a foreign invoice", async () => {
    const supabase = {
      from: (table: string) => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: table === "financial_vendor_invoices" ? { id: "inv_1" } : null,
                error: null
              })
            })
          })
        })
      })
    };

    const allowed = await assertMediaEntityAccess({
      supabase: supabase as never,
      organizationId: "org_pm",
      relatedEntityType: "vendor_invoice",
      relatedEntityId: "inv_1"
    });
    expect(allowed).toEqual({ ok: true });
  });

  it("returns 404 when the vendor invoice is not in the organization", async () => {
    const supabase = {
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: null, error: null })
            })
          })
        })
      })
    };
    const denied = await assertMediaEntityAccess({
      supabase: supabase as never,
      organizationId: "org_a",
      relatedEntityType: "vendor_invoice",
      relatedEntityId: "org_b_invoice"
    });
    expect("error" in denied).toBe(true);
    if ("error" in denied) {
      expect(denied.error.status).toBe(404);
    }
  });

  it("does not require Complete: PM invoices use finance, FO work orders use operations", () => {
    expect(mediaActorPlane("vendor_invoice")).toBe("finance");
    expect(mediaActorPlane("maintenance")).toBe("operations");
    expect(mediaActorPlane("conversation_message")).toBe("conversation");
    expect(mediaActorPlane("facility_asset")).toBe("operations");
  });

  it("evaluates receipt parent entitlements independently for PM, FO, and Complete", () => {
    const pm = entitlementsForMember({
      sku: "mpa_property_manager",
      roles: ["property_manager"],
      storedScope: "property_operations"
    });
    const fo = entitlementsForMember({
      sku: "mpa_facility_operations",
      roles: ["organization_admin"],
      storedScope: "facility_operations"
    });
    const complete = entitlementsForMember({
      sku: "mpa_complete_platform",
      roles: ["organization_admin"],
      storedScope: "both"
    });

    expect(hasEntitlement(pm, "pm.financial_operations")).toBe(true);
    expect(hasEntitlement(pm, "pm.maintenance")).toBe(true);
    expect(hasEntitlement(pm, "facility.operations")).toBe(false);

    expect(hasEntitlement(fo, "facility.operations")).toBe(true);
    expect(hasEntitlement(fo, "pm.financial_operations")).toBe(false);

    expect(hasEntitlement(complete, "pm.financial_operations")).toBe(true);
    expect(hasEntitlement(complete, "facility.operations")).toBe(true);
    expect(hasEntitlement(complete, "pm.maintenance")).toBe(true);
  });
});
