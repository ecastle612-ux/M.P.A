import { beforeEach, describe, expect, it, vi } from "vitest";
import { COM_002_FLAGS } from "@mpa/shared";
import {
  clearClaimPasswordRateLimitForTests
} from "../../../../../lib/saas-provisioning/claim-password-rate-limit";
import {
  getProvisioningJob,
  saveProvisioningJob
} from "../../../../../lib/saas-provisioning/jobs-store";
import { issueBindToken } from "../../../../../lib/saas-provisioning/tokens";
import { rememberSaasPurchase } from "../../../../../lib/saas-stripe/purchase-store";

vi.mock("../../../../../lib/env/server-env", () => ({
  serverEnv: {
    SUPABASE_SERVICE_ROLE_KEY: "test_service_role",
    NEXT_PUBLIC_APP_URL: "http://localhost:3000"
  }
}));

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

const adminCalls: Array<{ kind: string; payload?: unknown }> = [];

vi.mock("../../../../../lib/supabase/service-role", () => ({
  createServiceRoleClient: () => ({
    auth: {
      admin: {
        listUsers: async () => ({ data: { users: [] } }),
        createUser: async (payload: unknown) => {
          adminCalls.push({ kind: "createUser", payload });
          return { data: { user: { id: "user_claimed" } }, error: null };
        },
        updateUserById: async (id: string, payload: unknown) => {
          adminCalls.push({ kind: "updateUserById", payload: { id, ...(payload as object) } });
          return { data: { user: { id } }, error: null };
        }
      }
    }
  })
}));

import { POST } from "./route";

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
    organizationId: "org_seed",
    userId: "pending_user_1",
    createdAt: now,
    updatedAt: now
  });
}

function seedJob(sessionId: string, email: string, bind?: ReturnType<typeof issueBindToken>) {
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
    organizationId: "org_seed",
    organizationName: "Seed Org",
    bindTokenHash: issued.hash,
    bindExpiresAt: issued.expiresAt,
    attemptCount: 0,
    lastError: null,
    audit: [],
    emailsSent: [],
    createdAt: now,
    updatedAt: now
  });
}

describe("STAB-002 claim-password bind hardening", () => {
  beforeEach(() => {
    globalStore.__mpaProvisioningJobs = new Map();
    clearClaimPasswordRateLimitForTests();
    adminCalls.length = 0;
    expect(COM_002_FLAGS.sliceD_automaticProvisioning).toBe(true);
  });

  it("rejects fake session ID", async () => {
    const res = await POST(
      new Request("http://localhost/api/commerce/provision/claim-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sessionId: "cs_fake",
          email: "buyer@example.com",
          password: "password123",
          bindToken: "anything"
        })
      })
    );
    expect(res.status).toBe(409);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("purchase_not_completed");
    expect(JSON.stringify(body)).not.toMatch(/bind/i);
  });

  it("rejects real session without bind credential", async () => {
    const sessionId = "cs_nobind";
    seedPurchase(sessionId);
    seedJob(sessionId, "buyer@example.com");
    const res = await POST(
      new Request("http://localhost/api/commerce/provision/claim-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sessionId,
          email: "buyer@example.com",
          password: "password123"
        })
      })
    );
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("bind_token_required");
  });

  it("rejects session + email alone even when bind hash missing on job", async () => {
    const sessionId = "cs_hashless";
    seedPurchase(sessionId);
    const job = seedJob(sessionId, "buyer@example.com");
    saveProvisioningJob({ ...job, bindTokenHash: null, bindExpiresAt: null });
    const res = await POST(
      new Request("http://localhost/api/commerce/provision/claim-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sessionId,
          email: "buyer@example.com",
          password: "password123",
          bindToken: "forged"
        })
      })
    );
    expect(res.status).toBe(401);
  });

  it("accepts correct bind credential and establishes password", async () => {
    const sessionId = "cs_ok";
    const issued = issueBindToken();
    seedPurchase(sessionId);
    seedJob(sessionId, "buyer@example.com", issued);
    const res = await POST(
      new Request("http://localhost/api/commerce/provision/claim-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sessionId,
          email: "buyer@example.com",
          password: "password123",
          bindToken: issued.token
        })
      })
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; userId: string };
    expect(body.ok).toBe(true);
    expect(body.userId).toBe("user_claimed");
    expect(JSON.stringify(body)).not.toContain(issued.token);
    expect(getProvisioningJob(sessionId)?.bindTokenHash).toBeNull();
    expect(adminCalls.some((c) => c.kind === "createUser" || c.kind === "updateUserById")).toBe(
      true
    );
  });

  it("rejects reuse of bind credential", async () => {
    const sessionId = "cs_reuse";
    const issued = issueBindToken();
    seedPurchase(sessionId);
    seedJob(sessionId, "buyer@example.com", issued);
    const first = await POST(
      new Request("http://localhost/api/commerce/provision/claim-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sessionId,
          email: "buyer@example.com",
          password: "password123",
          bindToken: issued.token
        })
      })
    );
    expect(first.status).toBe(200);
    const second = await POST(
      new Request("http://localhost/api/commerce/provision/claim-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sessionId,
          email: "buyer@example.com",
          password: "password123",
          bindToken: issued.token
        })
      })
    );
    expect(second.status).toBe(401);
  });

  it("rejects expired bind credential", async () => {
    const sessionId = "cs_expired";
    const issued = issueBindToken();
    seedPurchase(sessionId);
    const job = seedJob(sessionId, "buyer@example.com", issued);
    saveProvisioningJob({
      ...job,
      bindExpiresAt: new Date(Date.now() - 60_000).toISOString()
    });
    const res = await POST(
      new Request("http://localhost/api/commerce/provision/claim-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sessionId,
          email: "buyer@example.com",
          password: "password123",
          bindToken: issued.token
        })
      })
    );
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("invalid_or_expired_bind_token");
  });

  it("rejects wrong email/user context", async () => {
    const sessionId = "cs_wrong_email";
    const issued = issueBindToken();
    seedPurchase(sessionId, "buyer@example.com");
    seedJob(sessionId, "buyer@example.com", issued);
    const res = await POST(
      new Request("http://localhost/api/commerce/provision/claim-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sessionId,
          email: "attacker@example.com",
          password: "password123",
          bindToken: issued.token
        })
      })
    );
    expect(res.status).toBe(409);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("email_mismatch");
    expect(JSON.stringify(body)).not.toContain(issued.token);
  });

  it("rate-limits repeated attempts", async () => {
    const sessionId = "cs_rate";
    const issued = issueBindToken();
    seedPurchase(sessionId);
    seedJob(sessionId, "buyer@example.com", issued);
    let limited = 0;
    for (let i = 0; i < 12; i += 1) {
      const res = await POST(
        new Request("http://localhost/api/commerce/provision/claim-password", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-forwarded-for": "203.0.113.50"
          },
          body: JSON.stringify({
            sessionId,
            email: "buyer@example.com",
            password: "password123",
            bindToken: "wrong-token"
          })
        })
      );
      if (res.status === 429) limited += 1;
    }
    expect(limited).toBeGreaterThan(0);
  });
});
