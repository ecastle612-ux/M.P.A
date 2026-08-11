import { describe, expect, it } from "vitest";
import {
  authorizedProvisionStatusPayload,
  maskEmail,
  minimalCheckoutSessionPayload,
  minimalProvisionStatusPayload
} from "./session-privacy";
import type { ProvisioningJob } from "@mpa/shared";

describe("STAB-009 session privacy helpers", () => {
  it("masks emails", () => {
    expect(maskEmail("buyer@example.com")).toBe("b***@example.com");
    expect(maskEmail(null)).toBeNull();
  });

  it("minimal provision payload omits identity fields", () => {
    const payload = minimalProvisionStatusPayload({
      checkpoint: "owner_pending",
      steps: [{ id: 6, done: false, current: true }],
      hasTemporaryIssue: true
    });
    expect(payload).toMatchObject({
      checkpoint: "owner_pending",
      awaitingClaim: true,
      hasTemporaryIssue: true
    });
    expect(payload).not.toHaveProperty("ownerEmail");
    expect(payload).not.toHaveProperty("organizationId");
  });

  it("authorized payload still omits org/user ids", () => {
    const now = new Date().toISOString();
    const job = {
      id: "job",
      checkoutSessionId: "cs_1",
      idempotencyKey: "idem",
      checkpoint: "owner_pending",
      stripeCustomerId: "cus_x",
      stripeSubscriptionId: "sub_x",
      catalogOfferId: "offer",
      productSku: "mpa_property_manager",
      planTier: "professional",
      billingCycle: "monthly",
      ownerEmail: "buyer@example.com",
      ownerUserId: "user_x",
      organizationId: "org_x",
      organizationName: "Org",
      bindTokenHash: "hash",
      bindExpiresAt: now,
      attemptCount: 1,
      lastError: "secret",
      audit: [],
      emailsSent: [],
      createdAt: now,
      updatedAt: now
    } as ProvisioningJob;
    const payload = authorizedProvisionStatusPayload({
      job,
      productSku: "mpa_property_manager"
    });
    expect(payload.maskedOwnerEmail).toBe("b***@example.com");
    expect(payload).not.toHaveProperty("organizationId");
    expect(payload).not.toHaveProperty("ownerEmail");
    expect(payload).not.toHaveProperty("lastError");
    expect(JSON.stringify(payload)).not.toContain("secret");
  });

  it("checkout payload is minimized", () => {
    const payload = minimalCheckoutSessionPayload({
      status: "checkout_completed",
      productSku: "mpa_facility_operations",
      billingCycle: "annual",
      workspacePreparing: true,
      continuePath: "/commerce/continue?session_id=cs_1"
    });
    expect(payload).toEqual({
      status: "checkout_completed",
      productSku: "mpa_facility_operations",
      billingCycle: "annual",
      workspacePreparing: true,
      continuePath: "/commerce/continue?session_id=cs_1"
    });
    expect(payload).not.toHaveProperty("organizationId");
    expect(payload).not.toHaveProperty("userId");
  });
});
