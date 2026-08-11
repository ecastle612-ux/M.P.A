import { beforeEach, describe, expect, it, vi } from "vitest";

const getUser = vi.fn();
const isPlatformOperatorUser = vi.fn();
const loadMa3UsersDirectory = vi.fn();

vi.mock("../../../../lib/auth/server", () => ({
  createAuthServerClient: async () => ({ auth: { getUser } })
}));
vi.mock("../../../../lib/commercial/server", () => ({
  isPlatformOperatorUser: (...args: unknown[]) => isPlatformOperatorUser(...args)
}));
vi.mock("../../../../lib/admin/load-ma3-users", () => ({
  loadMa3UsersDirectory: (...args: unknown[]) => loadMa3UsersDirectory(...args)
}));

describe("MA-3 GET /api/admin/users authorization", () => {
  beforeEach(() => {
    getUser.mockReset();
    isPlatformOperatorUser.mockReset();
    loadMa3UsersDirectory.mockReset();
  });

  it("rejects unauthenticated callers", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    const { GET } = await import("./route");
    const res = await GET(new Request("http://localhost/api/admin/users"));
    expect(res.status).toBe(401);
  });

  it("rejects non-operators", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    isPlatformOperatorUser.mockResolvedValue(false);
    const { GET } = await import("./route");
    const res = await GET(new Request("http://localhost/api/admin/users"));
    expect(res.status).toBe(403);
  });

  it("allows operators", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "op1" } } });
    isPlatformOperatorUser.mockResolvedValue(true);
    loadMa3UsersDirectory.mockResolvedValue({
      users: [],
      memberships: [],
      totals: { users: 0, memberships: 0, activeMemberships: 0 },
      degraded: [],
      filters: {}
    });
    const { GET } = await import("./route");
    const res = await GET(new Request("http://localhost/api/admin/users"));
    expect(res.status).toBe(200);
  });
});
