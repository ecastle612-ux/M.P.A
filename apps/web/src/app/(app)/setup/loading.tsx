import { Skeleton } from "@mpa/ui";

export default function SetupLoading() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-4xl flex-col gap-6 py-8">
      <div className="flex flex-col items-center gap-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <Skeleton className="h-12" />
      <Skeleton className="h-72" />
    </div>
  );
}
