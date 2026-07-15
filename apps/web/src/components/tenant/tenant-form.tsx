"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Avatar, Button, Card, Input, Select, Textarea } from "@mpa/ui";
import { TENANT_STATUSES, toTenantStatusLabel, type TenantRecord } from "../../lib/tenant/contracts";

type TenantFormValues = {
  propertyId: string;
  unitId: string;
  firstName: string;
  lastName: string;
  preferredName: string;
  email: string;
  avatarUrl: string;
  phone: string;
  dateOfBirth: string;
  moveInDate: string;
  moveOutDate: string;
  documentsPlaceholder: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  notes: string;
  status: TenantRecord["status"];
};

const DEFAULT_VALUES: TenantFormValues = {
  propertyId: "",
  unitId: "",
  firstName: "",
  lastName: "",
  preferredName: "",
  email: "",
  avatarUrl: "",
  phone: "",
  dateOfBirth: "",
  moveInDate: "",
  moveOutDate: "",
  documentsPlaceholder: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  notes: "",
  status: "active"
};

export function TenantForm({
  mode,
  tenant,
  properties,
  units,
  initialPropertyId,
  initialUnitId
}: {
  mode: "create" | "edit";
  tenant?: TenantRecord | null;
  properties: Array<{ id: string; name: string }>;
  units: Array<{ id: string; propertyId: string; unitNumber: string; unitLabel: string | null }>;
  initialPropertyId?: string | null;
  initialUnitId?: string | null;
}) {
  const router = useRouter();
  const [values, setValues] = useState<TenantFormValues>(() =>
    tenant
      ? {
          propertyId: tenant.propertyId ?? "",
          unitId: tenant.unitId ?? "",
          firstName: tenant.firstName,
          lastName: tenant.lastName,
          preferredName: tenant.preferredName ?? "",
          email: tenant.email,
          avatarUrl: tenant.avatarUrl ?? "",
          phone: tenant.phone ?? "",
          dateOfBirth: tenant.dateOfBirth ?? "",
          moveInDate: tenant.moveInDate ?? "",
          moveOutDate: tenant.moveOutDate ?? "",
          documentsPlaceholder: tenant.documentsPlaceholder ?? "",
          emergencyContactName: tenant.emergencyContactName ?? "",
          emergencyContactPhone: tenant.emergencyContactPhone ?? "",
          notes: tenant.notes ?? "",
          status: tenant.status
        }
      : {
          ...DEFAULT_VALUES,
          propertyId:
            (initialPropertyId && properties.some((propertyOption) => propertyOption.id === initialPropertyId)
              ? initialPropertyId
              : null) ??
            properties[0]?.id ??
            "",
          unitId:
            initialUnitId && units.some((unitOption) => unitOption.id === initialUnitId) ? initialUnitId : ""
        }
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const availableUnits = useMemo(
    () => units.filter((unitOption) => unitOption.propertyId === values.propertyId),
    [units, values.propertyId]
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!values.firstName.trim() || !values.lastName.trim() || !values.email.trim()) {
      setError("First name, last name, and email are required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
      setError("Email must be valid.");
      return;
    }
    if (values.moveInDate && values.moveOutDate && values.moveOutDate < values.moveInDate) {
      setError("Move-out date must be on or after move-in date.");
      return;
    }

    setSubmitting(true);
    const payload = {
      propertyId: values.propertyId || null,
      unitId: values.unitId || null,
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      preferredName: values.preferredName,
      email: values.email.trim(),
      avatarUrl: values.avatarUrl,
      phone: values.phone,
      dateOfBirth: values.dateOfBirth,
      moveInDate: values.moveInDate || (values.unitId ? new Date().toISOString().slice(0, 10) : ""),
      moveOutDate: values.moveOutDate,
      documentsPlaceholder: values.documentsPlaceholder,
      emergencyContactName: values.emergencyContactName,
      emergencyContactPhone: values.emergencyContactPhone,
      notes: values.notes,
      status: values.status
    };

    const response = await fetch(mode === "create" ? "/api/tenants" : `/api/tenants/${tenant?.id ?? ""}`, {
      method: mode === "create" ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mode === "create" ? payload : { action: "update", ...payload })
    });
    setSubmitting(false);

    if (!response.ok) {
      const failure = (await response.json()) as { error?: string };
      setError(failure.error ?? "Unable to save tenant.");
      return;
    }

    const success = (await response.json()) as { tenant?: TenantRecord };
    const savedId = success.tenant?.id ?? tenant?.id;
    if (savedId) {
      router.push(`/tenants/${savedId}?from=tenant-created`);
      router.refresh();
      return;
    }
    router.push("/tenants");
    router.refresh();
  }

  return (
    <Card>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
            {mode === "create" ? "Create Tenant" : "Edit Tenant"}
          </h1>
          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
            Capture operational tenant context once and reuse it across leasing, maintenance, communication, and portfolio reporting.
          </p>
        </div>
        {mode === "create" ? (
          <p className="rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface-muted)] px-3 py-2 text-xs text-[var(--mpa-color-text-secondary)]">
            Assignment updates occupancy automatically when an active tenant is linked to a unit.
          </p>
        ) : null}

        <Card className="border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface-muted)] p-4">
          <div className="flex items-center gap-3">
            <Avatar src={values.avatarUrl || undefined} fallback={`${values.firstName[0] ?? "T"}${values.lastName[0] ?? ""}`} />
            <div>
              <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">Tenant avatar placeholder</p>
              <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                Optional photo URL for faster visual scanning in future workflow surfaces.
              </p>
            </div>
          </div>
          <Input
            aria-label="Avatar URL"
            placeholder="https://..."
            className="mt-3"
            value={values.avatarUrl}
            onChange={(event) => setValues((current) => ({ ...current, avatarUrl: event.target.value }))}
          />
        </Card>

        <div className="grid gap-3 md:grid-cols-2">
          <Select
            aria-label="Assigned property"
            value={values.propertyId}
            onChange={(event) => {
              const nextPropertyId = event.target.value;
              const nextUnits = units.filter((unitOption) => unitOption.propertyId === nextPropertyId);
              setValues((current) => ({
                ...current,
                propertyId: nextPropertyId,
                unitId: nextUnits.some((unitOption) => unitOption.id === current.unitId) ? current.unitId : ""
              }));
            }}
          >
            <option value="">No property assigned</option>
            {properties.map((propertyOption) => (
              <option key={propertyOption.id} value={propertyOption.id}>
                {propertyOption.name}
              </option>
            ))}
          </Select>
          <Select
            aria-label="Assigned unit"
            value={values.unitId}
            onChange={(event) => setValues((current) => ({ ...current, unitId: event.target.value }))}
            disabled={!values.propertyId}
          >
            <option value="">{values.propertyId ? "No unit assigned" : "Select property first"}</option>
            {availableUnits.map((unitOption) => (
              <option key={unitOption.id} value={unitOption.id}>
                {unitOption.unitLabel
                  ? `${unitOption.unitNumber} — ${unitOption.unitLabel}`
                  : unitOption.unitNumber}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <Input
            aria-label="First name"
            placeholder="First name"
            value={values.firstName}
            onChange={(event) => setValues((current) => ({ ...current, firstName: event.target.value }))}
            autoFocus={mode === "create"}
            required
          />
          <Input
            aria-label="Last name"
            placeholder="Last name"
            value={values.lastName}
            onChange={(event) => setValues((current) => ({ ...current, lastName: event.target.value }))}
            required
          />
          <Input
            aria-label="Preferred name"
            placeholder="Preferred name"
            value={values.preferredName}
            onChange={(event) => setValues((current) => ({ ...current, preferredName: event.target.value }))}
          />
          <Input
            aria-label="Email"
            placeholder="Email"
            type="email"
            value={values.email}
            onChange={(event) => setValues((current) => ({ ...current, email: event.target.value }))}
            required
          />
          <Input
            aria-label="Phone"
            placeholder="Phone"
            value={values.phone}
            onChange={(event) => setValues((current) => ({ ...current, phone: event.target.value }))}
          />
          <Input
            aria-label="Date of birth"
            type="date"
            value={values.dateOfBirth}
            onChange={(event) => setValues((current) => ({ ...current, dateOfBirth: event.target.value }))}
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
          <Input
            aria-label="Emergency contact name"
            placeholder="Emergency contact name"
            value={values.emergencyContactName}
            onChange={(event) => setValues((current) => ({ ...current, emergencyContactName: event.target.value }))}
          />
          <Input
            aria-label="Emergency contact phone"
            placeholder="Emergency contact phone"
            value={values.emergencyContactPhone}
            onChange={(event) => setValues((current) => ({ ...current, emergencyContactPhone: event.target.value }))}
          />
          <Select
            aria-label="Status"
            value={values.status}
            onChange={(event) =>
              setValues((current) => ({ ...current, status: event.target.value as TenantRecord["status"] }))
            }
          >
            {TENANT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {toTenantStatusLabel(status)}
              </option>
            ))}
          </Select>
        </div>

        <Textarea
          aria-label="Notes"
          placeholder="Notes"
          rows={4}
          value={values.notes}
          onChange={(event) => setValues((current) => ({ ...current, notes: event.target.value }))}
        />
        <Textarea
          aria-label="Documents placeholder"
          placeholder="Documents placeholder (e.g., ID pending, lease packet pending)"
          rows={3}
          value={values.documentsPlaceholder}
          onChange={(event) => setValues((current) => ({ ...current, documentsPlaceholder: event.target.value }))}
        />

        {error ? (
          <p className="text-sm text-[var(--mpa-color-feedback-error)]" role="alert" aria-live="assertive">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving..." : mode === "create" ? "Create Tenant" : "Save Tenant"}
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.push("/tenants")}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
