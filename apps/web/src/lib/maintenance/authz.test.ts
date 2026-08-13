import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";

const state = {
  userId: "user_1" as string | null,
  orgId: "org_1" as string | null,
  membership: { id: "mem_1", status: "active", roles: ["organization_admin"] } as
    | { id: string; status: string; roles: string[] }
    | null,
  sku: "mpa_property_manager" as string | null,
  subscriptionStatus: "active" as string,
  permissions: ["pm.maintenance:read", "pm.maintenance:write", "pm.maintenance:assign"] as string[]
};

vi.mock("../auth/server", () => ({
  createAuthServerClient: async () => ({
    auth: {
      getUser: async () => ({
        data: { user: state.userId ? { id: state.userId } : null }
      })
    },
    from: (table: string) => {
      const builder = {
        select: () => builder,
        eq: () => builder,
        maybeSingle: async () => {
          if (table === "organization_memberships") {
            return { data: state.membership, error: null };
          }
          if (table === "organization_subscriptions") {
            return {
              data: state.sku
                ? { sku_code: state.sku, status: state.subscriptionStatus }
                : null,
              error: null
            };
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

import { requireMaintenancePermission } from "./authz";

describe("PM maintenance API entitlement gate", () => {
  beforeEach(() => {
    state.userId = "user_1";
    state.orgId = "org_1";
    state.membership = { id: "mem_1", status: "active", roles: ["organization_admin"] };
    state.sku = "mpa_property_manager";
    state.subscriptionStatus = "active";
    state.permissions = ["pm.maintenance:read", "pm.maintenance:write", "pm.maintenance:assign"];
  });

  it("rejects unauthenticated callers", async () => {
    state.userId = null;
    const result = await requireMaintenancePermission("pm.maintenance:read");
    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error.status).toBe(401);
    }
  });

  it("rejects missing membership", async () => {
    state.membership = null;
    const result = await requireMaintenancePermission("pm.maintenance:read");
    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error.status).toBe(403);
    }
  });

  it("rejects FO-only SKU for pm.maintenance APIs", async () => {
    state.sku = "mpa_facility_operations";
    const result = await requireMaintenancePermission("pm.maintenance:read", "pm.maintenance");
    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error.status).toBe(403);
    }
  });

  it("rejects FO-only SKU for pm.vendors APIs even with RBAC", async () => {
    state.sku = "mpa_facility_operations";
    const result = await requireMaintenancePermission("pm.maintenance:assign", "pm.vendors");
    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error.status).toBe(403);
    }
  });

  it("allows PM SKU with capability for pm.maintenance", async () => {
    const result = await requireMaintenancePermission("pm.maintenance:read", "pm.maintenance");
    expect("error" in result).toBe(false);
    if (!("error" in result)) {
      expect(result.organizationId).toBe("org_1");
      expect(result.user.id).toBe("user_1");
    }
  });

  it("allows Complete SKU for both pm.maintenance and pm.vendors", async () => {
    state.sku = "mpa_complete_platform";
    const maintenance = await requireMaintenancePermission("pm.maintenance:read", "pm.maintenance");
    const vendors = await requireMaintenancePermission("pm.maintenance:read", "pm.vendors");
    expect("error" in maintenance).toBe(false);
    expect("error" in vendors).toBe(false);
  });

  it("rejects missing capability even with PM SKU", async () => {
    state.permissions = [];
    const result = await requireMaintenancePermission("pm.maintenance:assign", "pm.maintenance");
    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error).toBeInstanceOf(NextResponse);
      expect(result.error.status).toBe(403);
    }
  });
});
