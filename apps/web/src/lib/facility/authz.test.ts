import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";

const state = {
  userId: "user_1" as string | null,
  orgId: "org_1" as string | null,
  membership: { id: "mem_1", status: "active", roles: ["organization_admin"] } as
    | { id: string; status: string; roles: string[] }
    | null,
  sku: "mpa_facility_operations" as string | null,
  permissions: ["pm.maintenance:read", "pm.maintenance:write", "pm.maintenance:assign"] as string[]
};

vi.mock("../auth/server", () => ({
  createAuthServerClient: async () => ({
    auth: {
      getUser: async () => ({
        data: { user: state.userId ? { id: state.userId } : null }
      })
    },
    from: () => {
      const builder = {
        select: () => builder,
        eq: () => builder,
        maybeSingle: async () => {
          if (state.membership) {
            return { data: state.membership, error: null };
          }
          return { data: null, error: null };
        }
      };
      return builder;
    }
  })
}));

vi.mock("../organization/server", () => ({
  getActiveOrganizationIdFromCookie: async () => state.orgId
}));

vi.mock("../auth/authorization", () => ({
  resolveAuthorizationContext: async () => ({
    permissions: state.permissions,
    roles: state.membership?.roles ?? [],
    organizationId: state.orgId,
    userId: state.userId
  }),
  evaluatePermission: (_ctx: unknown, capability: string) => state.permissions.includes(capability)
}));

vi.mock("../commercial/server", () => ({
  getOrganizationCommercialState: async () => {
    const { entitlementsForSku } = await import("@mpa/shared");
    return {
      sku: state.sku,
      skuLabel: null,
      subscriptionStatus: state.sku ? "active" : null,
      entitlements: state.sku
        ? entitlementsForSku(state.sku as "mpa_facility_operations")
        : ["platform.org", "platform.guided_setup", "platform.billing_self"],
      productConfirmed: true,
      setupComplete: false,
      entitlementSource: state.sku ? "MASTER_ADMIN_GRANT" : null
    };
  }
}));

import { requireFacilityOperation } from "./authz";

describe("STAB-004 facility authz", () => {
  beforeEach(() => {
    state.userId = "user_1";
    state.orgId = "org_1";
    state.membership = { id: "mem_1", status: "active", roles: ["organization_admin"] };
    state.sku = "mpa_facility_operations";
    state.permissions = ["pm.maintenance:read", "pm.maintenance:write", "pm.maintenance:assign"];
  });

  it("rejects unauthenticated callers", async () => {
    state.userId = null;
    const result = await requireFacilityOperation("pm.maintenance:read", "facility.operations");
    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error.status).toBe(401);
    }
  });

  it("rejects missing membership (cross-org cookie hint)", async () => {
    state.membership = null;
    const result = await requireFacilityOperation("pm.maintenance:read", "facility.operations");
    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error.status).toBe(403);
    }
  });

  it("rejects PM-only SKU for facility entitlement", async () => {
    state.sku = "mpa_property_manager";
    const result = await requireFacilityOperation("pm.maintenance:read", "facility.operations");
    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error.status).toBe(403);
    }
  });

  it("allows FO SKU with capability", async () => {
    const result = await requireFacilityOperation("pm.maintenance:read", "facility.operations");
    expect("error" in result).toBe(false);
    if (!("error" in result)) {
      expect(result.organizationId).toBe("org_1");
      expect(result.user.id).toBe("user_1");
    }
  });

  it("rejects when commercial state has no SKU (fail closed)", async () => {
    state.sku = null;
    const result = await requireFacilityOperation("pm.maintenance:read", "facility.operations");
    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error).toBeInstanceOf(NextResponse);
      expect(result.error.status).toBe(403);
    }
  });
});
