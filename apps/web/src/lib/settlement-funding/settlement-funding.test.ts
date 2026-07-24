import { afterEach, describe, expect, it } from "vitest";
import {
  canApplyLiveDestinationCharges,
  evaluateDestinationProviderCapability
} from "./capability";
import {
  assertDestinationRefundBalance,
  computeFeeReversalCents,
  correctionApplyKey,
  deriveSafeCorpusExclusion,
  hasAppliedCorrectionKey,
  isAchReturnPrincipalEligible,
  isFullRefund,
  nextCumulativeRefundedCents,
  refundKindFromCumulative,
  refundStatusFromCumulative
} from "./corrections";
import { computeApplicationFeeAmountCents } from "./fees";
import { isPay001DestinationFundingEnvEnabled } from "./flags";
import { evaluateSettlementReadiness, failedCheckIds } from "./readiness";
import type { OrgSettlementAccountMirror } from "./readiness";
import { buildStripeDestinationChargeParams } from "../integrations/payments/stripe-provider";
import { noopPaymentProvider } from "../integrations/payments/noop-provider";
import { stripePaymentProvider } from "../integrations/payments/stripe-provider";

function readyAccount(
  overrides: Partial<OrgSettlementAccountMirror> = {}
): OrgSettlementAccountMirror {
  return {
    id: "ca-1",
    organizationId: "org-1",
    purpose: "org_settlement",
    externalAccountId: "acct_settlement_org1",
    status: "eligible",
    chargesEnabled: true,
    currentlyDue: [],
    pastDue: [],
    disabledReason: null,
    ...overrides
  };
}

function clearFundingEnv() {
  delete process.env["PAY001_DESTINATION_FUNDING_ENABLED"];
  delete process.env["PAYMENT_PROVIDER"];
  delete process.env["STRIPE_SECRET_KEY"];
  delete process.env["STRIPE_MODE"];
}

describe("computeApplicationFeeAmountCents", () => {
  it("computes bps + flat and never exceeds charge", () => {
    expect(
      computeApplicationFeeAmountCents({
        chargeAmountCents: 100_000,
        feeBps: 250,
        feeFlatCents: 100
      })
    ).toBe(2600);
  });
});

describe("feature flag + provider capability (C1/C2)", () => {
  afterEach(() => clearFundingEnv());

  it("env funding defaults off", () => {
    clearFundingEnv();
    expect(isPay001DestinationFundingEnvEnabled()).toBe(false);
  });

  it("requires stripe + secret + env funding for live destination", () => {
    clearFundingEnv();
    expect(canApplyLiveDestinationCharges("noop")).toBe(false);
    expect(canApplyLiveDestinationCharges("stripe")).toBe(false);

    process.env["PAYMENT_PROVIDER"] = "stripe";
    process.env["STRIPE_SECRET_KEY"] = "sk_test_cert";
    expect(canApplyLiveDestinationCharges("stripe")).toBe(false);

    process.env["PAY001_DESTINATION_FUNDING_ENABLED"] = "true";
    expect(canApplyLiveDestinationCharges("stripe")).toBe(true);

    const noopCap = evaluateDestinationProviderCapability("noop");
    expect(noopCap.capable).toBe(false);
    expect(noopCap.reason).toMatch(/stripe/i);
  });

  it("blocks destination when secret missing even if env on", () => {
    process.env["PAYMENT_PROVIDER"] = "stripe";
    process.env["PAY001_DESTINATION_FUNDING_ENABLED"] = "on";
    delete process.env["STRIPE_SECRET_KEY"];
    expect(canApplyLiveDestinationCharges("stripe")).toBe(false);
  });
});

describe("evaluateSettlementReadiness (S1–S8)", () => {
  it("passes when all checks green", () => {
    const result = evaluateSettlementReadiness({
      organizationId: "org-1",
      destinationEnrolled: true,
      fundingEnabled: true,
      account: readyAccount(),
      envFundingEnabled: true
    });
    expect(result.ready).toBe(true);
    expect(failedCheckIds(result)).toEqual([]);
  });

  it("fails S8 on destination mismatch", () => {
    const result = evaluateSettlementReadiness({
      organizationId: "org-1",
      destinationEnrolled: true,
      fundingEnabled: true,
      account: readyAccount(),
      proposedDestinationAccountId: "acct_other_org",
      envFundingEnabled: true
    });
    expect(failedCheckIds(result)).toContain("S8");
  });

  it("fails S6/S7 flag combinations", () => {
    expect(
      failedCheckIds(
        evaluateSettlementReadiness({
          organizationId: "org-1",
          destinationEnrolled: true,
          fundingEnabled: true,
          account: readyAccount(),
          envFundingEnabled: false
        })
      )
    ).toContain("S6");

    expect(
      failedCheckIds(
        evaluateSettlementReadiness({
          organizationId: "org-1",
          destinationEnrolled: true,
          fundingEnabled: false,
          account: readyAccount(),
          envFundingEnabled: true
        })
      )
    ).toContain("S7");
  });
});

describe("live Stripe destination payload", () => {
  it("includes transfer_data.destination and funding metadata", () => {
    const params = buildStripeDestinationChargeParams(
      {
        organizationId: "org-1",
        attemptId: "att-1",
        attemptNumber: "PA-1",
        externalCustomerId: "cus_x",
        amountCents: 50000,
        currency: "usd",
        destinationRouting: {
          settlementAccountId: "acct_settlement_org1",
          applicationFeeAmountCents: 250,
          fundingMode: "destination",
          propertyId: "prop-1",
          paymentAttemptId: "att-1"
        }
      },
      ""
    );
    expect(params["transfer_data[destination]"]).toBe("acct_settlement_org1");
    expect(params["application_fee_amount"]).toBe("250");
    expect(params["metadata[funding_mode]"]).toBe("destination");
    expect(params["metadata[settlement_account_id]"]).toBe("acct_settlement_org1");
    expect(params["metadata[mpa_rail]"]).toBe("resident_rent");
  });

  it("checkout prefix nests transfer_data under payment_intent_data", () => {
    const params = buildStripeDestinationChargeParams(
      {
        organizationId: "org-1",
        attemptId: "att-2",
        attemptNumber: "PA-2",
        externalCustomerId: "cus_x",
        amountCents: 1000,
        currency: "usd",
        destinationRouting: {
          settlementAccountId: "acct_settlement_org1",
          applicationFeeAmountCents: 0,
          fundingMode: "destination",
          paymentAttemptId: "att-2"
        }
      },
      "payment_intent_data"
    );
    expect(params["payment_intent_data[transfer_data][destination]"]).toBe("acct_settlement_org1");
    expect(params["application_fee_amount"]).toBeUndefined();
    expect(params["payment_intent_data[application_fee_amount]"]).toBeUndefined();
  });

  it("omits transfer_data when destinationRouting missing", () => {
    const params = buildStripeDestinationChargeParams(
      {
        organizationId: "org-1",
        attemptId: "att-3",
        attemptNumber: "PA-3",
        externalCustomerId: "cus_x",
        amountCents: 1000,
        currency: "usd"
      },
      ""
    );
    expect(params["transfer_data[destination]"]).toBeUndefined();
    expect(Object.keys(params)).toHaveLength(0);
  });
});

describe("noop / keyless destination refusal (C1)", () => {
  afterEach(() => clearFundingEnv());

  it("noop rejects destinationRouting", async () => {
    await expect(
      noopPaymentProvider.createPaymentAttempt({
        organizationId: "org",
        attemptId: "att",
        attemptNumber: "PA-N",
        externalCustomerId: "noop-cus",
        amountCents: 1000,
        currency: "usd",
        destinationRouting: {
          settlementAccountId: "acct_x",
          applicationFeeAmountCents: 0,
          fundingMode: "destination",
          paymentAttemptId: "att"
        }
      })
    ).rejects.toThrow(/noop|transfer_data/i);
  });

  it("keyless stripe sandbox rejects destinationRouting", async () => {
    delete process.env["STRIPE_SECRET_KEY"];
    process.env["STRIPE_MODE"] = "sandbox";
    await expect(
      stripePaymentProvider.createPaymentAttempt({
        organizationId: "org",
        attemptId: "att-bad",
        attemptNumber: "PA-BAD",
        externalCustomerId: "cus_sandbox_x",
        amountCents: 1000,
        currency: "usd",
        destinationRouting: {
          settlementAccountId: "acct_settlement_test",
          applicationFeeAmountCents: 0,
          fundingMode: "destination",
          paymentAttemptId: "att-bad"
        }
      })
    ).rejects.toThrow(/STRIPE_SECRET_KEY|transfer_data/i);
  });

  it("keyless stripe still allows legacy (no destinationRouting)", async () => {
    delete process.env["STRIPE_SECRET_KEY"];
    process.env["STRIPE_MODE"] = "sandbox";
    const attempt = await stripePaymentProvider.createPaymentAttempt({
      organizationId: "org",
      attemptId: "att-legacy",
      attemptNumber: "PA-LEG",
      externalCustomerId: "cus_sandbox_x",
      amountCents: 1000,
      currency: "usd"
    });
    expect(attempt.externalAttemptId).toContain("pi_sandbox");
  });
});

describe("Slice 2 corrections — fee reversal / A17 / safe corpus", () => {
  it("computes proportional fee reversal and caps at fee", () => {
    expect(
      computeFeeReversalCents({
        chargeAmountCents: 100_000,
        applicationFeeAmountCents: 2_600,
        refundAmountCents: 50_000
      })
    ).toBe(1_300);
    expect(
      computeFeeReversalCents({
        chargeAmountCents: 100_000,
        applicationFeeAmountCents: 100,
        refundAmountCents: 100_000
      })
    ).toBe(100);
    expect(
      computeFeeReversalCents({
        chargeAmountCents: 0,
        applicationFeeAmountCents: 100,
        refundAmountCents: 50
      })
    ).toBe(0);
  });

  it("detects full vs partial refund", () => {
    expect(isFullRefund(10_000, 10_000)).toBe(true);
    expect(isFullRefund(10_000, 9_999)).toBe(false);
  });

  it("fail-closes destination refunds when underfunded or balance unknown (A17)", () => {
    expect(() =>
      assertDestinationRefundBalance({
        fundingMode: "destination",
        refundAmountCents: 5_000,
        availableCents: 4_999
      })
    ).toThrow(/Insufficient|fail closed/i);

    expect(() =>
      assertDestinationRefundBalance({
        fundingMode: "destination",
        refundAmountCents: 100,
        availableCents: null
      })
    ).toThrow(/Cannot verify|fail closed/i);

    expect(() =>
      assertDestinationRefundBalance({
        fundingMode: "destination",
        refundAmountCents: 100,
        availableCents: 100
      })
    ).not.toThrow();

    expect(() =>
      assertDestinationRefundBalance({
        fundingMode: "legacy_platform",
        refundAmountCents: 9_999,
        availableCents: 0
      })
    ).not.toThrow();
  });

  it("excludes refunded / disputed / ACH / legacy from safe corpus", () => {
    expect(
      deriveSafeCorpusExclusion({
        fundingMode: "destination",
        attemptStatus: "refunded"
      })
    ).toEqual({ excluded: true, reason: "refunded" });

    expect(
      deriveSafeCorpusExclusion({
        fundingMode: "destination",
        attemptStatus: "succeeded",
        disputeStatus: "opened"
      })
    ).toEqual({ excluded: true, reason: "dispute_open" });

    expect(
      deriveSafeCorpusExclusion({
        fundingMode: "destination",
        attemptStatus: "succeeded",
        disputeStatus: "lost"
      })
    ).toEqual({ excluded: true, reason: "dispute_lost" });

    expect(
      deriveSafeCorpusExclusion({
        fundingMode: "destination",
        attemptStatus: "succeeded",
        achReturned: true
      })
    ).toEqual({ excluded: true, reason: "ach_returned" });

    expect(
      deriveSafeCorpusExclusion({
        fundingMode: "legacy_platform",
        attemptStatus: "succeeded"
      })
    ).toEqual({ excluded: true, reason: "legacy_platform" });

    expect(
      deriveSafeCorpusExclusion({
        fundingMode: "destination",
        attemptStatus: "succeeded",
        disputeStatus: "won"
      })
    ).toEqual({ excluded: false, reason: null });
  });
});

describe("Slice 2 payments-rail webhook mapping", () => {
  it("maps dispute created / closed won-lost / ACH return", async () => {
    process.env["STRIPE_MODE"] = "sandbox";
    const opened = await stripePaymentProvider.parseWebhook(
      {
        id: "evt_dp_open",
        type: "charge.dispute.created",
        data: {
          object: {
            id: "dp_1",
            amount: 5000,
            payment_intent: "pi_dispute_1",
            status: "needs_response"
          }
        }
      },
      { "x-mpa-simulate": "1", "x-mpa-raw-body": "{}" }
    );
    expect(opened[0]?.type).toBe("dispute_opened");
    expect(opened[0]?.externalPaymentId).toBe("pi_dispute_1");
    expect(opened[0]?.externalCorrectionId).toBe("dp_1");

    const lost = await stripePaymentProvider.parseWebhook(
      {
        id: "evt_dp_lost",
        type: "charge.dispute.closed",
        data: {
          object: {
            id: "dp_2",
            amount: 5000,
            payment_intent: "pi_dispute_2",
            status: "lost"
          }
        }
      },
      { "x-mpa-simulate": "1", "x-mpa-raw-body": "{}" }
    );
    expect(lost[0]?.type).toBe("dispute_lost");

    const ach = await stripePaymentProvider.parseWebhook(
      {
        id: "evt_ach_ret",
        type: "charge.failed",
        data: {
          object: {
            id: "ch_ach_1",
            amount: 12000,
            payment_intent: "pi_ach_1",
            failure_code: "insufficient_funds",
            payment_method_details: { us_bank_account: { account_type: "checking" } }
          }
        }
      },
      { "x-mpa-simulate": "1", "x-mpa-raw-body": "{}" }
    );
    expect(ach[0]?.type).toBe("ach_return");
    expect(ach[0]?.externalPaymentId).toBe("pi_ach_1");
  });

  it("C2 — charge.refunded uses amount_refunded (not charge amount) for partials", async () => {
    process.env["STRIPE_MODE"] = "sandbox";
    const partial = await stripePaymentProvider.parseWebhook(
      {
        id: "evt_ch_ref_partial",
        type: "charge.refunded",
        data: {
          object: {
            id: "ch_partial_1",
            amount: 10000,
            amount_refunded: 2500,
            payment_intent: "pi_partial_1"
          }
        }
      },
      { "x-mpa-simulate": "1", "x-mpa-raw-body": "{}" }
    );
    expect(partial[0]?.type).toBe("partially_refunded");
    expect(partial[0]?.amountCents).toBe(2500);
    expect(partial[0]?.externalCorrectionId).toMatch(/^ch_refunded:/);

    const full = await stripePaymentProvider.parseWebhook(
      {
        id: "evt_ch_ref_full",
        type: "charge.refunded",
        data: {
          object: {
            id: "ch_full_1",
            amount: 10000,
            amount_refunded: 10000,
            payment_intent: "pi_full_1"
          }
        }
      },
      { "x-mpa-simulate": "1", "x-mpa-raw-body": "{}" }
    );
    expect(full[0]?.type).toBe("refunded");
    expect(full[0]?.amountCents).toBe(10000);

    const refundObj = await stripePaymentProvider.parseWebhook(
      {
        id: "evt_re_1",
        type: "refund.created",
        data: {
          object: {
            id: "re_abc",
            amount: 4000,
            payment_intent: "pi_re_1"
          }
        }
      },
      { "x-mpa-simulate": "1", "x-mpa-raw-body": "{}" }
    );
    expect(refundObj[0]?.amountCents).toBe(4000);
    expect(refundObj[0]?.externalCorrectionId).toBe("re_abc");
  });
});

describe("Slice 2 hardening helpers (C1/C3/C4)", () => {
  it("C1 — ACH principal eligibility only after collected statuses", () => {
    expect(isAchReturnPrincipalEligible("succeeded")).toBe(true);
    expect(isAchReturnPrincipalEligible("partially_refunded")).toBe(true);
    expect(isAchReturnPrincipalEligible("processing")).toBe(false);
    expect(isAchReturnPrincipalEligible("failed")).toBe(false);
  });

  it("C3 — correction apply keys dedupe", () => {
    const key = correctionApplyKey("refund", "re_1", "fallback");
    expect(key).toBe("refund:re_1");
    expect(hasAppliedCorrectionKey(["refund:re_1"], key)).toBe(true);
    expect(hasAppliedCorrectionKey(["refund:re_2"], key)).toBe(false);
    expect(correctionApplyKey("ach_return", null, "att-1")).toBe("ach_return:att-1");
  });

  it("C4 — cumulative refund status across partials", () => {
    const afterFirst = nextCumulativeRefundedCents({
      priorCumulativeCents: 0,
      refundDeltaCents: 4000,
      chargeAmountCents: 10000
    });
    expect(afterFirst).toBe(4000);
    expect(refundStatusFromCumulative(10000, afterFirst)).toBe("partially_refunded");
    expect(refundKindFromCumulative(10000, afterFirst)).toBe("partial_refund");

    const afterSecond = nextCumulativeRefundedCents({
      priorCumulativeCents: afterFirst,
      refundDeltaCents: 6000,
      chargeAmountCents: 10000
    });
    expect(afterSecond).toBe(10000);
    expect(refundStatusFromCumulative(10000, afterSecond)).toBe("refunded");
    expect(refundKindFromCumulative(10000, afterSecond)).toBe("refund");
  });
});
