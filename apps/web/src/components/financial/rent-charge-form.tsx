"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Select, Textarea } from "@mpa/ui";
import {
  CHARGE_TYPES,
  type ChargeType,
  type RentChargeRecord
} from "../../lib/financial/contracts";

type RentChargeFormValues = {
  leaseId: string;
  chargeType: ChargeType;
  description: string;
  amount: string;
  dueDate: string;
  periodStart: string;
  periodEnd: string;
};

const DEFAULT_VALUES: RentChargeFormValues = {
  leaseId: "",
  chargeType: "custom",
  description: "",
  amount: "",
  dueDate: "",
  periodStart: "",
  periodEnd: ""
};

function chargeTypeLabel(type: ChargeType): string {
  const labels: Record<ChargeType, string> = {
    monthly_rent: "Monthly rent",
    custom: "Custom",
    security_deposit: "Security deposit"
  };
  return labels[type];
}

export function RentChargeForm({
  leases
}: {
  leases: Array<{
    id: string;
    propertyName: string | null;
    unitNumber: string | null;
    tenantName: string | null;
    status: string;
  }>;
}) {
  const router = useRouter();
  const [values, setValues] = useState<RentChargeFormValues>(() => ({
    ...DEFAULT_VALUES,
    leaseId: leases[0]?.id ?? ""
  }));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!values.leaseId || !values.description.trim() || !values.amount || !values.dueDate) {
      setError("Lease, description, amount, and due date are required.");
      return;
    }

    const amount = Number(values.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Amount must be a positive number.");
      return;
    }

    const payload = {
      leaseId: values.leaseId,
      chargeType: values.chargeType,
      description: values.description.trim(),
      amount,
      dueDate: values.dueDate,
      periodStart: values.periodStart || null,
      periodEnd: values.periodEnd || null
    };

    setSubmitting(true);
    const response = await fetch("/api/rent-charges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    setSubmitting(false);

    if (!response.ok) {
      const failure = (await response.json()) as { error?: string };
      setError(failure.error ?? "Unable to create rent charge.");
      return;
    }

    const success = (await response.json()) as { charge?: RentChargeRecord };
    const savedId = success.charge?.id;
    if (savedId) {
      router.push(`/financials/charges/${savedId}?from=charge-created`);
      router.refresh();
      return;
    }
    router.push("/financials/charges");
    router.refresh();
  }

  return (
    <Card>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">Create Rent Charge</h1>
          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
            Bill a lease for rent, deposits, or custom charges.
          </p>
        </div>

        <Select
          aria-label="Lease"
          value={values.leaseId}
          onChange={(event) => setValues((current) => ({ ...current, leaseId: event.target.value }))}
          required
        >
          <option value="">Select lease</option>
          {leases.map((lease) => (
            <option key={lease.id} value={lease.id}>
              {[lease.propertyName, lease.unitNumber ? `Unit ${lease.unitNumber}` : null, lease.tenantName]
                .filter(Boolean)
                .join(" · ")}{" "}
              ({lease.status})
            </option>
          ))}
        </Select>

        <Select
          aria-label="Charge type"
          value={values.chargeType}
          onChange={(event) =>
            setValues((current) => ({ ...current, chargeType: event.target.value as ChargeType }))
          }
        >
          {CHARGE_TYPES.map((type) => (
            <option key={type} value={type}>
              {chargeTypeLabel(type)}
            </option>
          ))}
        </Select>

        <Textarea
          aria-label="Description"
          placeholder="Charge description"
          rows={3}
          value={values.description}
          onChange={(event) => setValues((current) => ({ ...current, description: event.target.value }))}
          required
        />

        <div className="grid gap-3 md:grid-cols-2">
          <Input
            aria-label="Amount"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="Amount"
            value={values.amount}
            onChange={(event) => setValues((current) => ({ ...current, amount: event.target.value }))}
            required
          />
          <Input
            aria-label="Due date"
            type="date"
            value={values.dueDate}
            onChange={(event) => setValues((current) => ({ ...current, dueDate: event.target.value }))}
            required
          />
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <Input
            aria-label="Period start"
            type="date"
            value={values.periodStart}
            onChange={(event) => setValues((current) => ({ ...current, periodStart: event.target.value }))}
          />
          <Input
            aria-label="Period end"
            type="date"
            value={values.periodEnd}
            onChange={(event) => setValues((current) => ({ ...current, periodEnd: event.target.value }))}
          />
        </div>

        {error ? (
          <p className="text-sm text-[var(--mpa-color-feedback-error)]" role="alert" aria-live="assertive">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving..." : "Create Charge"}
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.push("/financials/charges")}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
