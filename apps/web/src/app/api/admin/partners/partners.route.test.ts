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

vi.mock("../../../../lib/partners/runtime", () => ({
  loadPartnerDeps: async () => {
    const { getMemoryPartnerStore } = await import("../../../../lib/partners/store");
    return { store: getMemoryPartnerStore(), durable: true };
  }
}));

vi.mock("../../../../lib/partners/invitation-runtime", () => ({
  loadPartnerInvitationDeps: async () => {
    const { getMemoryPartnerStore } = await import("../../../../lib/partners/store");
    return { store: getMemoryPartnerStore(), durable: true };
  }
}));

import { GET, PATCH, POST } from "./route";
import { persistApplication } from "../../../../lib/partners/service";
import { getMemoryPartnerStore, resetMemoryPartnerStore } from "../../../../lib/partners/store";

describe("admin partners routes", () => {
  beforeEach(() => {
    resetMemoryPartnerStore();
    state.user = { id: "op-1", email: "op@example.com" };
    state.operator = true;
  });

  it("forbids non-operators", async () => {
    state.operator = false;
    const listed = await GET();
    expect(listed.status).toBe(403);
    const mutated = await PATCH(
      new Request("http://localhost/api/admin/partners", {
        method: "PATCH",
        body: JSON.stringify({ partnerId: "x", action: "approve" })
      })
    );
    expect(mutated.status).toBe(403);
  });

  it("lets operators list and approve", async () => {
    await persistApplication(
      {
        companyName: "NorthStar Property Services",
        contactName: "Alex Rivera",
        email: "alex@northstar.example",
        phone: "612-555-0100",
        website: null,
        city: "Minneapolis",
        state: "MN",
        serviceArea: "Twin Cities",
        companyServiceType: "Maintenance",
        servicesOffered: "HVAC",
        customersServed: null,
        mpaAccountEmail: null,
        interestedPartnerType: "referral",
        notes: null
      },
      { store: getMemoryPartnerStore() }
    );
    const listed = await GET();
    expect(listed.status).toBe(200);
    const body = (await listed.json()) as { partners: Array<{ id: string; status: string }> };
    expect(body.partners).toHaveLength(1);
    const approved = await PATCH(
      new Request("http://localhost/api/admin/partners", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ partnerId: body.partners[0]?.id, action: "approve" })
      })
    );
    expect(approved.status).toBe(200);
  });

  it("lets operators invite a partner without a public application", async () => {
    const invited = await POST(
      new Request("http://localhost/api/admin/partners", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          companyName: "Invited HVAC",
          contactName: "Casey",
          email: "casey@invited.example",
          partnerType: "certified_service"
        })
      })
    );
    expect(invited.status).toBe(200);
    const listed = await GET();
    const body = (await listed.json()) as {
      partners: Array<{ email: string; invitationStatus: string | null; onboarding: { readiness: string } }>;
    };
    expect(body.partners.some((row) => row.email === "casey@invited.example")).toBe(true);
  });
});
