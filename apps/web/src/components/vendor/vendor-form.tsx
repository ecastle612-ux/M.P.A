"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Select, Textarea } from "@mpa/ui";
import {
  VENDOR_SERVICE_TYPES,
  VENDOR_STATUSES,
  toVendorServiceLabel,
  toVendorStatusLabel,
  type VendorRecord
} from "../../lib/vendor/contracts";

type VendorFormValues = {
  businessName: string;
  primaryContactName: string;
  phone: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  stateRegion: string;
  postalCode: string;
  countryCode: string;
  website: string;
  licenseNumber: string;
  insuranceExpiration: string;
  taxIdPlaceholder: string;
  emergencyAvailability: string;
  afterHoursAvailability: string;
  preferredVendor: boolean;
  rating: string;
  internalNotes: string;
  status: VendorRecord["status"];
  services: string[];
};

const DEFAULT_VALUES: VendorFormValues = {
  businessName: "",
  primaryContactName: "",
  phone: "",
  email: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  stateRegion: "",
  postalCode: "",
  countryCode: "US",
  website: "",
  licenseNumber: "",
  insuranceExpiration: "",
  taxIdPlaceholder: "",
  emergencyAvailability: "",
  afterHoursAvailability: "",
  preferredVendor: false,
  rating: "",
  internalNotes: "",
  status: "active",
  services: []
};

function toFormValues(vendor: VendorRecord): VendorFormValues {
  return {
    businessName: vendor.businessName,
    primaryContactName: vendor.primaryContactName ?? "",
    phone: vendor.phone ?? "",
    email: vendor.email ?? "",
    addressLine1: vendor.addressLine1 ?? "",
    addressLine2: vendor.addressLine2 ?? "",
    city: vendor.city ?? "",
    stateRegion: vendor.stateRegion ?? "",
    postalCode: vendor.postalCode ?? "",
    countryCode: vendor.countryCode,
    website: vendor.website ?? "",
    licenseNumber: vendor.licenseNumber ?? "",
    insuranceExpiration: vendor.insuranceExpiration ?? "",
    taxIdPlaceholder: vendor.taxIdPlaceholder ?? "",
    emergencyAvailability: vendor.emergencyAvailability ?? "",
    afterHoursAvailability: vendor.afterHoursAvailability ?? "",
    preferredVendor: vendor.preferredVendor,
    rating: vendor.rating !== null ? String(vendor.rating) : "",
    internalNotes: vendor.internalNotes ?? "",
    status: vendor.status,
    services: [...vendor.services]
  };
}

export function VendorForm({ mode, vendor }: { mode: "create" | "edit"; vendor?: VendorRecord | null }) {
  const router = useRouter();
  const [values, setValues] = useState<VendorFormValues>(() => (vendor ? toFormValues(vendor) : DEFAULT_VALUES));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleService(service: string) {
    setValues((current) => ({
      ...current,
      services: current.services.includes(service)
        ? current.services.filter((entry) => entry !== service)
        : [...current.services, service]
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!values.businessName.trim()) {
      setError("Business name is required.");
      return;
    }
    if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
      setError("Email must be valid.");
      return;
    }
    const ratingValue = values.rating.trim() ? Number(values.rating) : null;
    if (ratingValue !== null && (Number.isNaN(ratingValue) || ratingValue < 0 || ratingValue > 5)) {
      setError("Rating must be between 0 and 5.");
      return;
    }

    setSubmitting(true);
    const payload = {
      businessName: values.businessName.trim(),
      primaryContactName: values.primaryContactName,
      phone: values.phone,
      email: values.email,
      addressLine1: values.addressLine1,
      addressLine2: values.addressLine2,
      city: values.city,
      stateRegion: values.stateRegion,
      postalCode: values.postalCode,
      countryCode: values.countryCode.trim() || "US",
      website: values.website,
      licenseNumber: values.licenseNumber,
      insuranceExpiration: values.insuranceExpiration || null,
      taxIdPlaceholder: values.taxIdPlaceholder,
      emergencyAvailability: values.emergencyAvailability,
      afterHoursAvailability: values.afterHoursAvailability,
      preferredVendor: values.preferredVendor,
      rating: ratingValue,
      internalNotes: values.internalNotes,
      status: values.status,
      services: values.services
    };

    const response = await fetch(mode === "create" ? "/api/vendors" : `/api/vendors/${vendor?.id ?? ""}`, {
      method: mode === "create" ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mode === "create" ? payload : { action: "update", ...payload })
    });
    setSubmitting(false);

    if (!response.ok) {
      const failure = (await response.json()) as { error?: string };
      setError(failure.error ?? "Unable to save vendor.");
      return;
    }

    const success = (await response.json()) as { vendor?: VendorRecord };
    const savedId = success.vendor?.id ?? vendor?.id;
    if (savedId) {
      router.push(`/vendors/${savedId}?from=vendor-created`);
      router.refresh();
      return;
    }
    router.push("/vendors");
    router.refresh();
  }

  return (
    <Card>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
            {mode === "create" ? "Create Vendor" : "Edit Vendor"}
          </h1>
          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
            Capture vendor profile details once and reuse them across maintenance assignments and future marketplace workflows.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <Input
            aria-label="Business name"
            placeholder="Business name"
            value={values.businessName}
            onChange={(event) => setValues((current) => ({ ...current, businessName: event.target.value }))}
            autoFocus={mode === "create"}
            required
          />
          <Input
            aria-label="Primary contact name"
            placeholder="Primary contact name"
            value={values.primaryContactName}
            onChange={(event) => setValues((current) => ({ ...current, primaryContactName: event.target.value }))}
          />
          <Input
            aria-label="Phone"
            placeholder="Phone"
            value={values.phone}
            onChange={(event) => setValues((current) => ({ ...current, phone: event.target.value }))}
          />
          <Input
            aria-label="Email"
            placeholder="Email"
            type="email"
            value={values.email}
            onChange={(event) => setValues((current) => ({ ...current, email: event.target.value }))}
          />
          <Input
            aria-label="Website"
            placeholder="Website"
            value={values.website}
            onChange={(event) => setValues((current) => ({ ...current, website: event.target.value }))}
          />
          <Select
            aria-label="Status"
            value={values.status}
            onChange={(event) =>
              setValues((current) => ({ ...current, status: event.target.value as VendorRecord["status"] }))
            }
          >
            {VENDOR_STATUSES.map((status) => (
              <option key={status} value={status}>
                {toVendorStatusLabel(status)}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <Input
            aria-label="Address line 1"
            placeholder="Address line 1"
            value={values.addressLine1}
            onChange={(event) => setValues((current) => ({ ...current, addressLine1: event.target.value }))}
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
          />
          <Input
            aria-label="State or region"
            placeholder="State / region"
            value={values.stateRegion}
            onChange={(event) => setValues((current) => ({ ...current, stateRegion: event.target.value }))}
          />
          <Input
            aria-label="Postal code"
            placeholder="Postal code"
            value={values.postalCode}
            onChange={(event) => setValues((current) => ({ ...current, postalCode: event.target.value }))}
          />
          <Input
            aria-label="Country code"
            placeholder="Country code"
            value={values.countryCode}
            onChange={(event) => setValues((current) => ({ ...current, countryCode: event.target.value }))}
          />
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <Input
            aria-label="License number"
            placeholder="License number"
            value={values.licenseNumber}
            onChange={(event) => setValues((current) => ({ ...current, licenseNumber: event.target.value }))}
          />
          <Input
            aria-label="Insurance expiration"
            type="date"
            value={values.insuranceExpiration}
            onChange={(event) => setValues((current) => ({ ...current, insuranceExpiration: event.target.value }))}
          />
          <Input
            aria-label="Tax ID or EIN"
            placeholder="Tax ID / EIN (optional)"
            value={values.taxIdPlaceholder}
            onChange={(event) => setValues((current) => ({ ...current, taxIdPlaceholder: event.target.value }))}
          />
          <Input
            aria-label="Rating"
            placeholder="Rating (0–5)"
            type="number"
            min={0}
            max={5}
            step={0.1}
            value={values.rating}
            onChange={(event) => setValues((current) => ({ ...current, rating: event.target.value }))}
          />
        </div>

        <Textarea
          aria-label="Emergency availability"
          placeholder="Emergency availability"
          rows={2}
          value={values.emergencyAvailability}
          onChange={(event) => setValues((current) => ({ ...current, emergencyAvailability: event.target.value }))}
        />
        <Textarea
          aria-label="After hours availability"
          placeholder="After hours availability"
          rows={2}
          value={values.afterHoursAvailability}
          onChange={(event) => setValues((current) => ({ ...current, afterHoursAvailability: event.target.value }))}
        />

        <div>
          <p className="mb-2 text-sm font-medium text-[var(--mpa-color-text-primary)]">Services</p>
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
            {VENDOR_SERVICE_TYPES.map((service) => (
              <label key={service} className="flex items-center gap-2 text-sm text-[var(--mpa-color-text-secondary)]">
                <input
                  type="checkbox"
                  checked={values.services.includes(service)}
                  onChange={() => toggleService(service)}
                />
                {toVendorServiceLabel(service)}
              </label>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-[var(--mpa-color-text-secondary)]">
          <input
            type="checkbox"
            checked={values.preferredVendor}
            onChange={(event) => setValues((current) => ({ ...current, preferredVendor: event.target.checked }))}
          />
          Preferred vendor
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
            {submitting ? "Saving..." : mode === "create" ? "Create Vendor" : "Save Vendor"}
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.push("/vendors")}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
