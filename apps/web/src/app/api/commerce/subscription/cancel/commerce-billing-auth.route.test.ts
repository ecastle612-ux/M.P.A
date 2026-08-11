import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LifecycleSubscription } from "@mpa/shared";
import { ACTIVE_ORGANIZATION_COOKIE } from "../../../../../lib/organization/contracts";
import {
  clearLifecycleStoreForTests,
  saveLifecycleSubscription
} from "../../../../../lib/saas-lifecycle/lifecycle-store";

type MembershipRow = { roles: string[]; status: string } | null;

const authState = {
  userId: "user_attacker" as string | null,
  membershipByOrg: new Map<string, MembershipRow>()
};

vi.mock("../../../../../lib/auth/server", () => ({
  createAuthServerClient: async () => ({
    auth: {
      getUser: async () => ({
        data: { user: authState.userId ? { id: authState.userId } : null }
      })
    },
    from: (table: string) => {
      if (table !== "organization_memberships") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: async () => ({ data: null, error: null })
                })
              })
            })
          })
        };
      }
      let orgId: string | null = null;
      let userId: string | null = null;
      const builder = {
        select: () => builder,
        eq: (col: string, value: string) => {
          if (col === "organization_id") orgId = value;
          if (col === "user_id") userId = value;
          return builder;
        },
        maybeSingle: async () => {
          void userId;
          const row = orgId ? authState.membershipByOrg.get(orgId) ?? null : null;
          return { data: row, error: null };
        }
      };
      return builder;
    }
  })
}));

import { POST as cancelPost } from "./route";
import { POST as reactivatePost } from "../reactivate/route";
import { POST as authorizePost } from "../../capacity/authorize/route";

async function seedSub(orgId: string, stripeId: string): Promise<LifecycleSubscription> {
  const now = new Date().toISOString();
  return saveLifecycleSubscription({
    id: `life_${orgId}`,
    organizationId: orgId,
    stripeSubscriptionId: stripeId,
    stripeCustomerId: `cus_${orgId}`,
    productSku: "mpa_property_manager",
    planTier: "professional",
    billingCycle: "monthly",
    status: "active",
    cancelAtPeriodEnd: false,
    currentPeriodEnd: now,
    graceStartedAt: null,
    seatLimit: null,
    propertyLimit: null,
    stripeBaseItemId: null,
    stripeAdditionalCapacityItemId: null,
    managedUnitCount: 100,
    authorizedAdditionalBlocks: 0,
    authorizedUnitCapacity: 500,
    declaredUnitCount: 100,
    pendingAdditionalBlocks: null,
    pendingAuthorizedUnitCapacity: null,
    lastCapacityAuthorizedAt: null,
    quoteId: null,
    trialEndsAt: null,
    pendingPlanTier: null,
    lastInvoiceStatus: null,
    scaRequired: false,
    emailsSent: [],
    audit: [],
    paymentHistory: [],
    createdAt: now,
    updatedAt: now
  });
}

function requestFor(
  path: string,
  orgId: string,
  body?: Record<string, unknown>
): Request {
  return new Request(`http://localhost${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      cookie: `${ACTIVE_ORGANIZATION_COOKIE}=${encodeURIComponent(orgId)}`
    },
    body: JSON.stringify(body ?? {})
  });
}

describe("STAB-001 commerce organization authorization", () => {
  beforeEach(() => {
    clearLifecycleStoreForTests();
    authState.userId = "user_attacker";
    authState.membershipByOrg = new Map();
    process.env["VITEST"] = "true";
  });

  it("rejects forged active-organization cookie (cross-org cancel)", async () => {
    await seedSub("org_victim", "sub_victim");
    authState.membershipByOrg.set("org_attacker", {
      roles: ["organization_admin"],
      status: "active"
    });
    // Cookie points at victim org; user is not a member there.
    const res = await cancelPost(requestFor("/api/commerce/subscription/cancel", "org_victim"));
    expect(res.status).toBe(403);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("forbidden");
  });

  it("rejects cross-organization reactivation", async () => {
    await seedSub("org_victim", "sub_victim");
    await seedSub("org_attacker", "sub_attacker");
    authState.membershipByOrg.set("org_attacker", {
      roles: ["organization_admin"],
      status: "active"
    });
    const res = await reactivatePost(
      requestFor("/api/commerce/subscription/reactivate", "org_victim")
    );
    expect(res.status).toBe(403);
  });

  it("rejects cross-organization capacity authorization", async () => {
    await seedSub("org_victim", "sub_victim");
    authState.membershipByOrg.set("org_attacker", {
      roles: ["organization_admin"],
      status: "active"
    });
    const res = await authorizePost(
      requestFor("/api/commerce/capacity/authorize", "org_victim", {})
    );
    expect(res.status).toBe(403);
  });

  it("rejects non-member organization mutation", async () => {
    await seedSub("org_a", "sub_a");
    const res = await cancelPost(requestFor("/api/commerce/subscription/cancel", "org_a"));
    expect(res.status).toBe(403);
  });

  it("rejects member without billing capability", async () => {
    await seedSub("org_a", "sub_a");
    authState.userId = "user_member";
    authState.membershipByOrg.set("org_a", {
      roles: ["tenant"],
      status: "active"
    });
    const res = await cancelPost(requestFor("/api/commerce/subscription/cancel", "org_a"));
    expect(res.status).toBe(403);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("forbidden_billing");
  });

  it("accepts authorized billing administrator cancel", async () => {
    await seedSub("org_a", "sub_a");
    authState.userId = "user_admin";
    authState.membershipByOrg.set("org_a", {
      roles: ["organization_admin"],
      status: "active"
    });
    const res = await cancelPost(requestFor("/api/commerce/subscription/cancel", "org_a"));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; cancelAtPeriodEnd: boolean };
    expect(body.ok).toBe(true);
    expect(body.cancelAtPeriodEnd).toBe(true);
  });

  it("accepts property_manager billing capability for reactivate", async () => {
    const sub = await seedSub("org_b", "sub_b");
    await saveLifecycleSubscription({ ...sub, cancelAtPeriodEnd: true });
    authState.userId = "user_pm";
    authState.membershipByOrg.set("org_b", {
      roles: ["property_manager"],
      status: "active"
    });
    const res = await reactivatePost(
      requestFor("/api/commerce/subscription/reactivate", "org_b")
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; status: string };
    expect(body.ok).toBe(true);
    expect(body.status).toBe("active");
  });

  it("rejects unauthenticated commerce mutation", async () => {
    await seedSub("org_a", "sub_a");
    authState.userId = null;
    const res = await cancelPost(requestFor("/api/commerce/subscription/cancel", "org_a"));
    expect(res.status).toBe(401);
  });
});
