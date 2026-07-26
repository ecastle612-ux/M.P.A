import { Skeleton } from "@mpa/ui";

/** PMX-004 Phase 5 — structured skeleton (not full-shell spinner). */
export default function FinancialsLoading() {
  return (
    <main className="mpa-page flex-1 space-y-5" aria-busy="true" aria-live="polite" aria-label="Loading financials">
      <Skeleton className="h-7 w-52" />
      <Skeleton className="h-4 w-72" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-[var(--mpa-radius-lg)]" />
        ))}
      </div>
      <Skeleton className="h-96 rounded-[var(--mpa-radius-lg)]" />
    </main>
  );
}
