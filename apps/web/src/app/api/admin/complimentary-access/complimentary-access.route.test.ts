import { beforeEach, describe, expect, it, vi } from "vitest";

const state = {
  user: { id: "op-1", email: "op@example.com" } as { id: string; email: string } | null,
  operator: true
};

vi.mock("../../../../lib/auth/server", () => ({
  createAuthServerClient: async () => ({
    auth: {
      getUser: async () => ({ data: { user: state.user } })
    }
  })
}));

vi.mock("../../../../lib/commercial/server", () => ({
  isPlatformOperatorUser: async () => state.operator
}));

vi.mock("../../../../lib/complimentary-access/runtime", () => ({
  loadRuntimeComplimentaryStore: async () => {
    const { getComplimentaryGrantStore } = await import("../../../../lib/complimentary-access/store");
    return getComplimentaryGrantStore();
  },
  persistRuntimeComplimentaryState: async () => undefined,
  createRuntimeComplimentaryDeps: async (store: unknown) => ({
    store,
    sendWelcome: async () => ({ ok: true }),
    sendExpiry: async () => ({ ok: true })
  })
}));

import { GET, PATCH, POST } from "./route";
import { useMemoryComplimentaryGrantStore } from "../../../../lib/complimentary-access/store";

describe("admin complimentary access routes", () => {
  beforeEach(() => {
    useMemoryComplimentaryGrantStore();
    state.user = { id: "op-1", email: "op@example.com" };
    state.operator = true;
  });

  it("forbids non-operators from grant/change/revoke", async () => {
    state.operator = false;
    const create = await POST(
      new Request("http://localhost/api/admin/complimentary-access", {
        method: "POST",
        body: JSON.stringify({
          email: "t@example.com",
          grantType: "tester",
          productSku: "mpa_property_manager",
          durationId: "30d",
          limitMode: "product_normal"
        })
      })
    );
    expect(create.status).toBe(403);
    const change = await PATCH(
      new Request("http://localhost/api/admin/complimentary-access", {
        method: "PATCH",
        body: JSON.stringify({ grantId: "x", action: "revoke" })
      })
    );
    expect(change.status).toBe(403);
  });

  it("lets operators send access", async () => {
    const response = await POST(
      new Request("http://localhost/api/admin/complimentary-access", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: "t@example.com",
          grantType: "tester",
          productSku: "mpa_property_manager",
          durationId: "30d",
          limitMode: "product_normal"
        })
      })
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as { grant: { recipientEmail: string; status: string } };
    expect(body.grant.recipientEmail).toBe("t@example.com");
    expect(body.grant.status).toBe("invited");
    const listed = await GET();
    expect(listed.status).toBe(200);
  });
});
