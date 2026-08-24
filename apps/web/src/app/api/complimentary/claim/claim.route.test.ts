import { beforeEach, describe, expect, it, vi } from "vitest";
import { useMemoryComplimentaryGrantStore } from "../../../../lib/complimentary-access/store";
import { sendComplimentaryAccess } from "../../../../lib/complimentary-access/service";

const state = {
  user: null as { id: string; email: string } | null
};

vi.mock("../../../../lib/auth/server", () => ({
  createAuthServerClient: async () => ({
    auth: {
      getUser: async () => ({ data: { user: state.user } })
    }
  })
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
    findAuthUserByEmail: async () => ({ id: "existing-user", email: "tester@example.com" }),
    createOrUpdateAuthUser: async () => ({ id: "existing-user", email: "tester@example.com" }),
    createOrganization: async () => ({ organizationId: "org_1", organizationName: "Tester Organization" }),
    assignSku: async () => ({ error: null })
  })
}));

import { GET, POST } from "./route";

describe("complimentary claim route", () => {
  beforeEach(() => {
    useMemoryComplimentaryGrantStore();
    state.user = null;
  });

  it("rejects SKU changes and reuses the existing user", async () => {
    const sent = await sendComplimentaryAccess(
      {
        email: "tester@example.com",
        grantType: "tester",
        productSku: "mpa_property_manager",
        durationId: "30d",
        limitMode: "product_normal"
      },
      "op-1",
      {
        store: useMemoryComplimentaryGrantStore(),
        sendWelcome: async () => ({ ok: true })
      }
    );
    expect(sent.ok).toBe(true);
    if (!sent.ok) return;

    const preview = await GET(
      new Request(`http://localhost/api/complimentary/claim?token=${sent.claimToken}`)
    );
    expect(preview.status).toBe(200);

    const denied = await POST(
      new Request("http://localhost/api/complimentary/claim", {
        method: "POST",
        body: JSON.stringify({ token: sent.claimToken, productSku: "mpa_facility_operations" })
      })
    );
    expect(denied.status).toBe(409);
    const deniedBody = (await denied.json()) as { error: string };
    expect(deniedBody.error).toBe("claim_cannot_change_sku");

    const claimed = await POST(
      new Request("http://localhost/api/complimentary/claim", {
        method: "POST",
        body: JSON.stringify({ token: sent.claimToken, password: "password1234" })
      })
    );
    expect(claimed.status).toBe(200);
    const body = (await claimed.json()) as { reusedUser: boolean; productSku: string };
    expect(body.reusedUser).toBe(true);
    expect(body.productSku).toBe("mpa_property_manager");
  });
});
