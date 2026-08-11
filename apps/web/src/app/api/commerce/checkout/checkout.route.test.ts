import { beforeEach, describe, expect, it } from "vitest";
import { clearAcquisitionSessionStoreForTests } from "../../../../lib/commerce/acquisition-session-store";
import { POST as quotePost } from "../quote/route";
import { POST as checkoutPost } from "./route";

describe("POST /api/commerce/checkout (quote path)", () => {
  beforeEach(() => {
    clearAcquisitionSessionStoreForTests();
  });

  async function createQuote(units: number) {
    const res = await quotePost(
      new Request("http://localhost/api/commerce/quote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          managedUnits: units,
          operationalNeed: "property_resident_leasing",
          billingInterval: "monthly"
        })
      })
    );
    const payload = (await res.json()) as { quote: { quote_id: string } };
    return payload.quote.quote_id;
  }

  it("rejects client Price ID / amount / trial injection", async () => {
    const quoteId = await createQuote(500);
    const res = await checkoutPost(
      new Request("http://localhost/api/commerce/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          quoteId,
          stripePriceId: "price_injected",
          monthly_amount: 1,
          trial_eligible: true
        })
      })
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("client_authoritative_fields_forbidden");
  });

  it("rejects missing quote", async () => {
    const res = await checkoutPost(
      new Request("http://localhost/api/commerce/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ quoteId: "cq_missing" })
      })
    );
    expect(res.status).toBe(410);
  });

  it("returns price unconfigured when unit-volume env Prices are absent", async () => {
    const quoteId = await createQuote(501);
    const res = await checkoutPost(
      new Request("http://localhost/api/commerce/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ quoteId })
      })
    );
    // Without STRIPE_SECRET_KEY / unit-volume Price envs in test env → 503
    expect([503, 502, 400]).toContain(res.status);
    const body = (await res.json()) as { error: string };
    expect(
      ["saas_checkout_not_configured", "unit_volume_prices_unconfigured", "price_unconfigured", "stripe_not_configured"].includes(
        body.error
      )
    ).toBe(true);
  });

  it("rejects Checkout without quoteId", async () => {
    const res = await checkoutPost(
      new Request("http://localhost/api/commerce/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({})
      })
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("quote_id_required");
  });

  it("rejects legacy productSku/planTier Checkout payloads", async () => {
    const res = await checkoutPost(
      new Request("http://localhost/api/commerce/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          productSku: "mpa_property_manager",
          planTier: "professional",
          billingCycle: "monthly"
        })
      })
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("legacy_checkout_unsupported");
  });
});
