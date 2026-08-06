import { describe, expect, it } from "vitest";
import {
  deriveResidentFinancialStatus,
  nextChargeStatus,
  periodBoundsForDate,
  planPaymentAllocations,
  remainingBalance,
  roundMoney
} from "./billing";
import { FINANCE_FEATURE_FLAGS, FINANCIAL_DOMAIN_REGISTRATION, FIN_OPS_SLICES } from "./index";

describe("FIN-OPS-001 S1 billing allocation", () => {
  it("allocates oldest rent before one-time fees", () => {
    const plan = planPaymentAllocations(
      [
        {
          id: "c-fee",
          due_at: "2026-08-01",
          charge_type: "one_time",
          amount: 50,
          amount_paid: 0,
          status: "open"
        },
        {
          id: "c-rent",
          due_at: "2026-08-01",
          charge_type: "rent",
          amount: 1000,
          amount_paid: 0,
          status: "open"
        }
      ],
      1000
    );

    expect(plan.allocations).toEqual([{ chargeId: "c-rent", amount: 1000 }]);
    expect(plan.unapplied).toBe(0);
  });

  it("supports partial payments and unapplied credit", () => {
    const plan = planPaymentAllocations(
      [
        {
          id: "c1",
          due_at: "2026-07-01",
          charge_type: "rent",
          amount: 500,
          amount_paid: 200,
          status: "partially_paid"
        }
      ],
      400
    );
    expect(plan.allocations[0]?.amount).toBe(300);
    expect(plan.unapplied).toBe(100);
    expect(remainingBalance({ amount: 500, amount_paid: 200 })).toBe(300);
    expect(nextChargeStatus(500, 500)).toBe("paid");
    expect(nextChargeStatus(500, 100)).toBe("partially_paid");
    expect(roundMoney(10.005)).toBe(10.01);
  });

  it("derives delinquent status from past-due balance", () => {
    expect(deriveResidentFinancialStatus({ openBalance: 100, hasPastDue: true })).toBe("delinquent");
    expect(deriveResidentFinancialStatus({ openBalance: 0, hasPastDue: false })).toBe("current");
  });

  it("computes monthly period bounds", () => {
    const bounds = periodBoundsForDate(new Date("2026-08-15T12:00:00.000Z"), 1);
    expect(bounds.periodStart).toBe("2026-08-01");
    expect(bounds.periodEnd).toBe("2026-08-31");
    expect(bounds.dueAt).toBe("2026-08-01");
    expect(bounds.nextRunOn).toBe("2026-09-01");
  });

  it("enables S1–S2 charge, payment, and vendor AP feature flags", () => {
    expect(FINANCE_FEATURE_FLAGS["finance.charges"]).toBe(true);
    expect(FINANCE_FEATURE_FLAGS["finance.payments"]).toBe(true);
    expect(FINANCE_FEATURE_FLAGS["finance.stripe_payment_execution"]).toBe(true);
    expect(FINANCE_FEATURE_FLAGS["finance.vendor_payments"]).toBe(true);
    expect(FINANCE_FEATURE_FLAGS["finance.erp_accounting"]).toBe(false);
    expect(FINANCIAL_DOMAIN_REGISTRATION.currentSlice).toBe("S2");
    expect(FIN_OPS_SLICES.find((slice) => slice.id === "S1")?.status).toBe("complete");
    expect(FIN_OPS_SLICES.find((slice) => slice.id === "S2")?.status).toBe("complete");
  });
});
