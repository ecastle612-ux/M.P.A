"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Card, Input, Select, Textarea } from "@mpa/ui";
import { PROPERTY_STATUSES, PROPERTY_TYPES, toPropertyTypeLabel, type PropertyRecord } from "../../lib/property/contracts";

type PropertyFormValues = {
  name: string;
  code: string;
  propertyType: PropertyRecord["propertyType"];
  status: PropertyRecord["status"];
  description: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  stateRegion: string;
  postalCode: string;
  countryCode: string;
  timezone: string;
  ownershipEntityName: string;
  ownerContactName: string;
  ownerContactEmail: string;
  ownerContactPhone: string;
};

const DEFAULT_VALUES: PropertyFormValues = {
  name: "",
  code: "",
  propertyType: "residential",
  status: "active",
  description: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  stateRegion: "",
  postalCode: "",
  countryCode: "US",
  timezone: "",
  ownershipEntityName: "",
  ownerContactName: "",
  ownerContactEmail: "",
  ownerContactPhone: ""
};

export function PropertyForm({
  mode,
  property
}: {
  mode: "create" | "edit";
  property?: PropertyRecord | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setupMode = searchParams.get("setup") === "1";
  const [values, setValues] = useState<PropertyFormValues>(() =>
    property
      ? {
          name: property.name,
          code: property.code ?? "",
          propertyType: property.propertyType,
          status: property.status,
          description: property.description ?? "",
          addressLine1: property.addressLine1,
          addressLine2: property.addressLine2 ?? "",
          city: property.city,
          stateRegion: property.stateRegion,
          postalCode: property.postalCode,
          countryCode: property.countryCode,
          timezone: property.timezone ?? "",
          ownershipEntityName: property.ownershipEntityName ?? "",
          ownerContactName: property.ownerContactName ?? "",
          ownerContactEmail: property.ownerContactEmail ?? "",
          ownerContactPhone: property.ownerContactPhone ?? ""
        }
      : DEFAULT_VALUES
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (
      !values.name.trim() ||
      !values.addressLine1.trim() ||
      !values.city.trim() ||
      !values.stateRegion.trim() ||
      !values.postalCode.trim()
    ) {
      setError("Name and address fields are required.");
      return;
    }
    if (values.ownerContactEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.ownerContactEmail.trim())) {
      setError("Owner contact email must be valid.");
      return;
    }

    setSubmitting(true);
    const payload = {
      ...values,
      name: values.name.trim(),
      addressLine1: values.addressLine1.trim(),
      city: values.city.trim(),
      stateRegion: values.stateRegion.trim(),
      postalCode: values.postalCode.trim(),
      countryCode: values.countryCode.toUpperCase()
    };

    const response = await fetch(
      mode === "create" ? "/api/properties" : `/api/properties/${property?.id ?? ""}`,
      {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "create" ? payload : { action: "update", ...payload })
      }
    );
    setSubmitting(false);

    if (!response.ok) {
      const failure = (await response.json()) as { error?: string };
      setError(failure.error ?? "Unable to save property.");
      return;
    }

    const success = (await response.json()) as { property?: PropertyRecord };
    const savedId = success.property?.id ?? property?.id;
    if (savedId) {
      if (mode === "create") {
        if (setupMode) {
          router.push("/setup?from=property-created");
        } else {
          router.push(`/properties/${savedId}?from=property-created`);
        }
      } else {
        router.push(`/properties/${savedId}`);
      }
      router.refresh();
      return;
    }
    router.push("/properties");
    router.refresh();
  }

  return (
    <Card>
      <form className="space-y-3" onSubmit={handleSubmit}>
        <div>
          <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
            {mode === "create" ? "Create Property" : "Edit Property"}
          </h1>
          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
            {setupMode
              ? "Configure location and ownership. After save, you’ll return to setup to add units."
              : "Configure location and ownership once, then continue directly to unit onboarding."}
          </p>
        </div>
        {mode === "create" ? (
          <p className="rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface-muted)] px-3 py-2 text-xs text-[var(--mpa-color-text-secondary)]">
            {setupMode
              ? "What happens next: Return to setup → Add units → Add a resident or use Move In."
              : "Workflow: Property → Unit → Tenant. After save, unit creation opens with this property preselected."}
          </p>
        ) : null}

        <div className="grid gap-3 md:grid-cols-2">
          <Input
            aria-label="Property name"
            placeholder="Property name"
            value={values.name}
            onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
            autoFocus={mode === "create"}
            required
          />
          <Input
            aria-label="Property code"
            placeholder="Property code"
            value={values.code}
            onChange={(event) => setValues((current) => ({ ...current, code: event.target.value }))}
          />
          <Select
            aria-label="Property type"
            value={values.propertyType}
            onChange={(event) =>
              setValues((current) => ({ ...current, propertyType: event.target.value as PropertyRecord["propertyType"] }))
            }
          >
            {PROPERTY_TYPES.map((type) => (
              <option key={type} value={type}>
                {toPropertyTypeLabel(type)}
              </option>
            ))}
          </Select>
          <Select
            aria-label="Status"
            value={values.status}
            onChange={(event) =>
              setValues((current) => ({ ...current, status: event.target.value as PropertyRecord["status"] }))
            }
          >
            {PROPERTY_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status[0]?.toUpperCase() + status.slice(1)}
              </option>
            ))}
          </Select>
          <Input
            aria-label="Address line 1"
            placeholder="Address line 1"
            value={values.addressLine1}
            onChange={(event) => setValues((current) => ({ ...current, addressLine1: event.target.value }))}
            required
          />
          <Input
            aria-label="Address line 2"
            placeholder="Address line 2"
            value={values.addressLine2}
            onChange={(event) => setValues((current) => ({ ...current, addressLine2: event.target.value }))}
          />
          <Input
            aria-label="City"
            placeholder="City"
            value={values.city}
            onChange={(event) => setValues((current) => ({ ...current, city: event.target.value }))}
            required
          />
          <Input
            aria-label="State or region"
            placeholder="State or region"
            value={values.stateRegion}
            onChange={(event) => setValues((current) => ({ ...current, stateRegion: event.target.value }))}
            required
          />
          <Input
            aria-label="Postal code"
            placeholder="Postal code"
            value={values.postalCode}
            onChange={(event) => setValues((current) => ({ ...current, postalCode: event.target.value }))}
            required
          />
          <Input
            aria-label="Country code"
            placeholder="Country code"
            value={values.countryCode}
            onChange={(event) => setValues((current) => ({ ...current, countryCode: event.target.value }))}
            required
          />
          <Input
            aria-label="Timezone"
            placeholder="Timezone"
            value={values.timezone}
            onChange={(event) => setValues((current) => ({ ...current, timezone: event.target.value }))}
          />
          <Input
            aria-label="Ownership entity"
            placeholder="Ownership entity"
            value={values.ownershipEntityName}
            onChange={(event) => setValues((current) => ({ ...current, ownershipEntityName: event.target.value }))}
          />
          <Input
            aria-label="Owner contact name"
            placeholder="Owner contact name"
            value={values.ownerContactName}
            onChange={(event) => setValues((current) => ({ ...current, ownerContactName: event.target.value }))}
          />
          <Input
            aria-label="Owner contact email"
            placeholder="Owner contact email"
            type="email"
            value={values.ownerContactEmail}
            onChange={(event) => setValues((current) => ({ ...current, ownerContactEmail: event.target.value }))}
          />
          <Input
            aria-label="Owner contact phone"
            placeholder="Owner contact phone"
            value={values.ownerContactPhone}
            onChange={(event) => setValues((current) => ({ ...current, ownerContactPhone: event.target.value }))}
          />
        </div>

        <Textarea
          aria-label="Description"
          placeholder="Description"
          rows={4}
          value={values.description}
          onChange={(event) => setValues((current) => ({ ...current, description: event.target.value }))}
        />

        {error ? (
          <p className="text-sm text-[var(--mpa-color-feedback-error)]" role="alert" aria-live="assertive">
            {error}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving..." : mode === "create" ? "Create Property" : "Save Property"}
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.push("/properties")}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
