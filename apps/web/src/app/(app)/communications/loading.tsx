import { Skeleton } from "@mpa/ui";

/** PMX-004 Phase 5 — structured skeleton (not full-shell spinner). */
export default function CommunicationsLoading() {
  return (
    <main className="mpa-page flex-1 space-y-5" aria-busy="true" aria-live="polite" aria-label="Loading communications">
      <Skeleton className="h-7 w-64" />
      <Skeleton className="h-4 w-72" />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,16rem)_1fr]">
        <div className="mpa-list-stack">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="mpa-list-row h-14 w-full rounded-[var(--mpa-radius-md)]" />
          ))}
        </div>
        <Skeleton className="min-h-72 rounded-[var(--mpa-radius-lg)]" />
      </div>
    </main>
  );
}
