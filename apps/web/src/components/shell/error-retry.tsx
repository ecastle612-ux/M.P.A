"use client";

import { Button } from "@mpa/ui";

/** Shared recoverable error pattern (PPS1-018). */
export function ErrorRetry({
  title,
  description,
  onRetry,
  retryLabel = "Retry"
}: {
  title: string;
  description: string;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <div
      role="alert"
      className="rounded-md border border-[var(--mpa-color-border-default)] border-l-[3px] border-l-[#C0392B] bg-white p-4"
    >
      <p className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">{title}</p>
      <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">{description}</p>
      {onRetry ? (
        <Button type="button" className="mt-3 min-h-11" onClick={onRetry}>
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}
