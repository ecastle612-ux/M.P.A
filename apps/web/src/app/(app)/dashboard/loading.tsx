import { Skeleton } from "@mpa/ui";

export default function DashboardLoading() {
  return (
    <main className="space-y-4 p-6">
      <Skeleton className="h-7 w-72" />
      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    </main>
  );
}
