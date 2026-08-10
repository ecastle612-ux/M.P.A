import { Skeleton } from "@mpa/ui";

export default function PortalLoading() {
  return (
    <main className="space-y-4 p-4" aria-busy="true" aria-label="Loading portal">
      <Skeleton className="h-6 w-48" />
      <div className="grid gap-3 sm:grid-cols-2">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <Skeleton className="h-48 w-full" />
    </main>
  );
}
