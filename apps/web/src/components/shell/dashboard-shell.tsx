import { Card, Skeleton } from "@mpa/ui";
import { Breadcrumbs } from "./breadcrumbs";
import { OrganizationFoundationPanel } from "../organization/organization-foundation-panel";

export function DashboardShellPlaceholder() {
  return (
    <main className="flex-1 space-y-4 bg-[var(--mpa-color-bg-app)] p-4 md:p-6">
      <Breadcrumbs items={[{ href: "/dashboard", label: "Dashboard" }]} />
      <section>
        <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
          Workspace
        </h1>
        <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
          Continue to Mission Control or finish organization setup below.
        </p>
      </section>
      <section className="grid gap-4 lg:grid-cols-[380px_1fr]">
        <Card>
          <h2 className="mb-2 text-sm font-semibold text-[var(--mpa-color-text-primary)]">
            Attention
          </h2>
          <div className="space-y-2">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        </Card>
        <Card>
          <h2 className="mb-2 text-sm font-semibold text-[var(--mpa-color-text-primary)]">
            Work plane
          </h2>
          <Skeleton className="h-40" />
        </Card>
      </section>
      <OrganizationFoundationPanel />
    </main>
  );
}
