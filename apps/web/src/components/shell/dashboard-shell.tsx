import { Card, EmptyState, Skeleton } from "@mpa/ui";
import { Breadcrumbs } from "./breadcrumbs";
import { OrganizationFoundationPanel } from "../organization/organization-foundation-panel";

export function DashboardShellPlaceholder() {
  return (
    <main className="flex-1 space-y-6 bg-[var(--mpa-color-bg-app)] p-4 pb-[max(1.5rem,var(--mpa-safe-bottom))] md:p-6">
      <Breadcrumbs items={[{ href: "/dashboard", label: "Dashboard" }, { label: "Foundation" }]} />

      <section className="space-y-2">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--mpa-color-text-primary)] md:text-3xl">
          Operations dashboard
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-[var(--mpa-color-text-secondary)]">
          Foundation workspace shell. Business workflows are not included in this phase — this
          surface sets the visual standard for calm, decisive operations.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-[360px_1fr] xl:grid-cols-[380px_1fr]">
        <Card className="space-y-3">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">
              Attention queue
            </h2>
            <p className="text-xs text-[var(--mpa-color-text-muted)]">
              Placeholder structure for prioritized work.
            </p>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        </Card>

        <Card className="space-y-3">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">Work plane</h2>
            <p className="text-xs text-[var(--mpa-color-text-muted)]">
              Detail pane placeholder for selected queue items.
            </p>
          </div>
          <EmptyState
            title="Nothing selected"
            description="When workflows arrive, selecting a queue item will open its full context here — status, owner, and next action."
            className="border-none bg-[var(--mpa-color-bg-surface-muted)] px-4 py-10"
          />
        </Card>
      </section>

      <OrganizationFoundationPanel />
    </main>
  );
}
