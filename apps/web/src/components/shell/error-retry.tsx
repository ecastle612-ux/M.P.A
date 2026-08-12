"use client";

import { Alert, Button } from "@mpa/ui";

/** Shared recoverable error pattern (PPS1-018 / PPS1-016). */
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
    <Alert
      variant="danger"
      title={title}
      className="border-l-[3px] border-l-[var(--mpa-color-status-danger,#C0392B)] bg-white text-[var(--mpa-color-text-primary)]"
      {...(onRetry
        ? {
            action: (
              <Button type="button" className="min-h-11" onClick={onRetry}>
                {retryLabel}
              </Button>
            )
          }
        : {})}
    >
      <p className="text-[var(--mpa-color-text-secondary)]">{description}</p>
    </Alert>
  );
}
