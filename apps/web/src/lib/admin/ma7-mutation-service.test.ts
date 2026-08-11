import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LifecycleSubscription } from "@mpa/shared";

const getUser = vi.fn();
const isPlatformOperatorUser = vi.fn();
const writeSupportAudit = vi.fn();
const cancelAtPeriodEnd = vi.fn();
const reactivateSubscription = vi.fn();
const getLifecycleByOrganizationId = vi.fn();

type MemRow = {
  id: string;
  organization_id: string;
  user_id: string;
  roles: string[];
  status: string;
};

const db = {
  memberships: new Map<string, MemRow>(),
  orgs: new Map<string, { id: string; name: string }>()
};

vi.mock("../auth/server", () => ({
  createAuthServerClient: async () => ({
    auth: { getUser },
    from: (table: string) => makeQuery(table)
  })
}));
vi.mock("../commercial/server", () => ({
  isPlatformOperatorUser: (...args: unknown[]) => isPlatformOperatorUser(...args)
}));
vi.mock("./impersonation-service", () => ({
  writeSupportAudit: (...args: unknown[]) => writeSupportAudit(...args)
}));
vi.mock("../saas-lifecycle/apply-lifecycle", () => ({
  cancelAtPeriodEnd: (...args: unknown[]) => cancelAtPeriodEnd(...args),
  reactivateSubscription: (...args: unknown[]) => reactivateSubscription(...args)
}));
vi.mock("../saas-lifecycle/lifecycle-store", () => ({
  getLifecycleByOrganizationId: (...args: unknown[]) => getLifecycleByOrganizationId(...args)
}));

function makeQuery(table: string) {
  const filters: Record<string, string> = {};
  let updatePayload: Record<string, unknown> | null = null;
  const builder: Record<string, unknown> = {};
  builder["select"] = () => builder;
  builder["eq"] = (col: string, val: string) => {
    filters[col] = val;
    return builder;
  };
  builder["update"] = (payload: Record<string, unknown>) => {
    updatePayload = payload;
    return builder;
  };
  builder["maybeSingle"] = async () => {
    if (table === "organizations") {
      const id = filters["id"];
      return { data: id ? db.orgs.get(id) ?? null : null, error: null };
    }
    if (table === "organization_memberships") {
      if (updatePayload && filters["id"]) {
        const row = db.memberships.get(filters["id"]);
        if (!row) return { data: null, error: null };
        if (filters["organization_id"] && row.organization_id !== filters["organization_id"]) {
          return { data: null, error: null };
        }
        const next = {
          ...row,
          status: String(updatePayload["status"] ?? row.status)
        };
        db.memberships.set(row.id, next);
        return {
          data: { id: next.id, user_id: next.user_id, roles: next.roles, status: next.status },
          error: null
        };
      }
      const id = filters["id"];
      return { data: id ? db.memberships.get(id) ?? null : null, error: null };
    }
    return { data: null, error: null };
  };
  // list active admins path uses no maybeSingle — returns data array via thenable await on builder
  builder["then"] = (resolve: (v: unknown) => unknown) => {
    if (table === "organization_memberships" && filters["organization_id"] && !filters["id"]) {
      const rows = [...db.memberships.values()].filter(
        (m) => m.organization_id === filters["organization_id"]
      );
      return Promise.resolve(resolve({ data: rows, error: null }));
    }
    return Promise.resolve(resolve({ data: null, error: null }));
  };
  return builder;
}

function seedLife(partial: Partial<LifecycleSubscription> & { organizationId: string }): LifecycleSubscription {
  const now = new Date().toISOString();
  const organizationId = partial.organizationId;
  return {
    id: partial.id ?? `life_${organizationId}`,
    organizationId,
    stripeSubscriptionId: partial.stripeSubscriptionId ?? `sub_${organizationId}`,
    stripeCustomerId: partial.stripeCustomerId ?? `cus_${organizationId}`,
    productSku: partial.productSku ?? "mpa_property_manager",
    planTier: partial.planTier ?? "professional",
    billingCycle: partial.billingCycle ?? "monthly",
    status: partial.status ?? "active",
    cancelAtPeriodEnd: partial.cancelAtPeriodEnd ?? false,
    currentPeriodEnd: partial.currentPeriodEnd ?? now,
    graceStartedAt: partial.graceStartedAt ?? null,
    seatLimit: partial.seatLimit ?? null,
    propertyLimit: partial.propertyLimit ?? null,
    stripeBaseItemId: partial.stripeBaseItemId ?? null,
    stripeAdditionalCapacityItemId: partial.stripeAdditionalCapacityItemId ?? null,
    managedUnitCount: partial.managedUnitCount ?? 10,
    authorizedAdditionalBlocks: partial.authorizedAdditionalBlocks ?? 0,
    authorizedUnitCapacity: partial.authorizedUnitCapacity ?? 500,
    declaredUnitCount: partial.declaredUnitCount ?? null,
    pendingAdditionalBlocks: partial.pendingAdditionalBlocks ?? null,
    pendingAuthorizedUnitCapacity: partial.pendingAuthorizedUnitCapacity ?? null,
    lastCapacityAuthorizedAt: partial.lastCapacityAuthorizedAt ?? null,
    quoteId: partial.quoteId ?? null,
    trialEndsAt: partial.trialEndsAt ?? null,
    pendingPlanTier: partial.pendingPlanTier ?? null,
    lastInvoiceStatus: partial.lastInvoiceStatus ?? null,
    scaRequired: partial.scaRequired ?? false,
    emailsSent: partial.emailsSent ?? [],
    audit: partial.audit ?? [],
    paymentHistory: partial.paymentHistory ?? [],
    createdAt: partial.createdAt ?? now,
    updatedAt: partial.updatedAt ?? now
  };
}

describe("MA-7 membership + subscription mutation service", () => {
  beforeEach(() => {
    getUser.mockReset();
    isPlatformOperatorUser.mockReset();
    writeSupportAudit.mockReset();
    cancelAtPeriodEnd.mockReset();
    reactivateSubscription.mockReset();
    getLifecycleByOrganizationId.mockReset();
    db.memberships.clear();
    db.orgs.clear();
    writeSupportAudit.mockResolvedValue(undefined);
    getUser.mockResolvedValue({ data: { user: { id: "op1" } } });
    isPlatformOperatorUser.mockResolvedValue(true);
  });

  it("deactivates membership with audit and protects last admin", async () => {
    db.orgs.set("org_a", { id: "org_a", name: "Alpha" });
    db.memberships.set("m_admin", {
      id: "m_admin",
      organization_id: "org_a",
      user_id: "u1",
      roles: ["organization_admin"],
      status: "active"
    });
    db.memberships.set("m_res", {
      id: "m_res",
      organization_id: "org_a",
      user_id: "u2",
      roles: ["resident"],
      status: "active"
    });

    const { mutateMembershipStatus } = await import("./ma7-mutation-service");

    const blocked = await mutateMembershipStatus({
      membershipId: "m_admin",
      organizationId: "org_a",
      status: "inactive",
      reason: "enough reason text",
      confirm: true,
      confirmationToken: "DEACTIVATE"
    });
    expect(blocked.ok).toBe(false);
    expect(blocked.code).toBe("last_admin_protection");

    db.memberships.set("m_admin2", {
      id: "m_admin2",
      organization_id: "org_a",
      user_id: "u3",
      roles: ["property_manager"],
      status: "active"
    });

    const ok = await mutateMembershipStatus({
      membershipId: "m_admin",
      organizationId: "org_a",
      status: "inactive",
      reason: "enough reason text",
      confirm: true,
      confirmationToken: "DEACTIVATE"
    });
    expect(ok.ok).toBe(true);
    expect(ok.previousState?.["status"]).toBe("active");
    expect(ok.resultingState?.["status"]).toBe("inactive");
    expect(writeSupportAudit).toHaveBeenCalled();

    const cross = await mutateMembershipStatus({
      membershipId: "m_admin",
      organizationId: "other_org",
      status: "inactive",
      reason: "enough reason text",
      confirm: true,
      confirmationToken: "DEACTIVATE"
    });
    expect(cross.ok).toBe(false);
    expect(cross.code).toBe("cross_org_rejected");
  });

  it("cancels and reactivates via authoritative lifecycle with idempotency", async () => {
    db.orgs.set("org_b", { id: "org_b", name: "Beta" });
    let life = seedLife({ organizationId: "org_b", cancelAtPeriodEnd: false, status: "active" });
    getLifecycleByOrganizationId.mockImplementation(async () => life);
    cancelAtPeriodEnd.mockImplementation(async () => {
      life = { ...life, cancelAtPeriodEnd: true, updatedAt: new Date().toISOString() };
      return life;
    });
    reactivateSubscription.mockImplementation(async () => {
      life = { ...life, cancelAtPeriodEnd: false, status: "active", updatedAt: new Date().toISOString() };
      return life;
    });

    const { mutateSubscriptionLifecycle } = await import("./ma7-mutation-service");

    const first = await mutateSubscriptionLifecycle({
      organizationId: "org_b",
      action: "cancel",
      reason: "enough reason text",
      confirm: true,
      confirmationToken: "CANCEL"
    });
    expect(first.ok).toBe(true);
    expect(first.resultingState?.["cancelAtPeriodEnd"]).toBe(true);
    expect(cancelAtPeriodEnd).toHaveBeenCalledWith({
      organizationId: "org_b",
      source: "master_admin"
    });

    const again = await mutateSubscriptionLifecycle({
      organizationId: "org_b",
      action: "cancel",
      reason: "enough reason text",
      confirm: true,
      confirmationToken: "CANCEL"
    });
    expect(again.ok).toBe(true);
    expect(again.code).toBe("idempotent");
    expect(cancelAtPeriodEnd).toHaveBeenCalledTimes(1);

    const reactivated = await mutateSubscriptionLifecycle({
      organizationId: "org_b",
      action: "reactivate",
      reason: "enough reason text",
      confirm: true,
      confirmationToken: "REACTIVATE"
    });
    expect(reactivated.ok).toBe(true);
    expect(reactivated.resultingState?.["cancelAtPeriodEnd"]).toBe(false);
  });

  it("rejects PM/FO users", async () => {
    isPlatformOperatorUser.mockResolvedValue(false);
    const { mutateMembershipStatus } = await import("./ma7-mutation-service");
    const res = await mutateMembershipStatus({
      membershipId: "m1",
      organizationId: "org_a",
      status: "inactive",
      reason: "enough reason text",
      confirm: true,
      confirmationToken: "DEACTIVATE"
    });
    expect(res.code).toBe("forbidden");
  });
});
