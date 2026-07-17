import type { RentChargeRecord } from "./contracts";

export function assertPaymentAmountValid(amount: number): void {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Payment amount must be greater than zero.");
  }
}

export function assertPaymentAgainstCharge(charge: RentChargeRecord, amount: number): void {
  if (charge.status === "paid" || charge.status === "waived" || charge.status === "cancelled") {
    throw new Error("Cannot record payment against a closed charge.");
  }
  if (amount > charge.outstandingBalance) {
    throw new Error("Payment amount exceeds the charge outstanding balance.");
  }
}
