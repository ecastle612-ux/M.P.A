import { beforeEach, describe, expect, it, vi } from "vitest";

const getUser = vi.fn();
const isPlatformOperatorUser = vi.fn();
const loadMa3AuditDirectory = vi.fn();

vi.mock("../../../../lib/auth/server", () => ({
  createAuthServerClient: async () => ({ auth: { getUser } })
}));
vi.mock("../../../../lib/commercial/server", () => ({
  isPlatformOperatorUser: (...args: unknown[]) => isPlatformOperatorUser(...args)
}));
vi.mock("../../../../lib/admin/load-ma3-audit", () => ({
  loadMa3AuditDirectory: (...args: unknown[]) => loadMa3AuditDirectory(...args)
}));

describe("MA-3 GET /api/admin/audit authorization", () => {
  beforeEach(() => {
    getUser.mockReset();
    isPlatformOperatorUser.mockReset();
    loadMa3AuditDirectory.mockReset();
  });

  it("rejects unauthenticated callers", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    const { GET } = await import("./route");
    expect((await GET(new Request("http://localhost/api/admin/audit"))).status).toBe(401);
  });

  it("rejects non-operators", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    isPlatformOperatorUser.mockResolvedValue(false);
    const { GET } = await import("./route");
    expect((await GET(new Request("http://localhost/api/admin/audit"))).status).toBe(403);
  });

  it("allows operators and returns scrubbed events", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "op1" } } });
    isPlatformOperatorUser.mockResolvedValue(true);
    loadMa3AuditDirectory.mockResolvedValue({
      events: [
        {
          id: "s1",
          source: "support",
          createdAt: "2026-08-11T00:00:00.000Z",
          actorId: "op1",
          actorLabel: "platform_operator",
          action: "inspect",
          targetType: "organization",
          targetId: "org_a",
          organizationId: "org_a",
          organizationName: "Alpha",
          result: "recorded",
          reason: null,
          correlationId: null,
          context: {}
        }
      ],
      filters: { rangeLabel: "Last 7 days", source: "all" },
      degraded: [],
      limitations: []
    });
    const { GET } = await import("./route");
    const res = await GET(new Request("http://localhost/api/admin/audit"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.events[0].organizationId).toBe("org_a");
  });
});
