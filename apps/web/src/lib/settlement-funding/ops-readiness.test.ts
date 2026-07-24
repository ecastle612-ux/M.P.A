import { describe, expect, it } from "vitest";

import {
  evaluatePay001ProductionReadiness,
  isPay001OpsRunbookId,
  moneyInReconcileWorkflowSteps,
  PAY001_OPS_RUNBOOK_IDS
} from "./ops-readiness";

describe("evaluatePay001ProductionReadiness", () => {
  it("fails closed when env and attestations missing", () => {
    const result = evaluatePay001ProductionReadiness({
      paymentProvider: "",
      stripeSecretKey: "",
      pay001DestinationFundingEnabled: "0",
      stripeWebhookSecret: "",
      q3bFeeRatesAttested: false,
      q4DisputeFeeAttested: false
    });
    expect(result.readyForProductionDestination).toBe(false);
    expect(result.failedIds.length).toBeGreaterThan(0);
  });

  it("passes when Stripe env + attestations complete", () => {
    const result = evaluatePay001ProductionReadiness({
      paymentProvider: "stripe",
      stripeSecretKey: "sk_test_x",
      pay001DestinationFundingEnabled: "true",
      stripeWebhookSecret: "whsec_x",
      q3bFeeRatesAttested: true,
      q4DisputeFeeAttested: true
    });
    expect(result.readyForProductionDestination).toBe(true);
    expect(result.failedIds).toEqual([]);
    expect(result.checks.every((c) => c.ok)).toBe(true);
  });

  it("requires Q3b/Q4 attestations even when env is set", () => {
    const result = evaluatePay001ProductionReadiness({
      paymentProvider: "stripe",
      stripeSecretKey: "sk_live_x",
      pay001DestinationFundingEnabled: "on",
      stripeWebhookSecret: "whsec_x",
      q3bFeeRatesAttested: false,
      q4DisputeFeeAttested: true
    });
    expect(result.readyForProductionDestination).toBe(false);
    expect(result.failedIds).toContain("PR5_q3b_fee_attestation");
  });
});

describe("PAY001 ops runbook registry", () => {
  it("lists A12 procedure ids", () => {
    expect(PAY001_OPS_RUNBOOK_IDS).toContain("reconcile_money_in");
    expect(PAY001_OPS_RUNBOOK_IDS).toContain("freeze_funding");
    expect(isPay001OpsRunbookId("refund_destination")).toBe(true);
    expect(isPay001OpsRunbookId("owner_transfer")).toBe(false);
  });

  it("documents money-in reconcile steps without inventing cash", () => {
    const steps = moneyInReconcileWorkflowSteps();
    expect(steps.length).toBeGreaterThanOrEqual(5);
    expect(steps.some((s) => s.action.includes("createTransfer"))).toBe(true);
    expect(steps.some((s) => s.system.includes("getMoneyInSettlementReconcile"))).toBe(true);
  });
});
