import { describe, expect, it } from "vitest";
import {
  assertModuleEntitled,
  assertWithinLimit,
  resolveEntitlementsForPlan
} from "../auth/capability-matrix";
import {
  subscriptionAllowsResourceCreates,
  entitledModuleKeys,
  type OrganizationEntitlementContext
} from "./entitlement-gate";

function context(
  overrides: Partial<OrganizationEntitlementContext>
): OrganizationEntitlementContext {
  const trial = resolveEntitlementsForPlan("trial");
  return {
    organizationId: "org_test",
    snapshot: trial,
    subscriptionStatus: "active",
    commercialStatus: "active",
    usage: {
      properties: 0,
      activeSeats: 1,
      pendingInvites: 0,
      seatUsage: 1
    },
    canCreateResources: true,
    ...overrides
  };
}

describe("BILL-001 Phase C entitlement gate", () => {
  it("allows creates for trialing/active and setup-without-sub", () => {
    expect(subscriptionAllowsResourceCreates("trialing")).toBe(true);
    expect(subscriptionAllowsResourceCreates("active")).toBe(true);
    expect(subscriptionAllowsResourceCreates(null)).toBe(true);
  });

  it("blocks creates for past_due, unpaid, canceled", () => {
    expect(subscriptionAllowsResourceCreates("past_due")).toBe(false);
    expect(subscriptionAllowsResourceCreates("unpaid")).toBe(false);
    expect(subscriptionAllowsResourceCreates("canceled")).toBe(false);
    expect(subscriptionAllowsResourceCreates("paused")).toBe(false);
  });

  it("hard-blocks property create at plan max", () => {
    const trial = resolveEntitlementsForPlan("trial");
    expect(assertWithinLimit(trial, "maxProperties", 2).ok).toBe(true);
    expect(assertWithinLimit(trial, "maxProperties", 3).ok).toBe(false);
  });

  it("seat usage counts active members + pending invites against maxUsers", () => {
    const trial = resolveEntitlementsForPlan("trial");
    // trial maxUsers = 5; 4 active + 1 pending = at limit
    expect(assertWithinLimit(trial, "maxUsers", 4).ok).toBe(true);
    expect(assertWithinLimit(trial, "maxUsers", 5).ok).toBe(false);
  });

  it("denies module not on plan (marketplace on trial)", () => {
    const trial = resolveEntitlementsForPlan("trial");
    expect(assertModuleEntitled(trial, "marketplace").ok).toBe(false);
    expect(assertModuleEntitled(trial, "property_operations").ok).toBe(true);
    expect(assertModuleEntitled(trial, "facility_operations").ok).toBe(true);
  });

  it("entitledModuleKeys includes core commercial SKU modules", () => {
    const keys = entitledModuleKeys(resolveEntitlementsForPlan("professional"));
    expect(keys).toContain("property_operations");
    expect(keys).toContain("facility_operations");
    expect(keys).toContain("marketplace");
  });

  it("upgrade raises property ceiling vs trial", () => {
    const trial = resolveEntitlementsForPlan("trial");
    const professional = resolveEntitlementsForPlan("professional");
    expect(assertWithinLimit(trial, "maxProperties", 3).ok).toBe(false);
    expect(assertWithinLimit(professional, "maxProperties", 3).ok).toBe(true);
  });

  it("downgrade leaves over-limit orgs unable to create more", () => {
    const trial = resolveEntitlementsForPlan("trial");
    // Org already has 10 properties after downgrade from professional — blocked
    expect(assertWithinLimit(trial, "maxProperties", 10).ok).toBe(false);
  });

  it("past_due context cannot create even under limit", () => {
    const pastDue = context({
      subscriptionStatus: "past_due",
      canCreateResources: subscriptionAllowsResourceCreates("past_due"),
      usage: {
        properties: 0,
        activeSeats: 1,
        pendingInvites: 0,
        seatUsage: 1
      }
    });
    expect(pastDue.canCreateResources).toBe(false);
  });
});
