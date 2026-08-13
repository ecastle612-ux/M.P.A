import { beforeEach, describe, expect, it } from "vitest";
import {
  ACQUISITION_QUOTE_STATE_COOKIE,
  buildCommercialQuote,
  createAcquisitionSnapshot,
  isCommercialQuoteExpired,
  resolveCheckoutCancelRecovery,
  validateAcquisitionAnswers,
  type BillingCycle,
  type OperationalNeed,
  type ProductSku
} from "@mpa/shared";
import {
  decodeAcquisitionQuoteState,
  encodeAcquisitionQuoteState
} from "./acquisition-durable-state";
import {
  clearAcquisitionSessionStoreForTests,
  createSharedAcquisitionDurableBackendForTests,
  getAcquisitionByQuoteId,
  rememberAcquisitionRecord,
  setAcquisitionDurableBackendForTests,
  simulateAcquisitionColdStartForTests,
  type StoredAcquisitionRecord
} from "./acquisition-session-store";

async function createStoredQuote(input: {
  operationalNeed: OperationalNeed;
  managedUnits: number;
  billingInterval: BillingCycle;
  selectedModule?: ProductSku;
  ownerKey?: string | null;
}): Promise<StoredAcquisitionRecord> {
  const validated = validateAcquisitionAnswers({
    managedUnits: input.managedUnits,
    operationalNeed: input.operationalNeed,
    billingInterval: input.billingInterval,
    selectedModule: input.selectedModule
  });
  if (!validated.ok) throw new Error(validated.reason);
  const quote = buildCommercialQuote({ answers: validated.answers });
  const snapshot = createAcquisitionSnapshot(quote);
  return rememberAcquisitionRecord({
    quote,
    snapshot,
    answers: validated.answers,
    ownerKey: input.ownerKey ?? null
  });
}

describe("acquisition quote durability (cross-instance)", () => {
  beforeEach(() => {
    clearAcquisitionSessionStoreForTests();
  });

  it("Instance B recovers PM/FO/Complete monthly+annual from shared durable store", async () => {
    const shared = createSharedAcquisitionDurableBackendForTests();
    setAcquisitionDurableBackendForTests(shared);

    const cases: Array<{
      operationalNeed: OperationalNeed;
      billingInterval: BillingCycle;
      managedUnits: number;
      sku: ProductSku;
    }> = [
      {
        operationalNeed: "property_resident_leasing",
        billingInterval: "monthly",
        managedUnits: 500,
        sku: "mpa_property_manager"
      },
      {
        operationalNeed: "property_resident_leasing",
        billingInterval: "annual",
        managedUnits: 750,
        sku: "mpa_property_manager"
      },
      {
        operationalNeed: "facility_maintenance",
        billingInterval: "monthly",
        managedUnits: 500,
        sku: "mpa_facility_operations"
      },
      {
        operationalNeed: "facility_maintenance",
        billingInterval: "annual",
        managedUnits: 1000,
        sku: "mpa_facility_operations"
      },
      {
        operationalNeed: "both",
        billingInterval: "monthly",
        managedUnits: 500,
        sku: "mpa_complete_platform"
      },
      {
        operationalNeed: "both",
        billingInterval: "annual",
        managedUnits: 1200,
        sku: "mpa_complete_platform"
      }
    ];

    for (const c of cases) {
      clearAcquisitionSessionStoreForTests();
      setAcquisitionDurableBackendForTests(shared);

      const stored = await createStoredQuote(c);
      expect(stored.quote.module).toBe(c.sku);

      // Instance B: empty process cache, same durable backend.
      simulateAcquisitionColdStartForTests();
      setAcquisitionDurableBackendForTests(shared);

      const recovered = await getAcquisitionByQuoteId(stored.quote.quote_id);
      expect(recovered).not.toBeNull();
      expect(recovered!.quote.quote_id).toBe(stored.quote.quote_id);
      expect(recovered!.quote.module).toBe(c.sku);
      expect(recovered!.quote.billing_interval).toBe(c.billingInterval);
      expect(recovered!.answers.managedUnits).toBe(c.managedUnits);
      expect(recovered!.quote.monthly_amount).toBe(stored.quote.monthly_amount);
      expect(recovered!.quote.annual_amount).toBe(stored.quote.annual_amount);
      expect(recovered!.quote.expires_at).toBe(stored.quote.expires_at);
      expect(recovered!.snapshot.snapshot_id).toBe(stored.snapshot.snapshot_id);
      expect(isCommercialQuoteExpired(recovered!.quote)).toBe(false);
    }
  });

  it("Instance B recovers from signed cookie without shared process memory", async () => {
    const stored = await createStoredQuote({
      operationalNeed: "facility_maintenance",
      managedUnits: 501,
      billingInterval: "monthly"
    });
    const token = encodeAcquisitionQuoteState(stored);
    expect(token).toBeTruthy();

    // Instance B: cold cache, no shared durable backend contents.
    clearAcquisitionSessionStoreForTests();
    const recovered = await getAcquisitionByQuoteId(stored.quote.quote_id, {
      stateToken: token
    });
    expect(recovered).not.toBeNull();
    expect(recovered!.quote.module).toBe("mpa_facility_operations");
    expect(recovered!.answers.managedUnits).toBe(501);
    expect(recovered!.quote.monthly_amount).toBe(stored.quote.monthly_amount);
    expect(recovered!.snapshot.snapshot_id).toBe(stored.snapshot.snapshot_id);
  });

  it("missing and invalid quote ids fail safely", async () => {
    expect(await getAcquisitionByQuoteId("cq_missing")).toBeNull();
    expect(await getAcquisitionByQuoteId("cq_missing", { stateToken: "not.a.token" })).toBeNull();
    expect(await getAcquisitionByQuoteId("cq_missing", { stateToken: "" })).toBeNull();
  });

  it("expired quote remains recoverable for cancel UX but is marked expired", async () => {
    const shared = createSharedAcquisitionDurableBackendForTests();
    setAcquisitionDurableBackendForTests(shared);
    const stored = await createStoredQuote({
      operationalNeed: "property_resident_leasing",
      managedUnits: 500,
      billingInterval: "monthly"
    });
    stored.quote.expires_at = new Date(Date.now() - 60_000).toISOString();
    await rememberAcquisitionRecord(stored);

    simulateAcquisitionColdStartForTests();
    setAcquisitionDurableBackendForTests(shared);
    const recovered = await getAcquisitionByQuoteId(stored.quote.quote_id);
    expect(recovered).not.toBeNull();
    expect(isCommercialQuoteExpired(recovered!.quote)).toBe(true);

    const recovery = resolveCheckoutCancelRecovery({
      quote: {
        quoteId: recovered!.quote.quote_id,
        productSku: recovered!.quote.module,
        billingCycle: recovered!.quote.billing_interval,
        snapshotId: recovered!.snapshot.snapshot_id,
        managedUnits: recovered!.answers.managedUnits,
        expired: true
      }
    });
    expect(recovery.retryHref).toContain("/get-started");
    expect(recovery.retryHref).toContain("intent=mpa_property_manager");
  });

  it("tampered SKU/cycle/units/pricing in cookie are rejected", async () => {
    const stored = await createStoredQuote({
      operationalNeed: "both",
      managedUnits: 800,
      billingInterval: "annual"
    });
    const token = encodeAcquisitionQuoteState(stored);
    expect(token).toBeTruthy();
    const [payloadB64, sig] = token!.split(".");
    const parsed = JSON.parse(Buffer.from(payloadB64!, "base64url").toString("utf8")) as {
      quote: Record<string, unknown>;
      answers: Record<string, unknown>;
    };

    const tampers = [
      { quote: { ...parsed.quote, module: "mpa_property_manager" }, answers: parsed.answers },
      { quote: { ...parsed.quote, billing_interval: "monthly" }, answers: parsed.answers },
      {
        quote: { ...parsed.quote, managed_units: 1 },
        answers: { ...parsed.answers, managedUnits: 1 }
      },
      { quote: { ...parsed.quote, monthly_amount: 1, annual_amount: 1 }, answers: parsed.answers }
    ];

    for (const tamper of tampers) {
      const evilPayload = Buffer.from(
        JSON.stringify({ v: 1, ...tamper, snapshot_id: stored.snapshot.snapshot_id }),
        "utf8"
      ).toString("base64url");
      // Wrong body with original signature → reject
      const withOldSig = `${evilPayload}.${sig}`;
      expect(decodeAcquisitionQuoteState(withOldSig)).toBeNull();
      // Cold instance: only the tampered cookie is available
      clearAcquisitionSessionStoreForTests();
      expect(
        await getAcquisitionByQuoteId(stored.quote.quote_id, { stateToken: withOldSig })
      ).toBeNull();
    }

    // Forged signed token for a different quote id cannot satisfy URL id.
    const forged = await createStoredQuote({
      operationalNeed: "property_resident_leasing",
      managedUnits: 100,
      billingInterval: "monthly"
    });
    const forgedToken = encodeAcquisitionQuoteState(forged)!;
    const targetQuoteId = stored.quote.quote_id;
    clearAcquisitionSessionStoreForTests();
    expect(await getAcquisitionByQuoteId(targetQuoteId, { stateToken: forgedToken })).toBeNull();
  });

  it("cross-owner isolation rejects mismatched ownerKey", async () => {
    const shared = createSharedAcquisitionDurableBackendForTests();
    setAcquisitionDurableBackendForTests(shared);
    const stored = await createStoredQuote({
      operationalNeed: "facility_maintenance",
      managedUnits: 500,
      billingInterval: "monthly",
      ownerKey: "org_a"
    });

    simulateAcquisitionColdStartForTests();
    setAcquisitionDurableBackendForTests(shared);
    expect(
      await getAcquisitionByQuoteId(stored.quote.quote_id, { ownerKey: "org_b" })
    ).toBeNull();
    expect(
      await getAcquisitionByQuoteId(stored.quote.quote_id, { ownerKey: "org_a" })
    ).not.toBeNull();
  });

  it("duplicate recovery returns the same authoritative snapshot", async () => {
    const shared = createSharedAcquisitionDurableBackendForTests();
    setAcquisitionDurableBackendForTests(shared);
    const stored = await createStoredQuote({
      operationalNeed: "property_resident_leasing",
      managedUnits: 500,
      billingInterval: "monthly"
    });

    simulateAcquisitionColdStartForTests();
    setAcquisitionDurableBackendForTests(shared);
    const first = await getAcquisitionByQuoteId(stored.quote.quote_id);
    const second = await getAcquisitionByQuoteId(stored.quote.quote_id);
    expect(first?.quote.quote_id).toBe(stored.quote.quote_id);
    expect(second?.quote.quote_id).toBe(stored.quote.quote_id);
    expect(first?.quote.monthly_amount).toBe(second?.quote.monthly_amount);
    expect(first?.snapshot.snapshot_id).toBe(second?.snapshot.snapshot_id);
  });

  it("legacy offer recovery remains separate from quote durability", () => {
    const recovery = resolveCheckoutCancelRecovery({
      offerId: "mpa_property_manager__professional__monthly"
    });
    expect(recovery.retryHref).toContain("intent=mpa_property_manager");
    expect(recovery.retryHref).toContain("cycle=monthly");
    expect(recovery.retryHref).not.toContain("quote=");
    expect(recovery.mode).toBe("offer");
  });

  it("POST quote sets durable state cookie name", async () => {
    const { POST } = await import("../../app/api/commerce/quote/route");
    const res = await POST(
      new Request("http://localhost/api/commerce/quote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          managedUnits: 500,
          operationalNeed: "property_resident_leasing",
          billingInterval: "monthly"
        })
      })
    );
    expect(res.status).toBe(200);
    const setCookie = res.headers.getSetCookie?.() ?? [];
    const blob = setCookie.join("\n");
    expect(blob).toContain(`${ACQUISITION_QUOTE_STATE_COOKIE}=`);
    expect(blob.toLowerCase()).toContain("httponly");
  });

  it("GET quote recovers from cookie after cold start", async () => {
    const { GET, POST } = await import("../../app/api/commerce/quote/route");
    const created = await POST(
      new Request("http://localhost/api/commerce/quote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          managedUnits: 500,
          operationalNeed: "facility_maintenance",
          billingInterval: "annual"
        })
      })
    );
    const payload = (await created.json()) as {
      quote: { quote_id: string; module: string; billing_interval: string; annual_amount: number };
    };
    const setCookie = created.headers.getSetCookie?.() ?? [];
    const stateLine = setCookie.find((line) => line.startsWith(`${ACQUISITION_QUOTE_STATE_COOKIE}=`));
    expect(stateLine).toBeTruthy();
    const token = stateLine!.slice(ACQUISITION_QUOTE_STATE_COOKIE.length + 1).split(";")[0];

    clearAcquisitionSessionStoreForTests();

    const loaded = await GET(
      new Request(
        `http://localhost/api/commerce/quote?id=${encodeURIComponent(payload.quote.quote_id)}`,
        { headers: { cookie: `${ACQUISITION_QUOTE_STATE_COOKIE}=${token}` } }
      )
    );
    expect(loaded.status).toBe(200);
    const body = (await loaded.json()) as {
      quote: { module: string; billing_interval: string; annual_amount: number };
    };
    expect(body.quote.module).toBe("mpa_facility_operations");
    expect(body.quote.billing_interval).toBe("annual");
    expect(body.quote.annual_amount).toBe(payload.quote.annual_amount);
  });
});
