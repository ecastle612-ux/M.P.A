import { Skeleton } from "@mpa/ui";

/** Shared authenticated first-paint skeleton (PRA-007). */
export default function AppLoading() {
  return (
    <main className="space-y-4 p-6" aria-busy="true" aria-label="Loading workspace">
      <Skeleton className="h-7 w-64" />
      <Skeleton className="h-4 w-96 max-w-full" />
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
      <Skeleton className="h-64 w-full" />
    </main>
  );
}
