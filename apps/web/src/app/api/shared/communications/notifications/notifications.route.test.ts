import { beforeEach, describe, expect, it, vi } from "vitest";

const state = {
  userId: null as string | null,
  organizationId: "org_1" as string | null,
  allowed: false,
  plane: "staff" as "staff" | "tenant"
};

vi.mock("../../../../../lib/communications/conversation-authz", () => ({
  requireNotificationCenterActor: async () => {
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
      plane: state.plane,
      tenantAccountId: state.plane === "tenant" ? "res_1" : null
    };
  }
}));

vi.mock("../../../../../lib/communications/communications-service", () => ({
  listUnifiedNotifications: async () => [
    {
      id: "comms:n1",
      source: "comms",
      title: "COM-002 UAT thread",
      body: "Hello",
      href: "/portal/tenant/messages/c1",
      readAt: null,
      createdAt: new Date().toISOString(),
      notificationKey: "conversation.message.sent:m1"
    }
  ],
  markNotificationRead: async () => ({ ok: true })
}));

import { GET, PATCH } from "./route";

describe("COM-002 notification center API", () => {
  beforeEach(() => {
    state.userId = null;
    state.allowed = false;
    state.plane = "staff";
  });

  it("denies unauthenticated callers", async () => {
    const response = await GET();
    expect(response.status).toBe(401);
  });

  it("denies FO / callers without notification access", async () => {
    state.userId = "fo_1";
    state.allowed = false;
    const response = await GET();
    expect(response.status).toBe(403);
  });

  it("lets entitled staff list notifications", async () => {
    state.userId = "staff_1";
    state.allowed = true;
    const response = await GET();
    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.unreadCount).toBe(1);
    expect(payload.notifications[0].href).toContain("/portal/tenant/messages/");
  });

  it("lets the tenant list and mark their own notifications", async () => {
    state.userId = "tenant_1";
    state.allowed = true;
    state.plane = "tenant";
    const list = await GET();
    expect(list.status).toBe(200);
    const marked = await PATCH(
      new Request("http://localhost/api/shared/communications/notifications", {
        method: "PATCH",
        body: JSON.stringify({ notificationId: "comms:n1" })
      })
    );
    expect(marked.status).toBe(200);
  });
});
