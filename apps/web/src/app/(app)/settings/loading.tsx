import { Skeleton } from "@mpa/ui";

export default function SettingsLoading() {
  return (
    <main className="mpa-page space-y-4">
      <p className="text-sm text-[var(--mpa-color-text-secondary)]">Loading settings…</p>
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-64 w-full max-w-2xl rounded-xl" />
    </main>
  );
}
