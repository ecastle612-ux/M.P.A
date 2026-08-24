import { beforeEach, describe, expect, it, vi } from "vitest";

const rate = { allow: true };

vi.mock("../../../../../../lib/security/durable-rate-limit", () => ({
  consumeRateLimit: async () => rate.allow,
  requestActorKey: () => "203.0.113.10"
}));

vi.mock("../../../../../../lib/partners/request-deps", () => ({
  loadPartnerRequestDeps: async () => {
    const { getMemoryPartnerStore } = await import("../../../../../../lib/partners/store");
    const { getMemoryPartnerRequestStore } = await import("../../../../../../lib/partners/request-store");
    const { getMemoryPartnerPropertyPortalStore, getMemoryPropertyCatalog } = await import(
      "../../../../../../lib/partners/property-portal-store"
    );
    return {
      store: getMemoryPartnerStore(),
      requests: getMemoryPartnerRequestStore(),
      propertyPortals: getMemoryPartnerPropertyPortalStore(),
      properties: getMemoryPropertyCatalog(),
      durable: true
    };
  }
}));

vi.mock("../../../../../../lib/observability/analytics", () => ({
  trackEvent: () => undefined
}));

import { GET, POST } from "./route";
import { persistApplication, mutatePartner } from "../../../../../../lib/partners/service";
import { resetMemoryPartnerStore } from "../../../../../../lib/partners/store";
import { resetMemoryPartnerRequestStore } from "../../../../../../lib/partners/request-store";
import {
  resetMemoryPartnerPropertyPortalStore,
  resetMemoryPropertyCatalog
} from "../../../../../../lib/partners/property-portal-store";
import { createAuthorizedPropertyPortal } from "../../../../../../lib/partners/property-portal-service";
import { getMemoryPartnerStore } from "../../../../../../lib/partners/store";
import { getMemoryPartnerRequestStore } from "../../../../../../lib/partners/request-store";
import { getMemoryPartnerPropertyPortalStore, getMemoryPropertyCatalog } from "../../../../../../lib/partners/property-portal-store";

const mapleId = "11111111-1111-4111-8111-111111111111";

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

async function enablePropertyPortal() {
  const store = resetMemoryPartnerStore();
  const requests = resetMemoryPartnerRequestStore();
  const propertyPortals = resetMemoryPartnerPropertyPortalStore();
  const properties = resetMemoryPropertyCatalog();
  await persistApplication(application, { store });
  const partner = (await store.listPartners())[0]!;
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
      organizationId: "org-northstar",
      publicPortalEnabled: true
    },
    { store }
  );
  properties.seed({
    id: mapleId,
    organizationId: "org-northstar",
    name: "Maple Apartments",
    addressLine1: "100 Maple Ave",
    city: "Minneapolis",
    region: "MN",
    postalCode: "55401",
    status: "active"
  });
  const created = await createAuthorizedPropertyPortal(
    {
      organizationId: "org-northstar",
      actorUserId: "user-1",
      payload: { propertyId: mapleId, publicSlug: "maple-apartments" }
    },
    { store, requests, propertyPortals, properties }
  );
  if (!created.ok) throw new Error(created.error);
  return { slug: partner.publicSlug!, propertySlug: "maple-apartments" };
}

describe("public partner property portal routes", () => {
  beforeEach(() => {
    resetMemoryPartnerStore();
    resetMemoryPartnerRequestStore();
    resetMemoryPartnerPropertyPortalStore();
    resetMemoryPropertyCatalog();
    rate.allow = true;
  });

  it("returns branding for a live property portal and a generic miss otherwise", async () => {
    const { slug, propertySlug } = await enablePropertyPortal();
    const live = await GET(new Request(`http://localhost/api/public/partners/${slug}/${propertySlug}`), {
      params: Promise.resolve({ slug, propertySlug })
    });
    expect(live.status).toBe(200);
    const body = (await live.json()) as { companyName: string; propertyName: string; poweredBy: string };
    expect(body.companyName).toBe("NorthStar Property Services");
    expect(body.propertyName).toBe("Maple Apartments");
    expect(body.poweredBy).toBe("Powered by M.P.A.");

    const missing = await GET(new Request(`http://localhost/api/public/partners/${slug}/unknown-building`), {
      params: Promise.resolve({ slug, propertySlug: "unknown-building" })
    });
    expect(missing.status).toBe(404);
    expect(await missing.json()).toEqual({ error: "This request link is not available." });
  });

  it("accepts a simplified property submit and rejects client property/org ids", async () => {
    const { slug, propertySlug } = await enablePropertyPortal();
    const submitted = await POST(
      new Request(`http://localhost/api/public/partners/${slug}/${propertySlug}`, {
        method: "POST",
        body: JSON.stringify({
          requesterName: "Jamie Tenant",
          requesterEmail: "jamie@example.test",
          unitLabel: "2B",
          category: "plumbing",
          description: "Kitchen sink is leaking.",
          urgency: "soon"
        })
      }),
      { params: Promise.resolve({ slug, propertySlug }) }
    );
    expect(submitted.status).toBe(200);
    const created = (await submitted.json()) as { publicRef: string; statusToken: string };
    expect(created.publicRef).toMatch(/^PSR-2026-\d{5}$/);
    expect(created.statusToken.length).toBeGreaterThan(20);

    const injected = await POST(
      new Request(`http://localhost/api/public/partners/${slug}/${propertySlug}`, {
        method: "POST",
        body: JSON.stringify({
          requesterName: "Jamie Tenant",
          requesterEmail: "jamie@example.test",
          category: "plumbing",
          description: "Kitchen sink is leaking.",
          property_id: mapleId,
          organization_id: "org-hack"
        })
      }),
      { params: Promise.resolve({ slug, propertySlug }) }
    );
    expect(injected.status).toBe(400);

    const [row] = await getMemoryPartnerRequestStore().listRequests((await getMemoryPartnerStore().listPartners())[0]!.id);
    expect(row?.propertyId).toBe(mapleId);
    expect(row?.intakeSource).toBe("property_portal");
    expect(getMemoryPartnerPropertyPortalStore().portals.size).toBe(1);
  });
});
