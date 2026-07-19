"use client";

import { Progress, Spinner } from "@mpa/ui";

/**
 * UX-003 — communicate what the system is doing during waits.
 */
export function OperationalStatus({
  message,
  progress,
  className
}: {
  message: string;
  /** 0–100; omit for indeterminate spinner + bar */
  progress?: number;
  className?: string;
}) {
  return (
    <div
      className={
        className ??
        "flex items-start gap-3 rounded-md border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface-muted)]/60 px-3 py-2"
      }
      role="status"
      aria-live="polite"
    >
      <Spinner className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">{message}</p>
        {typeof progress === "number" ? <Progress value={progress} /> : <Progress />}
      </div>
    </div>
  );
}
