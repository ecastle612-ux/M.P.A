import { describe, expect, it } from "vitest";
import {
  MA7_CAPABILITIES,
  bootstrapOperatorCapabilities,
  isBlockedCapability,
  operatorHasCapability,
  resolveTrustedCapabilities
} from "./ma7-capabilities";
import {
  classifyMembershipTransition,
  classifySubscriptionCancel,
  classifySubscriptionReactivate,
  countActiveAdmins,
  validateConfirmation,
  validateReason,
  wouldRemoveLastAdmin
} from "./ma7-mutations";

describe("MA-7 capabilities bootstrap", () => {
  it("grants mutate caps only to active operators and ignores client claims", () => {
    const empty = resolveTrustedCapabilities({
      isActiveOperator: false,
      clientClaimedCapabilities: [MA7_CAPABILITIES.ORGS_SUSPEND]
    });
    expect(empty.size).toBe(0);

    const caps = resolveTrustedCapabilities({
      isActiveOperator: true,
      clientClaimedCapabilities: [MA7_CAPABILITIES.CAPACITY_MUTATE, MA7_CAPABILITIES.ORGS_SUSPEND]
    });
    expect(operatorHasCapability(caps, MA7_CAPABILITIES.USERS_MEMBERSHIP_MUTATE)).toBe(true);
    expect(operatorHasCapability(caps, MA7_CAPABILITIES.SUBSCRIPTIONS_CANCEL)).toBe(true);
    expect(operatorHasCapability(caps, MA7_CAPABILITIES.SUBSCRIPTIONS_REACTIVATE)).toBe(true);
    expect(operatorHasCapability(caps, MA7_CAPABILITIES.ORGS_SUSPEND)).toBe(false);
    expect(operatorHasCapability(caps, MA7_CAPABILITIES.CAPACITY_MUTATE)).toBe(false);
    expect(isBlockedCapability(MA7_CAPABILITIES.ORGS_SUSPEND)).toBe(true);
    expect(bootstrapOperatorCapabilities(true).has(MA7_CAPABILITIES.ORGS_READ)).toBe(true);
  });
});

describe("MA-7 confirmation + reason", () => {
  it("rejects boolean-only confirmation and short reasons", () => {
    expect(validateReason("short")).toEqual({ ok: false, code: "reason_required" });
    expect(validateReason("long enough reason")).toMatchObject({ ok: true });
    expect(
      validateConfirmation({
        action: "cancel_subscription",
        confirm: true,
        confirmationToken: "YES"
      })
    ).toEqual({ ok: false, code: "confirmation_required" });
    expect(
      validateConfirmation({
        action: "cancel_subscription",
        confirm: true,
        confirmationToken: "CANCEL"
      })
    ).toEqual({ ok: true });
    expect(
      validateConfirmation({
        action: "suspend_organization",
        confirm: true,
        confirmationToken: "SUSPEND",
        confirmationPhrase: "Acme",
        expectedPhrase: "Acme LLC"
      })
    ).toEqual({ ok: false, code: "confirmation_required" });
  });
});

describe("MA-7 last-admin protection", () => {
  it("blocks deactivating the sole active admin", () => {
    const members = [
      { status: "active", roles: ["organization_admin"] },
      { status: "active", roles: ["resident"] },
      { status: "inactive", roles: ["organization_admin"] }
    ];
    expect(countActiveAdmins(members)).toBe(1);
    expect(
      wouldRemoveLastAdmin({
        target: members[0]!,
        requestedStatus: "inactive",
        activeAdminCount: 1
      })
    ).toBe(true);
    expect(
      wouldRemoveLastAdmin({
        target: members[0]!,
        requestedStatus: "inactive",
        activeAdminCount: 2
      })
    ).toBe(false);
    expect(
      wouldRemoveLastAdmin({
        target: { status: "active", roles: ["resident"] },
        requestedStatus: "inactive",
        activeAdminCount: 1
      })
    ).toBe(false);
  });
});

describe("MA-7 idempotent classifications", () => {
  it("classifies membership and subscription transitions without inventing states", () => {
    expect(classifyMembershipTransition({ current: "active", requested: "active" })).toBe(
      "already_active"
    );
    expect(classifyMembershipTransition({ current: "inactive", requested: "inactive" })).toBe(
      "already_inactive"
    );
    expect(classifyMembershipTransition({ current: "active", requested: "inactive" })).toBe("apply");

    expect(classifySubscriptionCancel({ status: "active", cancelAtPeriodEnd: true })).toBe(
      "already_cancelled"
    );
    expect(classifySubscriptionCancel({ status: "canceled", cancelAtPeriodEnd: false })).toBe(
      "not_cancellable"
    );
    expect(classifySubscriptionCancel({ status: "active", cancelAtPeriodEnd: false })).toBe("apply");

    expect(classifySubscriptionReactivate({ status: "active", cancelAtPeriodEnd: false })).toBe(
      "already_active"
    );
    expect(classifySubscriptionReactivate({ status: "active", cancelAtPeriodEnd: true })).toBe(
      "apply"
    );
  });
});
