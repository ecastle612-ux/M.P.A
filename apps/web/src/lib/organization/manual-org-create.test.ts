import { describe, expect, it } from "vitest";
import {
  customerFacingOrgCreateError,
  decideManualOrganizationCreate,
  mergeCommerceOrgCreateSignals
} from "./manual-org-create";

describe("P1-05 Guided Setup SKU safety", () => {
  it("retains Property Manager, Facility Operations, and Complete commerce SKUs", () => {
    for (const sku of [
      "mpa_property_manager",
      "mpa_facility_operations",
      "mpa_complete_platform"
    ] as const) {
      expect(
        decideManualOrganizationCreate({
          isOperator: false,
          requestedSku: undefined,
          commerce: { kind: "resolved", productSku: sku, organizationId: null }
        })
      ).toEqual({ ok: true, sku });
    }
  });

  it("does not silently create a Property Manager organization from commerce-backed setup", () => {
    expect(
      decideManualOrganizationCreate({
        isOperator: false,
        requestedSku: undefined,
        commerce: { kind: "unresolved" }
      })
    ).toEqual({ ok: false, error: "commerce_state_unresolved" });

    expect(
      decideManualOrganizationCreate({
        isOperator: false,
        requestedSku: "mpa_property_manager",
        commerce: {
          kind: "resolved",
          productSku: "mpa_facility_operations",
          organizationId: null
        }
      })
    ).toEqual({ ok: true, sku: "mpa_facility_operations" });

    expect(
      decideManualOrganizationCreate({
        isOperator: false,
        requestedSku: undefined,
        commerce: {
          kind: "resolved",
          productSku: "mpa_complete_platform",
          organizationId: "org_already"
        }
      })
    ).toEqual({ ok: false, error: "organization_already_provisioned" });
  });

  it("keeps legacy non-commerce customer creates on Property Manager", () => {
    expect(
      decideManualOrganizationCreate({
        isOperator: false,
        requestedSku: undefined,
        commerce: { kind: "none" }
      })
    ).toEqual({ ok: true, sku: "mpa_property_manager" });
  });

  it("lets operators request a SKU only when commerce is absent", () => {
    expect(
      decideManualOrganizationCreate({
        isOperator: true,
        requestedSku: "mpa_facility_operations",
        commerce: { kind: "none" }
      })
    ).toEqual({ ok: true, sku: "mpa_facility_operations" });
  });

  it("merges commerce signals fail-closed when SKU cannot be resolved", () => {
    expect(mergeCommerceOrgCreateSignals([])).toEqual({ kind: "none" });
    expect(
      mergeCommerceOrgCreateSignals([{ productSku: "not_a_sku", organizationId: null }])
    ).toEqual({ kind: "unresolved" });
    expect(
      mergeCommerceOrgCreateSignals([
        { productSku: "mpa_facility_operations", organizationId: null },
        { productSku: "mpa_complete_platform", organizationId: null }
      ])
    ).toEqual({ kind: "unresolved" });
    expect(
      mergeCommerceOrgCreateSignals([
        { productSku: "mpa_complete_platform", organizationId: null },
        { productSku: "mpa_complete_platform", organizationId: "org_1" }
      ])
    ).toEqual({
      kind: "resolved",
      productSku: "mpa_complete_platform",
      organizationId: "org_1"
    });
  });

  it("maps refuse codes to customer-facing guidance", () => {
    expect(customerFacingOrgCreateError("commerce_state_unresolved")).toMatch(/Check your email/i);
    expect(customerFacingOrgCreateError("organization_already_provisioned")).toMatch(
      /already being prepared/i
    );
  });
});
