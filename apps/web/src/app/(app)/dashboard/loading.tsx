import { Skeleton } from "@mpa/ui";

export default function DashboardLoading() {
  return (
    <main
      className="space-y-6 p-4 md:p-6"
      aria-busy="true"
      aria-label="Loading workspace"
    >
      <Skeleton className="h-4 w-40" />
      <div className="space-y-2">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-56" />
        <Skeleton className="h-56" />
      </div>
    </main>
  );
}
