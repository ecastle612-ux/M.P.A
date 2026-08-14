import { beforeEach, describe, expect, it, vi } from "vitest";

const authState = {
  userId: "user_mgr" as string | null,
  orgId: "org_a" as string | null,
  membership: { id: "mem_1", status: "active", roles: ["organization_admin"] } as
    | { id: string; status: string; roles: string[] }
    | null,
  sku: "mpa_facility_operations" as string | null,
  permissions: ["pm.maintenance:read"] as string[]
};

vi.mock("../../../../../lib/auth/server", () => ({
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
            data: authState.sku
              ? { sku_code: authState.sku, status: "active" }
              : null,
            error: null
          });
        }
        return thenable({ data: null, error: null });
      }
    };
  }
}));

vi.mock("../../../../../lib/organization/server", () => ({
  getActiveOrganizationIdFromCookie: async () => authState.orgId
}));

vi.mock("../../../../../lib/auth/authorization", () => ({
  resolveAuthorizationContext: async () => ({
    userId: authState.userId,
    organizationId: authState.orgId,
    roles: authState.membership?.roles ?? [],
    capabilities: authState.permissions
  }),
  evaluatePermission: (_ctx: unknown, capability: string) =>
    authState.permissions.includes(capability)
}));

vi.mock("../../../../../lib/work-order-reports/service", () => ({
  buildWorkOrderReportSnapshot: async (input: { surface: string; organizationId: string }) => ({
    snapshot: {
      organizationId: input.organizationId,
      surface: input.surface,
      metrics: { total: 0 },
      rows: [],
      filters: {}
    },
    filterOptions: { properties: [], vendors: [], users: [] }
  })
}));

describe("FAC-002 facility work-order reports API authz", () => {
  beforeEach(() => {
    authState.userId = "user_mgr";
    authState.orgId = "org_a";
    authState.membership = { id: "mem_1", status: "active", roles: ["organization_admin"] };
    authState.sku = "mpa_facility_operations";
    authState.permissions = ["pm.maintenance:read"];
  });

  it("returns 401 when unauthenticated", async () => {
    authState.userId = null;
    const { GET } = await import("./route");
    const response = await GET(new Request("http://localhost/api/facility/reports/work-orders"));
    expect(response.status).toBe(401);
  });

  it("returns 403 for PM-only SKU (no facility.operations)", async () => {
    authState.sku = "mpa_property_manager";
    const { GET } = await import("./route");
    const response = await GET(new Request("http://localhost/api/facility/reports/work-orders"));
    expect(response.status).toBe(403);
  });

  it("returns 403 without maintenance read capability", async () => {
    authState.permissions = [];
    const { GET } = await import("./route");
    const response = await GET(new Request("http://localhost/api/facility/reports/work-orders"));
    expect(response.status).toBe(403);
  });

  it("allows FO SKU with maintenance read and returns facility surface", async () => {
    const { GET } = await import("./route");
    const response = await GET(new Request("http://localhost/api/facility/reports/work-orders"));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.snapshot.surface).toBe("facility");
  });

  it("allows Complete SKU facility reports", async () => {
    authState.sku = "mpa_complete_platform";
    const { GET } = await import("./route");
    const response = await GET(new Request("http://localhost/api/facility/reports/work-orders"));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.snapshot.surface).toBe("facility");
  });
});
