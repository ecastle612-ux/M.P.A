"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Select, Textarea } from "@mpa/ui";
import { TENANT_STATUSES, toTenantStatusLabel, type TenantRecord } from "../../lib/tenant/contracts";

type TenantFormValues = {
  firstName: string;
  lastName: string;
  preferredName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  notes: string;
  status: TenantRecord["status"];
};

const DEFAULT_VALUES: TenantFormValues = {
  firstName: "",
  lastName: "",
  preferredName: "",
  email: "",
  phone: "",
  dateOfBirth: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  notes: "",
  status: "active"
};

export function TenantForm({
  mode,
  tenant
}: {
  mode: "create" | "edit";
  tenant?: TenantRecord | null;
}) {
  const router = useRouter();
  const [values, setValues] = useState<TenantFormValues>(() =>
    tenant
      ? {
          firstName: tenant.firstName,
          lastName: tenant.lastName,
          preferredName: tenant.preferredName ?? "",
          email: tenant.email,
          phone: tenant.phone ?? "",
          dateOfBirth: tenant.dateOfBirth ?? "",
          emergencyContactName: tenant.emergencyContactName ?? "",
          emergencyContactPhone: tenant.emergencyContactPhone ?? "",
          notes: tenant.notes ?? "",
          status: tenant.status
        }
      : DEFAULT_VALUES
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!values.firstName.trim() || !values.lastName.trim() || !values.email.trim()) {
      setError("First name, last name, and email are required.");
      return;
    }

    setSubmitting(true);
    const payload = {
      firstName: values.firstName,
      lastName: values.lastName,
      preferredName: values.preferredName,
      email: values.email,
      phone: values.phone,
      dateOfBirth: values.dateOfBirth,
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
      router.push(`/tenants/${savedId}`);
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
            Maintain a canonical tenant profile designed to connect with leasing, payments, operations, and AI workflows.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <Input
            aria-label="First name"
            placeholder="First name"
            value={values.firstName}
            onChange={(event) => setValues((current) => ({ ...current, firstName: event.target.value }))}
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

        {error ? <p className="text-sm text-[var(--mpa-color-feedback-error)]">{error}</p> : null}

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
