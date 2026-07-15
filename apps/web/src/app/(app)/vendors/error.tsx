"use client";

import { Button, Card } from "@mpa/ui";

export default function VendorsError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mpa-page flex-1 space-y-5">
      <Card>
        <h1 className="text-lg font-semibold text-[var(--mpa-color-text-primary)]">Vendors unavailable</h1>
        <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">{error.message}</p>
        <Button className="mt-4" onClick={reset}>
          Try again
        </Button>
      </Card>
    </main>
  );
}
