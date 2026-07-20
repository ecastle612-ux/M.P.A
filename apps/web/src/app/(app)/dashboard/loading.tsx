import { Skeleton } from "@mpa/ui";

export default function DashboardLoading() {
  return (
    <main className="mpa-page space-y-6">
      <p className="text-sm text-[var(--mpa-color-text-secondary)]">Loading Operations Center…</p>
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-80" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <Skeleton className="h-72 rounded-xl xl:col-span-1" />
        <Skeleton className="h-72 rounded-xl xl:col-span-2" />
      </div>
      <Skeleton className="h-96 rounded-xl" />
    </main>
  );
}
