"use client";

import { useState } from "react";
import { Button, Card } from "@mpa/ui";
import type { VendorJobCard } from "../../lib/vendor-jobs/contracts";
import { VendorInvoiceUpload } from "./vendor-invoice-upload";

type Props = {
  token: string;
  initialJob: VendorJobCard;
};

async function readJobError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error ?? "Something went wrong. Please try again.";
  } catch {
    return "Something went wrong. Please try again.";
  }
}

export function VendorJobCardView({ token, initialJob }: Props) {
  const [job, setJob] = useState(initialJob);
  const [notes, setNotes] = useState("");
  const [photoPaths, setPhotoPaths] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function startJob() {
    setBusy(true);
    setMessage(null);

    let location: { latitude: number; longitude: number; accuracyM?: number | null } | null = null;
    if (typeof navigator !== "undefined" && "geolocation" in navigator) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false,
            timeout: 8000,
            maximumAge: 60_000
          });
        });
        location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracyM: position.coords.accuracy
        };
      } catch {
        // Permission denied or unavailable — continue with timestamp only.
        location = null;
      }
    }

    try {
      const response = await fetch(`/api/vendor-jobs/${encodeURIComponent(token)}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientTimestamp: new Date().toISOString(),
          location
        })
      });
      if (!response.ok) {
        setMessage(await readJobError(response));
        return;
      }
      const body = (await response.json()) as { job: VendorJobCard };
      setJob(body.job);
      setMessage(
        body.job.arrivalRecordedWithLocation
          ? "Arrived on site — location recorded."
          : "Arrived on site — start time recorded."
      );
    } catch {
      setMessage("Unable to start the job. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function uploadPhoto(file: File) {
    const form = new FormData();
    form.append("file", file);
    const response = await fetch(`/api/vendor-jobs/${encodeURIComponent(token)}/photo`, {
      method: "POST",
      body: form
    });
    if (!response.ok) {
      throw new Error(await readJobError(response));
    }
    const body = (await response.json()) as { path: string };
    setPhotoPaths((prev) => [...prev, body.path].slice(0, 8));
  }

  async function finishJob() {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/vendor-jobs/${encodeURIComponent(token)}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes: notes.trim() || null,
          photoPaths
        })
      });
      if (!response.ok) {
        setMessage(await readJobError(response));
        return;
      }
      const body = (await response.json()) as { job: VendorJobCard };
      setJob(body.job);
      setMessage("Job submitted — awaiting manager approval.");
    } catch {
      setMessage("Unable to finish the job. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  if (job.phase === "unavailable") {
    return (
      <Card className="mx-auto w-full max-w-lg space-y-3 p-6">
        <h1 className="text-xl font-semibold text-[var(--mpa-color-text-primary)]">Job unavailable</h1>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          This work order is no longer available. Contact the property manager if you need help.
        </p>
      </Card>
    );
  }

  return (
    <Card className="mx-auto w-full max-w-lg space-y-5 p-6">
      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          {job.workOrderNumber}
        </p>
        <h1 className="text-2xl font-semibold text-[var(--mpa-color-text-primary)]">{job.title}</h1>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">{job.propertyAddress}</p>
      </div>

      {job.description ? (
        <div>
          <h2 className="text-sm font-medium text-[var(--mpa-color-text-primary)]">Job description</h2>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-[var(--mpa-color-text-secondary)]">
            {job.description}
          </p>
        </div>
      ) : null}

      <div className="rounded-[var(--mpa-radius-lg)] border border-[var(--mpa-color-border-subtle)] p-3 text-sm">
        <p className="font-medium text-[var(--mpa-color-text-primary)]">Manager contact</p>
        <p className="mt-1 text-[var(--mpa-color-text-secondary)]">{job.managerName ?? "Property manager"}</p>
        {job.managerPhone ? (
          <p className="mt-1">
            <a className="text-[var(--mpa-color-brand-primary)]" href={`tel:${job.managerPhone}`}>
              {job.managerPhone}
            </a>
          </p>
        ) : null}
        {job.managerEmail ? (
          <p className="mt-1">
            <a className="text-[var(--mpa-color-brand-primary)]" href={`mailto:${job.managerEmail}`}>
              {job.managerEmail}
            </a>
          </p>
        ) : null}
      </div>

      {job.estimatedTime ? (
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">Estimated time: {job.estimatedTime}</p>
      ) : null}

      {job.phase === "ready" ? (
        <div className="space-y-2">
          <Button type="button" className="w-full" size="lg" disabled={busy} onClick={() => void startJob()}>
            {busy ? "Starting…" : "Start Job"}
          </Button>
          <p className="text-xs text-[var(--mpa-color-text-secondary)]">
            Location is optional. If you allow it, we record an approximate arrival point for the property manager.
          </p>
        </div>
      ) : null}

      {job.phase === "on_site" ? (
        <div className="space-y-4">
          <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">
            On site{job.startedAt ? ` · started ${new Date(job.startedAt).toLocaleString()}` : ""}
          </p>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-[var(--mpa-color-text-primary)]">Notes (optional)</span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={4}
              className="w-full rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-3 text-sm"
              placeholder="What did you complete?"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-[var(--mpa-color-text-primary)]">Photos (optional)</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              disabled={busy || photoPaths.length >= 8}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                setBusy(true);
                void uploadPhoto(file)
                  .catch((error: unknown) => {
                    setMessage(error instanceof Error ? error.message : "Photo upload failed");
                  })
                  .finally(() => setBusy(false));
                event.target.value = "";
              }}
              className="block w-full text-sm"
            />
            {photoPaths.length > 0 ? (
              <p className="text-xs text-[var(--mpa-color-text-secondary)]">{photoPaths.length} photo(s) attached</p>
            ) : null}
          </label>

          <Button type="button" className="w-full" size="lg" disabled={busy} onClick={() => void finishJob()}>
            {busy ? "Submitting…" : "Finish Job"}
          </Button>
        </div>
      ) : null}

      {job.phase === "finished" ? (
        <div className="space-y-4">
          <div className="space-y-3 rounded-[var(--mpa-radius-lg)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface-muted)] p-5">
            <p className="text-lg font-semibold text-[var(--mpa-color-text-primary)]">✅ Work Submitted</p>
            <p className="text-sm leading-relaxed text-[var(--mpa-color-text-secondary)]">
              Your work has been submitted to the property manager for review.
            </p>
            <p className="text-sm leading-relaxed text-[var(--mpa-color-text-secondary)]">
              You&apos;ll be notified once it has been reviewed.
            </p>
            {job.completedAt ? (
              <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                Submitted {new Date(job.completedAt).toLocaleString()}
              </p>
            ) : null}
          </div>
          <VendorInvoiceUpload token={token} />
        </div>
      ) : null}

      {message ? <p className="text-sm text-[var(--mpa-color-text-secondary)]">{message}</p> : null}
    </Card>
  );
}
