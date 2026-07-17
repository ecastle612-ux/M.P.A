"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Select, Textarea } from "@mpa/ui";
import {
  EXPENSE_CATEGORIES,
  EXPENSE_STATUSES,
  toExpenseCategoryLabel,
  type ExpenseCategory,
  type ExpenseRecord,
  type ExpenseStatus
} from "../../lib/financial/contracts";

type ExpenseFormValues = {
  propertyId: string;
  category: ExpenseCategory;
  customCategory: string;
  description: string;
  amount: string;
  expenseDate: string;
  status: ExpenseStatus;
  vendorBillPlaceholder: string;
};

const DEFAULT_VALUES: ExpenseFormValues = {
  propertyId: "",
  category: "maintenance",
  customCategory: "",
  description: "",
  amount: "",
  expenseDate: new Date().toISOString().slice(0, 10),
  status: "pending",
  vendorBillPlaceholder: ""
};

function expenseStatusLabel(status: ExpenseStatus): string {
  const labels: Record<ExpenseStatus, string> = {
    pending: "Pending",
    approved: "Approved",
    paid: "Paid",
    archived: "Archived"
  };
  return labels[status];
}

export function ExpenseForm({
  properties,
  initialPropertyId
}: {
  properties: Array<{ id: string; name: string }>;
  initialPropertyId?: string | null;
}) {
  const router = useRouter();
  const [values, setValues] = useState<ExpenseFormValues>(() => ({
    ...DEFAULT_VALUES,
    propertyId:
      (initialPropertyId && properties.some((option) => option.id === initialPropertyId)
        ? initialPropertyId
        : null) ??
      properties[0]?.id ??
      ""
  }));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!values.propertyId || !values.description.trim() || !values.amount) {
      setError("Property, description, and amount are required.");
      return;
    }

    const amount = Number(values.amount);
    if (!Number.isFinite(amount) || amount < 0) {
      setError("Amount must be a non-negative number.");
      return;
    }

    const payload = {
      propertyId: values.propertyId,
      category: values.category,
      customCategory: values.category === "custom" ? values.customCategory.trim() || null : null,
      description: values.description.trim(),
      amount,
      expenseDate: values.expenseDate,
      status: values.status,
      vendorBillPlaceholder: values.vendorBillPlaceholder.trim() || null
    };

    setSubmitting(true);
    const response = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    setSubmitting(false);

    if (!response.ok) {
      const failure = (await response.json()) as { error?: string };
      setError(failure.error ?? "Unable to record expense.");
      return;
    }

    const success = (await response.json()) as { expense?: ExpenseRecord };
    if (success.expense) {
      router.push("/financials/expenses?from=expense-created");
      router.refresh();
      return;
    }
    router.push("/financials/expenses");
    router.refresh();
  }

  return (
    <Card>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">Record Expense</h1>
          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
            Log property operating costs for reporting and owner statements.
          </p>
        </div>

        <Select
          aria-label="Property"
          value={values.propertyId}
          onChange={(event) => setValues((current) => ({ ...current, propertyId: event.target.value }))}
          required
        >
          <option value="">Select property</option>
          {properties.map((property) => (
            <option key={property.id} value={property.id}>
              {property.name}
            </option>
          ))}
        </Select>

        <div className="grid gap-3 md:grid-cols-2">
          <Select
            aria-label="Category"
            value={values.category}
            onChange={(event) =>
              setValues((current) => ({ ...current, category: event.target.value as ExpenseCategory }))
            }
          >
            {EXPENSE_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {toExpenseCategoryLabel(category)}
              </option>
            ))}
          </Select>
          <Select
            aria-label="Status"
            value={values.status}
            onChange={(event) =>
              setValues((current) => ({ ...current, status: event.target.value as ExpenseStatus }))
            }
          >
            {EXPENSE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {expenseStatusLabel(status)}
              </option>
            ))}
          </Select>
        </div>

        {values.category === "custom" ? (
          <Input
            aria-label="Custom category"
            placeholder="Custom category name"
            value={values.customCategory}
            onChange={(event) => setValues((current) => ({ ...current, customCategory: event.target.value }))}
          />
        ) : null}

        <Textarea
          aria-label="Description"
          placeholder="Expense description"
          rows={3}
          value={values.description}
          onChange={(event) => setValues((current) => ({ ...current, description: event.target.value }))}
          required
        />

        <div className="grid gap-3 md:grid-cols-2">
          <Input
            aria-label="Amount"
            type="number"
            min="0"
            step="0.01"
            placeholder="Amount"
            value={values.amount}
            onChange={(event) => setValues((current) => ({ ...current, amount: event.target.value }))}
            required
          />
          <Input
            aria-label="Expense date"
            type="date"
            value={values.expenseDate}
            onChange={(event) => setValues((current) => ({ ...current, expenseDate: event.target.value }))}
            required
          />
        </div>

        <Input
          aria-label="Vendor bill placeholder"
          placeholder="Vendor bill reference (optional)"
          value={values.vendorBillPlaceholder}
          onChange={(event) => setValues((current) => ({ ...current, vendorBillPlaceholder: event.target.value }))}
        />

        {error ? (
          <p className="text-sm text-[var(--mpa-color-feedback-error)]" role="alert" aria-live="assertive">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving..." : "Record Expense"}
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.push("/financials/expenses")}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
