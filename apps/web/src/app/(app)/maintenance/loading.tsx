import { Skeleton } from "@mpa/ui";

/** PMX-004 Phase 5 — structured skeleton (not full-shell spinner). */
export default function MaintenanceLoading() {
  return (
    <main className="mpa-page flex-1 space-y-5" aria-busy="true" aria-live="polite" aria-label="Loading maintenance">
      <Skeleton className="h-7 w-56" />
      <Skeleton className="h-4 w-80" />
      <div className="mpa-list-stack">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="mpa-list-row h-14 w-full rounded-[var(--mpa-radius-md)]" />
        ))}
      </div>
    </main>
  );
}
