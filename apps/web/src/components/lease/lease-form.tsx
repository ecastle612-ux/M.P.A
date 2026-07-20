"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Card, Input, Select, Textarea } from "@mpa/ui";
import {
  LEASE_TYPES,
  toLeaseTypeLabel,
  type LeaseRecord
} from "../../lib/lease/contracts";
import { readApiError } from "../../lib/api/client-error";
import {
  collectIssues,
  validateDateOrder,
  validateDuplicateValue,
  validateNonNegativeMoney,
  validateRequired,
  type ValidationIssue
} from "../../lib/trust/validation";
import { suggestLeaseDateDefaults, suggestLeaseNumber } from "../../lib/workflow/category-suggest";
import { getWorkspaceMemory, rememberPropertyContext, resolveContextId } from "../../lib/workflow/workspace-memory";
import { ApiErrorAlert, ValidationAlert } from "../trust/validation-alert";
import { OperationalStatus } from "../trust/operational-status";
import { useSubmissionGuard } from "../../hooks/use-submission-guard";

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
  initialTenantId,
  screeningCaseId = null,
  existingLeaseNumbers = []
}: {
  mode: "create" | "edit";
  lease?: LeaseRecord | null;
  properties: Array<{ id: string; name: string }>;
  units: Array<{ id: string; propertyId: string; unitNumber: string; unitLabel: string | null }>;
  tenants: Array<{ id: string; propertyId: string | null; unitId: string | null; name: string }>;
  initialPropertyId?: string | null;
  initialUnitId?: string | null;
  initialTenantId?: string | null;
  screeningCaseId?: string | null;
  existingLeaseNumbers?: string[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setupMode = searchParams.get("setup") === "1";
  const [values, setValues] = useState<LeaseFormValues>(() => {
    if (lease) return toFormValues(lease);
    const memory = typeof window !== "undefined" ? getWorkspaceMemory() : null;
    const propertyIds = properties.map((p) => p.id);
    const propertyId = resolveContextId(initialPropertyId, memory?.propertyId, propertyIds);
    const unitIds = units.filter((u) => u.propertyId === propertyId).map((u) => u.id);
    const unitId = resolveContextId(initialUnitId, memory?.unitId, unitIds, false);
    const tenantForUnit = unitId
      ? tenants.find((t) => t.unitId === unitId && (!t.propertyId || t.propertyId === propertyId))
      : null;
    const tenantIds = tenants
      .filter((t) => (!t.propertyId || t.propertyId === propertyId) && (!unitId || !t.unitId || t.unitId === unitId))
      .map((t) => t.id);
    const primaryTenantId = resolveContextId(
      initialTenantId ?? tenantForUnit?.id,
      memory?.tenantId,
      tenantIds,
      Boolean(tenantForUnit)
    );
    const dates = suggestLeaseDateDefaults();
    const propertyName = properties.find((p) => p.id === propertyId)?.name;
    return {
      ...DEFAULT_VALUES,
      propertyId,
      unitId,
      primaryTenantId: primaryTenantId || tenantForUnit?.id || "",
      leaseNumber: suggestLeaseNumber(propertyName),
      startDate: dates.startDate,
      endDate: dates.endDate,
      moveInDate: dates.startDate
    };
  });
  const [submitting, setSubmitting] = useState(false);
  const [issues, setIssues] = useState<ValidationIssue[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const { busy, run } = useSubmissionGuard();

  const availableUnits = useMemo(
    () => units.filter((unitOption) => unitOption.propertyId === values.propertyId),
    [units, values.propertyId]
  );

  const availableTenants = useMemo(
    () =>
      tenants.filter((tenantOption) => {
        if (!values.propertyId) return true;
        if (!tenantOption.propertyId) return true;
        if (values.unitId && tenantOption.unitId && tenantOption.unitId !== values.unitId) return false;
        return tenantOption.propertyId === values.propertyId;
      }),
    [tenants, values.propertyId, values.unitId]
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIssues([]);
    setApiError(null);

    const nextIssues = collectIssues(
      validateRequired(values.propertyId, "Property"),
      validateRequired(values.unitId, "Unit"),
      validateRequired(values.primaryTenantId, "Primary tenant"),
      validateRequired(values.startDate, "Start date"),
      validateRequired(values.endDate, "End date"),
      validateDateOrder(values.startDate, values.endDate, "Start date", "End date"),
      validateDateOrder(values.moveInDate, values.moveOutDate, "Move-in date", "Move-out date"),
      validateNonNegativeMoney(values.rentAmount, "Rent amount", true),
      values.securityDeposit.trim()
        ? validateNonNegativeMoney(values.securityDeposit, "Security deposit", true)
        : null,
      mode === "create" && values.leaseNumber.trim()
        ? validateDuplicateValue(
            values.leaseNumber,
            existingLeaseNumbers,
            "Lease number",
            "Use a unique lease number or leave it blank to auto-generate."
          )
        : null
    );
    if (values.noticePeriodDays.trim()) {
      const notice = Number(values.noticePeriodDays);
      if (!Number.isFinite(notice) || notice < 0) {
        nextIssues.push({
          field: "Notice period",
          what: "Notice period days is invalid.",
          why: "Notice periods drive renewal and move-out timelines.",
          howToFix: "Enter a whole number of days that is zero or greater, or leave blank."
        });
      }
    }
    if (nextIssues.length > 0) {
      setIssues(nextIssues);
      return;
    }

    const rentAmount = Number(values.rentAmount);
    const securityDeposit = values.securityDeposit.trim() ? Number(values.securityDeposit) : 0;
    const noticePeriodDays = values.noticePeriodDays.trim() ? Number(values.noticePeriodDays) : null;

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

    await run(`lease:${mode}:${values.propertyId}:${values.unitId}`, async () => {
      setSubmitting(true);
      rememberPropertyContext({
        propertyId: values.propertyId,
        unitId: values.unitId || null,
        tenantId: values.primaryTenantId || null
      });
      const response = await fetch(mode === "create" ? "/api/leases" : `/api/leases/${lease?.id ?? ""}`, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "create" ? payload : { action: "update", updates: payload })
      });
      setSubmitting(false);

      if (!response.ok) {
        const failure = await response.json().catch(() => ({}));
        setApiError(readApiError(failure, "Unable to save lease. Check required fields and try again."));
        return;
      }

      const success = (await response.json()) as { lease?: LeaseRecord };
      const savedId = success.lease?.id ?? lease?.id;
      if (savedId && mode === "create" && screeningCaseId) {
        await fetch(`/api/screening/${screeningCaseId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "link_lease", leaseId: savedId })
        }).catch(() => undefined);
      }
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
    });
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
            onChange={(event) => {
              const nextUnitId = event.target.value;
              const occupied =
                mode === "create"
                  ? tenants.find(
                      (tenant) =>
                        tenant.unitId === nextUnitId &&
                        (!tenant.propertyId || tenant.propertyId === values.propertyId)
                    )
                  : null;
              setValues((current) => ({
                ...current,
                unitId: nextUnitId,
                primaryTenantId: occupied?.id ?? (mode === "create" ? "" : current.primaryTenantId)
              }));
            }}
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
          aria-label="Additional residents or co-tenants"
          placeholder="Additional residents or co-tenants (optional)"
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
          aria-label="Late fee notes"
          placeholder="Late fee notes (optional)"
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

        <ValidationAlert issues={issues} />
        {apiError ? <ApiErrorAlert message={apiError} /> : null}
        {submitting || busy ? <OperationalStatus message="Saving lease…" /> : null}

        <div className="sticky bottom-0 z-10 -mx-1 flex flex-wrap gap-2 border-t border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)]/95 px-1 py-3 backdrop-blur supports-[backdrop-filter]:bg-[var(--mpa-color-bg-surface)]/80 md:static md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
          <Button type="submit" disabled={submitting || busy} className="min-h-11 min-w-[8.5rem]">
            {submitting || busy ? "Saving..." : mode === "create" ? "Create Lease" : "Save Lease"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="min-h-11"
            onClick={() => router.push("/leases")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
