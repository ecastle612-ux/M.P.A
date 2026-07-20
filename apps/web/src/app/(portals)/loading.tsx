import { Skeleton } from "@mpa/ui";

export default function PortalLoading() {
  return (
    <main className="mx-auto max-w-3xl space-y-4 p-6">
      <p className="text-sm text-[var(--mpa-color-text-secondary)]">Loading your portal…</p>
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96" />
      <Skeleton className="h-48 w-full rounded-xl" />
      <Skeleton className="h-32 w-full rounded-xl" />
    </main>
  );
}
