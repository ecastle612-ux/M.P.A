"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card } from "@mpa/ui";
import { toApplicantStatusLabel, type ApplicantRecord } from "../../lib/applicant/contracts";

const LIFECYCLE_ACTIONS: Array<{ action: string; label: string; description: string }> = [
  { action: "submit", label: "Submit application", description: "Move from draft to submitted for processing." },
  { action: "request_documents", label: "Request documents", description: "Ask the applicant to provide required documents." },
  { action: "start_screening", label: "Start screening", description: "Initiate background screening (noop provider stub)." },
  { action: "mark_pending_review", label: "Mark pending review", description: "Screening complete — ready for manager review." },
  { action: "approve", label: "Approve", description: "Application approved — ready for lease and signature workflow." },
  { action: "decline", label: "Decline", description: "Decline this application." },
  { action: "withdraw", label: "Withdraw", description: "Applicant withdrew from the process." }
];

export function ApplicantStatusPanel({
  applicant,
  canUpdate
}: {
  applicant: ApplicantRecord;
  canUpdate: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);

  async function runAction(action: string) {
    setError(null);
    setSubmitting(action);
    const response = await fetch(`/api/applicants/${applicant.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action })
    });
    setSubmitting(null);
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      setError(payload?.message ?? "Action failed");
      return;
    }
    router.refresh();
  }

  async function requestSignature() {
    setError(null);
    setSubmitting("signature");
    const response = await fetch("/api/signatures", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicantId: applicant.id, requestType: "lease_agreement" })
    });
    setSubmitting(null);
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      setError(payload?.message ?? "Signature request failed");
      return;
    }
    router.refresh();
  }

  async function convertToResident() {
    setError(null);
    setSubmitting("convert");
    const response = await fetch(`/api/applicants/${applicant.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "convert_to_resident" })
    });
    setSubmitting(null);
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      setError(payload?.message ?? "Conversion failed");
      return;
    }
    const payload = (await response.json()) as { tenantId: string };
    router.push(`/tenants/${payload.tenantId}?from=applicant-converted`);
    router.refresh();
  }

  return (
    <Card className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">Application status</h3>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          Current: <strong>{toApplicantStatusLabel(applicant.status)}</strong>
        </p>
      </div>

      {canUpdate ? (
        <div className="space-y-2">
          {LIFECYCLE_ACTIONS.map((entry) => (
            <div key={entry.action} className="flex items-start justify-between gap-3 rounded-lg border border-[var(--mpa-color-border-default)] p-3">
              <div>
                <p className="text-sm font-medium">{entry.label}</p>
                <p className="text-xs text-[var(--mpa-color-text-secondary)]">{entry.description}</p>
              </div>
              <Button size="sm" variant="secondary" disabled={submitting !== null} onClick={() => void runAction(entry.action)}>
                {submitting === entry.action ? "…" : "Run"}
              </Button>
            </div>
          ))}

          {applicant.status === "approved" ? (
            <>
              <Button variant="secondary" disabled={submitting !== null} onClick={() => void requestSignature()}>
                {submitting === "signature" ? "Requesting…" : "Request signature"}
              </Button>
              <Button disabled={submitting !== null} onClick={() => void convertToResident()}>
                {submitting === "convert" ? "Converting…" : "Convert to resident"}
              </Button>
            </>
          ) : null}

          {applicant.tenantId ? (
            <p className="text-sm text-emerald-700">
              Linked tenant record created. Documents and timeline preserved on applicant record.
            </p>
          ) : null}
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </Card>
  );
}
