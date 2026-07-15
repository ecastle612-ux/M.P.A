import { Skeleton } from "@mpa/ui";

export default function PropertiesLoading() {
  return (
    <main className="mpa-page space-y-5">
      <Skeleton className="h-7 w-56" />
      <Skeleton className="h-14" />
      <Skeleton className="h-96" />
    </main>
  );
}
