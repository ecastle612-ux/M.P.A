import { describe, expect, it } from "vitest";
import {
  AUTOPAY_CONSENT_VERSION,
  FRIENDLY_PAYMENT_ERRORS,
  LEDGER_ENTRY_TYPES,
  PAYMENT_ATTEMPT_STATUSES,
  friendlyPaymentError
} from "./contracts";

describe("billing contracts", () => {
  it("defines autopay consent version", () => {
    expect(AUTOPAY_CONSENT_VERSION).toBe("autopay-v1");
  });

  it("includes awaiting_reconciliation attempt status", () => {
    expect(PAYMENT_ATTEMPT_STATUSES).toContain("awaiting_reconciliation");
  });

  it("includes immutable ledger entry types", () => {
    expect(LEDGER_ENTRY_TYPES).toEqual(
      expect.arrayContaining(["charge", "payment", "refund", "credit", "late_fee", "receipt"])
    );
  });

  it("never exposes raw provider jargon as default error", () => {
    expect(friendlyPaymentError(null)).toBe(FRIENDLY_PAYMENT_ERRORS["default"]);
    expect(friendlyPaymentError("card_declined")).not.toMatch(/stripe/i);
  });
});
