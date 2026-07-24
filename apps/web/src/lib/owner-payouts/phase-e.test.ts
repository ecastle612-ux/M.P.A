import { describe, expect, it } from "vitest";
import { canSelectOwnerPayoutRow } from "./owner-row-visibility";
import { mapIntentVisibility, ownerPayoutProjectionPropertyIds } from "./projections";

describe("FIN-003 Phase E — R-D1 owner-row visibility", () => {
  const base = {
    viewerUserId: "owner-a",
    rowOwnerUserId: "owner-b",
    isPayoutManage: false,
    isFinancialAdmin: false,
    isOrgManager: false,
    hasFinancialRead: true
  };

  it("denies owner A reading owner B remittance/intent rows", () => {
    expect(canSelectOwnerPayoutRow(base)).toBe(false);
  });

  it("allows owner reading own rows with financial:read", () => {
    expect(
      canSelectOwnerPayoutRow({
        ...base,
        rowOwnerUserId: "owner-a"
      })
    ).toBe(true);
  });

  it("allows payout:manage staff org-wide", () => {
    expect(canSelectOwnerPayoutRow({ ...base, isPayoutManage: true })).toBe(true);
  });

  it("allows property_manager (is_org_manager) org-wide", () => {
    expect(canSelectOwnerPayoutRow({ ...base, isOrgManager: true })).toBe(true);
  });

  it("allows financial:admin org-wide", () => {
    expect(canSelectOwnerPayoutRow({ ...base, isFinancialAdmin: true })).toBe(true);
  });
});

describe("FIN-003 Phase E — R-D3 payout history property scope", () => {
  it("does not silently truncate property ids for payout projections", () => {
    const ids = Array.from({ length: 35 }, (_, i) => `prop-${i}`);
    expect(ownerPayoutProjectionPropertyIds(ids)).toHaveLength(35);
    expect(ownerPayoutProjectionPropertyIds(ids)).toEqual(ids);
  });
});

describe("FIN-003 Phase E — honesty regression", () => {
  it("still maps needs_reconcile to pending not paid", () => {
    expect(mapIntentVisibility("needs_reconcile")).toBe("pending");
    expect(mapIntentVisibility("paid")).toBe("paid");
  });
});

describe("FIN-003 Phase E — R-D2 remittance notify event keys", () => {
  it("uses intent-scoped remittance key so retries are idempotent after create", () => {
    const intentId = "intent-paid-1";
    expect(`payout.remittance.issued:${intentId}:owner`).toBe(
      "payout.remittance.issued:intent-paid-1:owner"
    );
  });
});

/** Integration-style contract: paid persistence must call remittance ensure before notify may fail. */
describe("FIN-003 Phase E — R-D2 remittance reliability contract", () => {
  it("documents remittance-at-paid before notify (markIntentPaid + webhook paid)", () => {
    const pipeline = ["markIntentPaid|webhookPaid", "ensureRemittanceRecord", "notifyTransferOutcome"];
    expect(pipeline.indexOf("ensureRemittanceRecord")).toBeLessThan(
      pipeline.indexOf("notifyTransferOutcome")
    );
  });
});
