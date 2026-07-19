"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Select } from "@mpa/ui";
import type { OwnerStatementRecord } from "../../lib/financial/contracts";
import { readApiError } from "../../lib/api/client-error";
import {
  collectIssues,
  validateDateOrder,
  validateRequired,
  type ValidationIssue
} from "../../lib/trust/validation";
import { suggestCurrentAccountingPeriod } from "../../lib/workflow/category-suggest";
import {
  getWorkspaceMemory,
  rememberAccountingPeriod,
  rememberPropertyContext,
  resolveContextId
} from "../../lib/workflow/workspace-memory";
import { ConfirmActionDialog } from "../trust/confirm-action-dialog";
import { ApiErrorAlert, ValidationAlert } from "../trust/validation-alert";
import { OperationalStatus } from "../trust/operational-status";
import { useSubmissionGuard } from "../../hooks/use-submission-guard";

type GenerateStatementFormValues = {
  propertyId: string;
  statementPeriodStart: string;
  statementPeriodEnd: string;
  ownerPlaceholder: string;
};

const DEFAULT_VALUES: GenerateStatementFormValues = {
  propertyId: "",
  statementPeriodStart: "",
  statementPeriodEnd: "",
  ownerPlaceholder: ""
};

export function GenerateStatementForm({
  properties,
  initialPropertyId
}: {
  properties: Array<{ id: string; name: string }>;
  initialPropertyId?: string | null;
}) {
  const router = useRouter();
  const [values, setValues] = useState<GenerateStatementFormValues>(() => {
    const memory = typeof window !== "undefined" ? getWorkspaceMemory() : null;
    const propertyIds = properties.map((p) => p.id);
    const defaults = suggestCurrentAccountingPeriod();
    const remembered = memory?.accountingPeriod?.split(":") ?? [];
    const start = remembered[0] && remembered[1] ? remembered[0] : defaults.start;
    const end = remembered[0] && remembered[1] ? remembered[1] : defaults.end;
    return {
      ...DEFAULT_VALUES,
      propertyId: resolveContextId(initialPropertyId, memory?.propertyId, propertyIds),
      statementPeriodStart: start,
      statementPeriodEnd: end
    };
  });
  const [submitting, setSubmitting] = useState(false);
  const [issues, setIssues] = useState<ValidationIssue[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { busy, run } = useSubmissionGuard(4000);

  function validateForm(): boolean {
    const nextIssues = collectIssues(
      validateRequired(values.propertyId, "Property"),
      validateRequired(values.statementPeriodStart, "Period start"),
      validateRequired(values.statementPeriodEnd, "Period end"),
      validateDateOrder(
        values.statementPeriodStart,
        values.statementPeriodEnd,
        "Period start",
        "Period end"
      )
    );
    setIssues(nextIssues);
    return nextIssues.length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setApiError(null);
    if (!validateForm()) return;
    setConfirmOpen(true);
  }

  async function generateStatement() {
    setConfirmOpen(false);
    const payload = {
      propertyId: values.propertyId,
      statementPeriodStart: values.statementPeriodStart,
      statementPeriodEnd: values.statementPeriodEnd,
      ownerPlaceholder: values.ownerPlaceholder.trim() || null
    };

    await run(`statement:${values.propertyId}:${values.statementPeriodStart}`, async () => {
      setSubmitting(true);
      rememberPropertyContext({ propertyId: values.propertyId });
      rememberAccountingPeriod(`${values.statementPeriodStart}:${values.statementPeriodEnd}`);
      const response = await fetch("/api/owner-statements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      setSubmitting(false);

      if (!response.ok) {
        const failure = await response.json().catch(() => ({}));
        setApiError(readApiError(failure, "Unable to generate owner statement. Check the period and retry."));
        return;
      }

      const success = (await response.json()) as { statement?: OwnerStatementRecord };
      const savedId = success.statement?.id;
      if (savedId) {
        router.push(`/financials/owner-statements/${savedId}?from=statement-generated`);
        router.refresh();
        return;
      }
      router.push("/financials/owner-statements");
      router.refresh();
    });
  }

  return (
    <Card>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
            Generate Owner Statement
          </h1>
          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
            Aggregate income, expenses, and occupancy for a property reporting period.
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
          <Input
            aria-label="Period start"
            type="date"
            value={values.statementPeriodStart}
            onChange={(event) =>
              setValues((current) => ({ ...current, statementPeriodStart: event.target.value }))
            }
            required
          />
          <Input
            aria-label="Period end"
            type="date"
            value={values.statementPeriodEnd}
            onChange={(event) => setValues((current) => ({ ...current, statementPeriodEnd: event.target.value }))}
            required
          />
        </div>

        <Input
          aria-label="Owner placeholder"
          placeholder="Owner name or placeholder (optional)"
          value={values.ownerPlaceholder}
          onChange={(event) => setValues((current) => ({ ...current, ownerPlaceholder: event.target.value }))}
        />

        <ValidationAlert issues={issues} />
        {apiError ? <ApiErrorAlert message={apiError} /> : null}
        {submitting || busy ? <OperationalStatus message="Generating owner statement…" /> : null}

        <div className="sticky bottom-0 z-10 -mx-1 flex flex-wrap gap-2 border-t border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)]/95 px-1 py-3 backdrop-blur supports-[backdrop-filter]:bg-[var(--mpa-color-bg-surface)]/80 md:static md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
          <Button type="submit" disabled={submitting || busy} className="min-h-11 min-w-[8.5rem]">
            {submitting || busy ? "Generating..." : "Generate Statement"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="min-h-11"
            onClick={() => router.push("/financials/owner-statements")}
          >
            Cancel
          </Button>
        </div>

        <ConfirmActionDialog
          open={confirmOpen}
          title="Generate owner statement?"
          consequence="M.P.A. will aggregate income, expenses, and occupancy for the selected property and period. Review the statement before sharing with an owner."
          confirmLabel="Generate statement"
          busy={submitting || busy}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() => void generateStatement()}
        />
      </form>
    </Card>
  );
}
