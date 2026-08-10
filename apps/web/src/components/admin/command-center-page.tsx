import Link from "next/link";
import { Badge } from "@mpa/ui";
import type {
  CommandCenterActivityItem,
  CommandCenterHealthItem,
  CommandCenterSnapshot,
  HealthTone
} from "../../lib/admin/command-center-metrics";
import { OwnerGlobalSearch } from "./owner-global-search";

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

function PlatformHealthCard({ item, href }: { item: CommandCenterHealthItem; href: string }) {
  return (
    <Link
      href={href}
      className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4 hover:border-[var(--mpa-color-brand-primary)]"
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">{item.label}</h3>
        <Badge variant={toneVariant(item.tone)}>{item.tone}</Badge>
      </div>
      <p className="mt-2 text-xs text-[var(--mpa-color-text-secondary)]">{item.detail}</p>
    </Link>
  );
}

const HEALTH_HREF: Record<string, string> = {
  stripe: "/admin/commercial/billing",
  supabase: "/admin/system",
  email: "/admin/support",
  demo: "/admin/system",
  jobs: "/admin/system"
};

export function CommandCenterPage({ snapshot }: { snapshot: CommandCenterSnapshot }) {
  const { organizations, commercial, users, system, activity, alerts } = snapshot;
  const commitSha =
    process.env["VERCEL_GIT_COMMIT_SHA"] ?? process.env["NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA"] ?? null;

  const extendedHealth: CommandCenterHealthItem[] = [
    {
      id: "production",
      label: "Production Status",
      tone: "ok",
      detail: commitSha ? `Deploy ${commitSha.slice(0, 7)}` : "Production deploy SHA unavailable in this runtime"
    },
    ...system,
    {
      id: "storage",
      label: "Storage",
      tone: system.find((s) => s.id === "supabase")?.tone === "ok" ? "ok" : "warn",
      detail: "Document + media storage via Supabase"
    },
    {
      id: "notifications",
      label: "Notifications",
      tone: system.find((s) => s.id === "email")?.tone ?? "unknown",
      detail: "Email/notification delivery — open Support Center for failures"
    },
    {
      id: "api",
      label: "API Health",
      tone: alerts.length > 0 ? "warn" : "ok",
      detail: alerts.length > 0 ? `${alerts.length} attention item(s)` : "No open platform alerts"
    },
    {
      id: "errors",
      label: "Recent Errors",
      tone: commercial.failedProvisioning > 0 ? "warn" : "ok",
      detail:
        commercial.failedProvisioning > 0
          ? `${commercial.failedProvisioning} failed provisioning job(s)`
          : "No terminal provisioning failures in current window"
    }
  ];

  return (
    <main className="space-y-8 p-4 md:p-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          Owner Operations · Platform Console
        </p>
        <h1 className="font-display text-3xl font-semibold text-[var(--mpa-color-text-primary)]">
          Command Center
        </h1>
        <p className="max-w-3xl text-sm text-[var(--mpa-color-text-secondary)]">
          Diagnose any customer issue from one place — platform health, global search, and live activity
          without database access.
        </p>
        <p className="font-mono text-[10px] text-[var(--mpa-color-text-secondary)]">
          Snapshot {new Date(snapshot.generatedAt).toLocaleString()}
          {commitSha ? ` · Deploy ${commitSha.slice(0, 7)}` : ""}
        </p>
      </header>

      <section aria-labelledby="platform-health-heading" className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 id="platform-health-heading" className="font-display text-lg font-semibold text-[var(--mpa-color-text-primary)]">
            Platform Health
          </h2>
          <Link href="/admin/system" className="text-sm text-[var(--mpa-color-brand-primary)] underline">
            Open System Health
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {extendedHealth.map((item) => (
            <PlatformHealthCard
              key={item.id}
              item={item}
              href={HEALTH_HREF[item.id] ?? "/admin/system"}
            />
          ))}
        </div>
      </section>

      <OwnerGlobalSearch />

      {alerts.length > 0 ? (
        <section aria-label="Needs attention" className="space-y-2">
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

      <section aria-labelledby="live-activity-heading" className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 id="live-activity-heading" className="font-display text-lg font-semibold text-[var(--mpa-color-text-primary)]">
            Live Activity
          </h2>
          <Link href="/admin/support" className="text-sm text-[var(--mpa-color-brand-primary)] underline">
            Open Support Center
          </Link>
        </div>
        <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
          <ActivityList
            title="Organizations created"
            items={activity.latestOrganizations}
            empty="No recent organizations."
          />
          <ActivityList
            title="Subscriptions & purchases"
            items={[...activity.latestPurchases, ...activity.latestLifecycle].slice(0, 8)}
            empty="No recent subscription activity."
          />
          <ActivityList
            title="Provisioning"
            items={activity.latestProvisioning}
            empty="No recent provisioning jobs."
          />
          <ActivityList
            title="Support / webhook events"
            items={activity.latestSupport}
            empty="No recent support events."
          />
          <section className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4 lg:col-span-2">
            <h3 className="font-display text-base font-semibold text-[var(--mpa-color-text-primary)]">
              Applications · Residents · Work orders · Documents
            </h3>
            <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">
              Open an organization profile for property-scoped residents, applications, work orders, and
              document intelligence. Use Customer Search above to jump directly.
            </p>
            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              <Link href="/admin/platform/organizations" className="text-[var(--mpa-color-brand-primary)] underline">
                Organizations
              </Link>
              <Link href="/admin/platform/customers" className="text-[var(--mpa-color-brand-primary)] underline">
                Customers
              </Link>
              <Link href="/admin/testing/impersonation" className="text-[var(--mpa-color-brand-primary)] underline">
                View As
              </Link>
              <Link href="/admin/system" className="text-[var(--mpa-color-brand-primary)] underline">
                System Health
              </Link>
            </div>
          </section>
        </div>
      </section>

      <section aria-label="Fleet summary" className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-[var(--mpa-color-text-primary)]">
          Fleet summary
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard label="Organizations" value={organizations.total} />
          <MetricCard label="Active" value={organizations.active} tone="ok" />
          <MetricCard
            label="Pending provisioning"
            value={organizations.pendingProvisioning}
            tone={organizations.pendingProvisioning ? "warn" : "ok"}
          />
          <MetricCard label="Active subscriptions" value={commercial.activeSubscriptions} />
          <MetricCard label="MRR" value={commercial.mrrFormatted} hint={`ARR ${commercial.arrFormatted}`} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard label="Users" value={users.total} />
          <MetricCard label="Property managers" value={users.propertyManagers} />
          <MetricCard label="Facility users" value={users.facilityUsers} />
          <MetricCard label="Residents" value={users.residents} />
          <MetricCard label="Operators" value={users.platformOperators} />
        </div>
      </section>
    </main>
  );
}
