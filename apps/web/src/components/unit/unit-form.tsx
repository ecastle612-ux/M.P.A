"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Card, Input, Select } from "@mpa/ui";
import {
  UNIT_OCCUPANCY_STATUSES,
  UNIT_STATUSES,
  toUnitOccupancyLabel,
  type UnitRecord
} from "../../lib/unit/contracts";

type UnitFormValues = {
  propertyId: string;
  unitNumber: string;
  unitLabel: string;
  bedrooms: string;
  bathrooms: string;
  squareFeet: string;
  floor: string;
  rentAmount: string;
  depositAmount: string;
  currencyCode: string;
  occupancyStatus: UnitRecord["occupancyStatus"];
  status: UnitRecord["status"];
};

const DEFAULT_VALUES: UnitFormValues = {
  propertyId: "",
  unitNumber: "",
  unitLabel: "",
  bedrooms: "",
  bathrooms: "",
  squareFeet: "",
  floor: "",
  rentAmount: "",
  depositAmount: "",
  currencyCode: "USD",
  occupancyStatus: "vacant_not_ready",
  status: "active"
};

export function UnitForm({
  mode,
  unit,
  properties,
  initialPropertyId
}: {
  mode: "create" | "edit";
  unit?: UnitRecord | null;
  properties: Array<{ id: string; name: string }>;
  initialPropertyId?: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setupMode = searchParams.get("setup") === "1";
  const [values, setValues] = useState<UnitFormValues>(() =>
    unit
      ? {
          propertyId: unit.propertyId,
          unitNumber: unit.unitNumber,
          unitLabel: unit.unitLabel ?? "",
          bedrooms: unit.bedrooms?.toString() ?? "",
          bathrooms: unit.bathrooms?.toString() ?? "",
          squareFeet: unit.squareFeet?.toString() ?? "",
          floor: unit.floor ?? "",
          rentAmount: unit.rentAmount?.toString() ?? "",
          depositAmount: unit.depositAmount?.toString() ?? "",
          currencyCode: unit.currencyCode,
          occupancyStatus: unit.occupancyStatus,
          status: unit.status
        }
      : {
          ...DEFAULT_VALUES,
          propertyId:
            (initialPropertyId && properties.some((propertyOption) => propertyOption.id === initialPropertyId)
              ? initialPropertyId
              : null) ??
            properties[0]?.id ??
            ""
        }
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!values.propertyId || !values.unitNumber.trim()) {
      setError("Property and unit number are required.");
      return;
    }
    const numericFields = [
      ["Bedrooms", values.bedrooms],
      ["Bathrooms", values.bathrooms],
      ["Square feet", values.squareFeet],
      ["Rent amount", values.rentAmount],
      ["Deposit amount", values.depositAmount]
    ] as const;
    for (const [label, value] of numericFields) {
      if (!value.trim()) continue;
      const parsed = Number.parseFloat(value);
      if (!Number.isFinite(parsed) || parsed < 0) {
        setError(`${label} must be zero or greater.`);
        return;
      }
    }

    setSubmitting(true);
    const payload = {
      propertyId: values.propertyId,
      unitNumber: values.unitNumber.trim(),
      unitLabel: values.unitLabel,
      bedrooms: values.bedrooms,
      bathrooms: values.bathrooms,
      squareFeet: values.squareFeet,
      floor: values.floor,
      rentAmount: values.rentAmount,
      depositAmount: values.depositAmount,
      currencyCode: values.currencyCode.toUpperCase(),
      occupancyStatus: values.occupancyStatus,
      status: values.status
    };

    const response = await fetch(mode === "create" ? "/api/units" : `/api/units/${unit?.id ?? ""}`, {
      method: mode === "create" ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mode === "create" ? payload : { action: "update", ...payload })
    });
    setSubmitting(false);
    if (!response.ok) {
      const failure = (await response.json()) as { error?: string };
      setError(failure.error ?? "Unable to save unit.");
      return;
    }

    const success = (await response.json()) as { unit?: UnitRecord };
    const savedId = success.unit?.id ?? unit?.id;
    if (savedId) {
      if (mode === "create") {
        if (setupMode) {
          router.push("/setup");
        } else {
          router.push(`/units/${savedId}?from=unit-created`);
        }
      } else {
        router.push(`/units/${savedId}`);
      }
      router.refresh();
      return;
    }
    router.push("/units");
    router.refresh();
  }

  return (
    <Card>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
            {mode === "create" ? "Create Unit" : "Edit Unit"}
          </h1>
          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
            Capture unit readiness and occupancy, then continue directly to tenant assignment.
          </p>
        </div>
        {mode === "create" ? (
          <p className="rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface-muted)] px-3 py-2 text-xs text-[var(--mpa-color-text-secondary)]">
            Next step after save: assign a tenant for this unit and update occupancy in one flow.
          </p>
        ) : null}

        <div className="grid gap-3 md:grid-cols-2">
          <Select
            aria-label="Property"
            value={values.propertyId}
            onChange={(event) => setValues((current) => ({ ...current, propertyId: event.target.value }))}
          >
            {properties.map((propertyOption) => (
              <option key={propertyOption.id} value={propertyOption.id}>
                {propertyOption.name}
              </option>
            ))}
          </Select>
          <Input
            aria-label="Unit number"
            placeholder="Unit number"
            value={values.unitNumber}
            onChange={(event) => setValues((current) => ({ ...current, unitNumber: event.target.value }))}
            autoFocus={mode === "create"}
            required
          />
          <Input
            aria-label="Unit label"
            placeholder="Unit label"
            value={values.unitLabel}
            onChange={(event) => setValues((current) => ({ ...current, unitLabel: event.target.value }))}
          />
          <Input
            aria-label="Floor"
            placeholder="Floor"
            value={values.floor}
            onChange={(event) => setValues((current) => ({ ...current, floor: event.target.value }))}
          />
          <Input
            aria-label="Bedrooms"
            placeholder="Bedrooms"
            inputMode="decimal"
            value={values.bedrooms}
            onChange={(event) => setValues((current) => ({ ...current, bedrooms: event.target.value }))}
          />
          <Input
            aria-label="Bathrooms"
            placeholder="Bathrooms"
            inputMode="decimal"
            value={values.bathrooms}
            onChange={(event) => setValues((current) => ({ ...current, bathrooms: event.target.value }))}
          />
          <Input
            aria-label="Square feet"
            placeholder="Square feet"
            inputMode="numeric"
            value={values.squareFeet}
            onChange={(event) => setValues((current) => ({ ...current, squareFeet: event.target.value }))}
          />
          <Input
            aria-label="Rent amount"
            placeholder="Rent amount"
            inputMode="decimal"
            value={values.rentAmount}
            onChange={(event) => setValues((current) => ({ ...current, rentAmount: event.target.value }))}
          />
          <Input
            aria-label="Deposit amount"
            placeholder="Deposit amount"
            inputMode="decimal"
            value={values.depositAmount}
            onChange={(event) => setValues((current) => ({ ...current, depositAmount: event.target.value }))}
          />
          <Input
            aria-label="Currency"
            placeholder="Currency"
            value={values.currencyCode}
            onChange={(event) => setValues((current) => ({ ...current, currencyCode: event.target.value }))}
          />
          <Select
            aria-label="Occupancy status"
            value={values.occupancyStatus}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                occupancyStatus: event.target.value as UnitRecord["occupancyStatus"]
              }))
            }
          >
            {UNIT_OCCUPANCY_STATUSES.map((status) => (
              <option key={status} value={status}>
                {toUnitOccupancyLabel(status)}
              </option>
            ))}
          </Select>
          <Select
            aria-label="Unit status"
            value={values.status}
            onChange={(event) =>
              setValues((current) => ({ ...current, status: event.target.value as UnitRecord["status"] }))
            }
          >
            {UNIT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status[0]?.toUpperCase() + status.slice(1)}
              </option>
            ))}
          </Select>
        </div>

        {error ? (
          <p className="text-sm text-[var(--mpa-color-feedback-error)]" role="alert" aria-live="assertive">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving..." : mode === "create" ? "Create Unit" : "Save Unit"}
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.push("/units")}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
