import { beforeEach, describe, expect, it, vi } from "vitest";

const state = {
  userId: "user_1" as string | null,
  orgId: "org_1" as string | null,
  membership: { id: "mem_1", status: "active", roles: ["organization_admin"] } as
    | { id: string; status: string; roles: string[] }
    | null,
  sku: "mpa_facility_operations" as string | null,
  subscriptionStatus: "active" as string,
  permissions: ["pm.maintenance:read", "pm.maintenance:write"] as string[]
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
              data: state.sku ? { sku_code: state.sku, status: state.subscriptionStatus } : null,
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

import {
  requireFacilityAssetPermission,
  requireFacilityInventoryPermission
} from "./authz";

describe("FAC-003 PLAT-002 authorization", () => {
  beforeEach(() => {
    state.userId = "user_1";
    state.orgId = "org_1";
    state.membership = { id: "mem_1", status: "active", roles: ["organization_admin"] };
    state.sku = "mpa_facility_operations";
    state.subscriptionStatus = "active";
    state.permissions = ["pm.maintenance:read", "pm.maintenance:write"];
  });

  it("allows FO managers on assets and inventory", async () => {
    expect("error" in (await requireFacilityAssetPermission("pm.maintenance:read"))).toBe(false);
    expect("error" in (await requireFacilityInventoryPermission("pm.maintenance:read"))).toBe(false);
    expect(
      "error" in (await requireFacilityAssetPermission("pm.maintenance:write", { managerOnly: true }))
    ).toBe(false);
  });

  it("allows Complete managers on assets and inventory", async () => {
    state.sku = "mpa_complete_platform";
    expect("error" in (await requireFacilityAssetPermission("pm.maintenance:read"))).toBe(false);
    expect("error" in (await requireFacilityInventoryPermission("pm.maintenance:write"))).toBe(false);
  });

  it("denies Property Manager SKU", async () => {
    state.sku = "mpa_property_manager";
    const asset = await requireFacilityAssetPermission("pm.maintenance:read");
    const inventory = await requireFacilityInventoryPermission("pm.maintenance:read");
    expect("error" in asset && asset.error.status === 403).toBe(true);
    expect("error" in inventory && inventory.error.status === 403).toBe(true);
  });

  it("denies tenant, owner, and vendor roles", async () => {
    for (const role of ["tenant", "property_owner", "vendor"]) {
      state.membership = { id: "mem_1", status: "active", roles: [role] };
      const asset = await requireFacilityAssetPermission("pm.maintenance:read");
      const inventory = await requireFacilityInventoryPermission("pm.maintenance:read");
      expect("error" in asset && asset.error.status === 403).toBe(true);
      expect("error" in inventory && inventory.error.status === 403).toBe(true);
    }
  });

  it("allows technician asset read and denies technician inventory manage", async () => {
    state.membership = { id: "mem_1", status: "active", roles: ["maintenance_technician"] };
    const read = await requireFacilityAssetPermission("pm.maintenance:read");
    const manage = await requireFacilityAssetPermission("pm.maintenance:write", { managerOnly: true });
    const inventory = await requireFacilityInventoryPermission("pm.maintenance:read", {
      managerOnly: true
    });
    const usage = await requireFacilityInventoryPermission("pm.maintenance:write", {
      allowedRoles: ["organization_admin", "property_manager", "maintenance_technician"]
    });
    expect("error" in read).toBe(false);
    expect("error" in manage && manage.error.status === 403).toBe(true);
    expect("error" in inventory && inventory.error.status === 403).toBe(true);
    expect("error" in usage).toBe(false);
  });
});
