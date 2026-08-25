"use client";

import { useMemo, useState } from "react";
import {
  PARTNER_EMERGENCY_DISCLAIMER,
  PARTNER_REQUEST_URGENCY_LABELS,
  PARTNER_SERVICE_CATEGORY_LABELS,
  type PartnerRequestUrgency,
  type PartnerServiceCategory
} from "@mpa/shared";
import { Alert, Button, FormField, Input, Select, Textarea } from "@mpa/ui";

type Branding = {
  companyName: string;
  serviceArea: string;
  contactPhone: string;
  contactEmail: string;
  description: string | null;
  slug: string;
  categories: PartnerServiceCategory[];
  title: string;
  poweredBy: string;
  hasLogo?: boolean;
  logoUrl?: string | null;
  unitHint?: string;
};

type Confirmation = {
  publicRef: string;
  statusPath: string | null;
};

export function PublicPartnerRequestPortal({
  slug,
  branding,
  propertySlug,
  propertyName,
  propertyInstructions
}: {
  slug: string;
  branding: Branding;
  propertySlug?: string;
  propertyName?: string;
  propertyInstructions?: string | null;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [unit, setUnit] = useState("");
  const [category, setCategory] = useState<PartnerServiceCategory>(
    branding.categories[0] ?? "general_maintenance"
  );
  const [description, setDescription] = useState("");
  const [urgency, setUrgency] = useState<PartnerRequestUrgency>("normal");
  const [photos, setPhotos] = useState<File[]>([]);
  const [video, setVideo] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [honeypot, setHoneypot] = useState("");

  const categories = useMemo(
    () => (branding.categories.length ? branding.categories : (["other"] as PartnerServiceCategory[])),
    [branding.categories]
  );

  async function uploadFile(file: File) {
    const prepared = await fetch(`/api/public/partners/${encodeURIComponent(slug)}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mimeType: file.type || "image/jpeg",
        fileSize: file.size,
        originalFileName: file.name
      })
    });
    const mediaBody = (await prepared.json()) as { mediaId?: string; uploadUrl?: string; error?: string };
    if (!prepared.ok || !mediaBody.mediaId) {
      throw new Error(mediaBody.error ?? "Could not attach the file.");
    }
    if (mediaBody.uploadUrl && !mediaBody.uploadUrl.startsWith("signed://")) {
      await fetch(mediaBody.uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type || "image/jpeg" }
      });
    }
    return mediaBody.mediaId;
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const files = [...photos, ...(video ? [video] : [])];
      const mediaIds: string[] = [];
      for (const file of files) {
        mediaIds.push(await uploadFile(file));
      }
      const endpoint = propertySlug
        ? `/api/public/partners/${encodeURIComponent(slug)}/${encodeURIComponent(propertySlug)}`
        : `/api/public/partners/${encodeURIComponent(slug)}`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requesterName: name,
          requesterEmail: email,
          requesterPhone: phone,
          ...(propertySlug ? {} : { propertyAddress: address }),
          unitLabel: unit,
          category,
          description,
          urgency,
          mediaIds,
          company_fax: honeypot
        })
      });
      const body = (await response.json()) as {
        error?: string;
        publicRef?: string;
        statusPath?: string | null;
      };
      if (!response.ok) throw new Error(body.error ?? "Could not submit this request.");
      setConfirmation({
        publicRef: body.publicRef ?? "Received",
        statusPath: body.statusPath ?? null
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit this request.");
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmation) {
    return (
      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          {branding.companyName}
        </p>
        <h1 className="font-display text-2xl font-semibold">Request received</h1>
        <p className="text-lg font-semibold">{confirmation.publicRef}</p>
        <p className="text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
          {branding.companyName} received your service request. Keep this reference if you follow up.
          This form is not an emergency-response system.
        </p>
        {confirmation.statusPath ? (
          <a className="inline-flex min-h-12 items-center underline" href={confirmation.statusPath}>
            Check request status
          </a>
        ) : null}
        <p className="text-xs text-[var(--mpa-color-text-muted)]">{branding.poweredBy}</p>
      </div>
    );
  }

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <header className="space-y-2">
        {branding.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={branding.logoUrl} alt={`${branding.companyName} logo`} className="h-14 w-14 object-contain" />
        ) : null}
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          {branding.companyName}
        </p>
        <h1 className="font-display text-2xl font-semibold">{branding.title}</h1>
        {propertyName ? (
          <p className="text-lg font-semibold">Property: {propertyName}</p>
        ) : null}
        {propertyInstructions ? (
          <p className="text-sm leading-6 text-[var(--mpa-color-text-secondary)]">{propertyInstructions}</p>
        ) : null}
        {branding.description ? (
          <p className="text-sm leading-6 text-[var(--mpa-color-text-secondary)]">{branding.description}</p>
        ) : null}
        {branding.serviceArea ? (
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">Service area: {branding.serviceArea}</p>
        ) : null}
        {branding.contactPhone || branding.contactEmail ? (
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            {[branding.contactPhone, branding.contactEmail].filter(Boolean).join(" · ")}
          </p>
        ) : null}
      </header>

      {error ? <Alert variant="danger">{error}</Alert> : null}

      <div className="grid gap-4">
        <FormField id="partner-request-name" label="Your name" required>
          <Input
            id="partner-request-name"
            name="name"
            autoComplete="name"
            className="min-h-12 text-base"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </FormField>
        <FormField id="partner-request-email" label="Email">
          <Input
            id="partner-request-email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            className="min-h-12 text-base"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </FormField>
        <FormField id="partner-request-phone" label="Phone">
          <Input
            id="partner-request-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            className="min-h-12 text-base"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
        </FormField>
        <p className="text-xs text-[var(--mpa-color-text-secondary)]">
          Enter an email or phone number so the partner can reach you.
        </p>
        {propertySlug ? null : (
          <FormField id="partner-request-address" label="Property or address" required>
            <Input
              id="partner-request-address"
              name="address"
              autoComplete="street-address"
              className="min-h-12 text-base"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              required
            />
          </FormField>
        )}
        <FormField id="partner-request-unit" label={branding.unitHint ?? "Unit, suite, or area"}>
          <Input
            id="partner-request-unit"
            name="unit"
            className="min-h-12 text-base"
            value={unit}
            onChange={(event) => setUnit(event.target.value)}
          />
        </FormField>
        <FormField id="partner-request-category" label="Service category" required>
          <Select
            id="partner-request-category"
            name="category"
            className="min-h-12 text-base"
            value={category}
            onChange={(event) => setCategory(event.target.value as PartnerServiceCategory)}
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {PARTNER_SERVICE_CATEGORY_LABELS[item]}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField id="partner-request-description" label="What needs to be done?" required>
          <Textarea
            id="partner-request-description"
            name="description"
            className="min-h-32 text-base"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            required
          />
        </FormField>
        <FormField id="partner-request-urgency" label="Urgency" required>
          <Select
            id="partner-request-urgency"
            name="urgency"
            className="min-h-12 text-base"
            value={urgency}
            onChange={(event) => setUrgency(event.target.value as PartnerRequestUrgency)}
          >
            {(Object.keys(PARTNER_REQUEST_URGENCY_LABELS) as PartnerRequestUrgency[]).map((item) => (
              <option key={item} value={item}>
                {PARTNER_REQUEST_URGENCY_LABELS[item]}
              </option>
            ))}
          </Select>
        </FormField>
        {urgency === "urgent" ? (
          <Alert variant="warning">{PARTNER_EMERGENCY_DISCLAIMER}</Alert>
        ) : null}
        <FormField id="partner-request-photos" label="Photos">
          <input
            id="partner-request-photos"
            name="photos"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            capture="environment"
            multiple
            className="min-h-12 w-full text-sm"
            aria-label="Upload photos of the issue"
            onChange={(event) => setPhotos(Array.from(event.target.files ?? []).slice(0, 6))}
          />
        </FormField>
        <FormField id="partner-request-video" label="Short video">
          <input
            id="partner-request-video"
            name="video"
            type="file"
            accept="video/mp4,video/quicktime"
            capture="environment"
            className="min-h-12 w-full text-sm"
            aria-label="Upload a short video of the issue"
            onChange={(event) => setVideo(event.target.files?.[0] ?? null)}
          />
        </FormField>
        <label className="sr-only" htmlFor="company_fax">
          Company fax
        </label>
        <input
          id="company_fax"
          name="company_fax"
          tabIndex={-1}
          autoComplete="off"
          className="hidden"
          value={honeypot}
          onChange={(event) => setHoneypot(event.target.value)}
        />
      </div>

      <Button type="submit" className="min-h-14 w-full text-base" disabled={submitting}>
        {submitting ? "Submitting…" : "Submit request"}
      </Button>
      <p className="text-center text-xs text-[var(--mpa-color-text-muted)]">{branding.poweredBy}</p>
    </form>
  );
}
