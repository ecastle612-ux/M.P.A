"use client";

export default function MigrationLoading() {
  return (
    <div className="mpa-page-wide animate-pulse space-y-4 py-8">
      <div className="h-8 w-64 rounded bg-[var(--mpa-color-bg-muted)]" />
      <div className="h-4 w-96 rounded bg-[var(--mpa-color-bg-muted)]" />
      <div className="h-40 rounded-xl bg-[var(--mpa-color-bg-muted)]" />
    </div>
  );
}
