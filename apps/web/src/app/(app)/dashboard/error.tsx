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
    <main className="p-6">
      <Card className="max-w-xl">
        <h2 className="font-display text-xl font-semibold text-[var(--mpa-color-text-primary)]">
          Something went wrong
        </h2>
        <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">
          {error.message || "Unknown error in dashboard shell."}
        </p>
        <Button className="mt-4" onClick={reset}>
          Retry
        </Button>
      </Card>
    </main>
  );
}
