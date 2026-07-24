import { describe, expect, it } from "vitest";
import { mapIntentVisibility, statusLabel } from "./projections";

describe("FIN-003 Phase D — TransferIntent visibility honesty", () => {
  it("maps paid and in_transit to paid visibility", () => {
    expect(mapIntentVisibility("paid")).toBe("paid");
    expect(mapIntentVisibility("in_transit")).toBe("paid");
  });

  it("maps failed distinctly", () => {
    expect(mapIntentVisibility("failed")).toBe("failed");
  });

  it("maps ambiguous / in-flight states to pending (not paid)", () => {
    expect(mapIntentVisibility("eligible")).toBe("pending");
    expect(mapIntentVisibility("pending")).toBe("pending");
    expect(mapIntentVisibility("executing")).toBe("pending");
    expect(mapIntentVisibility("needs_reconcile")).toBe("pending");
  });

  it("never invents paid for unknown statuses", () => {
    expect(mapIntentVisibility("weird")).toBe("other");
    expect(mapIntentVisibility("weird")).not.toBe("paid");
  });

  it("labels known statuses for UX", () => {
    expect(statusLabel("needs_reconcile")).toBe("Needs reconcile");
    expect(statusLabel("in_transit")).toBe("In transit");
  });
});

describe("FIN-003 Phase D — notification event keys", () => {
  it("uses intent-scoped idempotent keys", () => {
    const intentId = "intent-abc";
    expect(`payout.transfer.paid:${intentId}:owner`).toBe(
      "payout.transfer.paid:intent-abc:owner"
    );
    expect(`payout.transfer.failed:${intentId}:owner`).toBe(
      "payout.transfer.failed:intent-abc:owner"
    );
    expect(`payout.remittance.issued:${intentId}:owner`).toBe(
      "payout.remittance.issued:intent-abc:owner"
    );
    expect(`payout.run.attention:run-1:pm`).toBe("payout.run.attention:run-1:pm");
  });
});
