import { Skeleton } from "@mpa/ui";

export default function ProfileLoading() {
  return (
    <main className="mpa-page space-y-4">
      <p className="text-sm text-[var(--mpa-color-text-secondary)]">Loading your profile…</p>
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-40 w-full max-w-xl rounded-xl" />
    </main>
  );
}
