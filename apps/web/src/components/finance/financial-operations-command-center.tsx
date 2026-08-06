import Link from "next/link";
import {
  FINANCIAL_DOMAIN_REGISTRATION,
  FINANCIAL_WORKSPACE_SECTIONS,
  FINANCE_FEATURE_FLAGS,
  FINANCE_INTEGRATION_POINTS,
  FIN_OPS_SLICES,
  buildFinanceFoundationTimeline,
  financeEventsForSlice,
  type FinanceTimelineItem
} from "@mpa/shared";
import { Badge, EmptyState, OperationsConsoleShell, Skeleton, TimelineView } from "@mpa/ui";
import { Breadcrumbs } from "../shell/breadcrumbs";

function formatTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function QueueItem({
  title,
  detail,
  badge,
  href
}: {
  title: string;
  detail: string;
  badge: string;
  href?: string;
}) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">{title}</p>
        <Badge variant="info">{badge}</Badge>
      </div>
      <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">{detail}</p>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block border-b border-[var(--mpa-color-border-subtle)] px-4 py-3 last:border-b-0 hover:bg-[var(--mpa-color-bg-subtle,#fafafa)]"
      >
        {body}
      </Link>
    );
  }

  return <div className="border-b border-[var(--mpa-color-border-subtle)] px-4 py-3 last:border-b-0">{body}</div>;
}

export function FinancialOperationsCommandCenter() {
  const timeline = buildFinanceFoundationTimeline();
  const s0Events = financeEventsForSlice("S0");
  const operationalDisabled = !FINANCE_FEATURE_FLAGS["finance.charges"];

  return (
    <main className="flex-1 space-y-4 bg-[var(--mpa-color-bg-app)] p-4 md:p-6">
      <Breadcrumbs
        items={[
          { href: "/launcher", label: "Launcher" },
          { href: "/pm/mission-control", label: "Property Manager" },
          { label: "Financial Operations" }
        ]}
      />

      <header className="max-w-4xl">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          Property Manager · {FINANCIAL_DOMAIN_REGISTRATION.entitlement}
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
          Financial Operations
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--mpa-color-text-secondary)]">
          Command Center for operational finance. Foundation (S0) is live — rent collection, payments, and
          ledgers unlock in authorized later slices.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant="success">S0 Foundation</Badge>
          <Badge variant="neutral">PM + Complete only</Badge>
          <Badge variant="warning">No payment execution</Badge>
        </div>
      </header>

      <nav aria-label="Financial Operations sections" className="flex flex-wrap gap-2 border-b border-[var(--mpa-color-border-default)] pb-3">
        {FINANCIAL_WORKSPACE_SECTIONS.map((section) => {
          const enabled = section.slice === "S0";
          return (
            <a
              key={section.id}
              href={section.href}
              className={
                enabled
                  ? "rounded-md border border-[var(--mpa-color-brand-primary)] bg-white px-3 py-1.5 text-sm font-medium text-[var(--mpa-color-text-primary)]"
                  : "rounded-md border border-[var(--mpa-color-border-default)] bg-white px-3 py-1.5 text-sm text-[var(--mpa-color-text-secondary)]"
              }
              aria-current={section.id === "overview" ? "page" : undefined}
            >
              {section.label}
              {!enabled ? <span className="ml-1 text-xs">({section.slice}+)</span> : null}
            </a>
          );
        })}
      </nav>

      <OperationsConsoleShell
        queue={
          <div>
            <div className="border-b border-[var(--mpa-color-border-default)] px-4 py-3">
              <h2 className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">Attention queue</h2>
              <p className="mt-0.5 text-xs text-[var(--mpa-color-text-secondary)]">
                What needs money action — operational items arrive in S1+.
              </p>
            </div>
            <QueueItem
              title="Connect payments before collections"
              detail="Stripe Connect linkage is registered. Payment execution stays off until S2."
              badge="Setup"
              href="/billing"
            />
            <QueueItem
              title="No open charges yet"
              detail="Charge creation is gated until AUTHORIZE FIN-OPS-001 SLICE S1."
              badge="S1"
            />
            <QueueItem
              title="No vendor invoices awaiting approval"
              detail="Payables workflow unlocks in S4."
              badge="S4"
            />
            {operationalDisabled ? (
              <div className="px-4 py-4">
                <EmptyState
                  title="Operational finance not authorized yet"
                  description="Foundation surfaces are ready. Rent collection, ledgers, late fees, and vendor payments remain blocked."
                />
              </div>
            ) : null}
          </div>
        }
        workPlane={
          <div className="space-y-6 p-4">
            <div>
              <h2 className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">Work plane</h2>
              <p className="mt-0.5 text-xs text-[var(--mpa-color-text-secondary)]">
                Integration points, timeline, and foundation status — not a KPI dashboard.
              </p>
            </div>

            <section id="integrations" aria-labelledby="integrations-heading" className="space-y-3">
              <h3 id="integrations-heading" className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">
                Domain integration points
              </h3>
              <ul className="grid gap-3 md:grid-cols-3">
                {FINANCE_INTEGRATION_POINTS.map((point) => (
                  <li
                    key={point.id}
                    id={point.panelId}
                    className="rounded-md border border-[var(--mpa-color-border-default)] p-3"
                  >
                    <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">{point.label}</p>
                    <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">{point.description}</p>
                    <p className="mt-2 font-mono text-[10px] text-[var(--mpa-color-text-secondary)]">
                      {point.requiredForeignKeys.join(" · ")}
                    </p>
                    <Link
                      href={point.relatedModuleHref}
                      className="mt-3 inline-block text-xs font-medium text-[var(--mpa-color-brand-primary)] underline"
                    >
                      Open {point.id} module
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            <section id="timeline" aria-labelledby="timeline-heading" className="space-y-3">
              <h3 id="timeline-heading" className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">
                Timeline
              </h3>
              <TimelineView
                items={timeline.map((item: FinanceTimelineItem) => ({
                  id: item.id,
                  title: item.title,
                  detail: item.detail,
                  occurredAtLabel: formatTime(item.occurredAt),
                  meta: item.href ? (
                    <Link href={item.href} className="text-xs text-[var(--mpa-color-brand-primary)] underline">
                      View
                    </Link>
                  ) : undefined
                }))}
              />
            </section>

            <section id="events" aria-labelledby="events-heading" className="space-y-2">
              <h3 id="events-heading" className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">
                Registered S0 events
              </h3>
              <ul className="space-y-1 text-xs font-mono text-[var(--mpa-color-text-secondary)]">
                {s0Events.map((event) => (
                  <li key={event.type}>{event.type}</li>
                ))}
              </ul>
            </section>

            <section id="charges" className="scroll-mt-24">
              <EmptyState
                title="Charges & ledger — S1"
                description="Resident charges and ledger balances are not implemented in S0."
              />
            </section>
            <section id="payments" className="scroll-mt-24">
              <EmptyState
                title="Payments — S2"
                description="Stripe Checkout and webhook payment posting are not implemented in S0."
              />
            </section>
            <section id="late-fees" className="scroll-mt-24">
              <EmptyState title="Late fees — S3" description="Late fee policies and posting unlock after S1." />
            </section>
            <section id="vendor-invoices" className="scroll-mt-24">
              <EmptyState
                title="Vendor invoices — S4"
                description="Invoice submit / approve / reject is not implemented in S0."
              />
            </section>
            <section id="vendor-payments" className="scroll-mt-24">
              <EmptyState
                title="Vendor payments — S5"
                description="Vendor payout execution stays disabled until later authorization."
              />
            </section>
            <section id="reports" className="scroll-mt-24">
              <EmptyState
                title="Reports — S6"
                description="Property and owner financial summaries unlock after collections and AP slices."
              />
            </section>
          </div>
        }
      />

      <section aria-labelledby="slice-progress-heading" className="max-w-3xl">
        <h2 id="slice-progress-heading" className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">
          Implementation progress
        </h2>
        <ol className="mt-2 space-y-1 text-sm text-[var(--mpa-color-text-secondary)]">
          {FIN_OPS_SLICES.map((slice) => (
            <li key={slice.id} className="flex items-center justify-between gap-3 border-b border-[var(--mpa-color-border-subtle)] py-1.5">
              <span>
                {slice.id} · {slice.name}
              </span>
              <Badge variant={slice.status === "complete" ? "success" : "neutral"}>{slice.status}</Badge>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}

export function FinancialOperationsCommandCenterLoading() {
  return (
    <main className="flex-1 space-y-4 bg-[var(--mpa-color-bg-app)] p-4 md:p-6">
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-8 w-80" />
      <Skeleton className="h-4 w-96" />
      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
      </div>
    </main>
  );
}
