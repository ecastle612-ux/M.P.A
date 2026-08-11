import { beforeEach, describe, expect, it, vi } from "vitest";

const getUser = vi.fn();
const isPlatformOperatorUser = vi.fn();
const loadMa2OrganizationDetail = vi.fn();

vi.mock("../../../../../lib/auth/server", () => ({
  createAuthServerClient: async () => ({
    auth: { getUser }
  })
}));

vi.mock("../../../../../lib/commercial/server", () => ({
  isPlatformOperatorUser: (...args: unknown[]) => isPlatformOperatorUser(...args)
}));

vi.mock("../../../../../lib/admin/load-ma2-org-detail", () => ({
  loadMa2OrganizationDetail: (...args: unknown[]) => loadMa2OrganizationDetail(...args)
}));

describe("MA-2 GET /api/admin/organizations/[orgId] authorization", () => {
  beforeEach(() => {
    getUser.mockReset();
    isPlatformOperatorUser.mockReset();
    loadMa2OrganizationDetail.mockReset();
  });

  it("rejects unauthenticated callers", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    const { GET } = await import("./route");
    const res = await GET(new Request("http://localhost/api/admin/organizations/org_a"), {
      params: { orgId: "org_a" }
    });
    expect(res.status).toBe(401);
    expect(loadMa2OrganizationDetail).not.toHaveBeenCalled();
  });

  it("rejects authenticated non-operators (normal org user)", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u1", email: "user@example.com" } } });
    isPlatformOperatorUser.mockResolvedValue(false);
    const { GET } = await import("./route");
    const res = await GET(new Request("http://localhost/api/admin/organizations/org_a"), {
      params: { orgId: "org_a" }
    });
    expect(res.status).toBe(403);
    expect(loadMa2OrganizationDetail).not.toHaveBeenCalled();
  });

  it("returns 404 when organization is not found (no cross-org leakage)", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "op1", email: "ops@example.com" } } });
    isPlatformOperatorUser.mockResolvedValue(true);
    loadMa2OrganizationDetail.mockResolvedValue(null);
    const { GET } = await import("./route");
    const res = await GET(new Request("http://localhost/api/admin/organizations/missing"), {
      params: { orgId: "missing" }
    });
    expect(res.status).toBe(404);
    expect(loadMa2OrganizationDetail).toHaveBeenCalledWith("missing");
  });

  it("allows platform operators to inspect a validated organization", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "op1", email: "ops@example.com" } } });
    isPlatformOperatorUser.mockResolvedValue(true);
    loadMa2OrganizationDetail.mockResolvedValue({
      id: "org_a",
      name: "Alpha",
      slug: "alpha",
      health: "ok",
      subscription: { status: "active" },
      stripe: { customerId: "cus_1", subscriptionId: "sub_1" },
      errors: [],
      audit: []
    });
    const { GET } = await import("./route");
    const res = await GET(new Request("http://localhost/api/admin/organizations/org_a"), {
      params: { orgId: "org_a" }
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.organization.id).toBe("org_a");
    expect(loadMa2OrganizationDetail).toHaveBeenCalledWith("org_a");
  });
});
