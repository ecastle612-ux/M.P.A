import { beforeEach, describe, expect, it, vi } from "vitest";

const getUser = vi.fn();
const isPlatformOperatorUser = vi.fn();
const loadMa5CheckoutDirectory = vi.fn();

vi.mock("../../../../lib/auth/server", () => ({
  createAuthServerClient: async () => ({ auth: { getUser } })
}));
vi.mock("../../../../lib/commercial/server", () => ({
  isPlatformOperatorUser: (...args: unknown[]) => isPlatformOperatorUser(...args)
}));
vi.mock("../../../../lib/admin/load-ma5-checkout", () => ({
  loadMa5CheckoutDirectory: (...args: unknown[]) => loadMa5CheckoutDirectory(...args)
}));

describe("MA-5 GET /api/admin/checkout authorization", () => {
  beforeEach(() => {
    getUser.mockReset();
    isPlatformOperatorUser.mockReset();
    loadMa5CheckoutDirectory.mockReset();
  });

  it("rejects unauthenticated callers (normal user)", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    const { GET } = await import("./route");
    expect((await GET(new Request("http://localhost/api/admin/checkout"))).status).toBe(401);
  });

  it("rejects PM/FO non-operators and forged roles", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "pm1", app_metadata: { role: "admin" } } } });
    isPlatformOperatorUser.mockResolvedValue(false);
    const { GET } = await import("./route");
    expect((await GET(new Request("http://localhost/api/admin/checkout"))).status).toBe(403);
  });

  it("rejects forged organization query without operator gate", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    isPlatformOperatorUser.mockResolvedValue(false);
    const { GET } = await import("./route");
    const res = await GET(
      new Request("http://localhost/api/admin/checkout?organizationId=forged-org")
    );
    expect(res.status).toBe(403);
    expect(loadMa5CheckoutDirectory).not.toHaveBeenCalled();
  });

  it("allows Master Admin operators", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "op1" } } });
    isPlatformOperatorUser.mockResolvedValue(true);
    loadMa5CheckoutDirectory.mockResolvedValue({
      rows: [],
      filters: { page: 1, pageSize: 50 },
      pagination: { page: 1, pageSize: 50, total: 0, totalPages: 1, hasMore: false },
      totals: { matched: 0, healthy: 0, attention: 0, failed: 0, unknown: 0 },
      degraded: [],
      limitations: []
    });
    const { GET } = await import("./route");
    expect((await GET(new Request("http://localhost/api/admin/checkout"))).status).toBe(200);
  });
});
