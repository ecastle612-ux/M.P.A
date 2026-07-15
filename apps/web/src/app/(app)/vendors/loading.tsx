import { Card } from "@mpa/ui";

export default function VendorsLoading() {
  return (
    <main className="mpa-page flex-1 space-y-5">
      <Card aria-busy="true" aria-live="polite">
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">Loading vendor workspace…</p>
      </Card>
    </main>
  );
}
