import { beforeEach, describe, expect, it, vi } from "vitest";

const getUser = vi.fn();
const isPlatformOperatorUser = vi.fn();
const loadMa4SubscriptionsDirectory = vi.fn();

vi.mock("../../../../lib/auth/server", () => ({
  createAuthServerClient: async () => ({ auth: { getUser } })
}));
vi.mock("../../../../lib/commercial/server", () => ({
  isPlatformOperatorUser: (...args: unknown[]) => isPlatformOperatorUser(...args)
}));
vi.mock("../../../../lib/admin/load-ma4-subscriptions", () => ({
  loadMa4SubscriptionsDirectory: (...args: unknown[]) => loadMa4SubscriptionsDirectory(...args)
}));

describe("MA-4 GET /api/admin/subscriptions authorization", () => {
  beforeEach(() => {
    getUser.mockReset();
    isPlatformOperatorUser.mockReset();
    loadMa4SubscriptionsDirectory.mockReset();
  });

  it("rejects unauthenticated callers (normal user)", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    const { GET } = await import("./route");
    expect((await GET(new Request("http://localhost/api/admin/subscriptions"))).status).toBe(401);
  });

  it("rejects non-operators (PM/FO forged role)", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "pm1", app_metadata: { role: "admin" } } } });
    isPlatformOperatorUser.mockResolvedValue(false);
    const { GET } = await import("./route");
    expect((await GET(new Request("http://localhost/api/admin/subscriptions"))).status).toBe(403);
  });

  it("rejects forged organization cookie trust — operator gate is user-based", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    isPlatformOperatorUser.mockResolvedValue(false);
    const { GET } = await import("./route");
    const res = await GET(
      new Request("http://localhost/api/admin/subscriptions?organizationId=forged-org")
    );
    expect(res.status).toBe(403);
    expect(loadMa4SubscriptionsDirectory).not.toHaveBeenCalled();
  });

  it("allows Master Admin / platform operators", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "op1" } } });
    isPlatformOperatorUser.mockResolvedValue(true);
    loadMa4SubscriptionsDirectory.mockResolvedValue({
      rows: [],
      filters: { page: 1, pageSize: 50 },
      pagination: { page: 1, pageSize: 50, total: 0, totalPages: 1, hasMore: false },
      totals: { fetched: 0, matched: 0, healthy: 0, attention: 0, unknown: 0 },
      degraded: []
    });
    const { GET } = await import("./route");
    expect((await GET(new Request("http://localhost/api/admin/subscriptions"))).status).toBe(200);
  });
});
