import Link from "next/link";
import { Badge } from "@mpa/ui";
import type { Ma4SubscriptionsDirectory } from "../../lib/admin/load-ma4-subscriptions";
import type {
  Ma4SubscriptionDetail,
  Ma4SubscriptionFilters,
  Ma4SubscriptionRow
} from "../../lib/admin/ma4-commercial";
import { healthToneToBadge } from "../../lib/admin/ma4-commercial";
import { Ma7CapacityMutationBlocked, Ma7SubscriptionActions } from "./ma7-mutation-actions";

function HealthBadge({ health }: { health: Ma4SubscriptionRow["health"] }) {
  const label =
    health === "healthy" ? "HEALTHY" : health === "attention" ? "ATTENTION REQUIRED" : "UNKNOWN";
  const variant =
    health === "healthy" ? "success" : health === "attention" ? "warning" : "neutral";
  return <Badge variant={variant}>{label}</Badge>;
}

function FiltersForm({
  filters,
  basePath
}: {
  filters: Ma4SubscriptionFilters;
  basePath: "/admin/subscriptions" | "/admin/capacity";
}) {
  return (
    <form
      method="get"
      className="grid gap-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4 md:grid-cols-3 xl:grid-cols-4"
    >
      <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
        Search
        <input
          name="q"
          defaultValue={filters.q ?? ""}
          placeholder="org name or id"
          className="mt-1 w-full rounded-md border border-[var(--mpa-color-border-default)] px-2 py-2 text-sm"
        />
      </label>
      <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
        Product / module
        <select
          name="sku"
          defaultValue={filters.sku ?? ""}
          className="mt-1 w-full rounded-md border border-[var(--mpa-color-border-default)] px-2 py-2 text-sm"
        >
          <option value="">All</option>
          <option value="mpa_property_manager">Property Manager</option>
          <option value="mpa_facility_operations">Facility Operations</option>
          <option value="mpa_complete_platform">Complete Platform</option>
        </select>
      </label>
      <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
        Billing interval
        <select
          name="billingCycle"
          defaultValue={filters.billingCycle ?? ""}
          className="mt-1 w-full rounded-md border border-[var(--mpa-color-border-default)] px-2 py-2 text-sm"
        >
          <option value="">All</option>
          <option value="monthly">Monthly</option>
          <option value="annual">Annual</option>
        </select>
      </label>
      <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
        Status
        <select
          name="status"
          defaultValue={filters.status ?? ""}
          className="mt-1 w-full rounded-md border border-[var(--mpa-color-border-default)] px-2 py-2 text-sm"
        >
          <option value="">All</option>
          <option value="active">active</option>
          <option value="trialing">trialing</option>
          <option value="past_due">past_due</option>
          <option value="canceled">canceled</option>
          <option value="pending">pending</option>
          <option value="unpaid">unpaid</option>
          <option value="incomplete">incomplete</option>
          <option value="expired">expired</option>
        </select>
      </label>
      <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
        Trial
        <select
          name="trial"
          defaultValue={filters.trial ?? ""}
          className="mt-1 w-full rounded-md border border-[var(--mpa-color-border-default)] px-2 py-2 text-sm"
        >
          <option value="">All</option>
          <option value="active">active</option>
          <option value="inactive">inactive</option>
          <option value="eligible">eligible (≤500)</option>
          <option value="ineligible">ineligible (&gt;500)</option>
        </select>
      </label>
      <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
        Cancelling
        <select
          name="cancelAtPeriodEnd"
          defaultValue={filters.cancelAtPeriodEnd ?? ""}
          className="mt-1 w-full rounded-md border border-[var(--mpa-color-border-default)] px-2 py-2 text-sm"
        >
          <option value="">All</option>
          <option value="yes">cancel at period end</option>
          <option value="no">not cancelling</option>
        </select>
      </label>
      <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
        Health
        <select
          name="health"
          defaultValue={filters.health ?? ""}
          className="mt-1 w-full rounded-md border border-[var(--mpa-color-border-default)] px-2 py-2 text-sm"
        >
          <option value="">All</option>
          <option value="healthy">healthy</option>
          <option value="attention">attention</option>
          <option value="unknown">unknown</option>
        </select>
      </label>
      <input type="hidden" name="page" value="1" />
      <div className="md:col-span-3 xl:col-span-4 flex flex-wrap gap-3">
        <button
          type="submit"
          className="rounded-md bg-[var(--mpa-color-brand-primary)] px-4 py-2 text-sm font-medium text-white"
        >
          Apply filters
        </button>
        <Link href={basePath} className="text-sm text-[var(--mpa-color-brand-primary)] underline">
          Clear
        </Link>
        <p className="text-xs text-[var(--mpa-color-text-secondary)]">Read-only. No mutations.</p>
      </div>
    </form>
  );
}

function Pagination({
  basePath,
  filters,
  pagination
}: {
  basePath: string;
  filters: Ma4SubscriptionFilters;
  pagination: Ma4SubscriptionsDirectory["pagination"];
}) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.sku) params.set("sku", filters.sku);
  if (filters.billingCycle) params.set("billingCycle", filters.billingCycle);
  if (filters.status) params.set("status", filters.status);
  if (filters.trial) params.set("trial", filters.trial);
  if (filters.cancelAtPeriodEnd) params.set("cancelAtPeriodEnd", filters.cancelAtPeriodEnd);
  if (filters.health) params.set("health", filters.health);
  params.set("pageSize", String(filters.pageSize));

  const prev = pagination.page > 1 ? pagination.page - 1 : null;
  const next = pagination.hasMore ? pagination.page + 1 : null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
      <p className="text-[var(--mpa-color-text-secondary)]">
        Page {pagination.page} of {pagination.totalPages} · {pagination.total} matched
      </p>
      <div className="flex gap-3">
        {prev ? (
          <Link
            href={`${basePath}?${new URLSearchParams({ ...Object.fromEntries(params), page: String(prev) })}`}
            className="text-[var(--mpa-color-brand-primary)] underline"
          >
            Previous
          </Link>
        ) : (
          <span className="text-[var(--mpa-color-text-secondary)]">Previous</span>
        )}
        {next ? (
          <Link
            href={`${basePath}?${new URLSearchParams({ ...Object.fromEntries(params), page: String(next) })}`}
            className="text-[var(--mpa-color-brand-primary)] underline"
          >
            Next
          </Link>
        ) : (
          <span className="text-[var(--mpa-color-text-secondary)]">Next</span>
        )}
      </div>
    </div>
  );
}

function SubscriptionCards({
  rows,
  detailBase
}: {
  rows: Ma4SubscriptionRow[];
  detailBase: "/admin/subscriptions" | "/admin/capacity";
}) {
  if (rows.length === 0) {
    return (
      <p className="rounded-md border border-[var(--mpa-color-border-default)] bg-white px-4 py-6 text-sm text-[var(--mpa-color-text-secondary)]">
        No subscriptions match the current filters.
      </p>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[960px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--mpa-color-border-default)] text-xs uppercase text-[var(--mpa-color-text-secondary)]">
              <th className="px-3 py-2 font-semibold">Organization</th>
              <th className="px-3 py-2 font-semibold">Product</th>
              <th className="px-3 py-2 font-semibold">Interval</th>
              <th className="px-3 py-2 font-semibold">Status</th>
              <th className="px-3 py-2 font-semibold">Units</th>
              <th className="px-3 py-2 font-semibold">Capacity</th>
              <th className="px-3 py-2 font-semibold">Next</th>
              <th className="px-3 py-2 font-semibold">Health</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.organizationId}
                className="border-b border-[var(--mpa-color-border-subtle)] hover:bg-[var(--mpa-color-bg-app)]"
              >
                <td className="px-3 py-2">
                  <Link
                    href={`${detailBase}/${row.organizationId}`}
                    className="font-medium text-[var(--mpa-color-brand-primary)] underline"
                  >
                    {row.organizationName}
                  </Link>
                  <p className="font-mono text-[10px] text-[var(--mpa-color-text-secondary)]">
                    {row.organizationId}
                  </p>
                </td>
                <td className="px-3 py-2">{row.skuLabel ?? "—"}</td>
                <td className="px-3 py-2 capitalize">{row.billingCycle ?? "—"}</td>
                <td className="px-3 py-2">
                  {row.status ?? "—"}
                  {row.trialActive ? " · trial" : ""}
                  {row.cancelAtPeriodEnd ? " · cancelling" : ""}
                </td>
                <td className="px-3 py-2 tabular-nums">{row.managedUnitCount ?? "—"}</td>
                <td className="px-3 py-2 tabular-nums">
                  {row.authorizedUnitCapacity ?? "—"}
                  {row.utilizationPercent != null ? (
                    <span className="ml-1 text-xs text-[var(--mpa-color-text-secondary)]">
                      ({row.utilizationPercent}%)
                    </span>
                  ) : null}
                </td>
                <td className="px-3 py-2 tabular-nums">
                  {row.pendingAuthorizedUnitCapacity ?? "—"}
                </td>
                <td className="px-3 py-2">
                  <HealthBadge health={row.health} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <ul className="space-y-3 md:hidden">
        {rows.map((row) => (
          <li
            key={row.organizationId}
            className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-3"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <Link
                href={`${detailBase}/${row.organizationId}`}
                className="text-sm font-medium text-[var(--mpa-color-brand-primary)] underline"
              >
                {row.organizationName}
              </Link>
              <HealthBadge health={row.health} />
            </div>
            <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">
              {row.skuLabel ?? "—"} · {row.billingCycle ?? "—"} · {row.status ?? "—"}
            </p>
            <p className="mt-1 text-xs tabular-nums text-[var(--mpa-color-text-secondary)]">
              units {row.managedUnitCount ?? "—"} / cap {row.authorizedUnitCapacity ?? "—"}
              {row.utilizationPercent != null ? ` (${row.utilizationPercent}%)` : ""}
            </p>
          </li>
        ))}
      </ul>
    </>
  );
}

export function Ma4SubscriptionsPage({ directory }: { directory: Ma4SubscriptionsDirectory }) {
  const { rows, filters, pagination, degraded, totals } = directory;

  return (
    <main className="space-y-6 p-4 md:p-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          Master Admin
        </p>
        <h1 className="font-display text-3xl font-semibold text-[var(--mpa-color-text-primary)]">
          Subscriptions
        </h1>
        <p className="max-w-3xl text-sm text-[var(--mpa-color-text-secondary)]">
          Platform-wide commercial state from durable organization_subscriptions — product,
          interval, trial, capacity, entitlements, Stripe linkage. Read-only.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-md border border-[var(--mpa-color-border-default)] bg-white px-3 py-3">
          <p className="text-[11px] uppercase text-[var(--mpa-color-text-secondary)]">Matched</p>
          <p className="font-display text-2xl font-semibold tabular-nums">{totals.matched}</p>
        </article>
        <article className="rounded-md border border-[var(--mpa-color-border-default)] bg-white px-3 py-3">
          <p className="text-[11px] uppercase text-[var(--mpa-color-text-secondary)]">Healthy</p>
          <p className="font-display text-2xl font-semibold tabular-nums">{totals.healthy}</p>
        </article>
        <article className="rounded-md border border-[var(--mpa-color-border-default)] bg-white px-3 py-3">
          <p className="text-[11px] uppercase text-[var(--mpa-color-text-secondary)]">Attention</p>
          <p className="font-display text-2xl font-semibold tabular-nums">{totals.attention}</p>
        </article>
        <article className="rounded-md border border-[var(--mpa-color-border-default)] bg-white px-3 py-3">
          <p className="text-[11px] uppercase text-[var(--mpa-color-text-secondary)]">Unknown</p>
          <p className="font-display text-2xl font-semibold tabular-nums">{totals.unknown}</p>
        </article>
      </div>

      <FiltersForm filters={filters} basePath="/admin/subscriptions" />

      {degraded.length > 0 ? (
        <div
          role="status"
          className="rounded-md border border-l-4 border-l-[#C0392B] border-[var(--mpa-color-border-default)] bg-white px-4 py-3 text-sm"
        >
          <p className="font-semibold">Partial data</p>
          <ul className="mt-1 list-disc pl-5 text-[var(--mpa-color-text-secondary)]">
            {degraded.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <SubscriptionCards rows={rows} detailBase="/admin/subscriptions" />
      <Pagination basePath="/admin/subscriptions" filters={filters} pagination={pagination} />
    </main>
  );
}

export function Ma4CapacityPage({ directory }: { directory: Ma4SubscriptionsDirectory }) {
  const { rows, filters, pagination, degraded, totals } = directory;

  return (
    <main className="space-y-6 p-4 md:p-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          Master Admin
        </p>
        <h1 className="font-display text-3xl font-semibold text-[var(--mpa-color-text-primary)]">
          Capacity
        </h1>
        <p className="max-w-3xl text-sm text-[var(--mpa-color-text-secondary)]">
          Unit-volume capacity fleet — managed units, authorized capacity, next-period changes,
          and reconciliation. Uses shared commercial domain math. Read-only.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <article className="rounded-md border border-[var(--mpa-color-border-default)] bg-white px-3 py-3">
          <p className="text-[11px] uppercase text-[var(--mpa-color-text-secondary)]">Orgs</p>
          <p className="font-display text-2xl font-semibold tabular-nums">{totals.matched}</p>
        </article>
        <article className="rounded-md border border-[var(--mpa-color-border-default)] bg-white px-3 py-3">
          <p className="text-[11px] uppercase text-[var(--mpa-color-text-secondary)]">Attention</p>
          <p className="font-display text-2xl font-semibold tabular-nums">{totals.attention}</p>
        </article>
        <article className="rounded-md border border-[var(--mpa-color-border-default)] bg-white px-3 py-3">
          <p className="text-[11px] uppercase text-[var(--mpa-color-text-secondary)]">Healthy</p>
          <p className="font-display text-2xl font-semibold tabular-nums">{totals.healthy}</p>
        </article>
      </div>

      <FiltersForm filters={filters} basePath="/admin/capacity" />

      {degraded.length > 0 ? (
        <div
          role="status"
          className="rounded-md border border-l-4 border-l-[#C0392B] border-[var(--mpa-color-border-default)] bg-white px-4 py-3 text-sm"
        >
          <p className="font-semibold">Partial data</p>
          <ul className="mt-1 list-disc pl-5 text-[var(--mpa-color-text-secondary)]">
            {degraded.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <SubscriptionCards rows={rows} detailBase="/admin/capacity" />
      <Pagination basePath="/admin/capacity" filters={filters} pagination={pagination} />
    </main>
  );
}

export function Ma4SubscriptionDetailPage({
  detail,
  degraded,
  mode
}: {
  detail: Ma4SubscriptionDetail | null;
  degraded: string[];
  mode: "subscription" | "capacity";
}) {
  if (!detail) {
    return (
      <main className="space-y-4 p-4 md:p-6">
        <Link
          href={mode === "capacity" ? "/admin/capacity" : "/admin/subscriptions"}
          className="text-sm text-[var(--mpa-color-brand-primary)] underline"
        >
          ← Back
        </Link>
        <h1 className="font-display text-2xl font-semibold">Not found</h1>
        {degraded.length > 0 ? (
          <ul className="list-disc pl-5 text-sm text-[var(--mpa-color-text-secondary)]">
            {degraded.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        ) : null}
      </main>
    );
  }

  const { commercial: row, entitlements, capacity, trial, stripe, health, anomalies } = detail;
  const back = mode === "capacity" ? "/admin/capacity" : "/admin/subscriptions";

  return (
    <main className="space-y-6 p-4 md:p-6">
      <header className="space-y-2">
        <div className="flex flex-wrap gap-2 text-xs">
          <Link href={back} className="text-[var(--mpa-color-brand-primary)] underline">
            ← {mode === "capacity" ? "Capacity" : "Subscriptions"}
          </Link>
          <Link
            href={`/admin/platform/organizations/${row.organizationId}`}
            className="text-[var(--mpa-color-brand-primary)] underline"
          >
            Organization Detail
          </Link>
          {mode === "subscription" ? (
            <Link
              href={`/admin/capacity/${row.organizationId}`}
              className="text-[var(--mpa-color-brand-primary)] underline"
            >
              Capacity detail
            </Link>
          ) : (
            <Link
              href={`/admin/subscriptions/${row.organizationId}`}
              className="text-[var(--mpa-color-brand-primary)] underline"
            >
              Subscription detail
            </Link>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl font-semibold text-[var(--mpa-color-text-primary)]">
            {row.organizationName}
          </h1>
          <HealthBadge health={health} />
        </div>
        <p className="font-mono text-xs text-[var(--mpa-color-text-secondary)]">{row.organizationId}</p>
      </header>

      {anomalies.length > 0 ? (
        <section className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
          <h2 className="font-display text-lg font-semibold">Reconciliation</h2>
          <ul className="mt-3 space-y-2">
            {anomalies.map((a) => (
              <li key={a.code} className="text-sm">
                <Badge variant={a.severity === "attention" ? "warning" : "neutral"}>{a.code}</Badge>{" "}
                {a.reason}
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <section className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4 text-sm">
          No reconciliation issues detected from available fields.
        </section>
      )}

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
          <h2 className="font-display text-lg font-semibold">Commercial</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <Kv label="Product" value={row.skuLabel ?? "—"} />
            <Kv label="Billing interval" value={row.billingCycle ?? "—"} />
            <Kv label="Status" value={row.status ?? "—"} />
            <Kv label="Cancel at period end" value={row.cancelAtPeriodEnd ? "yes" : "no"} />
            <Kv
              label="Current period end"
              value={row.currentPeriodEnd ? new Date(row.currentPeriodEnd).toLocaleString() : "—"}
            />
            <Kv label="Entitlement state" value={row.entitlementState} />
            <Kv
              label="Last lifecycle update"
              value={row.updatedAt ? new Date(row.updatedAt).toLocaleString() : "—"}
            />
            <Kv label="Grace started" value={row.graceStartedAt ? new Date(row.graceStartedAt).toLocaleString() : "—"} />
          </dl>
        </article>

        <article className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
          <h2 className="font-display text-lg font-semibold">Trial</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <Kv label="Trial active" value={trial.active ? "yes" : "no"} />
            <Kv label="Trial ends" value={trial.endsAt ? new Date(trial.endsAt).toLocaleString() : "—"} />
            <Kv
              label="Eligible"
              value={trial.eligible == null ? "unknown" : trial.eligible ? "yes" : "no"}
            />
            <Kv label="Eligibility basis" value={trial.eligibilityBasis} />
            <Kv label="Payment method" value={trial.paymentMethodNote} />
            <Kv label="Current units" value={trial.currentUnits ?? "—"} />
          </dl>
        </article>
      </section>

      {mode === "subscription" ? (
        <Ma7SubscriptionActions
          organizationId={row.organizationId}
          organizationName={row.organizationName}
          status={row.status}
          cancelAtPeriodEnd={row.cancelAtPeriodEnd}
          currentPeriodEnd={row.currentPeriodEnd}
        />
      ) : null}

      <section className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
        <h2 className="font-display text-lg font-semibold">Entitlements</h2>
        {entitlements.legacyPlanTier ? (
          <p className="mt-2 text-xs text-[var(--mpa-color-text-secondary)]">{entitlements.legacyPlanTier}</p>
        ) : null}
        <ul className="mt-3 grid gap-2 sm:grid-cols-3">
          {entitlements.modules.map((m) => (
            <li key={m.sku} className="rounded-md border border-[var(--mpa-color-border-subtle)] p-3 text-sm">
              <p className="font-medium">{m.label}</p>
              <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                {m.state} · {m.commercialState.replaceAll("_", " ")} · {m.entitlementCount} keys
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
        <h2 className="font-display text-lg font-semibold">Capacity</h2>
        <Ma7CapacityMutationBlocked />
        <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm">
          <Kv label="Managed units" value={capacity.managedUnitCount ?? "—"} />
          <Kv label="Included capacity" value={capacity.includedCapacity} />
          <Kv label="Additional blocks" value={capacity.additionalBlocks ?? "—"} />
          <Kv label="Total capacity" value={capacity.totalCapacity ?? "—"} />
          <Kv
            label="Utilization"
            value={capacity.utilizationPercent == null ? "—" : `${capacity.utilizationPercent}%`}
          />
          <Kv label="Required blocks (units)" value={capacity.requiredBlocks ?? "—"} />
          <Kv label="Next-period blocks" value={capacity.nextPeriodBlocks ?? "—"} />
          <Kv label="Next-period capacity" value={capacity.nextPeriodCapacity ?? "—"} />
          <Kv label="Capacity change" value={capacity.capacityChange} />
          <Kv label="Capacity status" value={capacity.capacityStatus ?? "—"} />
          <Kv label="Declared units" value={capacity.declaredUnitCount ?? "—"} />
          <Kv
            label="Last authorized"
            value={
              capacity.lastCapacityAuthorizedAt
                ? new Date(capacity.lastCapacityAuthorizedAt).toLocaleString()
                : "—"
            }
          />
        </dl>
      </section>

      <section className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
        <h2 className="font-display text-lg font-semibold">Stripe linkage</h2>
        <dl className="mt-3 grid gap-3 sm:grid-cols-2 text-sm">
          <Kv label="Customer ID" value={stripe.customerId ?? "—"} mono />
          <Kv label="Subscription ID" value={stripe.subscriptionId ?? "—"} mono />
          <Kv label="Base item ID" value={stripe.baseItemId ?? "—"} mono />
          <Kv label="Additional capacity item" value={stripe.additionalCapacityItemId ?? "—"} mono />
          <Kv label="Lifecycle status" value={stripe.lifecycleStatus ?? "—"} />
          <Kv label="Linked" value={stripe.linked ? "yes" : "no"} />
        </dl>
        <p className="mt-2 text-xs text-[var(--mpa-color-text-secondary)]">{stripe.priceIdsNote}</p>
        <p className="mt-1 text-[11px] text-[var(--mpa-color-text-secondary)]">
          Secrets, webhook keys, and unrestricted Stripe objects are never displayed.
        </p>
      </section>

      {degraded.length > 0 ? (
        <ul className="list-disc pl-5 text-xs text-[var(--mpa-color-text-secondary)]">
          {degraded.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      ) : null}

      {/* Keep healthTone helper referenced for consistency with MA health tones */}
      <span className="sr-only">{healthToneToBadge(health)}</span>
    </main>
  );
}

function Kv({
  label,
  value,
  mono
}: {
  label: string;
  value: string | number;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs uppercase text-[var(--mpa-color-text-secondary)]">{label}</dt>
      <dd className={mono ? "font-mono text-xs break-all" : undefined}>{value}</dd>
    </div>
  );
}
