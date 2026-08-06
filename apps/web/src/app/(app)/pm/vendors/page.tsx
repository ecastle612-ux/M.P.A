import Link from "next/link";

export default function Page() {
  return (
    <main className="flex-1 space-y-4 bg-[var(--mpa-color-bg-app)] p-4 md:p-6">
      <header className="max-w-2xl space-y-2">
        <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
          Vendors
        </h1>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          Vendor assignment for maintenance lives in the Maintenance Command Center — one workflow,
          reusing the Financial Operations vendor directory.
        </p>
      </header>
      <p className="text-sm">
        <Link
          href="/pm/maintenance"
          className="font-medium text-[var(--mpa-color-brand-primary)] underline"
        >
          Open Maintenance Command Center
        </Link>
      </p>
      <p className="text-sm text-[var(--mpa-color-text-secondary)]">
        Vendor payables remain in{" "}
        <Link href="/pm/financial-operations" className="underline">
          Financial Operations
        </Link>
        .
      </p>
    </main>
  );
}
