import Link from "next/link";
import { Badge, Button, Card } from "@mpa/ui";
import { Breadcrumbs } from "./breadcrumbs";
import { OrganizationFoundationPanel } from "../organization/organization-foundation-panel";
import type { DashboardSnapshot } from "../../lib/dashboard/server";

export function DashboardShell({
  organizationName,
  snapshot,
  permissions = { canCreateProperty: false, canCreateUnit: false }
}: {
  organizationName: string | null;
  snapshot: DashboardSnapshot | null;
  permissions?: {
    canCreateProperty: boolean;
    canCreateUnit: boolean;
  };
}) {
  if (!snapshot) {
    return (
      <main className="mpa-page flex-1 space-y-5">
        <Breadcrumbs items={[{ href: "/dashboard", label: "Dashboard" }, { label: "Overview" }]} />
        <section className="rounded-lg border border-dashed border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-6">
          <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
            Welcome to your operations workspace
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--mpa-color-text-secondary)]">
            Create your first organization to unlock the dashboard, property catalog, and unit operations.
          </p>
        </section>
        <OrganizationFoundationPanel />
      </main>
    );
  }

  const hasPortfolio = snapshot.propertiesTotal > 0 || snapshot.unitsTotal > 0;
  const visibleTasks = snapshot.upcomingTasks.filter((task) => {
    if (task.id === "create-first-property" && !permissions.canCreateProperty) return false;
    if (task.id === "create-first-unit" && !permissions.canCreateUnit) return false;
    return true;
  });
  return (
    <main className="mpa-page flex-1 space-y-5">
      <Breadcrumbs items={[{ href: "/dashboard", label: "Dashboard" }, { label: "Overview" }]} />
      <section className="mpa-page-header">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
            Operations Overview
          </h1>
          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
            {organizationName
              ? `Live portfolio visibility for ${organizationName}.`
              : "Live portfolio visibility for your active organization."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {permissions.canCreateProperty ? (
            <Link href="/properties/new">
              <Button size="sm">Create Property</Button>
            </Link>
          ) : null}
          {permissions.canCreateUnit ? (
            <Link href="/units/new">
              <Button size="sm" variant="secondary">
                Create Unit
              </Button>
            </Link>
          ) : null}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-7">
        <MetricCard label="Properties" value={snapshot.propertiesTotal.toString()} />
        <MetricCard label="Units" value={snapshot.unitsTotal.toString()} />
        <MetricCard label="Occupied Units" value={snapshot.occupiedUnits.toString()} />
        <MetricCard label="Vacancies" value={snapshot.vacanciesTotal.toString()} />
        <MetricCard label="Occupancy" value={`${Math.round(snapshot.occupancyRate * 100)}%`} />
        <MetricCard label="Total Tenants" value={snapshot.tenantsTotal.toString()} />
        <MetricCard label="Expiring Leases" value={snapshot.expiringLeasesTotal.toString()} />
      </section>

      {!hasPortfolio ? (
        <Card className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-[var(--mpa-color-text-primary)]">Start your portfolio foundation</h2>
            <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
              Add your first property and units to unlock occupancy and vacancy intelligence.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {permissions.canCreateProperty ? (
              <Link href="/properties/new">
                <Button>Create Property</Button>
              </Link>
            ) : null}
            {permissions.canCreateUnit ? (
              <Link href="/units/new">
                <Button variant="secondary">Create Unit</Button>
              </Link>
            ) : null}
          </div>
        </Card>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-2">
        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">Recent Activity</h2>
            <Link
              href="/properties"
              className="text-xs font-medium text-[var(--mpa-color-brand-primary)] hover:underline"
            >
              View portfolio
            </Link>
          </div>
          {snapshot.recentActivity.length === 0 ? (
            <p className="text-sm text-[var(--mpa-color-text-secondary)]">
              Activity appears after the first property or unit update.
            </p>
          ) : (
            <ul className="space-y-2">
              {snapshot.recentActivity.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between rounded-md border border-[var(--mpa-color-border-default)] p-2"
                >
                  <div>
                    <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">{item.title}</p>
                    <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                      {item.type === "property" ? "Property" : "Unit"} updated {formatDate(item.timestamp)}
                    </p>
                  </div>
                  <Badge variant={item.status === "active" ? "success" : "neutral"}>{item.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card className="space-y-3">
          <h2 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">Upcoming Tasks</h2>
          <ul className="space-y-2">
            {visibleTasks.map((task) => (
              <li
                key={task.id}
                className="rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">{task.title}</p>
                  <Badge
                    variant={
                      task.priority === "high" ? "danger" : task.priority === "medium" ? "warning" : "info"
                    }
                  >
                    {task.priority}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">{task.description}</p>
                <Link
                  href={task.href}
                  className="mt-2 inline-block text-xs font-medium text-[var(--mpa-color-brand-primary)] hover:underline"
                >
                  Open task
                </Link>
              </li>
            ))}
          </ul>
          {visibleTasks.length === 0 ? (
            <p className="text-sm text-[var(--mpa-color-text-secondary)]">
              No actionable tasks for your current role.
            </p>
          ) : null}
        </Card>
      </section>

      <OrganizationFoundationPanel />
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <p className="text-xs uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[var(--mpa-color-text-primary)]">{value}</p>
    </Card>
  );
}

function formatDate(value: string): string {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return "recently";
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(timestamp);
}
