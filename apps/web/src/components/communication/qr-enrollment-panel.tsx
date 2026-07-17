"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Card } from "@mpa/ui";

export type QrEnrollmentProperty = {
  id: string;
  name: string;
  addressLine1?: string | null;
  city?: string | null;
  state?: string | null;
};

export function QrEnrollmentPanel({
  token,
  property,
  organizationName,
  isAuthenticated
}: {
  token: string;
  property: QrEnrollmentProperty;
  organizationName?: string | null;
  isAuthenticated: boolean;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleEnroll() {
    setError(null);
    setSuccess(null);

    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(`/join/${token}`)}`);
      return;
    }

    setSubmitting(true);
    const response = await fetch("/api/communication/enroll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token })
    });
    setSubmitting(false);

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setError(payload.error ?? "Enrollment failed.");
      return;
    }

    setSuccess("You are enrolled for property announcements.");
    router.push("/portal/tenant/announcements");
    router.refresh();
  }

  const addressParts = [property.addressLine1, property.city, property.state].filter(Boolean);

  return (
    <Card className="mx-auto max-w-lg space-y-4">
      <div>
        <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">Join Property</h1>
        <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
          Enroll to receive digital announcements from your property management team.
        </p>
      </div>

      <div className="rounded-md border border-[var(--mpa-color-border-subtle)] p-4">
        <p className="text-xs text-[var(--mpa-color-text-secondary)]">Property</p>
        <p className="text-lg font-semibold text-[var(--mpa-color-text-primary)]">{property.name}</p>
        {organizationName ? (
          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">Managed by {organizationName}</p>
        ) : null}
        {addressParts.length > 0 ? (
          <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">{addressParts.join(", ")}</p>
        ) : null}
      </div>

      {!isAuthenticated ? (
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          Sign in to complete enrollment and link this property to your resident account.
        </p>
      ) : null}

      {error ? <p className="text-sm text-[var(--mpa-color-feedback-error)]">{error}</p> : null}
      {success ? <p className="text-sm text-[var(--mpa-color-text-primary)]">{success}</p> : null}

      <Button type="button" disabled={submitting} onClick={handleEnroll}>
        {submitting ? "Enrolling..." : isAuthenticated ? "Enroll in announcements" : "Sign in to enroll"}
      </Button>
    </Card>
  );
}
