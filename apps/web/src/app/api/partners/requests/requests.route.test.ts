import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = {
  organizationId: "org-a",
  userId: "user-a",
  entitlements: ["platform.partner_services", "facility.operations"]
};

vi.mock("../../../../lib/partners/authz", () => ({
  requirePartnerServicesRead: async () => ({
    organizationId: auth.organizationId,
    user: { id: auth.userId },
    entitlements: auth.entitlements
  }),
  requirePartnerServicesWrite: async () => ({
    organizationId: auth.organizationId,
    user: { id: auth.userId },
    entitlements: auth.entitlements
  })
}));

vi.mock("../../../../lib/partners/request-deps", () => ({
  loadPartnerRequestDeps: async () => {
    const { getMemoryPartnerStore } = await import("../../../../lib/partners/store");
    const { getMemoryPartnerRequestStore } = await import("../../../../lib/partners/request-store");
    return { store: getMemoryPartnerStore(), requests: getMemoryPartnerRequestStore(), durable: true };
  }
}));

import { GET } from "./route";
import { PATCH } from "./[requestId]/route";
import { persistApplication, mutatePartner } from "../../../../lib/partners/service";
import { resetMemoryPartnerStore } from "../../../../lib/partners/store";
import { resetMemoryPartnerRequestStore } from "../../../../lib/partners/request-store";
import { submitPartnerServiceRequest } from "../../../../lib/partners/request-service";
import { getMemoryPartnerStore } from "../../../../lib/partners/store";
import { getMemoryPartnerRequestStore } from "../../../../lib/partners/request-store";

const application = {
  companyName: "NorthStar Property Services",
  contactName: "Alex Rivera",
  email: "alex@northstar.example",
  phone: "612-555-0100",
  website: null,
  city: "Minneapolis",
  state: "MN",
  serviceArea: "Twin Cities",
  companyServiceType: "Maintenance company",
  servicesOffered: "Make-ready, HVAC, plumbing",
  customersServed: null,
  mpaAccountEmail: null,
  interestedPartnerType: "certified_service" as const,
  notes: null
};

async function seed(orgId: string) {
  const store = getMemoryPartnerStore();
  const requests = getMemoryPartnerRequestStore();
  await persistApplication({ ...application, companyName: `Co ${orgId}` }, { store });
  const partner = (await store.listPartners()).find((row) => row.organizationId == null)!;
  await mutatePartner(
    { partnerId: partner.id, action: "approve", actorUserId: "op-1", partnerType: "certified_service" },
    { store }
  );
  await mutatePartner({ partnerId: partner.id, action: "activate", actorUserId: "op-1" }, { store });
  await mutatePartner(
    {
      partnerId: partner.id,
      action: "update",
      actorUserId: "op-1",
      organizationId: orgId,
      publicPortalEnabled: true
    },
    { store }
  );
  const submitted = await submitPartnerServiceRequest(
    partner.publicSlug!,
    {
      requesterName: "Jamie",
      requesterEmail: "jamie@example.test",
      propertyAddress: "100 Main",
      category: "plumbing",
      description: "Leak under sink.",
      urgency: "normal"
    },
    { store, requests }
  );
  const [row] = await requests.listRequests(partner.id);
  return { partner, row, submitted };
}

describe("partner request APIs", () => {
  beforeEach(() => {
    resetMemoryPartnerStore();
    resetMemoryPartnerRequestStore();
    auth.organizationId = "org-a";
    auth.userId = "user-a";
  });

  it("lists only the receiving organization's requests", async () => {
    await seed("org-a");
    resetMemoryPartnerStore();
    resetMemoryPartnerRequestStore();
    const a = await seed("org-a");
    const listed = await GET(new Request("http://localhost/api/partners/requests"));
    expect(listed.status).toBe(200);
    const body = (await listed.json()) as { requests: Array<{ id: string }> };
    expect(body.requests.map((row) => row.id)).toEqual([a.row!.id]);
  });

  it("blocks cross-partner accept and convert", async () => {
    const a = await seed("org-a");
    auth.organizationId = "org-b";
    const denied = await PATCH(
      new Request("http://localhost/api/partners/requests/" + a.row!.id, {
        method: "PATCH",
        body: JSON.stringify({ action: "accept" })
      }),
      { params: Promise.resolve({ requestId: a.row!.id }) }
    );
    expect(denied.status).toBe(404);
    const convert = await PATCH(
      new Request("http://localhost/api/partners/requests/" + a.row!.id, {
        method: "PATCH",
        body: JSON.stringify({
          action: "convert",
          propertyId: "11111111-1111-4111-8111-111111111111"
        })
      }),
      { params: Promise.resolve({ requestId: a.row!.id }) }
    );
    expect(convert.status).toBe(404);
  });
});
