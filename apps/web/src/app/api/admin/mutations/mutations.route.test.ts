import { beforeEach, describe, expect, it, vi } from "vitest";

const getUser = vi.fn();
const isPlatformOperatorUser = vi.fn();
const mutateMembershipStatus = vi.fn();
const mutateSubscriptionLifecycle = vi.fn();
const mutateOrganizationLifecycle = vi.fn();
const capacityMutationBlocked = vi.fn();

vi.mock("../../../../lib/auth/server", () => ({
  createAuthServerClient: async () => ({ auth: { getUser } })
}));
vi.mock("../../../../lib/commercial/server", () => ({
  isPlatformOperatorUser: (...args: unknown[]) => isPlatformOperatorUser(...args)
}));
vi.mock("../../../../lib/admin/ma7-mutation-service", () => ({
  mutateMembershipStatus: (...args: unknown[]) => mutateMembershipStatus(...args),
  mutateSubscriptionLifecycle: (...args: unknown[]) => mutateSubscriptionLifecycle(...args),
  mutateOrganizationLifecycle: (...args: unknown[]) => mutateOrganizationLifecycle(...args),
  capacityMutationBlocked: (...args: unknown[]) => capacityMutationBlocked(...args)
}));

describe("MA-7 mutation route authorization", () => {
  beforeEach(() => {
    getUser.mockReset();
    isPlatformOperatorUser.mockReset();
    mutateMembershipStatus.mockReset();
    mutateSubscriptionLifecycle.mockReset();
    mutateOrganizationLifecycle.mockReset();
    capacityMutationBlocked.mockReset();
  });

  it("rejects unauthenticated membership mutation", async () => {
    mutateMembershipStatus.mockResolvedValue({
      ok: false,
      code: "unauthorized",
      correlationId: "x"
    });
    const { POST } = await import("./memberships/route");
    const res = await POST(
      new Request("http://localhost/api/admin/mutations/memberships", {
        method: "POST",
        body: JSON.stringify({
          membershipId: "m1",
          organizationId: "org1",
          status: "inactive",
          reason: "enough chars here",
          confirm: true,
          confirmationToken: "DEACTIVATE"
        })
      })
    );
    expect(res.status).toBe(401);
  });

  it("rejects forged role / non-operator for membership and ignores client capabilities", async () => {
    mutateMembershipStatus.mockResolvedValue({
      ok: false,
      code: "forbidden",
      correlationId: "x"
    });
    const { POST } = await import("./memberships/route");
    const res = await POST(
      new Request("http://localhost/api/admin/mutations/memberships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          membershipId: "m1",
          organizationId: "forged-org",
          status: "inactive",
          reason: "enough chars here",
          confirm: true,
          confirmationToken: "DEACTIVATE",
          capabilities: ["ma.orgs.suspend", "ma.capacity.mutate"]
        })
      })
    );
    expect(res.status).toBe(403);
    expect(mutateMembershipStatus).toHaveBeenCalled();
    const arg = mutateMembershipStatus.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(arg).not.toHaveProperty("capabilities");
  });

  it("allows operator membership mutation", async () => {
    mutateMembershipStatus.mockResolvedValue({
      ok: true,
      code: "ok",
      correlationId: "c",
      previousState: { status: "active" },
      resultingState: { status: "inactive" }
    });
    const { POST } = await import("./memberships/route");
    const res = await POST(
      new Request("http://localhost/api/admin/mutations/memberships", {
        method: "POST",
        body: JSON.stringify({
          membershipId: "m1",
          organizationId: "org1",
          status: "inactive",
          reason: "enough chars here",
          confirm: true,
          confirmationToken: "DEACTIVATE"
        })
      })
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean };
    expect(body.ok).toBe(true);
  });

  it("rejects non-operator subscription mutation", async () => {
    mutateSubscriptionLifecycle.mockResolvedValue({
      ok: false,
      code: "forbidden",
      correlationId: "x"
    });
    const { POST } = await import("./subscriptions/route");
    const res = await POST(
      new Request("http://localhost/api/admin/mutations/subscriptions", {
        method: "POST",
        body: JSON.stringify({
          organizationId: "org1",
          action: "cancel",
          reason: "enough chars here",
          confirm: true,
          confirmationToken: "CANCEL"
        })
      })
    );
    expect(res.status).toBe(403);
  });

  it("allows operator subscription cancel", async () => {
    mutateSubscriptionLifecycle.mockResolvedValue({
      ok: true,
      code: "ok",
      correlationId: "c",
      previousState: { cancelAtPeriodEnd: false },
      resultingState: { cancelAtPeriodEnd: true }
    });
    const { POST } = await import("./subscriptions/route");
    const res = await POST(
      new Request("http://localhost/api/admin/mutations/subscriptions", {
        method: "POST",
        body: JSON.stringify({
          organizationId: "org1",
          action: "cancel",
          reason: "enough chars here",
          confirm: true,
          confirmationToken: "CANCEL"
        })
      })
    );
    expect(res.status).toBe(200);
  });

  it("blocks org suspend and capacity mutate for operators", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "op1" } } });
    isPlatformOperatorUser.mockResolvedValue(true);
    mutateOrganizationLifecycle.mockResolvedValue({
      ok: false,
      code: "lifecycle_unavailable",
      correlationId: "c1",
      message: "blocked"
    });
    capacityMutationBlocked.mockReturnValue({
      ok: false,
      code: "capacity_mutation_unavailable",
      correlationId: "c2",
      message: "blocked"
    });
    const { POST } = await import("./blocked/route");
    const orgRes = await POST(
      new Request("http://localhost/api/admin/mutations/blocked", {
        method: "POST",
        body: JSON.stringify({ domain: "organization", action: "suspend", organizationId: "org1" })
      })
    );
    expect(orgRes.status).toBe(400);
    const orgBody = (await orgRes.json()) as { code: string };
    expect(orgBody.code).toBe("lifecycle_unavailable");

    const capRes = await POST(
      new Request("http://localhost/api/admin/mutations/blocked", {
        method: "POST",
        body: JSON.stringify({ domain: "capacity", organizationId: "org1" })
      })
    );
    expect(capRes.status).toBe(400);
    const capBody = (await capRes.json()) as { code: string };
    expect(capBody.code).toBe("capacity_mutation_unavailable");
  });

  it("rejects forged role on blocked probe endpoint", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "pm1", app_metadata: { role: "admin" } } }
    });
    isPlatformOperatorUser.mockResolvedValue(false);
    const { POST } = await import("./blocked/route");
    const res = await POST(
      new Request("http://localhost/api/admin/mutations/blocked", {
        method: "POST",
        body: JSON.stringify({ domain: "organization", action: "suspend" })
      })
    );
    expect(res.status).toBe(403);
  });
});
