import Link from "next/link";
import type { ReactNode } from "react";
import { Badge } from "@mpa/ui";
import type { HealthTone } from "../../lib/admin/command-center-metrics";
import type { Ma1OverviewSnapshot } from "../../lib/admin/load-ma1-overview";
import type { Ma1Metric, Ma1WebhookChannelHealth } from "../../lib/admin/ma1-overview";
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

function Signal({
  label,
  value,
  hint,
  tone,
  href
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: HealthTone;
  href?: string;
}) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          {label}
        </p>
        {tone ? <Badge variant={toneVariant(tone)}>{tone}</Badge> : null}
      </div>
      <p className="mt-1.5 font-display text-2xl font-semibold tabular-nums text-[var(--mpa-color-text-primary)]">
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">{hint}</p> : null}
    </>
  );

  const className =
    "block rounded-md border border-[var(--mpa-color-border-default)] bg-white px-3 py-3" +
    (href ? " hover:border-[var(--mpa-color-brand-primary)]" : "");

  return href ? (
    <Link href={href} className={className}>
      {body}
    </Link>
  ) : (
    <article className={className}>{body}</article>
  );
}

function signalProps(input: {
  label: string;
  value: string | number;
  hint?: string | null | undefined;
  tone?: HealthTone;
  href?: string;
}): {
  label: string;
  value: string | number;
  hint?: string;
  tone?: HealthTone;
  href?: string;
} {
  const out: {
    label: string;
    value: string | number;
    hint?: string;
    tone?: HealthTone;
    href?: string;
  } = { label: input.label, value: input.value };
  if (input.hint != null && input.hint !== "") out.hint = input.hint;
  if (input.tone) out.tone = input.tone;
  if (input.href) out.href = input.href;
  return out;
}

function Section({
  id,
  title,
  children,
  action
}: {
  id: string;
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 id={id} className="font-display text-lg font-semibold text-[var(--mpa-color-text-primary)]">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function metricHint(m: Ma1Metric<unknown>): string | undefined {
  if (m.note) return m.note;
  if (m.availability === "unavailable") return "Unavailable from authoritative data";
  if (m.availability === "partial") return "Partial / approximate";
  return undefined;
}

function WebhookPanel({
  title,
  channel,
  href
}: {
  title: string;
  channel: Ma1WebhookChannelHealth;
  href: string;
}) {
  const tone: HealthTone =
    channel.unresolvedCount > 0 || (channel.failureCount ?? 0) > 0 ? "warn" : "ok";
  return (
    <article className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">{title}</h3>
        <Badge variant={toneVariant(tone)}>{tone}</Badge>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div>
          <dt className="text-[var(--mpa-color-text-secondary)]">Recent (24h)</dt>
          <dd className="font-mono text-sm text-[var(--mpa-color-text-primary)]">{channel.recentCount}</dd>
        </div>
        <div>
          <dt className="text-[var(--mpa-color-text-secondary)]">Processed</dt>
          <dd className="font-mono text-sm text-[var(--mpa-color-text-primary)]">{channel.processedCount}</dd>
        </div>
        <div>
          <dt className="text-[var(--mpa-color-text-secondary)]">Unresolved</dt>
          <dd className="font-mono text-sm text-[var(--mpa-color-text-primary)]">{channel.unresolvedCount}</dd>
        </div>
        <div>
          <dt className="text-[var(--mpa-color-text-secondary)]">Failures</dt>
          <dd className="font-mono text-sm text-[var(--mpa-color-text-primary)]">
            {channel.failureCount == null ? "n/a" : channel.failureCount}
          </dd>
        </div>
        <div className="col-span-2">
          <dt className="text-[var(--mpa-color-text-secondary)]">Last successful delivery</dt>
          <dd className="font-mono text-[11px] text-[var(--mpa-color-text-primary)]">
            {channel.lastSuccessfulAt ? new Date(channel.lastSuccessfulAt).toLocaleString() : "None observed"}
          </dd>
        </div>
      </dl>
      {channel.note ? (
        <p className="mt-2 text-[11px] text-[var(--mpa-color-text-secondary)]">{channel.note}</p>
      ) : null}
      <p className="mt-2 text-[11px] text-[var(--mpa-color-text-secondary)]">
        Availability: {channel.availability} · Inspect-only (no replay in MA-1)
      </p>
      <Link href={href} className="mt-2 inline-block text-xs text-[var(--mpa-color-brand-primary)] underline">
        Open related console
      </Link>
    </article>
  );
}

export function Ma1OverviewPage({ snapshot }: { snapshot: Ma1OverviewSnapshot }) {
  const { commandCenter, ma1, recentErrors, degraded } = snapshot;
  const commitSha =
    process.env["VERCEL_GIT_COMMIT_SHA"] ?? process.env["NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA"] ?? null;

  const util = ma1.capacity.utilizationPercent;

  return (
    <main className="space-y-8 p-4 md:p-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          Master Admin · Command Center
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl font-semibold text-[var(--mpa-color-text-primary)]">
            Overview
          </h1>
          <Badge variant={toneVariant(ma1.overallHealth)}>{ma1.overallHealth}</Badge>
        </div>
        <p className="max-w-3xl text-sm text-[var(--mpa-color-text-secondary)]">
          Is M.P.A. healthy right now? {ma1.overallDetail}
        </p>
        <p className="font-mono text-[10px] text-[var(--mpa-color-text-secondary)]">
          Snapshot {new Date(commandCenter.generatedAt).toLocaleString()}
          {commitSha ? ` · Deploy ${commitSha.slice(0, 7)}` : ""}
        </p>
      </header>

      {degraded.length > 0 ? (
        <div
          role="status"
          className="rounded-md border border-[var(--mpa-color-border-default)] border-l-4 border-l-[#C0392B] bg-white px-4 py-3 text-sm text-[var(--mpa-color-text-secondary)]"
        >
          <p className="font-semibold text-[var(--mpa-color-text-primary)]">Partial data</p>
          <ul className="mt-1 list-disc pl-5">
            {degraded.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <OwnerGlobalSearch />

      <Section
        id="system-health"
        title="System Health"
        action={
          <Link href="/admin/system" className="text-sm text-[var(--mpa-color-brand-primary)] underline">
            System Health
          </Link>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Signal
            label="Overall"
            value={ma1.overallHealth}
            hint={ma1.overallDetail}
            tone={ma1.overallHealth}
          />
          <Signal
            label="Critical errors"
            value={ma1.criticalErrors.criticalCount}
            hint={`${ma1.criticalErrors.errorCount} error · ${ma1.criticalErrors.recentCount} in feed sample`}
            tone={ma1.criticalErrors.criticalCount > 0 ? "warn" : "ok"}
            href="/admin/errors"
          />
          <Signal
            {...signalProps({
              label: "Error rate (approx)",
              value:
                ma1.criticalErrors.recentRatePerHour.value == null
                  ? "n/a"
                  : `${ma1.criticalErrors.recentRatePerHour.value}/h`,
              hint: metricHint(ma1.criticalErrors.recentRatePerHour),
              tone: "info"
            })}
          />
          <Signal
            label="Webhook unresolved"
            value={ma1.webhooks.stripe.unresolvedCount}
            hint="Stripe SaaS unprocessed events (24h)"
            tone={ma1.webhooks.stripe.unresolvedCount > 0 ? "warn" : "ok"}
            href="/admin/errors"
          />
          <Signal
            {...signalProps({
              label: "Notification failures",
              value: ma1.notifications.recentFailed,
              hint: ma1.notifications.note,
              tone: ma1.notifications.recentFailed > 0 ? "warn" : "ok"
            })}
          />
          <Signal
            label="Provisioning failures"
            value={ma1.checkout.failedProvisioning}
            hint="Terminal provisioning checkpoints"
            tone={ma1.checkout.failedProvisioning > 0 ? "warn" : "ok"}
            href="/admin/commercial/provisioning"
          />
          <Signal
            label="Auth / security"
            value={
              ma1.authSecurity.availability === "unavailable"
                ? "n/a"
                : ma1.authSecurity.relatedErrorCount
            }
            hint={
              ma1.authSecurity.relatedErrorCount > 0
                ? `${ma1.authSecurity.relatedErrorCount} related durable error(s). ${ma1.authSecurity.note}`
                : ma1.authSecurity.note
            }
            tone="info"
            href="/admin/errors?q=unauthorized"
          />
          {commandCenter.system.map((item) => (
            <Signal
              key={item.id}
              label={item.label}
              value={item.tone}
              hint={item.detail}
              tone={item.tone}
              href="/admin/system"
            />
          ))}
        </div>
      </Section>

      <Section
        id="organizations"
        title="Organizations"
        action={
          <Link
            href="/admin/platform/organizations"
            className="text-sm text-[var(--mpa-color-brand-primary)] underline"
          >
            Directory
          </Link>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Signal label="Total" value={ma1.organizations.total} href="/admin/platform/organizations" />
          <Signal label="Active" value={ma1.organizations.active} tone="ok" />
          <Signal
            label="Setup incomplete"
            value={ma1.organizations.setupIncomplete}
            tone={ma1.organizations.setupIncomplete ? "warn" : "ok"}
          />
          <Signal
            label="Suspended (lifecycle)"
            value={ma1.organizations.suspended}
            hint="From subscription/lifecycle statuses already in use"
            tone={ma1.organizations.suspended ? "warn" : "ok"}
          />
          <Signal label="Trial" value={ma1.organizations.trial} />
          <Signal
            label="Pending provisioning"
            value={ma1.organizations.pendingProvisioning}
            tone={ma1.organizations.pendingProvisioning ? "warn" : "ok"}
          />
          <Signal label="Created (24h)" value={ma1.organizations.recentCreated} />
        </div>
      </Section>

      <Section
        id="commercial"
        title="Commercial / Billing"
        action={
          <Link
            href="/admin/commercial/billing"
            className="text-sm text-[var(--mpa-color-brand-primary)] underline"
          >
            Billing
          </Link>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Signal label="Active subscriptions" value={ma1.commercial.activeSubscriptions} />
          <Signal label="Trial organizations" value={ma1.commercial.trialOrganizations} />
          <Signal
            label="Subscription problems"
            value={ma1.commercial.problemSubscriptions}
            hint="past_due / unpaid / incomplete / dispute_hold / paused"
            tone={ma1.commercial.problemSubscriptions ? "warn" : "ok"}
            href="/admin/commercial/lifecycle"
          />
          <Signal
            label="Capacity pending"
            value={ma1.commercial.capacityPendingOrgs}
            hint="Orgs with pending next-period capacity"
            tone={ma1.commercial.capacityPendingOrgs ? "warn" : "ok"}
          />
          <Signal
            label="Lifecycle issues"
            value={ma1.commercial.lifecycleIssues}
            tone={ma1.commercial.lifecycleIssues ? "warn" : "ok"}
            href="/admin/commercial/lifecycle"
          />
          <Signal
            label="MRR (catalog estimate)"
            value={commandCenter.commercial.mrrFormatted}
            hint={`ARR ${commandCenter.commercial.arrFormatted}`}
          />
        </div>
      </Section>

      <Section id="capacity" title="Managed Units & Capacity">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Signal label="Total managed units" value={ma1.capacity.totalManagedUnits} />
          <Signal label="Orgs with capacity" value={ma1.capacity.orgsWithCapacity} />
          <Signal
            {...signalProps({
              label: "Utilization",
              value: util.value == null ? "n/a" : `${util.value}%`,
              hint: metricHint(util),
              tone: util.value != null && util.value > 100 ? "warn" : "ok"
            })}
          />
          <Signal
            label="Over capacity"
            value={ma1.capacity.orgsOverCapacity}
            tone={ma1.capacity.orgsOverCapacity ? "warn" : "ok"}
          />
          <Signal label="Pending capacity orgs" value={ma1.capacity.orgsWithPendingCapacity} />
          <Signal label="Capacity changes (24h)" value={ma1.capacity.recentCapacityChanges} />
        </div>
      </Section>

      <Section
        id="checkout"
        title="Checkout / Provisioning"
        action={
          <Link
            href="/admin/commercial/provisioning"
            className="text-sm text-[var(--mpa-color-brand-primary)] underline"
          >
            Provisioning
          </Link>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Signal label="Checkout attempts (24h)" value={ma1.checkout.recentAttempts} />
          <Signal label="Successful" value={ma1.checkout.successful} tone="ok" />
          <Signal
            label="Failed / expired"
            value={ma1.checkout.failed}
            tone={ma1.checkout.failed ? "warn" : "ok"}
          />
          <Signal label="Pending checkout" value={ma1.checkout.pending} />
          <Signal label="Provisioned checkouts" value={ma1.checkout.provisioned} />
          <Signal
            label="Failed provisioning"
            value={ma1.checkout.failedProvisioning}
            tone={ma1.checkout.failedProvisioning ? "warn" : "ok"}
            href="/admin/commercial/provisioning"
          />
          <Signal
            label="Pending provisioning jobs"
            value={ma1.checkout.pendingProvisioningJobs}
            tone={ma1.checkout.pendingProvisioningJobs ? "warn" : "ok"}
          />
        </div>
      </Section>

      <Section id="webhooks" title="Webhook Health">
        <div className="grid gap-3 lg:grid-cols-2">
          <WebhookPanel
            title="Stripe (SaaS)"
            channel={ma1.webhooks.stripe}
            href="/admin/commercial/lifecycle"
          />
          <WebhookPanel
            title="SignWell"
            channel={ma1.webhooks.signwell}
            href="/admin/platform/organizations"
          />
        </div>
      </Section>

      <Section id="notifications" title="Notifications">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Signal
            {...signalProps({
              label: "Email failed (24h)",
              value: ma1.notifications.recentFailed,
              tone: ma1.notifications.recentFailed ? "warn" : "ok",
              hint: ma1.notifications.note
            })}
          />
          <Signal label="Email sent (24h)" value={ma1.notifications.recentSent} tone="ok" />
          <Signal label="Email queued (24h)" value={ma1.notifications.recentQueued} />
          <Signal
            label="Data availability"
            value={ma1.notifications.availability}
            hint="Sprint 5 maintenance_notifications delivery fields"
          />
        </div>
      </Section>

      <Section
        id="critical-errors"
        title="Critical Errors"
        action={
          <Link href="/admin/errors" className="text-sm text-[var(--mpa-color-brand-primary)] underline">
            Open Errors
          </Link>
        }
      >
        {recentErrors.length === 0 ? (
          <p className="rounded-md border border-[var(--mpa-color-border-default)] bg-white px-4 py-3 text-sm text-[var(--mpa-color-text-secondary)]">
            No durable production errors in the current feed sample.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--mpa-color-border-subtle)] rounded-md border border-[var(--mpa-color-border-default)] bg-white">
            {recentErrors.map((err) => (
              <li key={err.id}>
                <Link
                  href={`/admin/errors/${err.id}`}
                  className="flex flex-wrap items-start justify-between gap-3 px-4 py-3 hover:bg-[var(--mpa-color-bg-app)]"
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <Badge variant={err.severity === "critical" ? "danger" : "warning"}>
                        {err.severity}
                      </Badge>
                      <span className="text-sm font-medium text-[var(--mpa-color-text-primary)]">
                        {err.message}
                      </span>
                    </span>
                    <span className="mt-1 block font-mono text-[11px] text-[var(--mpa-color-text-secondary)]">
                      {[err.route, err.requestId ? `req ${err.requestId}` : null, err.organizationId]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>
                  <span className="font-mono text-[10px] text-[var(--mpa-color-text-secondary)]">
                    {new Date(err.createdAt).toLocaleString()}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section id="recent-activity" title="Recent Operational Activity">
        <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
          {(
            [
              ["Organizations", commandCenter.activity.latestOrganizations],
              ["Purchases", commandCenter.activity.latestPurchases],
              ["Provisioning", commandCenter.activity.latestProvisioning],
              ["Lifecycle", commandCenter.activity.latestLifecycle],
              ["Webhooks", commandCenter.activity.latestSupport]
            ] as const
          ).map(([title, items]) => (
            <article
              key={title}
              className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4"
            >
              <h3 className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">{title}</h3>
              {items.length === 0 ? (
                <p className="mt-2 text-xs text-[var(--mpa-color-text-secondary)]">No recent items.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {items.slice(0, 5).map((item) => (
                    <li key={item.id} className="border-t border-[var(--mpa-color-border-subtle)] pt-2 first:border-0 first:pt-0">
                      {item.href ? (
                        <Link href={item.href} className="block hover:text-[var(--mpa-color-brand-primary)]">
                          <p className="text-sm text-[var(--mpa-color-text-primary)]">{item.title}</p>
                          <p className="text-xs text-[var(--mpa-color-text-secondary)]">{item.detail}</p>
                        </Link>
                      ) : (
                        <>
                          <p className="text-sm text-[var(--mpa-color-text-primary)]">{item.title}</p>
                          <p className="text-xs text-[var(--mpa-color-text-secondary)]">{item.detail}</p>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>
      </Section>
    </main>
  );
}
