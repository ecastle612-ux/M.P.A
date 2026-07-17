"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Select, Textarea } from "@mpa/ui";
import {
  PAYMENT_METHODS,
  formatCurrency,
  type PaymentMethod,
  type PaymentRecord,
  type RentChargeRecord
} from "../../lib/financial/contracts";

function paymentMethodLabel(method: PaymentMethod): string {
  const labels: Record<PaymentMethod, string> = {
    manual: "Manual",
    check: "Check",
    cash: "Cash",
    ach_placeholder: "ACH (placeholder)",
    card_placeholder: "Card (placeholder)"
  };
  return labels[method];
}

export function RecordPaymentForm({
  charge
}: {
  charge: RentChargeRecord & {
    propertyName?: string | null;
    unitNumber?: string | null;
    tenantName?: string | null;
  };
}) {
  const router = useRouter();
  const [amount, setAmount] = useState(charge.outstandingBalance > 0 ? String(charge.outstandingBalance) : "");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("manual");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [referenceNote, setReferenceNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Payment amount must be a positive number.");
      return;
    }
    if (parsedAmount > charge.outstandingBalance) {
      setError(`Amount cannot exceed outstanding balance of ${formatCurrency(charge.outstandingBalance)}.`);
      return;
    }

    setSubmitting(true);
    const response = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rentChargeId: charge.id,
        amount: parsedAmount,
        paymentMethod,
        paymentDate,
        referenceNote: referenceNote.trim() || null
      })
    });
    setSubmitting(false);

    if (!response.ok) {
      const failure = (await response.json()) as { error?: string };
      setError(failure.error ?? "Unable to record payment.");
      return;
    }

    const success = (await response.json()) as { payment?: PaymentRecord };
    if (success.payment) {
      router.push(`/financials/charges/${charge.id}?from=payment-recorded`);
      router.refresh();
      return;
    }
    router.refresh();
  }

  if (charge.outstandingBalance <= 0 || charge.status === "paid" || charge.status === "waived") {
    return (
      <Card>
        <h2 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">Record payment</h2>
        <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
          This charge has no outstanding balance. No payment is required.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <h2 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">Record payment</h2>
          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
            Outstanding: {formatCurrency(charge.outstandingBalance)} on {charge.chargeNumber}
          </p>
        </div>

        <Input
          aria-label="Payment amount"
          type="number"
          min="0.01"
          step="0.01"
          max={charge.outstandingBalance}
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          required
        />

        <Select
          aria-label="Payment method"
          value={paymentMethod}
          onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}
        >
          {PAYMENT_METHODS.map((method) => (
            <option key={method} value={method}>
              {paymentMethodLabel(method)}
            </option>
          ))}
        </Select>

        <Input
          aria-label="Payment date"
          type="date"
          value={paymentDate}
          onChange={(event) => setPaymentDate(event.target.value)}
          required
        />

        <Textarea
          aria-label="Reference note"
          placeholder="Check number, memo, or reference"
          rows={2}
          value={referenceNote}
          onChange={(event) => setReferenceNote(event.target.value)}
        />

        {error ? (
          <p className="text-sm text-[var(--mpa-color-feedback-error)]" role="alert" aria-live="assertive">
            {error}
          </p>
        ) : null}

        <Button type="submit" disabled={submitting}>
          {submitting ? "Recording..." : "Record Payment"}
        </Button>
      </form>
    </Card>
  );
}
