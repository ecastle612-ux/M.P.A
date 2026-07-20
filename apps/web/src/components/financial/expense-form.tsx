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
import { readApiError } from "../../lib/api/client-error";
import {
  collectIssues,
  validateNonNegativeMoney,
  validateRequired,
  type ValidationIssue
} from "../../lib/trust/validation";
import { getWorkspaceMemory, rememberPropertyContext, resolveContextId } from "../../lib/workflow/workspace-memory";
import { ApiErrorAlert, ValidationAlert } from "../trust/validation-alert";
import { OperationalStatus } from "../trust/operational-status";
import { useSubmissionGuard } from "../../hooks/use-submission-guard";

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
  const [values, setValues] = useState<ExpenseFormValues>(() => {
    const memory = typeof window !== "undefined" ? getWorkspaceMemory() : null;
    const propertyIds = properties.map((p) => p.id);
    return {
      ...DEFAULT_VALUES,
      propertyId: resolveContextId(initialPropertyId, memory?.propertyId, propertyIds)
    };
  });
  const [submitting, setSubmitting] = useState(false);
  const [issues, setIssues] = useState<ValidationIssue[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const { busy, run } = useSubmissionGuard();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIssues([]);
    setApiError(null);

    const nextIssues = collectIssues(
      validateRequired(values.propertyId, "Property"),
      validateRequired(values.description, "Description"),
      validateNonNegativeMoney(values.amount, "Amount", true),
      validateRequired(values.expenseDate, "Expense date")
    );
    if (nextIssues.length > 0) {
      setIssues(nextIssues);
      return;
    }

    const amount = Number(values.amount);
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

    await run(`expense:${values.propertyId}:${values.amount}`, async () => {
      setSubmitting(true);
      rememberPropertyContext({ propertyId: values.propertyId });
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      setSubmitting(false);

      if (!response.ok) {
        const failure = await response.json().catch(() => ({}));
        setApiError(readApiError(failure, "Unable to record expense. Check amount and property, then retry."));
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
    });
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
          aria-label="Vendor bill reference"
          placeholder="Vendor bill reference (optional)"
          value={values.vendorBillPlaceholder}
          onChange={(event) => setValues((current) => ({ ...current, vendorBillPlaceholder: event.target.value }))}
        />

        <ValidationAlert issues={issues} />
        {apiError ? <ApiErrorAlert message={apiError} /> : null}
        {submitting || busy ? <OperationalStatus message="Recording expense…" /> : null}

        <div className="sticky bottom-0 z-10 -mx-1 flex flex-wrap gap-2 border-t border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)]/95 px-1 py-3 backdrop-blur supports-[backdrop-filter]:bg-[var(--mpa-color-bg-surface)]/80 md:static md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
          <Button type="submit" disabled={submitting || busy}>
            {submitting || busy ? "Saving..." : "Record Expense"}
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.push("/financials/expenses")}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
