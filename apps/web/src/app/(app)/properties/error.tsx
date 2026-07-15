"use client";

import { Button, Card } from "@mpa/ui";

export default function PropertiesError({
  error,
  reset
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main className="mpa-page">
      <Card className="max-w-xl">
        <h2 className="font-display text-xl font-semibold text-[var(--mpa-color-text-primary)]">
          Property workflow unavailable
        </h2>
        <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">
          {error.message || "Unable to load property operations."}
        </p>
        <Button className="mt-4" onClick={reset}>
          Retry
        </Button>
      </Card>
    </main>
  );
}
