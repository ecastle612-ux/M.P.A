import { beforeEach, describe, expect, it, vi } from "vitest";

const getUser = vi.fn();
const isPlatformOperatorUser = vi.fn();
const loadPlatformErrorsList = vi.fn();

vi.mock("../../../../lib/auth/server", () => ({
  createAuthServerClient: async () => ({
    auth: { getUser }
  })
}));

vi.mock("../../../../lib/commercial/server", () => ({
  isPlatformOperatorUser: (...args: unknown[]) => isPlatformOperatorUser(...args)
}));

vi.mock("../../../../lib/admin/load-platform-errors", () => ({
  loadPlatformErrorsList: (...args: unknown[]) => loadPlatformErrorsList(...args)
}));

describe("MA-1 GET /api/admin/errors authorization", () => {
  beforeEach(() => {
    getUser.mockReset();
    isPlatformOperatorUser.mockReset();
    loadPlatformErrorsList.mockReset();
  });

  it("rejects unauthenticated callers", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    const { GET } = await import("./route");
    const res = await GET(new Request("http://localhost/api/admin/errors"));
    expect(res.status).toBe(401);
    expect(loadPlatformErrorsList).not.toHaveBeenCalled();
  });

  it("rejects authenticated non-operators", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u1", email: "user@example.com" } } });
    isPlatformOperatorUser.mockResolvedValue(false);
    const { GET } = await import("./route");
    const res = await GET(new Request("http://localhost/api/admin/errors"));
    expect(res.status).toBe(403);
    expect(loadPlatformErrorsList).not.toHaveBeenCalled();
  });

  it("allows platform operators and returns scrubbed list payload", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "op1", email: "ops@example.com" } } });
    isPlatformOperatorUser.mockResolvedValue(true);
    loadPlatformErrorsList.mockResolvedValue({
      errors: [
        {
          id: "e1",
          createdAt: "2026-08-11T12:00:00.000Z",
          severity: "critical",
          message: "boom",
          errorName: "Error",
          route: "/api/x",
          organizationId: "org_1",
          requestId: "req_1",
          source: "server",
          actorId: null,
          stack: null,
          metadata: {},
          occurrenceCount: 1,
          resolutionStatus: "untracked",
          resolutionNote: "deferred"
        }
      ],
      degraded: false,
      rangeLabel: "Last 24 hours",
      resolutionLimitation: "deferred",
      filters: { severity: "all", range: "24h" }
    });

    const { GET } = await import("./route");
    const res = await GET(new Request("http://localhost/api/admin/errors?severity=critical"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.errors).toHaveLength(1);
    expect(body.errors[0].organizationId).toBe("org_1");
    expect(loadPlatformErrorsList).toHaveBeenCalledOnce();
  });
});
