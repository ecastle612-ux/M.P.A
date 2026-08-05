"use client";

import { Button, Card } from "@mpa/ui";

export default function DashboardError({
  error,
  reset
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main className="mpa-page-enter p-4 md:p-6">
      <Card className="max-w-xl space-y-3 shadow-mpa-sm">
        <h2 className="font-display text-xl font-semibold tracking-tight text-[var(--mpa-color-text-primary)]">
          Something went wrong
        </h2>
        <p className="text-sm leading-relaxed text-[var(--mpa-color-text-secondary)]">
          {error.message || "Unknown error in dashboard shell."}
        </p>
        <p className="text-sm text-[var(--mpa-color-text-muted)]">
          Your workspace shell is intact. Retry to reload this view.
        </p>
        <Button className="mt-1" onClick={reset}>
          Retry
        </Button>
      </Card>
    </main>
  );
}
