import { beforeEach, describe, expect, it, vi } from "vitest";

const rate = { allow: true };

vi.mock("../../../../lib/security/durable-rate-limit", () => ({
  consumeRateLimit: async () => rate.allow,
  requestActorKey: () => "203.0.113.10"
}));

vi.mock("../../../../lib/partners/runtime", () => ({
  loadPartnerDeps: async () => {
    const { getMemoryPartnerStore } = await import("../../../../lib/partners/store");
    return { store: getMemoryPartnerStore(), durable: true };
  }
}));

vi.mock("../../../../lib/observability/analytics", () => ({
  trackEvent: () => undefined
}));

import { POST } from "./route";
import { resetMemoryPartnerStore } from "../../../../lib/partners/store";

const validBody = {
  companyName: "NorthStar Property Services",
  contactName: "Alex Rivera",
  email: "alex@northstar.example",
  phone: "612-555-0100",
  city: "Minneapolis",
  state: "MN",
  serviceArea: "Twin Cities",
  companyServiceType: "Maintenance company",
  servicesOffered: "Make-ready, HVAC",
  interestedPartnerType: "referral"
};

describe("POST /api/partners/apply", () => {
  beforeEach(() => {
    resetMemoryPartnerStore();
    rate.allow = true;
  });

  it("accepts a valid public application", async () => {
    const response = await POST(
      new Request("http://localhost/api/partners/apply", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(validBody)
      })
    );
    expect(response.status).toBe(200);
    const json = (await response.json()) as { ok: boolean };
    expect(json.ok).toBe(true);
  });

  it("rejects invalid and oversized payloads and client org ids", async () => {
    const invalid = await POST(
      new Request("http://localhost/api/partners/apply", {
        method: "POST",
        body: JSON.stringify({ companyName: "X" })
      })
    );
    expect(invalid.status).toBe(400);

    const oversized = await POST(
      new Request("http://localhost/api/partners/apply", {
        method: "POST",
        headers: { "content-length": String(20 * 1024) },
        body: "{}"
      })
    );
    expect(oversized.status).toBe(413);

    const injected = await POST(
      new Request("http://localhost/api/partners/apply", {
        method: "POST",
        body: JSON.stringify({ ...validBody, organization_id: "org-hack" })
      })
    );
    expect(injected.status).toBe(400);
  });

  it("rate limits public intake", async () => {
    rate.allow = false;
    const response = await POST(
      new Request("http://localhost/api/partners/apply", {
        method: "POST",
        body: JSON.stringify(validBody)
      })
    );
    expect(response.status).toBe(429);
  });

  it("returns generic success for honeypot spam", async () => {
    const response = await POST(
      new Request("http://localhost/api/partners/apply", {
        method: "POST",
        body: JSON.stringify({ ...validBody, company_fax: "bot" })
      })
    );
    expect(response.status).toBe(200);
  });
});
