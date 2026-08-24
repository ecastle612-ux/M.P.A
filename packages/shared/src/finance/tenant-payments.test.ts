import { describe, expect, it } from "vitest";
import {
  AUTOPAY_CONSENT_TEXT,
  chargeIsAutopayEligible,
  chargeIsImmutableAmount,
  connectAccountReady,
  connectStatusFromStripe,
  defaultAutopayEligible,
  defaultFeeCategoryForChargeType,
  nextSchedulePeriod,
  refundReopenPaid,
  remainingOfCharges,
  resolveCheckoutAmount,
  tenantOnlinePayAvailable
} from "./tenant-payments";

describe("docs/188 tenant payment domain", () => {
  it("defaults rent to AutoPay-eligible and one-time fees not", () => {
    expect(defaultAutopayEligible({ chargeType: "rent" })).toBe(true);
    expect(defaultAutopayEligible({ chargeType: "recurring_fee" })).toBe(false);
    expect(defaultAutopayEligible({ chargeType: "recurring_fee", autopayEligible: true })).toBe(true);
    expect(defaultAutopayEligible({ chargeType: "one_time", autopayEligible: true })).toBe(false);
    expect(defaultFeeCategoryForChargeType("rent")).toBe("rent");
    expect(defaultFeeCategoryForChargeType("late_fee")).toBe("late_fee");
  });

  it("AutoPay includes only marked rent and recurring fees", () => {
    expect(
      chargeIsAutopayEligible({ charge_type: "rent", autopay_eligible: true, schedule_id: "s1" })
    ).toBe(true);
    expect(
      chargeIsAutopayEligible({
        charge_type: "recurring_fee",
        autopay_eligible: true,
        fee_category: "parking"
      })
    ).toBe(true);
    expect(
      chargeIsAutopayEligible({
        charge_type: "one_time",
        autopay_eligible: true,
        fee_category: "damage"
      })
    ).toBe(false);
    expect(
      chargeIsAutopayEligible({
        charge_type: "late_fee",
        autopay_eligible: true,
        fee_category: "late_fee"
      })
    ).toBe(false);
    expect(chargeIsAutopayEligible({ charge_type: "rent", autopay_eligible: false })).toBe(false);
  });

  it("refuses amount rewrite on posted, paid, or historical charges", () => {
    expect(chargeIsImmutableAmount("paid")).toBe(true);
    expect(chargeIsImmutableAmount("partially_paid")).toBe(true);
    expect(chargeIsImmutableAmount("void")).toBe(true);
    expect(chargeIsImmutableAmount("written_off")).toBe(true);
    expect(chargeIsImmutableAmount("open")).toBe(false);
  });

  it("requires Connect ready plus execution plus occupancy for online pay", () => {
    expect(
      tenantOnlinePayAvailable({
        stripePaymentExecutionEnabled: true,
        occupancyAccess: "active",
        connectReady: true
      })
    ).toBe(true);
    expect(
      tenantOnlinePayAvailable({
        stripePaymentExecutionEnabled: true,
        occupancyAccess: "active",
        connectReady: false
      })
    ).toBe(false);
    expect(
      tenantOnlinePayAvailable({
        stripePaymentExecutionEnabled: false,
        occupancyAccess: "active",
        connectReady: true
      })
    ).toBe(false);
    expect(
      tenantOnlinePayAvailable({
        stripePaymentExecutionEnabled: true,
        occupancyAccess: "historical",
        connectReady: true
      })
    ).toBe(false);
  });

  it("Connect ready requires account id, charges_enabled, and ready status", () => {
    expect(
      connectAccountReady({
        stripe_account_id: "acct_1",
        charges_enabled: true,
        status: "ready"
      })
    ).toBe(true);
    expect(
      connectAccountReady({
        stripe_account_id: "acct_1",
        charges_enabled: false,
        status: "ready"
      })
    ).toBe(false);
    expect(connectAccountReady({ stripe_account_id: null, charges_enabled: true, status: "ready" })).toBe(
      false
    );
    expect(connectStatusFromStripe({ charges_enabled: true, details_submitted: true })).toBe("ready");
    expect(connectStatusFromStripe({ charges_enabled: false, details_submitted: true })).toBe("pending");
  });

  it("supports Pay Once remaining and partial amounts and refuses overpay", () => {
    expect(resolveCheckoutAmount({ remaining: 100 })).toEqual({ ok: true, amount: 100 });
    expect(resolveCheckoutAmount({ remaining: 100, requestedAmount: 40 })).toEqual({
      ok: true,
      amount: 40
    });
    expect(resolveCheckoutAmount({ remaining: 100, requestedAmount: 100.01 }).ok).toBe(false);
    expect(resolveCheckoutAmount({ remaining: 0 }).ok).toBe(false);
    expect(remainingOfCharges([{ amount: 80, amount_paid: 20 }])).toBe(60);
  });

  it("schedule poster advances a month without rewriting posted periods", () => {
    const period = nextSchedulePeriod("2026-09-01", 1);
    expect(period.periodStart).toBe("2026-09-01");
    expect(period.periodEnd).toBe("2026-09-30");
    expect(period.dueAt).toBe("2026-09-01");
    expect(period.followingRunOn).toBe("2026-10-01");
  });

  it("refunds reopen remaining without changing the original charge amount", () => {
    expect(refundReopenPaid({ amount: 100, amount_paid: 100 }, 40)).toEqual({
      amount_paid: 60,
      status: "partially_paid"
    });
    expect(refundReopenPaid({ amount: 100, amount_paid: 100 }, 100)).toEqual({
      amount_paid: 0,
      status: "open"
    });
  });

  it("requires explicit tenant consent language for AutoPay", () => {
    expect(AUTOPAY_CONSENT_TEXT).toMatch(/I authorize/);
    expect(AUTOPAY_CONSENT_TEXT).toMatch(/turn AutoPay off/);
    expect(AUTOPAY_CONSENT_TEXT).toMatch(/Setting rent on my lease does not enroll me/);
    expect(AUTOPAY_CONSENT_TEXT).not.toMatch(/admin can enroll/i);
  });
});
