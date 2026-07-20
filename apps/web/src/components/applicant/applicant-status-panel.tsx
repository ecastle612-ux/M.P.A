"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card } from "@mpa/ui";
import { toApplicantStatusLabel, type ApplicantRecord } from "../../lib/applicant/contracts";
import { isApplicantLifecycleActionAllowed } from "../../lib/applicant/events";

const LIFECYCLE_ACTIONS: Array<{ action: string; label: string; description: string }> = [
  { action: "submit", label: "Submit application", description: "Move from draft to submitted for processing." },
  { action: "request_documents", label: "Request documents", description: "Ask the applicant to provide required documents." },
  { action: "start_screening", label: "Start screening", description: "Initiate background screening for this applicant." },
  { action: "mark_pending_review", label: "Mark pending review", description: "Screening complete — ready for manager review." },
  { action: "approve", label: "Approve", description: "Application approved — continue to guided Move in." },
  { action: "decline", label: "Decline", description: "Decline this application." },
  { action: "withdraw", label: "Withdraw", description: "Applicant withdrew from the process." }
];

function moveInHref(applicant: ApplicantRecord): string {
  const params = new URLSearchParams();
  params.set("applicantId", applicant.id);
  if (applicant.propertyId) params.set("propertyId", applicant.propertyId);
  if (applicant.unitId) params.set("unitId", applicant.unitId);
  return `/residents/move-in?${params.toString()}`;
}

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
  const [moreOpen, setMoreOpen] = useState(false);

  const readyForMoveIn = applicant.status === "approved" || applicant.status === "converted_to_resident";
  const lifecycleActions = LIFECYCLE_ACTIONS.filter((entry) =>
    isApplicantLifecycleActionAllowed(applicant.status, entry.action)
  );

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
      const payload = (await response.json().catch(() => null)) as { message?: string; error?: string } | null;
      setError(payload?.error ?? payload?.message ?? "Action failed");
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
      const payload = (await response.json().catch(() => null)) as { message?: string; error?: string } | null;
      setError(payload?.error ?? payload?.message ?? "Signature request failed");
      return;
    }
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
        <div className="space-y-3">
          {readyForMoveIn ? (
            <div className="space-y-3 rounded-lg border border-[var(--mpa-color-brand-primary)]/30 bg-[var(--mpa-color-brand-primary-subtle)] p-4">
              <div>
                <p className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">Recommended next step</p>
                <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">
                  Guided Move in creates the resident, lease, signature handoff, activation, and welcome — one path.
                </p>
              </div>
              <Link href={moveInHref(applicant)}>
                <Button disabled={submitting !== null}>Continue to Move In</Button>
              </Link>
              <div>
                <Button
                  size="sm"
                  variant="ghost"
                  type="button"
                  onClick={() => setMoreOpen((value) => !value)}
                >
                  {moreOpen ? "Hide more actions" : "More actions"}
                </Button>
              </div>
              {moreOpen ? (
                <div className="space-y-2 border-t border-[var(--mpa-color-border-default)] pt-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--mpa-color-text-muted)]">
                    Advanced / exceptional
                  </p>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={submitting !== null}
                    onClick={() => void requestSignature()}
                  >
                    {submitting === "signature" ? "Requesting…" : "Request signature only"}
                  </Button>
                  <Link
                    href={`/leases/new?applicantId=${applicant.id}${applicant.tenantId ? `&tenantId=${applicant.tenantId}` : ""}`}
                    className="block"
                  >
                    <Button size="sm" variant="secondary">
                      New lease (manual)
                    </Button>
                  </Link>
                </div>
              ) : null}
            </div>
          ) : null}

          {lifecycleActions.length > 0 ? (
            <div className="space-y-2">
              {!readyForMoveIn ? (
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--mpa-color-text-muted)]">
                  Pipeline actions
                </p>
              ) : moreOpen ? (
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--mpa-color-text-muted)]">
                  Status changes
                </p>
              ) : null}
              {(!readyForMoveIn || moreOpen) &&
                lifecycleActions.map((entry) => (
                  <div
                    key={entry.action}
                    className="flex items-start justify-between gap-3 rounded-lg border border-[var(--mpa-color-border-default)] p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{entry.label}</p>
                      <p className="text-xs text-[var(--mpa-color-text-secondary)]">{entry.description}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={submitting !== null}
                      onClick={() => void runAction(entry.action)}
                    >
                      {submitting === entry.action ? "…" : "Run"}
                    </Button>
                  </div>
                ))}
            </div>
          ) : null}

          {applicant.tenantId ? (
            <p className="text-sm text-emerald-700">
              Resident record already linked. Prefer Continue to Move In to finish lease activation and welcome.
            </p>
          ) : null}
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </Card>
  );
}
