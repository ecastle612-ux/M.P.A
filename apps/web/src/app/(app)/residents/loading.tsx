import { Skeleton } from "@mpa/ui";

export default function ResidentsLoading() {
  return (
    <div className="mpa-page space-y-4">
      <Skeleton className="h-7 w-56" />
      <Skeleton className="h-4 w-96" />
      <Skeleton className="h-80" />
    </div>
  );
}
