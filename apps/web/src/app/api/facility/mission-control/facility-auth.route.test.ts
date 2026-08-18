import { beforeEach, describe, expect, it, vi } from "vitest";

const authState = {
  userId: "user_mgr" as string | null,
  orgId: "org_a" as string | null,
  membership: { id: "mem_1", status: "active", roles: ["organization_admin"] } as
    | { id: string; status: string; roles: string[] }
    | null,
  sku: "mpa_facility_operations" as string | null,
  permissions: ["pm.maintenance:read", "pm.maintenance:write", "pm.maintenance:assign"] as string[]
};

vi.mock("../../../../lib/auth/server", () => ({
  createAuthServerClient: async () => {
    const thenable = (result: { data: unknown; error: null }) => {
      const builder: {
        select: () => typeof builder;
        eq: () => typeof builder;
        in: () => typeof builder;
        maybeSingle: () => Promise<{ data: unknown; error: null }>;
        then: (
          resolve: (value: unknown) => unknown,
          reject?: (reason: unknown) => unknown
        ) => Promise<unknown>;
      } = {
        select: () => builder,
        eq: () => builder,
        in: () => builder,
        maybeSingle: async () => result,
        then: (resolve, reject) => Promise.resolve(result).then(resolve, reject)
      };
      return builder;
    };

    return {
      auth: {
        getUser: async () => ({
          data: { user: authState.userId ? { id: authState.userId } : null }
        })
      },
      from: (table: string) => {
        if (table === "organization_memberships") {
          return thenable({ data: authState.membership, error: null });
        }
        if (table === "organization_subscriptions") {
          return thenable({
            data: authState.sku ? { sku_code: authState.sku, status: "active" } : null,
            error: null
          });
        }
        if (table === "role_permission_grants") {
          return thenable({
            data: authState.permissions.map((capability_key) => ({ capability_key })),
            error: null
          });
        }
        if (table === "organization_permission_overrides") {
          return thenable({ data: [], error: null });
        }
        return thenable({ data: null, error: null });
      }
    };
  }
}));

vi.mock("../../../../lib/organization/server", () => ({
  getActiveOrganizationIdFromCookie: async () => authState.orgId
}));

vi.mock("../../../../lib/facility/mission-control-service", () => ({
  getFacilityMissionControlSnapshot: vi.fn(async () => ({
    todayOpen: 1,
    emergency: 0,
    open: 2,
    overdue: 0,
    waitingOnVendor: 0,
    waitingOnTechnician: 1,
    completedRecently: 3,
    attention: [],
    attentionTotal: 0,
    viewerMode: "manager"
  }))
}));

vi.mock("../../../../lib/maintenance/maintenance-service", () => ({
  listWorkOrders: vi.fn(async () => []),
  listTechnicians: vi.fn(async () => []),
  listVendors: vi.fn(async () => []),
  createFacilityWorkOrder: vi.fn(async () => ({ id: "wo_1", work_surface: "facility" })),
  getWorkOrder: vi.fn(async () => null),
  listWorkOrderUpdates: vi.fn(async () => [])
}));

vi.mock("../../../../lib/property/property-catalog", () => ({
  listPortfolioProperties: vi.fn(async () => [])
}));

import { GET as missionControlGet } from "./route";
import { GET as operationsGet, POST as operationsPost } from "../operations/route";

describe("facility API authz", () => {
  beforeEach(() => {
    authState.userId = "user_mgr";
    authState.orgId = "org_a";
    authState.membership = { id: "mem_1", status: "active", roles: ["organization_admin"] };
    authState.sku = "mpa_facility_operations";
    authState.permissions = [
      "pm.maintenance:read",
      "pm.maintenance:write",
      "pm.maintenance:assign"
    ];
  });

  it("returns 401 when unauthenticated", async () => {
    authState.userId = null;
    const response = await missionControlGet();
    expect(response.status).toBe(401);
  });

  it("returns 403 when membership is missing (cross-org cookie hint)", async () => {
    authState.membership = null;
    const response = await missionControlGet();
    expect(response.status).toBe(403);
  });

  it("returns 403 when SKU lacks facility entitlement", async () => {
    authState.sku = "mpa_property_manager";
    const response = await missionControlGet();
    expect(response.status).toBe(403);
  });

  it("returns snapshot for entitled facility member", async () => {
    const response = await missionControlGet();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.snapshot.open).toBe(2);
  });

  it("forbids facility operations list without entitlement", async () => {
    authState.sku = "mpa_property_manager";
    const response = await operationsGet(new Request("http://localhost/api/facility/operations"));
    expect(response.status).toBe(403);
  });

  it("rejects invalid create payload", async () => {
    const response = await operationsPost(
      new Request("http://localhost/api/facility/operations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "x" })
      })
    );
    expect(response.status).toBe(400);
  });
});
