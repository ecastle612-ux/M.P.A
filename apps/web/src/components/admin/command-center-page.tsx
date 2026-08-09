import Link from "next/link";
import { Badge } from "@mpa/ui";
import { MASTER_ADMIN_NAV } from "@mpa/shared";
import type {
  CommandCenterActivityItem,
  CommandCenterHealthItem,
  CommandCenterSnapshot,
  HealthTone
} from "../../lib/admin/command-center-metrics";

function toneVariant(tone: HealthTone): "success" | "warning" | "danger" | "neutral" | "info" {
  switch (tone) {
    case "ok":
      return "success";
    case "warn":
      return "warning";
    case "down":
      return "danger";
    case "info":
      return "info";
    default:
      return "neutral";
  }
}

function MetricCard({
  label,
  value,
  hint,
  tone
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: HealthTone;
}) {
  return (
    <article className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          {label}
        </p>
        {tone ? <Badge variant={toneVariant(tone)}>{tone}</Badge> : null}
      </div>
      <p className="mt-2 font-display text-3xl font-semibold tabular-nums text-[var(--mpa-color-text-primary)]">
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">{hint}</p> : null}
    </article>
  );
}

function ActivityList({
  title,
  items,
  empty
}: {
  title: string;
  items: CommandCenterActivityItem[];
  empty: string;
}) {
  return (
    <section className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
      <h3 className="font-display text-base font-semibold text-[var(--mpa-color-text-primary)]">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-[var(--mpa-color-text-secondary)]">{empty}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="border-t border-[var(--mpa-color-border-subtle)] pt-2 first:border-t-0 first:pt-0"
            >
              {item.href ? (
                <Link href={item.href} className="block hover:text-[var(--mpa-color-brand-primary)]">
                  <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">{item.title}</p>
                  <p className="text-xs text-[var(--mpa-color-text-secondary)]">{item.detail}</p>
                  <p className="mt-0.5 font-mono text-[10px] text-[var(--mpa-color-text-secondary)]">
                    {new Date(item.at).toLocaleString()}
                  </p>
                </Link>
              ) : (
                <>
                  <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">{item.title}</p>
                  <p className="text-xs text-[var(--mpa-color-text-secondary)]">{item.detail}</p>
                  <p className="mt-0.5 font-mono text-[10px] text-[var(--mpa-color-text-secondary)]">
                    {new Date(item.at).toLocaleString()}
                  </p>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function SystemHealthCard({ item }: { item: CommandCenterHealthItem }) {
  return (
    <article className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">{item.label}</h3>
        <Badge variant={toneVariant(item.tone)}>{item.tone}</Badge>
      </div>
      <p className="mt-2 text-xs text-[var(--mpa-color-text-secondary)]">{item.detail}</p>
    </article>
  );
}

export function CommandCenterPage({ snapshot }: { snapshot: CommandCenterSnapshot }) {
  const { organizations, commercial, users, system, activity, alerts } = snapshot;

  return (
    <main className="space-y-8 p-4 md:p-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          Master Admin · Command Center
        </p>
        <h1 className="font-display text-3xl font-semibold text-[var(--mpa-color-text-primary)]">
          Platform Command Center
        </h1>
        <p className="max-w-3xl text-sm text-[var(--mpa-color-text-secondary)]">
          Operational visibility across organizations, commercial health, users, integrations, and recent
          platform activity. Read-only — no customer experience changes.
        </p>
        <p className="font-mono text-[10px] text-[var(--mpa-color-text-secondary)]">
          Generated {new Date(snapshot.generatedAt).toLocaleString()}
        </p>
      </header>

      {alerts.length > 0 ? (
        <section aria-label="Actionable alerts" className="space-y-2">
          <h2 className="font-display text-lg font-semibold text-[var(--mpa-color-text-primary)]">
            Needs attention
          </h2>
          <ul className="grid gap-2 md:grid-cols-2">
            {alerts.map((alert) => (
              <li key={alert.id}>
                <Link
                  href={alert.href ?? "/admin"}
                  className="flex items-start justify-between gap-3 rounded-md border border-[var(--mpa-color-border-default)] border-l-4 border-l-[#C0392B] bg-white px-4 py-3 hover:border-[var(--mpa-color-brand-primary)]"
                >
                  <span>
                    <span className="block text-sm font-semibold text-[var(--mpa-color-text-primary)]">
                      {alert.title}
                    </span>
                    <span className="mt-1 block text-xs text-[var(--mpa-color-text-secondary)]">
                      {alert.detail}
                    </span>
                  </span>
                  <Badge variant="danger">Alert</Badge>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-label="Organizations" className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-[var(--mpa-color-text-primary)]">
          Organizations
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard label="Total" value={organizations.total} />
          <MetricCard label="Active" value={organizations.active} tone="ok" />
          <MetricCard label="Trial" value={organizations.trial} tone="info" />
          <MetricCard label="Suspended" value={organizations.suspended} tone={organizations.suspended ? "warn" : "ok"} />
          <MetricCard
            label="Pending provisioning"
            value={organizations.pendingProvisioning}
            tone={organizations.pendingProvisioning ? "warn" : "ok"}
          />
        </div>
      </section>

      <section aria-label="Commercial" className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-[var(--mpa-color-text-primary)]">
          Commercial
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard label="Active subscriptions" value={commercial.activeSubscriptions} />
          <MetricCard label="Monthly recurring revenue" value={commercial.mrrFormatted} hint="From live Stripe list prices × billable subscriptions" />
          <MetricCard label="Annual recurring revenue" value={commercial.arrFormatted} hint="MRR × 12" />
          <MetricCard
            label="Failed provisioning"
            value={commercial.failedProvisioning}
            tone={commercial.failedProvisioning ? "down" : "ok"}
          />
          <MetricCard
            label="Recent purchases"
            value={commercial.recentPurchases.length}
            hint="Shown in activity"
          />
        </div>
      </section>

      <section aria-label="Users" className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-[var(--mpa-color-text-primary)]">Users</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard label="Total users" value={users.total} />
          <MetricCard label="Property Managers" value={users.propertyManagers} />
          <MetricCard label="Facility users" value={users.facilityUsers} />
          <MetricCard label="Residents" value={users.residents} />
          <MetricCard label="Platform operators" value={users.platformOperators} />
        </div>
      </section>

      <section aria-label="System health" className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-[var(--mpa-color-text-primary)]">System</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {system.map((item) => (
            <SystemHealthCard key={item.id} item={item} />
          ))}
        </div>
      </section>

      <section aria-label="Activity" className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-[var(--mpa-color-text-primary)]">Activity</h2>
        <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
          <ActivityList
            title="Latest organizations"
            items={activity.latestOrganizations}
            empty="No organizations yet."
          />
          <ActivityList
            title="Latest purchases"
            items={activity.latestPurchases}
            empty="No SaaS purchase records on this instance."
          />
          <ActivityList
            title="Latest provisioning"
            items={activity.latestProvisioning}
            empty="No provisioning jobs observed."
          />
          <ActivityList
            title="Latest lifecycle events"
            items={activity.latestLifecycle}
            empty="No in-memory lifecycle rows on this instance."
          />
          <ActivityList
            title="Latest support activity"
            items={activity.latestSupport}
            empty="No support ticket feed yet — showing empty until Support sprint. Stripe webhook events appear when present."
          />
        </div>
      </section>

      <section aria-label="Operator directories" className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-[var(--mpa-color-text-primary)]">
          Operator directories
        </h2>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          Existing Master Admin surfaces — unchanged navigation architecture.
        </p>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {MASTER_ADMIN_NAV.filter((group) => group.id !== "workspaces" && group.id !== "mission_control")
            .flatMap((group) =>
              group.items.slice(0, 3).map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-md border border-[var(--mpa-color-border-default)] bg-white px-3 py-3 text-sm hover:border-[var(--mpa-color-brand-primary)]"
                >
                  <span className="block text-xs uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
                    {group.title}
                  </span>
                  <span className="mt-1 block font-medium text-[var(--mpa-color-text-primary)]">{item.label}</span>
                </Link>
              ))
            )}
        </div>
      </section>
    </main>
  );
}
