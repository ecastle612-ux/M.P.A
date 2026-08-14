import { beforeEach, describe, expect, it, vi } from "vitest";

const state = {
  userId: null as string | null,
  organizationId: "org_1" as string | null,
  allowed: false,
  plane: "staff" as "staff" | "tenant"
};

vi.mock("../../../../../lib/communications/conversation-authz", () => ({
  requireStaffConversationPermission: async () => {
    if (!state.userId) {
      return { error: new Response(JSON.stringify({ error: "Unauthenticated" }), { status: 401 }) };
    }
    if (!state.allowed) {
      return { error: new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 }) };
    }
    return {
      supabase: {},
      user: { id: state.userId },
      organizationId: state.organizationId,
      plane: "staff",
      tenantAccountId: null
    };
  },
  requireTenantConversationActor: async () => {
    if (!state.userId) {
      return { error: new Response(JSON.stringify({ error: "Unauthenticated" }), { status: 401 }) };
    }
    if (!state.allowed || state.plane !== "tenant") {
      return { error: new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 }) };
    }
    return {
      supabase: {},
      user: { id: state.userId },
      organizationId: state.organizationId,
      plane: "tenant",
      tenantAccountId: "res_1"
    };
  }
}));

vi.mock("../../../../../lib/communications/conversation-service", () => ({
  ConversationServiceError: class ConversationServiceError extends Error {
    status = 403;
  },
  listConversationInbox: async () => [{ id: "c1", unread: true }],
  listMessageableTenants: async () => [{ id: "res_1", label: "Ada" }],
  startConversation: async () => ({ conversation: { id: "c1" }, messageId: "m1" }),
  getConversationThread: async () => ({ conversation: { id: "c1" }, messages: [] }),
  sendConversationMessage: async () => ({ conversation: { id: "c1" }, messageId: "m2" }),
  markConversationRead: async () => ({ ok: true }),
  closeConversation: async () => ({ conversation: { id: "c1", status: "closed" } })
}));

import { GET, POST } from "./route";

describe("COM-002 staff conversation API authorization", () => {
  beforeEach(() => {
    state.userId = null;
    state.allowed = false;
    state.plane = "staff";
  });

  it("denies unauthenticated inbox", async () => {
    const response = await GET(new Request("http://localhost/api/shared/communications/conversations"));
    expect(response.status).toBe(401);
  });

  it("denies FO-only / unauthorized staff", async () => {
    state.userId = "staff_1";
    state.allowed = false;
    const response = await GET(new Request("http://localhost/api/shared/communications/conversations"));
    expect(response.status).toBe(403);
  });

  it("allows entitled PM staff to list and start", async () => {
    state.userId = "staff_1";
    state.allowed = true;
    const list = await GET(new Request("http://localhost/api/shared/communications/conversations"));
    expect(list.status).toBe(200);
    const created = await POST(
      new Request("http://localhost/api/shared/communications/conversations", {
        method: "POST",
        body: JSON.stringify({ tenantAccountId: "res_1", body: "Hello" })
      })
    );
    expect(created.status).toBe(201);
  });
});
