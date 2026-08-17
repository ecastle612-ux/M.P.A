import { describe, expect, it } from "vitest";
import { AUTOPAY_CONSENT_VERSION } from "./tenant-payments";
import {
  ORGANIZATION_DISABLED_ONLINE_PAYMENTS,
  assertNoStripeAccountId,
  canResumeAutopayAfterOrgDisable,
  customerSafeOnlinePayments,
  publicConnectView,
  resolveOnlinePaymentStatus
} from "./online-payments";

const readyConnect = publicConnectView({
  stripe_account_id: "acct_ready",
  status: "ready",
  charges_enabled: true,
  payouts_enabled: true
});

describe("docs/194 Online Payments status model", () => {
  it("maps Connect + execution into customer statuses", () => {
    expect(
      resolveOnlinePaymentStatus({
        executionEnabled: false,
        connect: publicConnectView(null)
      })
    ).toBe("not_connected");
    expect(
      resolveOnlinePaymentStatus({
        executionEnabled: false,
        connect: publicConnectView({ stripe_account_id: "acct_1", status: "pending", charges_enabled: false })
      })
    ).toBe("setup_incomplete");
    expect(resolveOnlinePaymentStatus({ executionEnabled: false, connect: readyConnect })).toBe(
      "ready_to_enable"
    );
    expect(resolveOnlinePaymentStatus({ executionEnabled: true, connect: readyConnect })).toBe("active");
    expect(
      resolveOnlinePaymentStatus({
        executionEnabled: true,
        connect: publicConnectView({ stripe_account_id: "acct_1", status: "restricted", charges_enabled: false })
      })
    ).toBe("action_required");
  });

  it("never puts a Stripe account id on the customer payload", () => {
    const payload = customerSafeOnlinePayments({
      executionEnabled: true,
      connect: readyConnect
    });
    expect(assertNoStripeAccountId(payload)).toBe(true);
    expect(JSON.stringify(payload)).not.toContain("acct_");
    expect(payload.primary_action).toBe("manage");
    expect(payload.secondary_action).toBe("disable");
  });

  it("resumes AutoPay only under the approved org-disable rule", () => {
    const base = {
      status: "paused",
      pausedReason: ORGANIZATION_DISABLED_ONLINE_PAYMENTS,
      consentVersion: AUTOPAY_CONSENT_VERSION,
      occupancyCurrent: true,
      hasPaymentMethod: true,
      connectReady: true,
      executionEnabled: true
    };
    expect(canResumeAutopayAfterOrgDisable(base)).toBe(true);
    expect(canResumeAutopayAfterOrgDisable({ ...base, status: "revoked" })).toBe(false);
    expect(canResumeAutopayAfterOrgDisable({ ...base, pausedReason: "other" })).toBe(false);
    expect(canResumeAutopayAfterOrgDisable({ ...base, consentVersion: "old" })).toBe(false);
    expect(canResumeAutopayAfterOrgDisable({ ...base, occupancyCurrent: false })).toBe(false);
    expect(canResumeAutopayAfterOrgDisable({ ...base, hasPaymentMethod: false })).toBe(false);
    expect(canResumeAutopayAfterOrgDisable({ ...base, connectReady: false })).toBe(false);
    expect(canResumeAutopayAfterOrgDisable({ ...base, executionEnabled: false })).toBe(false);
  });
});
