import { beforeEach, describe, expect, it, vi } from "vitest";

const authState = {
  userId: null as string | null,
  isOperator: false
};

const grantStore = {
  createResult: null as
    | { grant: { id: string; organization_id: string; plan_granted: string } }
    | { error: string; status?: number }
    | null,
  listResult: [] as Array<{ id: string; grant_status: string }>
};

vi.mock("../../../../lib/auth/server", () => ({
  createAuthServerClient: async () => ({
    auth: {
      getUser: async () => ({
        data: { user: authState.userId ? { id: authState.userId } : null }
      })
    }
  })
}));

vi.mock("../../../../lib/commercial/server", () => ({
  isPlatformOperatorUser: async () => authState.isOperator
}));

vi.mock("../../../../lib/admin/complimentary-grants", () => ({
  listComplimentaryGrants: async () => grantStore.listResult,
  createComplimentaryGrant: async () =>
    grantStore.createResult ?? { error: "not configured", status: 500 },
  extendComplimentaryGrant: async () => ({
    grant: { id: "g1", organization_id: "org_1", plan_granted: "mpa_property_manager" }
  }),
  revokeComplimentaryGrant: async () => ({
    grant: {
      id: "g1",
      organization_id: "org_1",
      plan_granted: "mpa_property_manager",
      grant_status: "revoked"
    }
  })
}));

import { GET, POST } from "./route";
import { DELETE, PATCH } from "./[grantId]/route";

describe("ADM-001 /api/admin/testers authorization", () => {
  beforeEach(() => {
    authState.userId = null;
    authState.isOperator = false;
    grantStore.createResult = null;
    grantStore.listResult = [];
  });

  it("denies unauthenticated list", async () => {
    const response = await GET(new Request("http://localhost/api/admin/testers"));
    expect(response.status).toBe(401);
  });

  it("denies non-operator create", async () => {
    authState.userId = "user_customer";
    authState.isOperator = false;
    const response = await POST(
      new Request("http://localhost/api/admin/testers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "tester@example.com",
          planGranted: "mpa_property_manager",
          duration: "7d",
          reason: "qa"
        })
      })
    );
    expect(response.status).toBe(403);
  });

  it("allows Master Admin create", async () => {
    authState.userId = "user_operator";
    authState.isOperator = true;
    grantStore.createResult = {
      grant: {
        id: "grant_1",
        organization_id: "org_tester",
        plan_granted: "mpa_property_manager"
      }
    };
    const response = await POST(
      new Request("http://localhost/api/admin/testers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "tester@example.com",
          planGranted: "mpa_property_manager",
          duration: "7d",
          reason: "pre-launch tester"
        })
      })
    );
    expect(response.status).toBe(201);
    const body = (await response.json()) as { grant: { id: string } };
    expect(body.grant.id).toBe("grant_1");
  });

  it("allows Master Admin list", async () => {
    authState.userId = "user_operator";
    authState.isOperator = true;
    grantStore.listResult = [{ id: "grant_1", grant_status: "active" }];
    const response = await GET(new Request("http://localhost/api/admin/testers?status=active"));
    expect(response.status).toBe(200);
    const body = (await response.json()) as { grants: Array<{ id: string }> };
    expect(body.grants).toHaveLength(1);
  });

  it("denies non-operator revoke", async () => {
    authState.userId = "user_customer";
    authState.isOperator = false;
    const response = await DELETE(new Request("http://localhost/api/admin/testers/grant_1"), {
      params: Promise.resolve({ grantId: "grant_1" })
    });
    expect(response.status).toBe(403);
  });

  it("allows Master Admin extend", async () => {
    authState.userId = "user_operator";
    authState.isOperator = true;
    const response = await PATCH(
      new Request("http://localhost/api/admin/testers/grant_1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "extend",
          expirationDate: "2026-12-01T00:00:00.000Z"
        })
      }),
      { params: Promise.resolve({ grantId: "grant_1" }) }
    );
    expect(response.status).toBe(200);
  });
});
