import { beforeEach, describe, expect, it, vi } from "vitest";

const getUser = vi.fn();
const isPlatformOperatorUser = vi.fn();
const loadMa4CapacityDirectory = vi.fn();

vi.mock("../../../../lib/auth/server", () => ({
  createAuthServerClient: async () => ({ auth: { getUser } })
}));
vi.mock("../../../../lib/commercial/server", () => ({
  isPlatformOperatorUser: (...args: unknown[]) => isPlatformOperatorUser(...args)
}));
vi.mock("../../../../lib/admin/load-ma4-capacity", () => ({
  loadMa4CapacityDirectory: (...args: unknown[]) => loadMa4CapacityDirectory(...args)
}));

describe("MA-4 GET /api/admin/capacity authorization", () => {
  beforeEach(() => {
    getUser.mockReset();
    isPlatformOperatorUser.mockReset();
    loadMa4CapacityDirectory.mockReset();
  });

  it("rejects unauthenticated callers", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    const { GET } = await import("./route");
    expect((await GET(new Request("http://localhost/api/admin/capacity"))).status).toBe(401);
  });

  it("rejects FO/PM non-operators", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "fo1" } } });
    isPlatformOperatorUser.mockResolvedValue(false);
    const { GET } = await import("./route");
    expect((await GET(new Request("http://localhost/api/admin/capacity"))).status).toBe(403);
  });

  it("allows Master Admin operators", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "op1" } } });
    isPlatformOperatorUser.mockResolvedValue(true);
    loadMa4CapacityDirectory.mockResolvedValue({
      rows: [],
      filters: { page: 1, pageSize: 50 },
      pagination: { page: 1, pageSize: 50, total: 0, totalPages: 1, hasMore: false },
      totals: { fetched: 0, matched: 0, healthy: 0, attention: 0, unknown: 0 },
      degraded: [],
      anomaliesOnly: false
    });
    const { GET } = await import("./route");
    expect((await GET(new Request("http://localhost/api/admin/capacity"))).status).toBe(200);
  });
});
