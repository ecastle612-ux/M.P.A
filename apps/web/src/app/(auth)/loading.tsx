import { Skeleton } from "@mpa/ui";

/**
 * PMX-004 Phase 5 — auth route loading prefers structured skeleton over full-shell spinner.
 * Auth chrome is always dark → muted surfaces on dark tokens.
 */
export default function AuthLoading() {
  return (
    <div
      className="flex min-h-[100dvh] items-center justify-center bg-[var(--mpa-color-bg-app)] px-[var(--mpa-space-4)]"
      role="status"
      aria-live="polite"
      aria-label="Preparing sign-in"
    >
      <div className="w-full max-w-md space-y-[var(--mpa-space-4)] rounded-[var(--mpa-radius-lg)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] p-[var(--mpa-space-6)] shadow-[var(--mpa-shadow-md)]">
        <Skeleton className="mx-auto h-10 w-36 rounded-lg bg-[var(--mpa-color-brand-primary-subtle)]/50" />
        <Skeleton className="mx-auto h-4 w-48 rounded-md" />
        <div className="space-y-[var(--mpa-space-3)] pt-[var(--mpa-space-2)]">
          <Skeleton className="h-3 w-16 rounded-md" />
          <Skeleton className="h-11 w-full rounded-[var(--mpa-radius-md)]" />
          <Skeleton className="h-3 w-20 rounded-md" />
          <Skeleton className="h-11 w-full rounded-[var(--mpa-radius-md)]" />
          <Skeleton className="mt-[var(--mpa-space-2)] h-11 w-full rounded-[var(--mpa-radius-md)] bg-[var(--mpa-color-brand-primary-subtle)]/60" />
        </div>
      </div>
    </div>
  );
}
