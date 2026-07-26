import { Skeleton } from "@mpa/ui";

/**
 * Layout-stable loading mirror of TenantPortalHome — greeting, feed, actions, Today.
 * Uses Canopy Skeleton (surface-muted pulse), not flat gray slabs.
 */
export function TenantHomeSkeleton() {
  return (
    <div
      className="mx-auto max-w-lg space-y-5 pb-10 sm:max-w-2xl sm:space-y-6"
      aria-busy="true"
      aria-label="Loading your home"
    >
      {/* Greeting */}
      <header className="space-y-2">
        <div className="space-y-2">
          <Skeleton className="h-8 w-[14rem] max-w-[85%] rounded-lg bg-[var(--mpa-color-brand-primary-subtle)]/50" />
          <Skeleton className="h-4 w-28 rounded-md" />
        </div>
        <div className="space-y-1.5 pt-1">
          <Skeleton className="h-4 w-48 rounded-md" />
          <Skeleton className="h-3.5 w-20 rounded-md" />
          <Skeleton className="mt-1 h-3 w-36 rounded-md" />
        </div>
      </header>

      {/* For you */}
      <section className="space-y-2.5" aria-hidden>
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-16 rounded-md" />
          <Skeleton className="h-4 w-14 rounded-md" />
        </div>
        <div className="overflow-hidden rounded-[var(--mpa-radius-lg)] border border-[var(--mpa-color-border-subtle)]">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="space-y-2 border-b border-[var(--mpa-color-border-subtle)] px-4 py-3 last:border-b-0"
            >
              <Skeleton className="h-2.5 w-16 rounded-full" />
              <Skeleton className="h-4 w-[90%] rounded-md" />
              <Skeleton className="h-3 w-[70%] rounded-md" />
            </div>
          ))}
        </div>
      </section>

      {/* Quick actions */}
      <section className="space-y-2.5" aria-hidden>
        <Skeleton className="h-4 w-24 rounded-md" />
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
          <Skeleton className="min-h-12 w-full rounded-[var(--mpa-radius-lg)] bg-[var(--mpa-color-brand-primary-subtle)]/60" />
          <Skeleton className="min-h-12 w-full rounded-[var(--mpa-radius-lg)]" />
          <Skeleton className="min-h-12 w-full rounded-[var(--mpa-radius-lg)]" />
          <Skeleton className="min-h-12 w-full rounded-[var(--mpa-radius-lg)]" />
          <Skeleton className="min-h-12 w-full rounded-[var(--mpa-radius-lg)]" />
          <Skeleton className="min-h-12 w-full rounded-[var(--mpa-radius-lg)]" />
        </div>
      </section>

      {/* Today */}
      <section className="space-y-2.5" aria-hidden>
        <Skeleton className="h-4 w-14 rounded-md" />
        <Skeleton className="h-[4.5rem] w-full rounded-[var(--mpa-radius-lg)]" />
      </section>
    </div>
  );
}
