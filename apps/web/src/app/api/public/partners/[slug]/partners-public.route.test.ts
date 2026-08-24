import { beforeEach, describe, expect, it, vi } from "vitest";

const rate = { allow: true };

vi.mock("../../../../../lib/security/durable-rate-limit", () => ({
  consumeRateLimit: async () => rate.allow,
  requestActorKey: () => "203.0.113.10"
}));

vi.mock("../../../../../lib/partners/request-deps", () => ({
  loadPartnerRequestDeps: async () => {
    const { getMemoryPartnerStore } = await import("../../../../../lib/partners/store");
    const { getMemoryPartnerRequestStore } = await import("../../../../../lib/partners/request-store");
    return { store: getMemoryPartnerStore(), requests: getMemoryPartnerRequestStore(), durable: true };
  }
}));

vi.mock("../../../../../lib/observability/analytics", () => ({
  trackEvent: () => undefined
}));

import { GET, POST } from "./route";
import { persistApplication, mutatePartner } from "../../../../../lib/partners/service";
import { resetMemoryPartnerStore } from "../../../../../lib/partners/store";
import { resetMemoryPartnerRequestStore } from "../../../../../lib/partners/request-store";

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

async function enablePortal() {
  const store = resetMemoryPartnerStore();
  resetMemoryPartnerRequestStore();
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
  return partner.publicSlug!;
}

describe("public partner portal routes", () => {
  beforeEach(() => {
    resetMemoryPartnerStore();
    resetMemoryPartnerRequestStore();
    rate.allow = true;
  });

  it("returns branding for a live portal and a generic miss otherwise", async () => {
    const slug = await enablePortal();
    const live = await GET(new Request("http://localhost/api/public/partners/" + slug), {
      params: Promise.resolve({ slug })
    });
    expect(live.status).toBe(200);
    const body = (await live.json()) as { companyName: string; poweredBy: string };
    expect(body.companyName).toBe("NorthStar Property Services");
    expect(body.poweredBy).toBe("Powered by M.P.A.");

    const missing = await GET(new Request("http://localhost/api/public/partners/unknown-company"), {
      params: Promise.resolve({ slug: "unknown-company" })
    });
    expect(missing.status).toBe(404);
    expect(await missing.json()).toEqual({ error: "This request link is not available." });
  });

  it("accepts a public submit and rejects oversized, honeypot, and client ids", async () => {
    const slug = await enablePortal();
    const submitted = await POST(
      new Request("http://localhost/api/public/partners/" + slug, {
        method: "POST",
        body: JSON.stringify({
          requesterName: "Jamie Tenant",
          requesterEmail: "jamie@example.test",
          propertyAddress: "100 Main St",
          category: "plumbing",
          description: "Kitchen sink is leaking.",
          urgency: "soon"
        })
      }),
      { params: Promise.resolve({ slug }) }
    );
    expect(submitted.status).toBe(200);
    const created = (await submitted.json()) as { publicRef: string; statusToken: string };
    expect(created.publicRef).toMatch(/^PSR-2026-\d{5}$/);
    expect(created.statusToken.length).toBeGreaterThan(20);

    const oversized = await POST(
      new Request("http://localhost/api/public/partners/" + slug, {
        method: "POST",
        headers: { "content-length": String(20 * 1024) },
        body: "{}"
      }),
      { params: Promise.resolve({ slug }) }
    );
    expect(oversized.status).toBe(413);

    const spam = await POST(
      new Request("http://localhost/api/public/partners/" + slug, {
        method: "POST",
        body: JSON.stringify({
          requesterName: "Jamie Tenant",
          requesterEmail: "jamie@example.test",
          propertyAddress: "100 Main St",
          category: "plumbing",
          description: "Kitchen sink is leaking.",
          company_fax: "1"
        })
      }),
      { params: Promise.resolve({ slug }) }
    );
    expect(spam.status).toBe(200);

    const injected = await POST(
      new Request("http://localhost/api/public/partners/" + slug, {
        method: "POST",
        body: JSON.stringify({
          requesterName: "Jamie Tenant",
          requesterEmail: "jamie@example.test",
          propertyAddress: "100 Main St",
          category: "plumbing",
          description: "Kitchen sink is leaking.",
          organization_id: "org-hack"
        })
      }),
      { params: Promise.resolve({ slug }) }
    );
    expect(injected.status).toBe(400);
  });

  it("rate limits public portal traffic", async () => {
    const slug = await enablePortal();
    rate.allow = false;
    const limited = await GET(new Request("http://localhost/api/public/partners/" + slug), {
      params: Promise.resolve({ slug })
    });
    expect(limited.status).toBe(429);
  });
});
