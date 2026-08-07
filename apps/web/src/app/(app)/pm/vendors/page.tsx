import Link from "next/link";
import { EmptyState, PageHeader } from "@mpa/ui";
import { Breadcrumbs } from "../../../../components/shell/breadcrumbs";

export default function Page() {
  return (
    <main className="flex-1 space-y-4 bg-[var(--mpa-color-bg-app)] p-4 md:p-6">
      <Breadcrumbs
        items={[
          { href: "/pm/mission-control", label: "PM Mission Control" },
          { label: "Vendors" }
        ]}
      />
      <PageHeader
        eyebrow="Property Manager"
        title="Vendors"
        description="Vendor assignment for maintenance lives in the Maintenance Command Center — one workflow, reusing the Financial Operations vendor directory."
      />
      <EmptyState
        title="Vendor work happens in Maintenance"
        description="Assign vendors on work orders from the Maintenance Command Center. Payables remain in Financial Operations."
        action={
          <>
            <Link
              href="/pm/maintenance"
              className="inline-flex h-9 items-center justify-center rounded-md bg-[var(--mpa-color-brand-primary)] px-4 text-sm font-medium text-white hover:bg-[var(--mpa-color-brand-primary-hover)]"
            >
              Open Maintenance Command Center
            </Link>
            <Link
              href="/pm/financial-operations"
              className="inline-flex h-9 items-center justify-center rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-4 text-sm font-medium text-[var(--mpa-color-text-primary)] hover:bg-[var(--mpa-color-bg-subtle)]"
            >
              Financial Operations
            </Link>
          </>
        }
      />
    </main>
  );
}
