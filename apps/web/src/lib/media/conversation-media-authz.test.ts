import { describe, expect, it, vi } from "vitest";

vi.mock("../communications/conversation-service", () => ({
  canReadConversationMessageMedia: async (
    _db: unknown,
    actor: { plane: string; tenantAccountId: string | null },
    messageId: string | null
  ) => {
    if (!messageId) return true;
    if (actor.plane === "tenant" && actor.tenantAccountId !== "res_1") return false;
    if (messageId === "foreign_message") return false;
    return true;
  }
}));

import { assertMediaEntityAccess } from "./authz";

describe("COM-002 conversation media authorization", () => {
  it("allows a tenant to access their message media and denies another tenant", async () => {
    const allowed = await assertMediaEntityAccess({
      supabase: {} as never,
      organizationId: "org_1",
      relatedEntityType: "conversation_message",
      relatedEntityId: "msg_1",
      conversationActor: { plane: "tenant", tenantAccountId: "res_1" }
    });
    expect(allowed).toEqual({ ok: true });

    const denied = await assertMediaEntityAccess({
      supabase: {} as never,
      organizationId: "org_1",
      relatedEntityType: "conversation_message",
      relatedEntityId: "foreign_message",
      conversationActor: { plane: "tenant", tenantAccountId: "res_2" }
    });
    expect("error" in denied).toBe(true);
  });
});
