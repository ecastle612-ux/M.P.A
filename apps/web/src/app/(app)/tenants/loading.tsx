import { Skeleton } from "@mpa/ui";

export default function TenantsLoading() {
  return (
    <main className="mpa-page space-y-5">
      <Skeleton className="h-7 w-56" />
      <Skeleton className="h-14" />
      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>
    </main>
  );
}
