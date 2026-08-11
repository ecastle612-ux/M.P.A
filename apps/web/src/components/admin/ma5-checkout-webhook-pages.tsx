import Link from "next/link";
import { Badge } from "@mpa/ui";
import type { Ma5CheckoutDirectory } from "../../lib/admin/load-ma5-checkout";
import type { Ma5WebhookDirectory } from "../../lib/admin/load-ma5-webhooks";
import {
  diagLabel,
  type Ma5CheckoutRow,
  type Ma5DiagTone,
  type Ma5LifecycleStage,
  type Ma5WebhookRow
} from "../../lib/admin/ma5-checkout-webhooks";
import type { ProvisioningJob } from "@mpa/shared";

function ToneBadge({ tone }: { tone: Ma5DiagTone }) {
  const variant =
    tone === "healthy" ? "success" : tone === "attention" ? "warning" : tone === "failed" ? "danger" : "neutral";
  return <Badge variant={variant}>{diagLabel(tone)}</Badge>;
}

export function Ma5CheckoutPage({ directory }: { directory: Ma5CheckoutDirectory }) {
  const { rows, filters, pagination, degraded, limitations, totals } = directory;

  return (
    <main className="space-y-6 p-4 md:p-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          Master Admin
        </p>
        <h1 className="font-display text-3xl font-semibold text-[var(--mpa-color-text-primary)]">
          Checkout / Provisioning
        </h1>
        <p className="max-w-3xl text-sm text-[var(--mpa-color-text-secondary)]">
          Commercial acquisition pipeline — checkout sessions, payment state, provisioning, and
          resulting org/subscription linkage. Read-only.
        </p>
        <p className="text-xs text-[var(--mpa-color-text-secondary)]">{filters.rangeLabel}</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {(
          [
            ["Matched", totals.matched],
            ["Healthy", totals.healthy],
            ["Attention", totals.attention],
            ["Failed", totals.failed],
            ["Unknown", totals.unknown]
          ] as const
        ).map(([label, value]) => (
          <article
            key={label}
            className="rounded-md border border-[var(--mpa-color-border-default)] bg-white px-3 py-3"
          >
            <p className="text-[11px] uppercase text-[var(--mpa-color-text-secondary)]">{label}</p>
            <p className="font-display text-2xl font-semibold tabular-nums">{value}</p>
          </article>
        ))}
      </div>

      <form
        method="get"
        className="grid gap-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4 md:grid-cols-3 xl:grid-cols-4"
      >
        <Field label="Search" name="q" defaultValue={filters.q ?? ""} placeholder="session, email, org…" />
        <Select
          label="Product"
          name="sku"
          defaultValue={filters.sku ?? ""}
          options={[
            ["", "All"],
            ["mpa_property_manager", "Property Manager"],
            ["mpa_facility_operations", "Facility Operations"],
            ["mpa_complete_platform", "Complete Platform"]
          ]}
        />
        <Select
          label="Interval"
          name="billingCycle"
          defaultValue={filters.billingCycle ?? ""}
          options={[
            ["", "All"],
            ["monthly", "Monthly"],
            ["annual", "Annual"]
          ]}
        />
        <Select
          label="Checkout status"
          name="checkoutStatus"
          defaultValue={filters.checkoutStatus ?? ""}
          options={[
            ["", "All"],
            ["checkout_created", "checkout_created"],
            ["checkout_completed", "checkout_completed"],
            ["checkout_expired", "checkout_expired"],
            ["checkout_canceled", "checkout_canceled"],
            ["payment_failed", "payment_failed"]
          ]}
        />
        <Select
          label="Time range"
          name="range"
          defaultValue={filters.range ?? "7d"}
          options={[
            ["1h", "Last 1 hour"],
            ["24h", "Last 24 hours"],
            ["7d", "Last 7 days"],
            ["30d", "Last 30 days"]
          ]}
        />
        <Select
          label="Health"
          name="health"
          defaultValue={filters.health ?? ""}
          options={[
            ["", "All"],
            ["healthy", "healthy"],
            ["attention", "attention"],
            ["failed", "failed"],
            ["unknown", "unknown"]
          ]}
        />
        <input type="hidden" name="page" value="1" />
        <div className="md:col-span-3 xl:col-span-4 flex flex-wrap gap-3">
          <button
            type="submit"
            className="rounded-md bg-[var(--mpa-color-brand-primary)] px-4 py-2 text-sm font-medium text-white"
          >
            Apply filters
          </button>
          <Link href="/admin/checkout" className="text-sm text-[var(--mpa-color-brand-primary)] underline">
            Clear
          </Link>
          <Link href="/admin/webhooks" className="text-sm text-[var(--mpa-color-brand-primary)] underline">
            Webhooks
          </Link>
        </div>
      </form>

      <Degraded degraded={degraded} />
      <ul className="space-y-1 text-xs text-[var(--mpa-color-text-secondary)]">
        {limitations.map((l) => (
          <li key={l}>• {l}</li>
        ))}
      </ul>

      {rows.length === 0 ? (
        <Empty text="No checkout sessions match filters." />
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--mpa-color-border-default)] text-xs uppercase text-[var(--mpa-color-text-secondary)]">
                  <th className="px-3 py-2">Session</th>
                  <th className="px-3 py-2">Product</th>
                  <th className="px-3 py-2">Payment</th>
                  <th className="px-3 py-2">Provisioning</th>
                  <th className="px-3 py-2">Organization</th>
                  <th className="px-3 py-2">Health</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-[var(--mpa-color-border-subtle)]">
                    <td className="px-3 py-2">
                      <Link
                        href={`/admin/checkout/${encodeURIComponent(row.stripeCheckoutSessionId)}`}
                        className="font-mono text-xs text-[var(--mpa-color-brand-primary)] underline"
                      >
                        {row.stripeCheckoutSessionId}
                      </Link>
                      <p className="text-[10px] text-[var(--mpa-color-text-secondary)]">
                        {row.createdAt ? new Date(row.createdAt).toLocaleString() : "—"}
                      </p>
                    </td>
                    <td className="px-3 py-2">
                      {row.productLabel ?? "—"}
                      <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                        {row.billingCycle ?? "—"} · units {row.quotedUnits ?? "—"}
                      </p>
                    </td>
                    <td className="px-3 py-2">{row.paymentState}</td>
                    <td className="px-3 py-2">{row.provisioningCheckpoint ?? "—"}</td>
                    <td className="px-3 py-2">
                      {row.organizationId ? (
                        <Link
                          href={`/admin/platform/organizations/${row.organizationId}`}
                          className="text-[var(--mpa-color-brand-primary)] underline"
                        >
                          {row.organizationName ?? row.organizationId}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <ToneBadge
                        tone={
                          row.checkoutHealth === "failed" || row.provisioningHealth === "failed"
                            ? "failed"
                            : row.checkoutHealth === "attention" || row.provisioningHealth === "attention"
                              ? "attention"
                              : row.checkoutHealth
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="space-y-3 md:hidden">
            {rows.map((row) => (
              <li
                key={row.id}
                className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-3"
              >
                <Link
                  href={`/admin/checkout/${encodeURIComponent(row.stripeCheckoutSessionId)}`}
                  className="font-mono text-xs text-[var(--mpa-color-brand-primary)] underline"
                >
                  {row.stripeCheckoutSessionId}
                </Link>
                <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">
                  {row.productLabel} · {row.paymentState} · {row.provisioningCheckpoint ?? "no job"}
                </p>
              </li>
            ))}
          </ul>
        </>
      )}

      <Pager
        basePath="/admin/checkout"
        page={pagination.page}
        totalPages={pagination.totalPages}
        hasMore={pagination.hasMore}
        total={pagination.total}
        filters={filters as unknown as Record<string, string | number | undefined>}
      />
    </main>
  );
}

export function Ma5CheckoutDetailPage({
  row,
  lifecycle,
  job,
  degraded,
  limitations
}: {
  row: Ma5CheckoutRow | null;
  lifecycle: Ma5LifecycleStage[];
  job: ProvisioningJob | null;
  degraded: string[];
  limitations: string[];
}) {
  if (!row) {
    return (
      <main className="space-y-4 p-4 md:p-6">
        <Link href="/admin/checkout" className="text-sm text-[var(--mpa-color-brand-primary)] underline">
          ← Checkout / Provisioning
        </Link>
        <h1 className="font-display text-2xl font-semibold">Checkout not found</h1>
        <Degraded degraded={degraded} />
      </main>
    );
  }

  return (
    <main className="space-y-6 p-4 md:p-6">
      <header className="space-y-2">
        <div className="flex flex-wrap gap-2 text-xs">
          <Link href="/admin/checkout" className="text-[var(--mpa-color-brand-primary)] underline">
            ← Checkout / Provisioning
          </Link>
          {row.organizationId ? (
            <Link
              href={`/admin/platform/organizations/${row.organizationId}`}
              className="text-[var(--mpa-color-brand-primary)] underline"
            >
              Organization
            </Link>
          ) : null}
          {row.organizationId ? (
            <Link
              href={`/admin/subscriptions/${row.organizationId}`}
              className="text-[var(--mpa-color-brand-primary)] underline"
            >
              Subscription
            </Link>
          ) : null}
          <Link
            href={`/admin/webhooks?q=${encodeURIComponent(row.stripeCheckoutSessionId)}`}
            className="text-[var(--mpa-color-brand-primary)] underline"
          >
            Related webhooks
          </Link>
        </div>
        <h1 className="font-display text-3xl font-semibold break-all">{row.stripeCheckoutSessionId}</h1>
        <div className="flex flex-wrap gap-2">
          <ToneBadge tone={row.checkoutHealth} />
          <ToneBadge tone={row.provisioningHealth} />
        </div>
      </header>

      {row.anomalies.length > 0 ? (
        <section className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
          <h2 className="font-display text-lg font-semibold">Commercial anomalies</h2>
          <ul className="mt-3 space-y-2">
            {row.anomalies.map((a) => (
              <li key={a.code} className="text-sm">
                <Badge variant={a.severity === "failed" ? "danger" : "warning"}>{a.code}</Badge> {a.reason}
                {a.href ? (
                  <Link href={a.href} className="ml-2 text-[var(--mpa-color-brand-primary)] underline">
                    Open
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
        <h2 className="font-display text-lg font-semibold">Lifecycle</h2>
        <ol className="mt-4 space-y-3">
          {lifecycle.map((stage) => (
            <li
              key={stage.id}
              className="grid gap-2 border-t border-[var(--mpa-color-border-subtle)] pt-3 first:border-0 first:pt-0 sm:grid-cols-[140px_1fr]"
            >
              <div>
                <p className="text-sm font-medium">{stage.label}</p>
                <ToneBadge tone={stage.status} />
              </div>
              <div className="text-sm text-[var(--mpa-color-text-secondary)]">
                <p>{stage.detail}</p>
                <p className="font-mono text-[10px]">
                  {stage.identifier ?? "—"}
                  {stage.at ? ` · ${new Date(stage.at).toLocaleString()}` : ""}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
          <h2 className="font-display text-lg font-semibold">Commercial</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <Kv label="Product" value={row.productLabel ?? "—"} />
            <Kv label="Billing interval" value={row.billingCycle ?? "—"} />
            <Kv label="Quoted units" value={row.quotedUnits ?? "—"} />
            <Kv
              label="Quoted amount"
              value={row.quotedAmountLabel ?? "UNKNOWN / not persisted on checkout row"}
            />
            <Kv label="Capacity blocks" value={row.additionalBlocks ?? "—"} />
            <Kv label="Authorized capacity" value={row.authorizedCapacity ?? "—"} />
            <Kv
              label="Trial"
              value={
                row.trialEligible == null
                  ? "unknown"
                  : row.trialEligible
                    ? `eligible (${row.trialDays ?? "—"} days)`
                    : "ineligible"
              }
            />
            <Kv label="Quote ID" value={row.quoteId ?? "—"} mono />
          </dl>
        </article>
        <article className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
          <h2 className="font-display text-lg font-semibold">Stripe linkage</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <Kv label="Checkout Session ID" value={row.stripeCheckoutSessionId} mono />
            <Kv label="Customer ID" value={row.stripeCustomerId ?? "—"} mono />
            <Kv label="Subscription ID" value={row.stripeSubscriptionId ?? "—"} mono />
            <Kv label="Payment state" value={row.paymentState} />
            <Kv label="Checkout status" value={row.checkoutStatus} />
            <Kv label="Source" value={row.source} />
          </dl>
          <p className="mt-2 text-[11px] text-[var(--mpa-color-text-secondary)]">
            Secrets, webhook signatures, and unrestricted Stripe objects are never displayed. Price
            IDs shown only when present on safe metadata.
          </p>
        </article>
      </section>

      <section className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
        <h2 className="font-display text-lg font-semibold">Provisioning</h2>
        <dl className="mt-3 grid gap-3 sm:grid-cols-2 text-sm">
          <Kv label="Checkpoint" value={job?.checkpoint ?? row.provisioningCheckpoint ?? "—"} />
          <Kv label="Attempts" value={job?.attemptCount ?? "—"} />
          <Kv label="Owner email" value={job?.ownerEmail ?? row.customerEmail ?? "—"} />
          <Kv label="Owner user" value={job?.ownerUserId ?? "—"} mono />
          <Kv label="Organization" value={job?.organizationId ?? row.organizationId ?? "—"} mono />
          <Kv label="Last error" value={job?.lastError ?? row.provisioningError ?? "—"} />
          <Kv
            label="Updated"
            value={job?.updatedAt ? new Date(job.updatedAt).toLocaleString() : "—"}
          />
        </dl>
        <p className="mt-2 text-xs text-[var(--mpa-color-text-secondary)]">
          Retry/claim mutations remain on existing Owner Ops consoles — MA-5 is inspect-only (no
          webhook replay).
        </p>
      </section>

      <Degraded degraded={degraded} />
      <ul className="space-y-1 text-xs text-[var(--mpa-color-text-secondary)]">
        {limitations.map((l) => (
          <li key={l}>• {l}</li>
        ))}
      </ul>
    </main>
  );
}

export function Ma5WebhooksPage({ directory }: { directory: Ma5WebhookDirectory }) {
  const { rows, filters, pagination, degraded, limitations, duplicates, totals } = directory;

  return (
    <main className="space-y-6 p-4 md:p-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          Master Admin
        </p>
        <h1 className="font-display text-3xl font-semibold text-[var(--mpa-color-text-primary)]">
          Webhooks
        </h1>
        <p className="max-w-3xl text-sm text-[var(--mpa-color-text-secondary)]">
          Stripe SaaS + SignWell webhook health. Inspect-only — no replay.
        </p>
        <p className="text-xs text-[var(--mpa-color-text-secondary)]">{filters.rangeLabel}</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {(
          [
            ["Matched", totals.matched],
            ["Stripe", totals.stripe],
            ["SignWell", totals.signwell],
            ["Unresolved", totals.unresolved],
            ["Attention", totals.attention],
            ["Failed", totals.failed]
          ] as const
        ).map(([label, value]) => (
          <article
            key={label}
            className="rounded-md border border-[var(--mpa-color-border-default)] bg-white px-3 py-3"
          >
            <p className="text-[11px] uppercase text-[var(--mpa-color-text-secondary)]">{label}</p>
            <p className="font-display text-2xl font-semibold tabular-nums">{value}</p>
          </article>
        ))}
      </div>

      <form
        method="get"
        className="grid gap-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4 md:grid-cols-3 xl:grid-cols-4"
      >
        <Field label="Search" name="q" defaultValue={filters.q ?? ""} />
        <Select
          label="Provider"
          name="provider"
          defaultValue={filters.provider ?? "all"}
          options={[
            ["all", "All"],
            ["stripe", "Stripe"],
            ["signwell", "SignWell"]
          ]}
        />
        <Select
          label="Status"
          name="status"
          defaultValue={filters.status ?? "all"}
          options={[
            ["all", "All"],
            ["processed", "processed"],
            ["unresolved", "unresolved"]
          ]}
        />
        <Select
          label="Time range"
          name="range"
          defaultValue={filters.range ?? "7d"}
          options={[
            ["1h", "Last 1 hour"],
            ["24h", "Last 24 hours"],
            ["7d", "Last 7 days"],
            ["30d", "Last 30 days"]
          ]}
        />
        <Field label="Event type" name="eventType" defaultValue={filters.eventType ?? ""} />
        <Field
          label="Organization ID"
          name="organizationId"
          defaultValue={filters.organizationId ?? ""}
        />
        <input type="hidden" name="page" value="1" />
        <div className="md:col-span-3 xl:col-span-4 flex flex-wrap gap-3">
          <button
            type="submit"
            className="rounded-md bg-[var(--mpa-color-brand-primary)] px-4 py-2 text-sm font-medium text-white"
          >
            Apply filters
          </button>
          <Link href="/admin/webhooks" className="text-sm text-[var(--mpa-color-brand-primary)] underline">
            Clear
          </Link>
        </div>
      </form>

      <Degraded degraded={degraded} />
      {duplicates.length > 0 ? (
        <ul className="space-y-1 text-sm">
          {duplicates.map((d) => (
            <li key={d.code + d.reason}>
              <Badge variant="warning">{d.code}</Badge> {d.reason}
            </li>
          ))}
        </ul>
      ) : null}
      <ul className="space-y-1 text-xs text-[var(--mpa-color-text-secondary)]">
        {limitations.map((l) => (
          <li key={l}>• {l}</li>
        ))}
      </ul>

      {rows.length === 0 ? (
        <Empty text="No webhook events match filters." />
      ) : (
        <ul className="divide-y divide-[var(--mpa-color-border-subtle)] rounded-md border border-[var(--mpa-color-border-default)] bg-white">
          {rows.map((row) => (
            <li key={`${row.provider}-${row.id}`}>
              <Link
                href={`/admin/webhooks/${encodeURIComponent(row.eventId)}`}
                className="block px-4 py-3 hover:bg-[var(--mpa-color-bg-app)]"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="neutral">{row.provider}</Badge>
                  <span className="text-sm font-medium">{row.eventType}</span>
                  <ToneBadge tone={row.health} />
                </div>
                <p className="mt-1 font-mono text-[11px] text-[var(--mpa-color-text-secondary)]">
                  {[
                    row.receivedAt ? new Date(row.receivedAt).toLocaleString() : null,
                    row.eventId,
                    row.organizationName ?? row.organizationId,
                    row.processingStatus
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Pager
        basePath="/admin/webhooks"
        page={pagination.page}
        totalPages={pagination.totalPages}
        hasMore={pagination.hasMore}
        total={pagination.total}
        filters={filters as unknown as Record<string, string | number | undefined>}
      />
    </main>
  );
}

export function Ma5WebhookDetailPage({
  event,
  degraded,
  limitations
}: {
  event: Ma5WebhookRow | null;
  degraded: string[];
  limitations: string[];
}) {
  if (!event) {
    return (
      <main className="space-y-4 p-4 md:p-6">
        <Link href="/admin/webhooks" className="text-sm text-[var(--mpa-color-brand-primary)] underline">
          ← Webhooks
        </Link>
        <h1 className="font-display text-2xl font-semibold">Webhook event not found</h1>
        <Degraded degraded={degraded} />
      </main>
    );
  }

  return (
    <main className="space-y-6 p-4 md:p-6">
      <header className="space-y-2">
        <Link href="/admin/webhooks" className="text-sm text-[var(--mpa-color-brand-primary)] underline">
          ← Webhooks
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="neutral">{event.provider}</Badge>
          <h1 className="font-display text-2xl font-semibold">{event.eventType}</h1>
          <ToneBadge tone={event.health} />
        </div>
      </header>

      <dl className="grid gap-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4 sm:grid-cols-2 text-sm">
        <Kv label="Event ID" value={event.eventId} mono />
        <Kv label="Received" value={event.receivedAt ? new Date(event.receivedAt).toLocaleString() : "—"} />
        <Kv
          label="Processed"
          value={event.processedAt ? new Date(event.processedAt).toLocaleString() : "—"}
        />
        <Kv label="Processing status" value={event.processingStatus} />
        <Kv label="Organization" value={event.organizationName ?? event.organizationId ?? "—"} mono />
        <Kv label="Subscription" value={event.subscriptionId ?? "—"} mono />
        <Kv label="Checkout session" value={event.checkoutSessionId ?? "—"} mono />
        <Kv label="Object ID" value={event.objectId ?? "—"} mono />
        <Kv label="Failure reason" value={event.failureReason ?? "—"} />
        <Kv label="Correlation ID" value={event.correlationId ?? "—"} mono />
        <Kv label="Idempotency" value={event.idempotencyNote} />
      </dl>

      <div className="flex flex-wrap gap-3 text-xs">
        {event.organizationId ? (
          <Link
            href={`/admin/platform/organizations/${event.organizationId}`}
            className="text-[var(--mpa-color-brand-primary)] underline"
          >
            Organization Detail
          </Link>
        ) : null}
        {event.organizationId ? (
          <Link
            href={`/admin/subscriptions/${event.organizationId}`}
            className="text-[var(--mpa-color-brand-primary)] underline"
          >
            Subscription
          </Link>
        ) : null}
        {event.checkoutSessionId ? (
          <Link
            href={`/admin/checkout/${encodeURIComponent(event.checkoutSessionId)}`}
            className="text-[var(--mpa-color-brand-primary)] underline"
          >
            Checkout
          </Link>
        ) : null}
      </div>

      <section className="space-y-2">
        <h2 className="font-display text-lg font-semibold">Safe metadata</h2>
        <pre className="overflow-auto rounded-md border border-[var(--mpa-color-border-default)] bg-white p-3 font-mono text-xs">
          {JSON.stringify(event.safeMetadata, null, 2)}
        </pre>
      </section>

      <p className="text-xs text-[var(--mpa-color-text-secondary)]">
        Webhook replay is not available. Signatures, secrets, and payment credentials are never shown.
      </p>
      <Degraded degraded={degraded} />
      <ul className="space-y-1 text-xs text-[var(--mpa-color-text-secondary)]">
        {limitations.map((l) => (
          <li key={l}>• {l}</li>
        ))}
      </ul>
    </main>
  );
}

function Field({
  label,
  name,
  defaultValue,
  placeholder
}: {
  label: string;
  name: string;
  defaultValue: string;
  placeholder?: string;
}) {
  return (
    <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
      {label}
      <input
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="mt-1 w-full rounded-md border border-[var(--mpa-color-border-default)] px-2 py-2 text-sm"
      />
    </label>
  );
}

function Select({
  label,
  name,
  defaultValue,
  options
}: {
  label: string;
  name: string;
  defaultValue: string;
  options: Array<[string, string]>;
}) {
  return (
    <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
      {label}
      <select
        name={name}
        defaultValue={defaultValue}
        className="mt-1 w-full rounded-md border border-[var(--mpa-color-border-default)] px-2 py-2 text-sm"
      >
        {options.map(([value, text]) => (
          <option key={value || "all"} value={value}>
            {text}
          </option>
        ))}
      </select>
    </label>
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

function Degraded({ degraded }: { degraded: string[] }) {
  if (!degraded.length) return null;
  return (
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
  );
}

function Empty({ text }: { text: string }) {
  return (
    <p className="rounded-md border border-[var(--mpa-color-border-default)] bg-white px-4 py-6 text-sm text-[var(--mpa-color-text-secondary)]">
      {text}
    </p>
  );
}

function Pager({
  basePath,
  page,
  totalPages,
  hasMore,
  total,
  filters
}: {
  basePath: string;
  page: number;
  totalPages: number;
  hasMore: boolean;
  total: number;
  filters: Record<string, string | number | undefined>;
}) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) {
    if (v == null || v === "" || k === "page" || k === "rangeLabel") continue;
    params.set(k, String(v));
  }
  const prev = page > 1 ? page - 1 : null;
  const next = hasMore ? page + 1 : null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
      <p className="text-[var(--mpa-color-text-secondary)]">
        Page {page} of {totalPages} · {total} matched
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
