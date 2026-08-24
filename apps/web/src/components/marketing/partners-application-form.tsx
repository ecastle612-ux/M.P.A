"use client";

import { useState } from "react";
import { Button, FormField, Input, Select, Textarea } from "@mpa/ui";
import { PARTNER_TYPE_LABELS, type PartnerType } from "@mpa/shared";

const TYPE_OPTIONS: Array<{ value: PartnerType; label: string }> = [
  { value: "referral", label: PARTNER_TYPE_LABELS.referral },
  { value: "certified_service", label: PARTNER_TYPE_LABELS.certified_service },
  { value: "strategic", label: PARTNER_TYPE_LABELS.strategic }
];

export function PartnersApplicationForm() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [started, setStarted] = useState(false);

  function markStarted() {
    if (started) return;
    setStarted(true);
    void fetch("/api/partners/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intent: "started" })
    }).catch(() => undefined);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const payload = {
      companyName: String(form.get("companyName") ?? ""),
      contactName: String(form.get("contactName") ?? ""),
      email: String(form.get("email") ?? ""),
      phone: String(form.get("phone") ?? ""),
      website: String(form.get("website") ?? ""),
      city: String(form.get("city") ?? ""),
      state: String(form.get("state") ?? ""),
      serviceArea: String(form.get("serviceArea") ?? ""),
      companyServiceType: String(form.get("companyServiceType") ?? ""),
      servicesOffered: String(form.get("servicesOffered") ?? ""),
      customersServed: String(form.get("customersServed") ?? ""),
      mpaAccountEmail: String(form.get("mpaAccountEmail") ?? ""),
      interestedPartnerType: String(form.get("interestedPartnerType") ?? ""),
      notes: String(form.get("notes") ?? ""),
      company_fax: String(form.get("company_fax") ?? "")
    };
    const response = await fetch("/api/partners/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    setSubmitting(false);
    if (!response.ok) {
      setError(body?.error ?? "We could not submit that application. Try again shortly.");
      return;
    }
    setSuccess(true);
  }

  if (success) {
    return (
      <div
        className="rounded-lg border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-5"
        role="status"
      >
        <h3 className="font-display text-xl font-semibold">Application received</h3>
        <p className="mt-2 text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
          Thank you. M.P.A. will review your Partner Program application. Approval is required before
          a referral link or commission tracking begins.
        </p>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit} onFocus={markStarted}>
      <div className="grid gap-4 md:grid-cols-2">
        <FormField id="companyName" label="Company name" required>
          <Input id="companyName" name="companyName" required autoComplete="organization" />
        </FormField>
        <FormField id="contactName" label="Contact name" required>
          <Input id="contactName" name="contactName" required autoComplete="name" />
        </FormField>
        <FormField id="email" label="Email" required>
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </FormField>
        <FormField id="phone" label="Phone" required>
          <Input id="phone" name="phone" type="tel" required autoComplete="tel" />
        </FormField>
        <FormField id="website" label="Website" optional>
          <Input id="website" name="website" type="url" autoComplete="url" />
        </FormField>
        <FormField id="city" label="City" required>
          <Input id="city" name="city" required autoComplete="address-level2" />
        </FormField>
        <FormField id="state" label="State" required>
          <Input id="state" name="state" required autoComplete="address-level1" />
        </FormField>
        <FormField id="serviceArea" label="Service area" required>
          <Input id="serviceArea" name="serviceArea" required />
        </FormField>
        <FormField id="companyServiceType" label="Company / service type" required>
          <Input id="companyServiceType" name="companyServiceType" required />
        </FormField>
        <FormField id="interestedPartnerType" label="Interested partner type" required>
          <Select
            id="interestedPartnerType"
            name="interestedPartnerType"
            required
            defaultValue="certified_service"
          >
            {TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField id="customersServed" label="Approximate customers / properties served" optional>
          <Input id="customersServed" name="customersServed" />
        </FormField>
        <FormField id="mpaAccountEmail" label="Current M.P.A. account email" optional>
          <Input id="mpaAccountEmail" name="mpaAccountEmail" type="email" />
        </FormField>
      </div>
      <FormField id="servicesOffered" label="Services offered" required>
        <Textarea id="servicesOffered" name="servicesOffered" required rows={4} />
      </FormField>
      <FormField id="notes" label="Additional notes" optional>
        <Textarea id="notes" name="notes" rows={3} />
      </FormField>
      <div aria-hidden="true" className="hidden">
        <label>
          Company fax
          <input name="company_fax" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      {error ? (
        <p className="text-sm text-[var(--mpa-color-text-danger,#B42318)]" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={submitting}>
        {submitting ? "Submitting…" : "Submit application"}
      </Button>
      <p className="text-xs leading-5 text-[var(--mpa-color-text-muted)]">
        You do not need an M.P.A. subscription to apply. Software access and customer pricing remain
        governed by the applicable M.P.A. plan or offer.
      </p>
    </form>
  );
}
