import { beforeEach, describe, expect, it } from "vitest";
import {
  claimProvisioningOwner,
  startOrAdvanceProvisioningFromCheckoutSession,
  startOrAdvanceProvisioningFromPurchase
} from "./run-provisioning";
import { getProvisioningJob, listProvisioningJobs } from "./jobs-store";
import { getSaasCustomerByCheckoutSession } from "./customers-store";
import {
  getSaasPurchaseBySessionId,
  rememberSaasPurchase,
  updateSaasPurchase
} from "../saas-stripe/purchase-store";
import { markProvisioningRetry } from "@mpa/shared";
import { saveProvisioningJob } from "./jobs-store";
import { issueBindToken, bindTokenValid } from "./tokens";

const globalStore = globalThis as typeof globalThis & {
  __mpaProvisioningJobs?: Map<string, unknown>;
  __mpaSaasCustomers?: Map<string, unknown>;
};

function seedPurchase(sessionId: string, email = "buyer@example.com") {
  const now = new Date().toISOString();
  return rememberSaasPurchase({
    id: crypto.randomUUID(),
    stripeCheckoutSessionId: sessionId,
    stripeCustomerId: `cus_${sessionId.slice(-6)}`,
    stripeSubscriptionId: `sub_${sessionId.slice(-6)}`,
    catalogOfferId: "mpa_property_manager__professional__monthly",
    productSku: "mpa_property_manager",
    planTier: "professional",
    billingCycle: "monthly",
    status: "checkout_completed",
    customerEmail: email,
    idempotencyKey: null,
    demoSessionId: null,
    metadata: {
      mpa_money_domain: "saas_billing",
      mpa_catalog_offer_id: "mpa_property_manager__professional__monthly"
    },
    provisioned: false,
    organizationId: null,
    userId: null,
    createdAt: now,
    updatedAt: now
  });
}

describe("COM-002 Slice D provisioning runner", () => {
  beforeEach(() => {
    globalStore.__mpaProvisioningJobs = new Map();
    globalStore.__mpaSaasCustomers = new Map();
  });

  it("advances a paid purchase to owner_pending without employee involvement", async () => {
    const sessionId = `cs_prov_${Date.now()}`;
    seedPurchase(sessionId);
    const job = await startOrAdvanceProvisioningFromPurchase(getSaasPurchaseBySessionId(sessionId)!);
    expect(job?.checkpoint).toBe("owner_pending");
    expect(job?.organizationId).toBeTruthy();
    expect(job?.ownerUserId).toBeTruthy();
    expect(job?.emailsSent).toContain("verification");
    expect(getSaasCustomerByCheckoutSession(sessionId)?.email).toBe("buyer@example.com");
    expect(getSaasPurchaseBySessionId(sessionId)?.provisioned).toBe(false);
  });

  it("is idempotent on webhook replay (no duplicate jobs / orgs)", async () => {
    const sessionId = `cs_dup_${Date.now()}`;
    const first = await startOrAdvanceProvisioningFromCheckoutSession({
      id: sessionId,
      customer: "cus_dup",
      subscription: "sub_dup",
      customer_email: "dup@example.com",
      metadata: {
        mpa_catalog_offer_id: "mpa_property_manager__professional__monthly",
        mpa_plan_tier: "professional",
        mpa_billing_cycle: "monthly"
      }
    });
    const second = await startOrAdvanceProvisioningFromCheckoutSession({
      id: sessionId,
      customer: "cus_dup",
      subscription: "sub_dup",
      customer_email: "dup@example.com",
      metadata: {
        mpa_catalog_offer_id: "mpa_property_manager__professional__monthly",
        mpa_plan_tier: "professional",
        mpa_billing_cycle: "monthly"
      }
    });
    expect(first?.id).toBe(second?.id);
    expect(first?.organizationId).toBe(second?.organizationId);
    expect(listProvisioningJobs().filter((j) => j.checkoutSessionId === sessionId)).toHaveLength(1);
  });

  it("retries safely from failed_retryable without duplicating the organization", async () => {
    const sessionId = `cs_retry_${Date.now()}`;
    seedPurchase(sessionId);
    const job = await startOrAdvanceProvisioningFromPurchase(getSaasPurchaseBySessionId(sessionId)!);
    expect(job?.checkpoint).toBe("owner_pending");
    const failed = saveProvisioningJob(markProvisioningRetry(job!, "simulated_transient_failure"));
    expect(failed.checkpoint).toBe("failed_retryable");
    const resumed = await startOrAdvanceProvisioningFromPurchase(getSaasPurchaseBySessionId(sessionId)!);
    expect(resumed?.checkpoint).toBe("owner_pending");
    expect(resumed?.organizationId).toBe(job?.organizationId);
  });

  it("claims owner and reaches ready with welcome + continue emails", async () => {
    const sessionId = `cs_claim_${Date.now()}`;
    seedPurchase(sessionId, "claim@example.com");
    const pending = await startOrAdvanceProvisioningFromPurchase(getSaasPurchaseBySessionId(sessionId)!);
    expect(pending?.checkpoint).toBe("owner_pending");
    const claim = await claimProvisioningOwner({
      checkoutSessionId: sessionId,
      userId: "user_claim_1",
      userEmail: "claim@example.com"
    });
    expect(claim.ok).toBe(true);
    if (claim.ok) {
      expect(claim.job.checkpoint).toBe("ready");
      expect(claim.job.emailsSent).toContain("welcome");
      expect(claim.job.emailsSent).toContain("continue_setup");
    }
    expect(getSaasPurchaseBySessionId(sessionId)?.provisioned).toBe(true);
  });

  it("rejects email mismatch and invalid bind tokens", async () => {
    const sessionId = `cs_bind_${Date.now()}`;
    seedPurchase(sessionId, "owner@example.com");
    const job = await startOrAdvanceProvisioningFromPurchase(getSaasPurchaseBySessionId(sessionId)!);
    expect(job?.checkpoint).toBe("owner_pending");
    const mismatch = await claimProvisioningOwner({
      checkoutSessionId: sessionId,
      userId: "user_x",
      userEmail: "other@example.com"
    });
    expect(mismatch.ok).toBe(false);
    if (!mismatch.ok) expect(mismatch.error).toBe("email_mismatch");

    const issued = issueBindToken();
    const withToken = saveProvisioningJob({
      ...getProvisioningJob(sessionId)!,
      bindTokenHash: issued.hash,
      bindExpiresAt: issued.expiresAt
    });
    expect(bindTokenValid(withToken, issued.token)).toBe(true);
    const bad = await claimProvisioningOwner({
      checkoutSessionId: sessionId,
      userId: "user_x",
      userEmail: "owner@example.com",
      bindToken: "not-the-token"
    });
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.error).toBe("invalid_or_expired_bind_token");
  });

  it("marks missing email as failed_dead", async () => {
    const sessionId = `cs_dead_${Date.now()}`;
    seedPurchase(sessionId);
    updateSaasPurchase(sessionId, { customerEmail: null });
    const job = await startOrAdvanceProvisioningFromPurchase(getSaasPurchaseBySessionId(sessionId)!);
    expect(job?.checkpoint).toBe("failed_dead");
  });
});
