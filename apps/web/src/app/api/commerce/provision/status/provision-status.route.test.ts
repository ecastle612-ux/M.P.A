import { beforeEach, describe, expect, it, vi } from "vitest";
import { COM_002_FLAGS } from "@mpa/shared";
import { clearCommerceSessionLookupRateLimitForTests } from "../../../../../lib/saas-commerce/session-lookup-rate-limit";
import { maskEmail } from "../../../../../lib/saas-commerce/session-privacy";
import {
  getProvisioningJob,
  saveProvisioningJob
} from "../../../../../lib/saas-provisioning/jobs-store";
import { issueBindToken } from "../../../../../lib/saas-provisioning/tokens";
import { rememberSaasPurchase } from "../../../../../lib/saas-stripe/purchase-store";

vi.mock("../../../../../lib/saas-stripe/ensure-purchase-from-stripe", () => ({
  ensurePurchaseFromStripeSession: async (sessionId: string) => {
    const { getSaasPurchaseBySessionId } = await import(
      "../../../../../lib/saas-stripe/purchase-store"
    );
    return getSaasPurchaseBySessionId(sessionId);
  }
}));

vi.mock("../../../../../lib/saas-provisioning/run-provisioning", () => ({
  startOrAdvanceProvisioningFromPurchase: async () => null
}));

const authState = { email: null as string | null };

vi.mock("../../../../../lib/auth/server", () => ({
  createAuthServerClient: async () => ({
    auth: {
      getUser: async () => ({
        data: { user: authState.email ? { id: "user_x", email: authState.email } : null }
      })
    }
  })
}));

import { GET as provisionStatusGet } from "./route";

const globalStore = globalThis as typeof globalThis & {
  __mpaProvisioningJobs?: Map<string, unknown>;
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
    metadata: {},
    provisioned: false,
    organizationId: "org_secret",
    userId: "user_secret",
    createdAt: now,
    updatedAt: now
  });
}

function seedJob(
  sessionId: string,
  email: string,
  bind?: ReturnType<typeof issueBindToken>
) {
  const now = new Date().toISOString();
  const issued = bind ?? issueBindToken();
  return saveProvisioningJob({
    id: crypto.randomUUID(),
    checkoutSessionId: sessionId,
    idempotencyKey: `idem_${sessionId}`,
    checkpoint: "owner_pending",
    stripeCustomerId: `cus_${sessionId.slice(-6)}`,
    stripeSubscriptionId: `sub_${sessionId.slice(-6)}`,
    catalogOfferId: "mpa_property_manager__professional__monthly",
    productSku: "mpa_property_manager",
    planTier: "professional",
    billingCycle: "monthly",
    ownerEmail: email,
    ownerUserId: "pending_user_1",
    organizationId: "org_secret",
    organizationName: "Secret Org LLC",
    bindTokenHash: issued.hash,
    bindExpiresAt: issued.expiresAt,
    attemptCount: 2,
    lastError: "transient_internal_detail",
    audit: [],
    emailsSent: [],
    createdAt: now,
    updatedAt: now
  });
}

function sensitiveKeysPresent(body: Record<string, unknown>): string[] {
  const banned = [
    "ownerEmail",
    "organizationId",
    "organizationName",
    "userId",
    "stripeCustomerId",
    "stripeSubscriptionId",
    "lastError",
    "attemptCount",
    "checkoutSessionId",
    "customerEmail"
  ];
  return banned.filter((key) => key in body && body[key] != null && body[key] !== "");
}

describe("STAB-009 provision status privacy", () => {
  beforeEach(() => {
    globalStore.__mpaProvisioningJobs = new Map();
    clearCommerceSessionLookupRateLimitForTests();
    authState.email = null;
    expect(COM_002_FLAGS.sliceD_automaticProvisioning).toBe(true);
  });

  it("rejects missing session id with safe error", async () => {
    const res = await provisionStatusGet(
      new Request("http://localhost/api/commerce/provision/status")
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body["error"]).toBe("invalid_request");
    expect(sensitiveKeysPresent(body)).toEqual([]);
  });

  it("returns safe 404 for invalid session", async () => {
    const res = await provisionStatusGet(
      new Request("http://localhost/api/commerce/provision/status?session_id=cs_unknown")
    );
    expect(res.status).toBe(404);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body["error"]).toBe("not_found");
    expect(JSON.stringify(body)).not.toMatch(/org_secret|buyer@|stack|supabase/i);
  });

  it("session id alone returns minimal non-sensitive progress", async () => {
    const sessionId = "cs_public_min";
    seedPurchase(sessionId);
    seedJob(sessionId, "buyer@example.com");
    const res = await provisionStatusGet(
      new Request(
        `http://localhost/api/commerce/provision/status?session_id=${encodeURIComponent(sessionId)}`
      )
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body["checkpoint"]).toBe("owner_pending");
    expect(body["ready"]).toBe(false);
    expect(sensitiveKeysPresent(body)).toEqual([]);
    expect(body["maskedOwnerEmail"]).toBeUndefined();
    expect(JSON.stringify(body)).not.toContain("buyer@example.com");
    expect(JSON.stringify(body)).not.toContain("Secret Org");
    expect(JSON.stringify(body)).not.toContain("org_secret");
    expect(JSON.stringify(body)).not.toContain("transient_internal_detail");
    expect(JSON.stringify(body)).not.toContain("cus_");
  });

  it("rejects expired bind credential", async () => {
    const sessionId = "cs_expired_bind";
    const issued = issueBindToken();
    seedPurchase(sessionId);
    const job = seedJob(sessionId, "buyer@example.com", issued);
    saveProvisioningJob({
      ...job,
      bindExpiresAt: new Date(Date.now() - 60_000).toISOString()
    });
    const res = await provisionStatusGet(
      new Request(
        `http://localhost/api/commerce/provision/status?session_id=${encodeURIComponent(sessionId)}&bind_token=${encodeURIComponent(issued.token)}`
      )
    );
    expect(res.status).toBe(401);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body["error"]).toBe("unauthorized");
    expect(JSON.stringify(body)).not.toContain(issued.token);
  });

  it("rejects reused/consumed bind credential", async () => {
    const sessionId = "cs_used_bind";
    const issued = issueBindToken();
    seedPurchase(sessionId);
    const job = seedJob(sessionId, "buyer@example.com", issued);
    saveProvisioningJob({ ...job, bindTokenHash: null, bindExpiresAt: null });
    const res = await provisionStatusGet(
      new Request(
        `http://localhost/api/commerce/provision/status?session_id=${encodeURIComponent(sessionId)}&bind_token=${encodeURIComponent(issued.token)}`
      )
    );
    expect(res.status).toBe(401);
  });

  it("rejects wrong bind token for another user's session", async () => {
    const sessionId = "cs_cross_user";
    seedPurchase(sessionId, "owner@example.com");
    seedJob(sessionId, "owner@example.com");
    const attacker = issueBindToken();
    const res = await provisionStatusGet(
      new Request(
        `http://localhost/api/commerce/provision/status?session_id=${encodeURIComponent(sessionId)}&bind_token=${encodeURIComponent(attacker.token)}`
      )
    );
    expect(res.status).toBe(401);
  });

  it("authorized bind returns masked email without org/user ids", async () => {
    const sessionId = "cs_auth_bind";
    const issued = issueBindToken();
    seedPurchase(sessionId);
    seedJob(sessionId, "buyer@example.com", issued);
    const res = await provisionStatusGet(
      new Request(
        `http://localhost/api/commerce/provision/status?session_id=${encodeURIComponent(sessionId)}&bind_token=${encodeURIComponent(issued.token)}`
      )
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body["maskedOwnerEmail"]).toBe(maskEmail("buyer@example.com"));
    expect(body["organizationPrepared"]).toBe(true);
    expect(sensitiveKeysPresent(body)).toEqual([]);
    expect(JSON.stringify(body)).not.toContain("buyer@example.com");
    expect(JSON.stringify(body)).not.toContain("org_secret");
    expect(JSON.stringify(body)).not.toContain("Secret Org");
  });

  it("matching authenticated owner is authorized; mismatched user stays minimal", async () => {
    const sessionId = "cs_auth_user";
    seedPurchase(sessionId, "owner@example.com");
    seedJob(sessionId, "owner@example.com");

    authState.email = "attacker@example.com";
    const denied = await provisionStatusGet(
      new Request(
        `http://localhost/api/commerce/provision/status?session_id=${encodeURIComponent(sessionId)}`
      )
    );
    const deniedBody = (await denied.json()) as Record<string, unknown>;
    expect(denied.status).toBe(200);
    expect(deniedBody["maskedOwnerEmail"]).toBeUndefined();
    expect(JSON.stringify(deniedBody)).not.toContain("owner@example.com");

    authState.email = "owner@example.com";
    const allowed = await provisionStatusGet(
      new Request(
        `http://localhost/api/commerce/provision/status?session_id=${encodeURIComponent(sessionId)}`
      )
    );
    const allowedBody = (await allowed.json()) as Record<string, unknown>;
    expect(allowed.status).toBe(200);
    expect(allowedBody["maskedOwnerEmail"]).toBe(maskEmail("owner@example.com"));
  });

  it("rate limits abusive lookups", async () => {
    const sessionId = "cs_rate_status";
    seedPurchase(sessionId);
    seedJob(sessionId, "buyer@example.com");
    let limited = 0;
    for (let i = 0; i < 40; i += 1) {
      const res = await provisionStatusGet(
        new Request(
          `http://localhost/api/commerce/provision/status?session_id=${encodeURIComponent(sessionId)}`,
          { headers: { "x-forwarded-for": "198.51.100.10" } }
        )
      );
      if (res.status === 429) limited += 1;
    }
    expect(limited).toBeGreaterThan(0);
  });

  it("does not expose bind token in responses", async () => {
    const sessionId = "cs_no_leak";
    const issued = issueBindToken();
    seedPurchase(sessionId);
    seedJob(sessionId, "buyer@example.com", issued);
    const res = await provisionStatusGet(
      new Request(
        `http://localhost/api/commerce/provision/status?session_id=${encodeURIComponent(sessionId)}&bind_token=${encodeURIComponent(issued.token)}`
      )
    );
    const text = await res.text();
    expect(text).not.toContain(issued.token);
    expect(getProvisioningJob(sessionId)?.bindTokenHash).toBeTruthy();
  });
});
