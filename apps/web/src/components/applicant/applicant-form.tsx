"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Select, Textarea } from "@mpa/ui";
import { defaultApplicantProfile, toApplicantStatusLabel, type ApplicantRecord } from "../../lib/applicant/contracts";

type ApplicantFormValues = {
  propertyId: string;
  unitId: string;
  firstName: string;
  lastName: string;
  preferredName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  plannedMoveInDate: string;
  internalNotes: string;
  employer: string;
  jobTitle: string;
  monthlyIncome: string;
  emergencyName: string;
  emergencyPhone: string;
  emergencyRelationship: string;
};

const DEFAULT_VALUES: ApplicantFormValues = {
  propertyId: "",
  unitId: "",
  firstName: "",
  lastName: "",
  preferredName: "",
  email: "",
  phone: "",
  dateOfBirth: "",
  plannedMoveInDate: "",
  internalNotes: "",
  employer: "",
  jobTitle: "",
  monthlyIncome: "",
  emergencyName: "",
  emergencyPhone: "",
  emergencyRelationship: ""
};

export function ApplicantForm({
  mode,
  applicant,
  properties,
  units,
  initialPropertyId,
  initialUnitId
}: {
  mode: "create" | "edit";
  applicant?: ApplicantRecord | null;
  properties: Array<{ id: string; name: string }>;
  units: Array<{ id: string; propertyId: string; unitNumber: string; unitLabel: string | null }>;
  initialPropertyId?: string | null;
  initialUnitId?: string | null;
}) {
  const router = useRouter();
  const [values, setValues] = useState<ApplicantFormValues>(() =>
    applicant
      ? {
          propertyId: applicant.propertyId ?? "",
          unitId: applicant.unitId ?? "",
          firstName: applicant.firstName,
          lastName: applicant.lastName,
          preferredName: applicant.preferredName ?? "",
          email: applicant.email,
          phone: applicant.phone ?? "",
          dateOfBirth: applicant.dateOfBirth ?? "",
          plannedMoveInDate: applicant.plannedMoveInDate ?? "",
          internalNotes: applicant.internalNotes ?? "",
          employer: applicant.profile.employment.employer ?? "",
          jobTitle: applicant.profile.employment.jobTitle ?? "",
          monthlyIncome: applicant.profile.employment.monthlyIncome?.toString() ?? "",
          emergencyName: applicant.profile.emergency.name ?? "",
          emergencyPhone: applicant.profile.emergency.phone ?? "",
          emergencyRelationship: applicant.profile.emergency.relationship ?? ""
        }
      : {
          ...DEFAULT_VALUES,
          propertyId: initialPropertyId ?? "",
          unitId: initialUnitId ?? ""
        }
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const filteredUnits = useMemo(
    () => (values.propertyId ? units.filter((unit) => unit.propertyId === values.propertyId) : units),
    [units, values.propertyId]
  );

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const profile = applicant?.profile ?? defaultApplicantProfile();
    const payload = {
      propertyId: values.propertyId || null,
      unitId: values.unitId || null,
      firstName: values.firstName,
      lastName: values.lastName,
      preferredName: values.preferredName || null,
      email: values.email,
      phone: values.phone || null,
      dateOfBirth: values.dateOfBirth || null,
      plannedMoveInDate: values.plannedMoveInDate || null,
      internalNotes: values.internalNotes || null,
      profile: {
        ...profile,
        employment: {
          ...profile.employment,
          employer: values.employer || null,
          jobTitle: values.jobTitle || null,
          monthlyIncome: values.monthlyIncome ? Number.parseFloat(values.monthlyIncome) : null
        },
        emergency: {
          name: values.emergencyName || null,
          phone: values.emergencyPhone || null,
          relationship: values.emergencyRelationship || null
        }
      }
    };

    const response = await fetch(
      mode === "create" ? "/api/applicants" : `/api/applicants/${applicant?.id ?? ""}`,
      {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "create" ? payload : { action: "update", ...payload })
      }
    );

    setSubmitting(false);
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { message?: string } | null;
      setError(body?.message ?? "Unable to save application");
      return;
    }

    const body = (await response.json()) as { applicant: ApplicantRecord };
    router.push(
      mode === "create" ? `/applicants/${body.applicant.id}?from=applicant-created` : `/applicants/${body.applicant.id}`
    );
    router.refresh();
  }

  return (
    <Card className="space-y-6">
      <form className="space-y-6" onSubmit={(event) => void handleSubmit(event)}>
      <div>
        <h2 className="text-lg font-semibold text-[var(--mpa-color-text-primary)]">
          {mode === "create" ? "New application" : "Edit application"}
        </h2>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          Capture applicant details for screening, documents, and resident conversion.
        </p>
      </div>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">Assignment</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <Select
            aria-label="Property"
            value={values.propertyId}
            onChange={(event) => setValues((current) => ({ ...current, propertyId: event.target.value, unitId: "" }))}
          >
            <option value="">Select property</option>
            {properties.map((property) => (
              <option key={property.id} value={property.id}>
                {property.name}
              </option>
            ))}
          </Select>
          <Select
            aria-label="Unit"
            value={values.unitId}
            onChange={(event) => setValues((current) => ({ ...current, unitId: event.target.value }))}
          >
            <option value="">Select unit</option>
            {filteredUnits.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.unitLabel || unit.unitNumber}
              </option>
            ))}
          </Select>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">Personal</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <Input aria-label="First name" placeholder="First name" value={values.firstName} required onChange={(e) => setValues((c) => ({ ...c, firstName: e.target.value }))} />
          <Input aria-label="Last name" placeholder="Last name" value={values.lastName} required onChange={(e) => setValues((c) => ({ ...c, lastName: e.target.value }))} />
          <Input aria-label="Preferred name" placeholder="Preferred name" value={values.preferredName} onChange={(e) => setValues((c) => ({ ...c, preferredName: e.target.value }))} />
          <Input aria-label="Email" type="email" placeholder="Email" value={values.email} required onChange={(e) => setValues((c) => ({ ...c, email: e.target.value }))} />
          <Input aria-label="Phone" placeholder="Phone" value={values.phone} onChange={(e) => setValues((c) => ({ ...c, phone: e.target.value }))} />
          <Input aria-label="Date of birth" type="date" value={values.dateOfBirth} onChange={(e) => setValues((c) => ({ ...c, dateOfBirth: e.target.value }))} />
          <Input aria-label="Planned move-in" type="date" value={values.plannedMoveInDate} onChange={(e) => setValues((c) => ({ ...c, plannedMoveInDate: e.target.value }))} />
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">Employment & income</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <Input aria-label="Employer" placeholder="Employer" value={values.employer} onChange={(e) => setValues((c) => ({ ...c, employer: e.target.value }))} />
          <Input aria-label="Job title" placeholder="Job title" value={values.jobTitle} onChange={(e) => setValues((c) => ({ ...c, jobTitle: e.target.value }))} />
          <Input aria-label="Monthly income" placeholder="Monthly income" type="number" min="0" step="0.01" value={values.monthlyIncome} onChange={(e) => setValues((c) => ({ ...c, monthlyIncome: e.target.value }))} />
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">Emergency contact</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <Input aria-label="Emergency contact name" placeholder="Name" value={values.emergencyName} onChange={(e) => setValues((c) => ({ ...c, emergencyName: e.target.value }))} />
          <Input aria-label="Emergency contact phone" placeholder="Phone" value={values.emergencyPhone} onChange={(e) => setValues((c) => ({ ...c, emergencyPhone: e.target.value }))} />
          <Input aria-label="Relationship" placeholder="Relationship" value={values.emergencyRelationship} onChange={(e) => setValues((c) => ({ ...c, emergencyRelationship: e.target.value }))} />
        </div>
      </section>

      <Textarea aria-label="Internal notes" placeholder="Internal notes" rows={4} value={values.internalNotes} onChange={(e) => setValues((c) => ({ ...c, internalNotes: e.target.value }))} />

      {applicant ? (
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          Current status: <strong>{toApplicantStatusLabel(applicant.status)}</strong>
        </p>
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : mode === "create" ? "Create application" : "Save changes"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
      </form>
    </Card>
  );
}
