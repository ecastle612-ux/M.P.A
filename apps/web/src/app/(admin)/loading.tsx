import { Skeleton } from "@mpa/ui";

export default function AdminLoading() {
  return (
    <main className="space-y-4 p-6" aria-busy="true" aria-label="Loading Owner Operations">
      <Skeleton className="h-7 w-72" />
      <Skeleton className="h-4 w-80 max-w-full" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <Skeleton className="h-72 w-full" />
    </main>
  );
}
