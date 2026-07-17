"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Card, Input, Select, Textarea } from "@mpa/ui";
import {
  LEASE_TYPES,
  toLeaseTypeLabel,
  type LeaseRecord
} from "../../lib/lease/contracts";

type LeaseFormValues = {
  leaseNumber: string;
  propertyId: string;
  unitId: string;
  primaryTenantId: string;
  coTenantPlaceholder: string;
  leaseType: LeaseRecord["leaseType"];
  startDate: string;
  endDate: string;
  moveInDate: string;
  moveOutDate: string;
  rentAmount: string;
  securityDeposit: string;
  lateFeePlaceholder: string;
  renewalOption: boolean;
  noticePeriodDays: string;
  internalNotes: string;
};

const DEFAULT_VALUES: LeaseFormValues = {
  leaseNumber: "",
  propertyId: "",
  unitId: "",
  primaryTenantId: "",
  coTenantPlaceholder: "",
  leaseType: "residential",
  startDate: "",
  endDate: "",
  moveInDate: "",
  moveOutDate: "",
  rentAmount: "",
  securityDeposit: "0",
  lateFeePlaceholder: "",
  renewalOption: false,
  noticePeriodDays: "",
  internalNotes: ""
};

function toFormValues(lease: LeaseRecord): LeaseFormValues {
  return {
    leaseNumber: lease.leaseNumber,
    propertyId: lease.propertyId,
    unitId: lease.unitId,
    primaryTenantId: lease.primaryTenantId,
    coTenantPlaceholder: lease.coTenantPlaceholder ?? "",
    leaseType: lease.leaseType,
    startDate: lease.startDate,
    endDate: lease.endDate,
    moveInDate: lease.moveInDate ?? "",
    moveOutDate: lease.moveOutDate ?? "",
    rentAmount: String(lease.rentAmount),
    securityDeposit: String(lease.securityDeposit),
    lateFeePlaceholder: lease.lateFeePlaceholder ?? "",
    renewalOption: lease.renewalOption,
    noticePeriodDays: lease.noticePeriodDays !== null ? String(lease.noticePeriodDays) : "",
    internalNotes: lease.internalNotes ?? ""
  };
}

export function LeaseForm({
  mode,
  lease,
  properties,
  units,
  tenants,
  initialPropertyId,
  initialUnitId,
  initialTenantId
}: {
  mode: "create" | "edit";
  lease?: LeaseRecord | null;
  properties: Array<{ id: string; name: string }>;
  units: Array<{ id: string; propertyId: string; unitNumber: string; unitLabel: string | null }>;
  tenants: Array<{ id: string; propertyId: string | null; unitId: string | null; name: string }>;
  initialPropertyId?: string | null;
  initialUnitId?: string | null;
  initialTenantId?: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setupMode = searchParams.get("setup") === "1";
  const [values, setValues] = useState<LeaseFormValues>(() =>
    lease
      ? toFormValues(lease)
      : {
          ...DEFAULT_VALUES,
          propertyId:
            (initialPropertyId && properties.some((propertyOption) => propertyOption.id === initialPropertyId)
              ? initialPropertyId
              : null) ??
            properties[0]?.id ??
            "",
          unitId:
            initialUnitId && units.some((unitOption) => unitOption.id === initialUnitId) ? initialUnitId : "",
          primaryTenantId:
            initialTenantId && tenants.some((tenantOption) => tenantOption.id === initialTenantId)
              ? initialTenantId
              : ""
        }
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableUnits = useMemo(
    () => units.filter((unitOption) => unitOption.propertyId === values.propertyId),
    [units, values.propertyId]
  );

  const availableTenants = useMemo(
    () =>
      tenants.filter((tenantOption) => {
        if (!values.propertyId) return true;
        if (!tenantOption.propertyId) return true;
        return tenantOption.propertyId === values.propertyId;
      }),
    [tenants, values.propertyId]
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!values.propertyId || !values.unitId || !values.primaryTenantId) {
      setError("Property, unit, and tenant are required.");
      return;
    }
    if (!values.startDate || !values.endDate) {
      setError("Start date and end date are required.");
      return;
    }
    if (values.endDate < values.startDate) {
      setError("End date must be on or after start date.");
      return;
    }
    if (!values.rentAmount.trim()) {
      setError("Rent amount is required.");
      return;
    }

    const rentAmount = Number(values.rentAmount);
    const securityDeposit = values.securityDeposit.trim() ? Number(values.securityDeposit) : 0;
    const noticePeriodDays = values.noticePeriodDays.trim() ? Number(values.noticePeriodDays) : null;

    if (Number.isNaN(rentAmount) || rentAmount < 0) {
      setError("Rent amount must be a valid non-negative number.");
      return;
    }
    if (Number.isNaN(securityDeposit) || securityDeposit < 0) {
      setError("Security deposit must be a valid non-negative number.");
      return;
    }
    if (noticePeriodDays !== null && (Number.isNaN(noticePeriodDays) || noticePeriodDays < 0)) {
      setError("Notice period must be a valid non-negative number.");
      return;
    }
    if (values.moveInDate && values.moveOutDate && values.moveOutDate < values.moveInDate) {
      setError("Move-out date must be on or after move-in date.");
      return;
    }

    const payload = {
      leaseNumber: values.leaseNumber.trim() || undefined,
      propertyId: values.propertyId,
      unitId: values.unitId,
      primaryTenantId: values.primaryTenantId,
      coTenantPlaceholder: values.coTenantPlaceholder || null,
      leaseType: values.leaseType,
      startDate: values.startDate,
      endDate: values.endDate,
      moveInDate: values.moveInDate || null,
      moveOutDate: values.moveOutDate || null,
      rentAmount,
      securityDeposit,
      lateFeePlaceholder: values.lateFeePlaceholder || null,
      renewalOption: values.renewalOption,
      noticePeriodDays,
      internalNotes: values.internalNotes || null
    };

    setSubmitting(true);
    const response = await fetch(mode === "create" ? "/api/leases" : `/api/leases/${lease?.id ?? ""}`, {
      method: mode === "create" ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mode === "create" ? payload : { action: "update", updates: payload })
    });
    setSubmitting(false);

    if (!response.ok) {
      const failure = (await response.json()) as { error?: string };
      setError(failure.error ?? "Unable to save lease.");
      return;
    }

    const success = (await response.json()) as { lease?: LeaseRecord };
    const savedId = success.lease?.id ?? lease?.id;
    if (savedId) {
      if (setupMode) {
        router.push("/setup");
      } else {
        router.push(`/leases/${savedId}?from=lease-created`);
      }
      router.refresh();
      return;
    }
    router.push("/leases");
    router.refresh();
  }

  return (
    <Card>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
            {mode === "create" ? "Create Lease" : "Edit Lease"}
          </h1>
          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
            Define lease terms, assign property context, and prepare the record for signing and activation.
          </p>
        </div>

        {mode === "create" ? (
          <p className="rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface-muted)] px-3 py-2 text-xs text-[var(--mpa-color-text-secondary)]">
            New leases start in draft status. Use lifecycle actions on the detail page to sign and activate.
          </p>
        ) : null}

        <div className="grid gap-3 md:grid-cols-2">
          <Input
            aria-label="Lease number"
            placeholder="Lease number (optional — auto-generated if blank)"
            value={values.leaseNumber}
            onChange={(event) => setValues((current) => ({ ...current, leaseNumber: event.target.value }))}
            disabled={mode === "edit"}
          />
          <Select
            aria-label="Lease type"
            value={values.leaseType}
            onChange={(event) =>
              setValues((current) => ({ ...current, leaseType: event.target.value as LeaseRecord["leaseType"] }))
            }
          >
            {LEASE_TYPES.map((type) => (
              <option key={type} value={type}>
                {toLeaseTypeLabel(type)}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <Select
            aria-label="Property"
            value={values.propertyId}
            onChange={(event) => {
              const nextPropertyId = event.target.value;
              const nextUnits = units.filter((unitOption) => unitOption.propertyId === nextPropertyId);
              setValues((current) => ({
                ...current,
                propertyId: nextPropertyId,
                unitId: nextUnits.some((unitOption) => unitOption.id === current.unitId) ? current.unitId : "",
                primaryTenantId: ""
              }));
            }}
            required
          >
            <option value="">Select property</option>
            {properties.map((propertyOption) => (
              <option key={propertyOption.id} value={propertyOption.id}>
                {propertyOption.name}
              </option>
            ))}
          </Select>
          <Select
            aria-label="Unit"
            value={values.unitId}
            onChange={(event) => setValues((current) => ({ ...current, unitId: event.target.value }))}
            disabled={!values.propertyId}
            required
          >
            <option value="">{values.propertyId ? "Select unit" : "Select property first"}</option>
            {availableUnits.map((unitOption) => (
              <option key={unitOption.id} value={unitOption.id}>
                {unitOption.unitLabel
                  ? `${unitOption.unitNumber} — ${unitOption.unitLabel}`
                  : unitOption.unitNumber}
              </option>
            ))}
          </Select>
          <Select
            aria-label="Primary tenant"
            value={values.primaryTenantId}
            onChange={(event) => setValues((current) => ({ ...current, primaryTenantId: event.target.value }))}
            required
          >
            <option value="">Select tenant</option>
            {availableTenants.map((tenantOption) => (
              <option key={tenantOption.id} value={tenantOption.id}>
                {tenantOption.name}
              </option>
            ))}
          </Select>
        </div>

        <Input
          aria-label="Co-tenant placeholder"
          placeholder="Co-tenant placeholder"
          value={values.coTenantPlaceholder}
          onChange={(event) => setValues((current) => ({ ...current, coTenantPlaceholder: event.target.value }))}
        />

        <div className="grid gap-3 md:grid-cols-2">
          <Input
            aria-label="Start date"
            type="date"
            value={values.startDate}
            onChange={(event) => setValues((current) => ({ ...current, startDate: event.target.value }))}
            required
          />
          <Input
            aria-label="End date"
            type="date"
            value={values.endDate}
            onChange={(event) => setValues((current) => ({ ...current, endDate: event.target.value }))}
            required
          />
          <Input
            aria-label="Move-in date"
            type="date"
            value={values.moveInDate}
            onChange={(event) => setValues((current) => ({ ...current, moveInDate: event.target.value }))}
          />
          <Input
            aria-label="Move-out date"
            type="date"
            value={values.moveOutDate}
            onChange={(event) => setValues((current) => ({ ...current, moveOutDate: event.target.value }))}
          />
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <Input
            aria-label="Rent amount"
            placeholder="Rent amount"
            type="number"
            min={0}
            step={0.01}
            value={values.rentAmount}
            onChange={(event) => setValues((current) => ({ ...current, rentAmount: event.target.value }))}
            required
          />
          <Input
            aria-label="Security deposit"
            placeholder="Security deposit"
            type="number"
            min={0}
            step={0.01}
            value={values.securityDeposit}
            onChange={(event) => setValues((current) => ({ ...current, securityDeposit: event.target.value }))}
          />
          <Input
            aria-label="Notice period days"
            placeholder="Notice period (days)"
            type="number"
            min={0}
            value={values.noticePeriodDays}
            onChange={(event) => setValues((current) => ({ ...current, noticePeriodDays: event.target.value }))}
          />
        </div>

        <Input
          aria-label="Late fee placeholder"
          placeholder="Late fee placeholder"
          value={values.lateFeePlaceholder}
          onChange={(event) => setValues((current) => ({ ...current, lateFeePlaceholder: event.target.value }))}
        />

        <label className="flex items-center gap-2 text-sm text-[var(--mpa-color-text-secondary)]">
          <input
            type="checkbox"
            checked={values.renewalOption}
            onChange={(event) => setValues((current) => ({ ...current, renewalOption: event.target.checked }))}
          />
          Renewal option included
        </label>

        <Textarea
          aria-label="Internal notes"
          placeholder="Internal notes"
          rows={4}
          value={values.internalNotes}
          onChange={(event) => setValues((current) => ({ ...current, internalNotes: event.target.value }))}
        />

        {error ? (
          <p className="text-sm text-[var(--mpa-color-feedback-error)]" role="alert" aria-live="assertive">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving..." : mode === "create" ? "Create Lease" : "Save Lease"}
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.push("/leases")}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
