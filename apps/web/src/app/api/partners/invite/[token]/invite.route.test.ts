import { beforeEach, describe, expect, it, vi } from "vitest";
import { hashPartnerInvitationToken } from "../../../../../lib/partners/invitation-tokens";
import { invitePartnerDirect } from "../../../../../lib/partners/invitation-service";
import { getMemoryPartnerStore, resetMemoryPartnerStore } from "../../../../../lib/partners/store";

const state = {
  user: { id: "user-1", email: "alex@northstar.example" } as { id: string; email: string } | null
};

vi.mock("../../../../../lib/auth/server", () => ({
  createAuthServerClient: async () => ({
    auth: {
      getUser: async () => ({ data: { user: state.user } })
    }
  })
}));

vi.mock("../../../../../lib/partners/invitation-runtime", () => ({
  loadPartnerInvitationDeps: async () => ({
    store: getMemoryPartnerStore(),
    createPartnerOrganization: async () => ({ organizationId: "org_partner" }),
    ensurePartnerMembership: async () => undefined
  })
}));

vi.mock("../../../../../lib/security/durable-rate-limit", () => ({
  consumeRateLimit: async () => true,
  requestActorKey: () => "test"
}));

import { GET, POST } from "./route";

describe("partner invitation routes", () => {
  beforeEach(() => {
    resetMemoryPartnerStore();
    state.user = { id: "user-1", email: "alex@northstar.example" };
  });

  it("hides details for unknown tokens and accepts a bound email", async () => {
    const unknown = await GET(new Request("http://localhost/api/partners/invite/not-a-real-token"), {
      params: Promise.resolve({ token: "not-a-real-token" })
    });
    expect(unknown.status).toBe(200);
    const hidden = (await unknown.json()) as { state: string; companyName: string | null };
    expect(hidden.state).toBe("unavailable");
    expect(hidden.companyName).toBeNull();

    const created = await invitePartnerDirect(
      {
        companyName: "NorthStar Property Services",
        contactName: "Alex Rivera",
        email: "alex@northstar.example",
        partnerType: "certified_service"
      },
      { actorUserId: "op-1" },
      { store: getMemoryPartnerStore() }
    );
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const token = "invitetokeninvitetokeninvi";
    await getMemoryPartnerStore().updateInvitation({
      ...created.invitation,
      tokenHash: hashPartnerInvitationToken(token)
    });

    const preview = await GET(new Request(`http://localhost/api/partners/invite/${token}`), {
      params: Promise.resolve({ token })
    });
    const view = (await preview.json()) as { state: string; companyName: string | null };
    expect(view.state).toBe("valid");
    expect(view.companyName).toBe("NorthStar Property Services");

    const accepted = await POST(
      new Request(`http://localhost/api/partners/invite/${token}`, {
        method: "POST",
        body: JSON.stringify({ organizationId: "org-hijack" })
      }),
      { params: Promise.resolve({ token }) }
    );
    expect(accepted.status).toBe(400);

    const ok = await POST(
      new Request(`http://localhost/api/partners/invite/${token}`, {
        method: "POST",
        body: JSON.stringify({})
      }),
      { params: Promise.resolve({ token }) }
    );
    expect(ok.status).toBe(200);
    const body = (await ok.json()) as { nextPath: string };
    expect(body.nextPath).toBe("/partner");
  });

  it("rejects unauthenticated accept and wrong email", async () => {
    const created = await invitePartnerDirect(
      {
        companyName: "NorthStar Property Services",
        contactName: "Alex Rivera",
        email: "alex@northstar.example",
        partnerType: "referral"
      },
      { actorUserId: "op-1" },
      { store: getMemoryPartnerStore() }
    );
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const token = "othertokenothertokenothert";
    await getMemoryPartnerStore().updateInvitation({
      ...created.invitation,
      tokenHash: hashPartnerInvitationToken(token)
    });

    state.user = null;
    const unauth = await POST(
      new Request(`http://localhost/api/partners/invite/${token}`, {
        method: "POST",
        body: JSON.stringify({})
      }),
      { params: Promise.resolve({ token }) }
    );
    expect(unauth.status).toBe(401);

    state.user = { id: "user-2", email: "other@example.com" };
    const mismatch = await POST(
      new Request(`http://localhost/api/partners/invite/${token}`, {
        method: "POST",
        body: JSON.stringify({})
      }),
      { params: Promise.resolve({ token }) }
    );
    expect(mismatch.status).toBe(403);
  });
});
