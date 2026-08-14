import { beforeEach, describe, expect, it, vi } from "vitest";

const state = {
  userId: null as string | null,
  allowed: false,
  tenantAccountId: "res_1"
};

vi.mock("../../../../../lib/communications/conversation-authz", () => ({
  requireTenantConversationActor: async () => {
    if (!state.userId) {
      return { error: new Response(JSON.stringify({ error: "Unauthenticated" }), { status: 401 }) };
    }
    if (!state.allowed) {
      return { error: new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 }) };
    }
    return {
      supabase: {},
      user: { id: state.userId },
      organizationId: "org_1",
      plane: "tenant",
      tenantAccountId: state.tenantAccountId
    };
  }
}));

vi.mock("../../../../../lib/communications/conversation-service", () => ({
  listConversationInbox: async (
    _db: unknown,
    _org: string,
    actor: { tenantAccountId: string | null }
  ) => [{ id: "c1", tenantAccountId: actor.tenantAccountId, unread: true }]
}));

import { GET } from "./route";

describe("COM-002 tenant inbox API", () => {
  beforeEach(() => {
    state.userId = null;
    state.allowed = false;
  });

  it("denies unauthenticated tenants", async () => {
    const response = await GET();
    expect(response.status).toBe(401);
  });

  it("denies tenants without lease access", async () => {
    state.userId = "tenant_1";
    state.allowed = false;
    const response = await GET();
    expect(response.status).toBe(403);
  });

  it("returns only the caller tenant inbox", async () => {
    state.userId = "tenant_1";
    state.allowed = true;
    const response = await GET();
    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.conversations[0].tenantAccountId).toBe("res_1");
  });
});
