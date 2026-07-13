import { Card, Skeleton } from "@mpa/ui";
import { Breadcrumbs } from "./breadcrumbs";

export function DashboardShellPlaceholder() {
  return (
    <main className="flex-1 space-y-4 bg-[var(--mpa-color-bg-app)] p-4 md:p-6">
      <Breadcrumbs items={[{ href: "/dashboard", label: "Dashboard" }, { label: "Foundation" }]} />
      <section>
        <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
          Operations Dashboard Shell
        </h1>
        <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
          Empty foundation placeholder. No business functionality is included in Phase 2 scaffold.
        </p>
      </section>
      <section className="grid gap-4 lg:grid-cols-[380px_1fr]">
        <Card>
          <h2 className="mb-2 text-sm font-semibold text-[var(--mpa-color-text-primary)]">
            Attention Queue Placeholder
          </h2>
          <div className="space-y-2">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        </Card>
        <Card>
          <h2 className="mb-2 text-sm font-semibold text-[var(--mpa-color-text-primary)]">
            Work Plane Placeholder
          </h2>
          <Skeleton className="h-40" />
        </Card>
      </section>
    </main>
  );
}
