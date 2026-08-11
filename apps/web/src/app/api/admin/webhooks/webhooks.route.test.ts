import { beforeEach, describe, expect, it, vi } from "vitest";

const getUser = vi.fn();
const isPlatformOperatorUser = vi.fn();
const loadMa5WebhookDirectory = vi.fn();

vi.mock("../../../../lib/auth/server", () => ({
  createAuthServerClient: async () => ({ auth: { getUser } })
}));
vi.mock("../../../../lib/commercial/server", () => ({
  isPlatformOperatorUser: (...args: unknown[]) => isPlatformOperatorUser(...args)
}));
vi.mock("../../../../lib/admin/load-ma5-webhooks", () => ({
  loadMa5WebhookDirectory: (...args: unknown[]) => loadMa5WebhookDirectory(...args)
}));

describe("MA-5 GET /api/admin/webhooks authorization", () => {
  beforeEach(() => {
    getUser.mockReset();
    isPlatformOperatorUser.mockReset();
    loadMa5WebhookDirectory.mockReset();
  });

  it("rejects unauthenticated callers", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    const { GET } = await import("./route");
    expect((await GET(new Request("http://localhost/api/admin/webhooks"))).status).toBe(401);
  });

  it("rejects FO/PM non-operators", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "fo1" } } });
    isPlatformOperatorUser.mockResolvedValue(false);
    const { GET } = await import("./route");
    expect((await GET(new Request("http://localhost/api/admin/webhooks"))).status).toBe(403);
  });

  it("allows Master Admin operators", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "op1" } } });
    isPlatformOperatorUser.mockResolvedValue(true);
    loadMa5WebhookDirectory.mockResolvedValue({
      rows: [],
      filters: { page: 1, pageSize: 50, provider: "all", status: "all" },
      pagination: { page: 1, pageSize: 50, total: 0, totalPages: 1, hasMore: false },
      totals: { matched: 0, stripe: 0, signwell: 0, unresolved: 0, attention: 0, failed: 0 },
      degraded: [],
      limitations: [],
      duplicates: []
    });
    const { GET } = await import("./route");
    expect((await GET(new Request("http://localhost/api/admin/webhooks"))).status).toBe(200);
  });
});
