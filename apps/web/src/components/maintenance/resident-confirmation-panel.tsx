"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@mpa/ui";

/**
 * Resident-facing confirm + feedback — no internal operational controls.
 */
export function ResidentConfirmationPanel({ workOrderId }: { workOrderId: string }) {
  const router = useRouter();
  const [feedback, setFeedback] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function confirm() {
    setError(null);
    setPending(true);
    try {
      const response = await fetch(`/api/maintenance/${workOrderId}/resident-confirm`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          feedback: feedback.trim() || null,
          rating
        })
      });
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.message ?? "Unable to confirm completion.");
      }
      setDone(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to confirm completion.");
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <section
        className="space-y-2 rounded-[var(--mpa-radius-xl)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] p-[var(--mpa-space-4)]"
        data-core004="resident-confirmation-done"
      >
        <h2 className="font-display text-lg font-semibold text-[var(--mpa-color-text-primary)]">
          Thank you
        </h2>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          Your confirmation was recorded. This request is complete.
        </p>
      </section>
    );
  }

  return (
    <section
      className="space-y-4 rounded-[var(--mpa-radius-xl)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] p-[var(--mpa-space-4)]"
      data-core004="resident-confirmation"
      aria-labelledby="resident-confirm-heading"
    >
      <div className="space-y-1">
        <h2
          id="resident-confirm-heading"
          className="font-display text-lg font-semibold text-[var(--mpa-color-text-primary)]"
        >
          Confirm completion
        </h2>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          Let us know the work looks good. Optional feedback helps your property team.
        </p>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-[var(--mpa-color-text-primary)]">
          Rating (optional)
        </legend>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              className={
                rating === value
                  ? "h-9 min-w-9 rounded-md bg-[var(--mpa-color-brand-primary)] px-3 text-sm font-semibold text-[var(--mpa-color-text-inverse)]"
                  : "h-9 min-w-9 rounded-md border border-[var(--mpa-color-border-default)] px-3 text-sm text-[var(--mpa-color-text-primary)]"
              }
              aria-pressed={rating === value}
              onClick={() => setRating(value)}
            >
              {value}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="block space-y-1">
        <span className="text-sm font-medium text-[var(--mpa-color-text-primary)]">
          Feedback (optional)
        </span>
        <textarea
          className="min-h-24 w-full rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-3 py-2 text-sm text-[var(--mpa-color-text-primary)]"
          value={feedback}
          onChange={(event) => setFeedback(event.target.value)}
          maxLength={1000}
        />
      </label>

      {error ? (
        <p className="text-sm text-[var(--mpa-color-status-danger)]" role="alert">
          {error}
        </p>
      ) : null}

      <Button type="button" disabled={pending} onClick={() => void confirm()}>
        {pending ? "Confirming…" : "Confirm completion"}
      </Button>
    </section>
  );
}
