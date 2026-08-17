import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearAcquisitionSessionStoreForTests } from "../../../../lib/commerce/acquisition-session-store";
import { POST as quotePost } from "../quote/route";
import { POST as checkoutPost } from "./route";
import { unitVolumeCheckoutGateForQuote } from "../../../../lib/saas-stripe/client";

vi.mock("../../../../lib/saas-stripe/client", async (importOriginal) => {
  const actual = (await importOriginal()) as {
    unitVolumeCheckoutGateForQuote: typeof unitVolumeCheckoutGateForQuote;
  };
  return {
    ...actual,
    unitVolumeCheckoutGateForQuote: vi.fn(actual.unitVolumeCheckoutGateForQuote)
  };
});

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

  it("returns price unconfigured when the selected quote Price env is missing", async () => {
    vi.mocked(unitVolumeCheckoutGateForQuote).mockReturnValueOnce({
      ready: false,
      missingEnvKey: "STRIPE_PRICE_PM_BASE_MONTHLY"
    });
    const quoteId = await createQuote(501);
    const res = await checkoutPost(
      new Request("http://localhost/api/commerce/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ quoteId })
      })
    );
    expect(res.status).toBe(503);
    const body = (await res.json()) as { error: string; missingEnvKey?: string; message?: string };
    expect(body.error).toBe("saas_checkout_not_configured");
    expect(body.missingEnvKey).toBe("STRIPE_PRICE_PM_BASE_MONTHLY");
    expect(body.message).toContain("STRIPE_PRICE_PM_BASE_MONTHLY");
    expect(body.message).not.toMatch(/sk_live|sk_test|whsec_/);
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
