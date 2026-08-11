import { describe, expect, it } from "vitest";
import type { ProvisioningJob } from "@mpa/shared";
import type { StoredSaasPurchase, StoredSaasWebhookEvent } from "../saas-stripe/purchase-store";
import {
  buildCheckoutLifecycle,
  detectDuplicateWebhookProcessing,
  filterCheckoutRows,
  filterWebhookRows,
  mapCheckoutRow,
  mapSignWellWebhookRow,
  mapStripeWebhookRow,
  paginateRows,
  parseCheckoutFilters,
  parseWebhookFilters,
  reconcileCheckoutAnomalies,
  scrubMa5Payload
} from "./ma5-checkout-webhooks";

function purchase(over: Partial<StoredSaasPurchase> = {}): StoredSaasPurchase {
  return {
    id: "cs_1",
    stripeCheckoutSessionId: "cs_1",
    stripeCustomerId: "cus_1",
    stripeSubscriptionId: "sub_1",
    catalogOfferId: "mpa_property_manager__unit_volume__monthly",
    productSku: "mpa_property_manager",
    planTier: "professional",
    billingCycle: "monthly",
    status: "checkout_completed",
    customerEmail: "buyer@example.com",
    idempotencyKey: "idem_1",
    demoSessionId: null,
    metadata: {
      mpa_quote_id: "q_1",
      mpa_managed_units: "500",
      mpa_additional_blocks: "0",
      mpa_authorized_unit_capacity: "500",
      mpa_trial_eligible: "true",
      mpa_trial_days: "30"
    },
    provisioned: true,
    organizationId: "org_a",
    userId: "user_1",
    createdAt: "2026-08-11T00:00:00.000Z",
    updatedAt: "2026-08-11T01:00:00.000Z",
    ...over
  };
}

function job(over: Partial<ProvisioningJob> = {}): ProvisioningJob {
  return {
    id: "job_1",
    checkoutSessionId: "cs_1",
    idempotencyKey: "provision:org:cs_1",
    checkpoint: "ready",
    stripeCustomerId: "cus_1",
    stripeSubscriptionId: "sub_1",
    catalogOfferId: "mpa_property_manager__unit_volume__monthly",
    productSku: "mpa_property_manager",
    planTier: "professional",
    billingCycle: "monthly",
    ownerEmail: "buyer@example.com",
    ownerUserId: "user_1",
    organizationId: "org_a",
    organizationName: "Alpha",
    bindTokenHash: null,
    bindExpiresAt: null,
    attemptCount: 1,
    lastError: null,
    audit: [],
    emailsSent: [],
    createdAt: "2026-08-11T00:30:00.000Z",
    updatedAt: "2026-08-11T01:00:00.000Z",
    ...over
  };
}

describe("MA-5 checkout filters / pagination", () => {
  it("parses checkout filters and page bounds", () => {
    const parsed = parseCheckoutFilters(
      new URLSearchParams(
        "q=cs_1&sku=mpa_property_manager&billingCycle=monthly&checkoutStatus=checkout_completed&page=2&pageSize=500&range=24h"
      )
    );
    expect(parsed.q).toBe("cs_1");
    expect(parsed.sku).toBe("mpa_property_manager");
    expect(parsed.billingCycle).toBe("monthly");
    expect(parsed.page).toBe(2);
    expect(parsed.pageSize).toBe(100);
    expect(parsed.since).toBeTruthy();
  });

  it("filters and paginates checkout rows", () => {
    const rows = [
      mapCheckoutRow({
        purchase: purchase(),
        job: job(),
        organizationName: "Alpha",
        subscriptionExists: true,
        source: "database"
      }),
      mapCheckoutRow({
        purchase: purchase({
          stripeCheckoutSessionId: "cs_2",
          status: "payment_failed",
          productSku: "mpa_facility_operations",
          organizationId: null,
          provisioned: false,
          customerEmail: "other@example.com",
          metadata: {}
        }),
        job: null,
        organizationName: null,
        subscriptionExists: null,
        source: "database"
      })
    ];
    expect(filterCheckoutRows(rows, { page: 1, pageSize: 50, sku: "mpa_facility_operations" })).toHaveLength(
      1
    );
    expect(filterCheckoutRows(rows, { page: 1, pageSize: 50, q: "buyer@" })).toHaveLength(1);
    expect(paginateRows(rows, 2, 1)).toHaveLength(1);
  });
});

describe("MA-5 commercial anomalies", () => {
  it("detects missing organization after successful payment", () => {
    const anomalies = reconcileCheckoutAnomalies({
      purchase: purchase({ organizationId: null, provisioned: false }),
      job: null,
      subscriptionExists: null,
      entitlementOk: null
    });
    expect(anomalies.some((a) => a.code === "missing_organization_after_payment")).toBe(true);
    expect(anomalies.some((a) => a.code === "provisioning_incomplete_after_checkout")).toBe(true);
  });

  it("detects provisioning failure and missing subscription after ready", () => {
    expect(
      reconcileCheckoutAnomalies({
        purchase: purchase(),
        job: job({ checkpoint: "failed_dead", lastError: "boom", stripeSubscriptionId: null }),
        subscriptionExists: false,
        entitlementOk: null
      }).some((a) => a.code === "provisioning_failed")
    ).toBe(true);

    expect(
      reconcileCheckoutAnomalies({
        purchase: purchase({ stripeSubscriptionId: null }),
        job: job({ checkpoint: "ready", stripeSubscriptionId: null }),
        subscriptionExists: null,
        entitlementOk: true
      }).some((a) => a.code === "missing_subscription_after_provisioning")
    ).toBe(true);
  });

  it("detects trial mismatch, capacity mismatch, quote/price mismatches", () => {
    const trial = reconcileCheckoutAnomalies({
      purchase: purchase({
        metadata: {
          mpa_trial_eligible: "true",
          mpa_managed_units: "501",
          mpa_additional_blocks: "1",
          mpa_authorized_unit_capacity: "1000"
        }
      }),
      job: job(),
      subscriptionExists: true,
      entitlementOk: true
    });
    expect(trial.some((a) => a.code === "trial_state_mismatch")).toBe(true);

    const cap = reconcileCheckoutAnomalies({
      purchase: purchase({
        metadata: {
          mpa_managed_units: "800",
          mpa_additional_blocks: "1",
          mpa_authorized_unit_capacity: "500"
        }
      }),
      job: job(),
      subscriptionExists: true,
      entitlementOk: true
    });
    expect(cap.some((a) => a.code === "capacity_mismatch")).toBe(true);

    const amount = reconcileCheckoutAnomalies({
      purchase: purchase({
        metadata: {
          mpa_quoted_amount_usd: "59",
          amount_total: "99"
        }
      }),
      job: job(),
      subscriptionExists: true,
      entitlementOk: true
    });
    expect(amount.some((a) => a.code === "quote_amount_mismatch")).toBe(true);

    const price = reconcileCheckoutAnomalies({
      purchase: purchase({
        metadata: {
          mpa_price_id: "price_a",
          mpa_expected_price_id: "price_b"
        }
      }),
      job: job(),
      subscriptionExists: true,
      entitlementOk: true
    });
    expect(price.some((a) => a.code === "price_id_mismatch")).toBe(true);
  });

  it("does not invent quote amount mismatch when amounts are unavailable", () => {
    const anomalies = reconcileCheckoutAnomalies({
      purchase: purchase(),
      job: job(),
      subscriptionExists: true,
      entitlementOk: true
    });
    expect(anomalies.some((a) => a.code === "quote_amount_mismatch")).toBe(false);
  });

  it("flags missing entitlement when product SKU invalid at entitled stage", () => {
    const anomalies = reconcileCheckoutAnomalies({
      purchase: purchase({ productSku: "mpa_property_manager" }),
      job: job({ checkpoint: "entitled" }),
      subscriptionExists: true,
      entitlementOk: false
    });
    expect(anomalies.some((a) => a.code === "missing_entitlement")).toBe(true);
  });
});

describe("MA-5 lifecycle + provisioning states", () => {
  it("builds lifecycle with unknown questionnaire/confirm and linked stages", () => {
    const row = mapCheckoutRow({
      purchase: purchase(),
      job: job(),
      organizationName: "Alpha",
      subscriptionExists: true,
      source: "database"
    });
    const stages = buildCheckoutLifecycle(row, job());
    expect(stages.find((s) => s.id === "questionnaire")?.status).toBe("unknown");
    expect(stages.find((s) => s.id === "confirm_plan")?.status).toBe("unknown");
    expect(stages.find((s) => s.id === "checkout")?.status).toBe("healthy");
    expect(stages.find((s) => s.id === "organization")?.identifier).toBe("org_a");
    expect(stages.find((s) => s.id === "subscription")?.status).toBe("healthy");
  });

  it("marks failed payment and incomplete provisioning", () => {
    const row = mapCheckoutRow({
      purchase: purchase({
        status: "payment_failed",
        provisioned: false,
        organizationId: null,
        stripeSubscriptionId: null
      }),
      job: null,
      organizationName: null,
      subscriptionExists: null,
      source: "memory"
    });
    expect(row.checkoutHealth).toBe("failed");
    expect(row.paymentState).toBe("failed");
  });
});

describe("MA-5 webhooks", () => {
  it("maps stripe success/unresolved and signwell unknown org", () => {
    const stripeOk = mapStripeWebhookRow({
      stripeEventId: "evt_1",
      eventType: "checkout.session.completed",
      payload: { password: "nope" },
      processedAt: "2026-08-11T00:00:00.000Z",
      checkoutSessionId: "cs_1",
      createdAt: "2026-08-11T00:00:00.000Z"
    } satisfies StoredSaasWebhookEvent);
    expect(stripeOk.processingStatus).toBe("processed");
    expect(stripeOk.safeMetadata["password"]).toBe("[redacted]");

    const unresolved = mapStripeWebhookRow({
      stripeEventId: "evt_2",
      eventType: "invoice.payment_failed",
      payload: {},
      processedAt: null,
      checkoutSessionId: null,
      createdAt: "2026-08-11T00:00:00.000Z"
    });
    expect(unresolved.processingStatus).toBe("unresolved");
    expect(unresolved.health).toBe("failed");

    const sw = mapSignWellWebhookRow({
      id: "sw1",
      event_id: "e1",
      event_type: "document.completed",
      processed_at: "2026-08-11T00:00:00.000Z",
      organization_id: null,
      document_id: "doc_1",
      payload: { webhook_secret: "whsec" }
    });
    expect(sw.provider).toBe("signwell");
    expect(sw.health).toBe("attention");
    expect(sw.safeMetadata["webhook_secret"]).toBe("[redacted]");
  });

  it("filters webhooks and detects duplicates", () => {
    const rows = [
      mapStripeWebhookRow({
        stripeEventId: "evt_1",
        eventType: "checkout.session.completed",
        payload: {},
        processedAt: "2026-08-11T00:00:00.000Z",
        checkoutSessionId: "cs_1",
        createdAt: "2026-08-11T00:00:00.000Z"
      }),
      mapStripeWebhookRow({
        stripeEventId: "evt_1",
        eventType: "checkout.session.completed",
        payload: {},
        processedAt: "2026-08-11T00:00:00.000Z",
        checkoutSessionId: "cs_1",
        createdAt: "2026-08-11T00:00:00.000Z"
      }),
      mapSignWellWebhookRow({
        id: "sw1",
        event_type: "document.completed",
        processed_at: "2026-08-11T00:00:00.000Z",
        organization_id: "org_a",
        document_id: "doc_1"
      })
    ];
    expect(filterWebhookRows(rows, { page: 1, pageSize: 50, provider: "signwell" })).toHaveLength(1);
    expect(detectDuplicateWebhookProcessing(rows).some((a) => a.code === "duplicate_webhook_processing")).toBe(
      true
    );
  });

  it("parses webhook filters", () => {
    const parsed = parseWebhookFilters(
      new URLSearchParams("provider=stripe&status=unresolved&q=evt&range=1h")
    );
    expect(parsed.provider).toBe("stripe");
    expect(parsed.status).toBe("unresolved");
    expect(parsed.q).toBe("evt");
    expect(parsed.since).toBeTruthy();
  });

  it("scrubs secrets from payloads", () => {
    const scrubbed = scrubMa5Payload({
      stripe_secret: "sk",
      webhook_secret: "whsec",
      ok: "yes"
    });
    expect(scrubbed["stripe_secret"]).toBe("[redacted]");
    expect(scrubbed["webhook_secret"]).toBe("[redacted]");
    expect(scrubbed["ok"]).toBe("yes");
  });
});
