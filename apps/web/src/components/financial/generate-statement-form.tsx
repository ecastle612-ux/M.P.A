"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Select } from "@mpa/ui";
import type { OwnerStatementRecord } from "../../lib/financial/contracts";

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
  const [values, setValues] = useState<GenerateStatementFormValues>(() => ({
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

    if (!values.propertyId || !values.statementPeriodStart || !values.statementPeriodEnd) {
      setError("Property and statement period are required.");
      return;
    }
    if (values.statementPeriodStart > values.statementPeriodEnd) {
      setError("Period start must be on or before period end.");
      return;
    }

    const payload = {
      propertyId: values.propertyId,
      statementPeriodStart: values.statementPeriodStart,
      statementPeriodEnd: values.statementPeriodEnd,
      ownerPlaceholder: values.ownerPlaceholder.trim() || null
    };

    setSubmitting(true);
    const response = await fetch("/api/owner-statements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    setSubmitting(false);

    if (!response.ok) {
      const failure = (await response.json()) as { error?: string };
      setError(failure.error ?? "Unable to generate owner statement.");
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

        {error ? (
          <p className="text-sm text-[var(--mpa-color-feedback-error)]" role="alert" aria-live="assertive">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Generating..." : "Generate Statement"}
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.push("/financials/owner-statements")}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
