import { beforeEach, describe, expect, it } from "vitest";
import { clearAcquisitionSessionStoreForTests } from "../../../../lib/commerce/acquisition-session-store";
import { GET, POST } from "./route";

describe("POST /api/commerce/quote", () => {
  beforeEach(() => {
    clearAcquisitionSessionStoreForTests();
  });

  it("creates a server quote for PM boundaries and rejects tampering", async () => {
    const ok = await POST(
      new Request("http://localhost/api/commerce/quote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          managedUnits: 501,
          operationalNeed: "property_resident_leasing",
          billingInterval: "monthly"
        })
      })
    );
    expect(ok.status).toBe(200);
    const payload = (await ok.json()) as {
      quote: {
        monthly_amount: number;
        annual_amount: number;
        trial_eligible: boolean;
        additional_blocks: number;
        stripe_objects_created: boolean;
      };
      snapshot: { snapshot_id: string };
    };
    expect(payload.quote.monthly_amount).toBe(98);
    expect(payload.quote.annual_amount).toBe(1176);
    expect(payload.quote.trial_eligible).toBe(false);
    expect(payload.quote.additional_blocks).toBe(1);
    expect(payload.quote.stripe_objects_created).toBe(false);
    expect(payload.snapshot.snapshot_id).toMatch(/^as_/);

    const tamper = await POST(
      new Request("http://localhost/api/commerce/quote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          managedUnits: 100,
          operationalNeed: "property_resident_leasing",
          billingInterval: "monthly",
          stripePriceId: "price_injected",
          monthly_amount: 1
        })
      })
    );
    expect(tamper.status).toBe(400);
  });

  it("returns expired quotes as 410 and supports regeneration", async () => {
    const created = await POST(
      new Request("http://localhost/api/commerce/quote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          managedUnits: 500,
          operationalNeed: "property_resident_leasing",
          billingInterval: "annual"
        })
      })
    );
    const createdPayload = (await created.json()) as {
      quote: { quote_id: string; expires_at: string };
    };

    // Force expiry in store
    const { getAcquisitionByQuoteId, rememberAcquisitionRecord } = await import(
      "../../../../lib/commerce/acquisition-session-store"
    );
    const record = getAcquisitionByQuoteId(createdPayload.quote.quote_id);
    expect(record).not.toBeNull();
    if (!record) return;
    record.quote.expires_at = new Date(Date.now() - 1000).toISOString();
    rememberAcquisitionRecord(record);

    const expired = await GET(
      new Request(
        `http://localhost/api/commerce/quote?id=${encodeURIComponent(createdPayload.quote.quote_id)}`
      )
    );
    expect(expired.status).toBe(410);

    const regen = await POST(
      new Request("http://localhost/api/commerce/quote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          managedUnits: 500,
          operationalNeed: "property_resident_leasing",
          billingInterval: "annual",
          regenerate: true,
          regenerateFromQuoteId: createdPayload.quote.quote_id
        })
      })
    );
    expect(regen.status).toBe(200);
    const regenPayload = (await regen.json()) as { quote: { quote_id: string; selected_amount: number } };
    expect(regenPayload.quote.quote_id).not.toBe(createdPayload.quote.quote_id);
    expect(regenPayload.quote.selected_amount).toBe(708);
  });

  it("gates Complete recommendation while still calculating price", async () => {
    const res = await POST(
      new Request("http://localhost/api/commerce/quote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          managedUnits: 1000,
          operationalNeed: "both",
          billingInterval: "monthly"
        })
      })
    );
    const payload = (await res.json()) as {
      quote: {
        module: string;
        monthly_amount: number;
        recommendation: { gated: boolean };
      };
    };
    expect(payload.quote.module).toBe("mpa_complete_platform");
    expect(payload.quote.monthly_amount).toBe(148);
    expect(payload.quote.recommendation.gated).toBe(false);
  });
});
