import { describe, expect, it } from "vitest";
import { COM_002_FLAGS } from "./commerce-flags";
import {
  canAccessWorkspaceModules,
  markProvisioningRetry,
  nextProvisioningCheckpoint,
  operatorStepStatuses,
  provisionIdempotencyKey,
  resumeFromRetryable,
  transitionProvisioning,
  type ProvisioningJob
} from "./provisioning";

function job(partial: Partial<ProvisioningJob> = {}): ProvisioningJob {
  const now = new Date().toISOString();
  return {
    id: "job_1",
    checkoutSessionId: "cs_test",
    idempotencyKey: provisionIdempotencyKey("cs_test"),
    checkpoint: "received",
    stripeCustomerId: "cus_1",
    stripeSubscriptionId: "sub_1",
    catalogOfferId: "mpa_property_manager__professional__monthly",
    productSku: "mpa_property_manager",
    planTier: "professional",
    billingCycle: "monthly",
    ownerEmail: "buyer@example.com",
    ownerUserId: null,
    organizationId: null,
    organizationName: null,
    bindTokenHash: null,
    bindExpiresAt: null,
    attemptCount: 0,
    lastError: null,
    audit: [],
    emailsSent: [],
    createdAt: now,
    updatedAt: now,
    ...partial
  };
}

describe("COM-002 Slice D provisioning machine", () => {
  it("enables Slice D and keeps lifecycle slices off", () => {
    expect(COM_002_FLAGS.sliceD_automaticProvisioning).toBe(true);
    expect(COM_002_FLAGS.sliceE_subscriptionLifecycle).toBe(false);
    expect(COM_002_FLAGS.sliceF_customerPortal).toBe(false);
  });

  it("advances checkpoints in order", () => {
    expect(nextProvisioningCheckpoint("received")).toBe("customer_linked");
    expect(nextProvisioningCheckpoint("owner_pending")).toBe("owner_bound");
    expect(nextProvisioningCheckpoint("ready")).toBeNull();
  });

  it("blocks module access until owner_bound", () => {
    expect(canAccessWorkspaceModules("entitled")).toBe(false);
    expect(canAccessWorkspaceModules("owner_pending")).toBe(false);
    expect(canAccessWorkspaceModules("owner_bound")).toBe(true);
    expect(canAccessWorkspaceModules("ready")).toBe(true);
  });

  it("records audit on transition and supports retry/resume", () => {
    let current = transitionProvisioning(job(), "customer_linked");
    expect(current.audit).toHaveLength(1);
    current = markProvisioningRetry(current, "org_insert_failed");
    expect(current.checkpoint).toBe("failed_retryable");
    current = resumeFromRetryable(current);
    expect(current.checkpoint).toBe("customer_linked");
  });

  it("exposes operator 9-step progress", () => {
    const steps = operatorStepStatuses(job({ checkpoint: "entitled" }));
    expect(steps).toHaveLength(9);
    expect(steps.some((s) => s.current && s.key === "activate_product")).toBe(true);
  });
});
