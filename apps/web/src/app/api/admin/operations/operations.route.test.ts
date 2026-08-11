import { beforeEach, describe, expect, it, vi } from "vitest";

const getUser = vi.fn();
const isPlatformOperatorUser = vi.fn();
const loadMa6OperationsSnapshot = vi.fn();

vi.mock("../../../../lib/auth/server", () => ({
  createAuthServerClient: async () => ({ auth: { getUser } })
}));
vi.mock("../../../../lib/commercial/server", () => ({
  isPlatformOperatorUser: (...args: unknown[]) => isPlatformOperatorUser(...args)
}));
vi.mock("../../../../lib/admin/load-ma6-operations", () => ({
  loadMa6OperationsSnapshot: (...args: unknown[]) => loadMa6OperationsSnapshot(...args)
}));

describe("MA-6 GET /api/admin/operations authorization", () => {
  beforeEach(() => {
    getUser.mockReset();
    isPlatformOperatorUser.mockReset();
    loadMa6OperationsSnapshot.mockReset();
  });

  it("rejects unauthenticated callers", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    const { GET } = await import("./route");
    expect((await GET(new Request("http://localhost/api/admin/operations"))).status).toBe(401);
  });

  it("rejects PM/FO non-operators and forged roles", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "pm1", app_metadata: { role: "admin" } } } });
    isPlatformOperatorUser.mockResolvedValue(false);
    const { GET } = await import("./route");
    expect((await GET(new Request("http://localhost/api/admin/operations"))).status).toBe(403);
  });

  it("rejects forged organization query without operator gate", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    isPlatformOperatorUser.mockResolvedValue(false);
    const { GET } = await import("./route");
    const res = await GET(
      new Request("http://localhost/api/admin/operations?organizationId=forged-org")
    );
    expect(res.status).toBe(403);
    expect(loadMa6OperationsSnapshot).not.toHaveBeenCalled();
  });

  it("allows Master Admin operators", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "op1" } } });
    isPlatformOperatorUser.mockResolvedValue(true);
    loadMa6OperationsSnapshot.mockResolvedValue({
      overview: {
        properties: 0,
        units: 0,
        openWorkOrders: 0,
        overdueWorkOrders: 0,
        inProgressWorkOrders: 0,
        completedWorkOrders: 0,
        activeVendors: 0,
        notificationFailed: 0,
        notificationSent: 0,
        orgsAttention: 0,
        health: "healthy",
        availability: "authoritative"
      },
      organizations: [],
      workOrders: [],
      properties: [],
      units: [],
      vendors: [],
      notifications: [],
      anomalies: [],
      filters: { page: 1, pageSize: 50 },
      pagination: { page: 1, pageSize: 50, total: 0, totalPages: 1, hasMore: false },
      degraded: [],
      limitations: []
    });
    const { GET } = await import("./route");
    expect((await GET(new Request("http://localhost/api/admin/operations"))).status).toBe(200);
  });
});
