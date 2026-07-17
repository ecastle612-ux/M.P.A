"use client";

import { Button } from "@mpa/ui";

export default function MigrationError({ reset }: { reset: () => void }) {
  return (
    <div className="mpa-page-wide space-y-3 py-8">
      <h1 className="text-xl font-semibold text-[var(--mpa-color-text-primary)]">Migration Center unavailable</h1>
      <p className="text-sm text-[var(--mpa-color-text-secondary)]">
        Something went wrong loading this page. Try again, or return to the Migration Center dashboard.
      </p>
      <Button type="button" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
