import Link from "next/link";
import {
  FINANCIAL_DOMAIN_REGISTRATION,
  FINANCIAL_WORKSPACE_SECTIONS,
  FINANCE_FEATURE_FLAGS,
  FINANCE_INTEGRATION_POINTS,
  FIN_OPS_SLICES,
  buildFinanceFoundationTimeline,
  type FinanceTimelineItem
} from "@mpa/shared";
import { Badge, EmptyState, OperationsConsoleShell, Skeleton, TimelineView } from "@mpa/ui";
import { Breadcrumbs } from "../shell/breadcrumbs";
import { CollectionsDesk } from "./collections-desk";
import { FinanceDesk } from "./finance-desk";

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

export function FinancialOperationsCommandCenter() {
  const timeline = buildFinanceFoundationTimeline();

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
          Operational finance Command Center — billing, collections, late fees, and vendor payables for
          property managers. Not ERP.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant="success">S2 Collections + AP live</Badge>
          <Badge variant="neutral">PM + Complete only</Badge>
          {FINANCE_FEATURE_FLAGS["finance.late_fees"] ? <Badge variant="info">Late fees on</Badge> : null}
          {FINANCE_FEATURE_FLAGS["finance.vendor_invoices"] ? (
            <Badge variant="info">Vendor AP on</Badge>
          ) : null}
        </div>
      </header>

      <nav
        aria-label="Financial Operations sections"
        className="flex flex-wrap gap-2 border-b border-[var(--mpa-color-border-default)] pb-3"
      >
        {FINANCIAL_WORKSPACE_SECTIONS.map((section) => {
          const enabled = section.slice === "S0" || section.slice === "S1" || section.slice === "S2";
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
                Overdue residents, late fees, and vendor invoices needing approval or payment.
              </p>
            </div>
            <div className="space-y-0 px-4 py-3 text-sm text-[var(--mpa-color-text-secondary)]">
              <p>Use Billing desk for charges/payments. Use Collections & AP for delinquency and vendors.</p>
              <p className="mt-2">
                Residents see balance and late-fee notes in{" "}
                <Link href="/portal/tenant/billing" className="text-[var(--mpa-color-brand-primary)] underline">
                  Tenant Billing
                </Link>
                .
              </p>
              <p className="mt-2">
                Vendor directory alignment:{" "}
                <Link href="/pm/vendors" className="text-[var(--mpa-color-brand-primary)] underline">
                  Vendor Operations
                </Link>
                .
              </p>
            </div>
          </div>
        }
        workPlane={
          <div className="space-y-8 p-4">
            <div>
              <h2 className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">Billing desk</h2>
              <p className="mt-0.5 text-xs text-[var(--mpa-color-text-secondary)]">
                Lease → charges → payment → receipt → ledger.
              </p>
              <div className="mt-3">
                <FinanceDesk />
              </div>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">Collections & vendor AP</h2>
              <p className="mt-0.5 text-xs text-[var(--mpa-color-text-secondary)]">
                Delinquency aging, late fees, arrangements, invoice approval, scheduled payments.
              </p>
              <div className="mt-3">
                <CollectionsDesk />
              </div>
            </div>
          </div>
        }
      />

      <section id="integrations" className="space-y-3">
        <h2 className="text-sm font-semibold">Domain integration points</h2>
        <ul className="grid gap-3 md:grid-cols-3">
          {FINANCE_INTEGRATION_POINTS.map((point) => (
            <li key={point.id} className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-3">
              <p className="text-sm font-medium">{point.label}</p>
              <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">{point.description}</p>
              <Link
                href={point.relatedModuleHref}
                className="mt-3 inline-block text-xs text-[var(--mpa-color-brand-primary)] underline"
              >
                Open {point.id} module
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section id="timeline" className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
        <h2 className="text-sm font-semibold">Timeline</h2>
        <div className="mt-3">
          <TimelineView
            items={[
              {
                id: "s2-live",
                title: "Delinquency, late fees & vendor AP live",
                detail:
                  "Aging buckets, late-fee assessment, payment arrangements, vendor invoice approval, schedule, and mark paid.",
                occurredAtLabel: formatTime(new Date().toISOString())
              },
              {
                id: "s1-live",
                title: "Resident billing & rent collection live",
                detail: "Charges, manual payments, online Checkout, receipts, ledger, and portal billing.",
                occurredAtLabel: formatTime(new Date().toISOString())
              },
              ...timeline.map((item: FinanceTimelineItem) => ({
                id: item.id,
                title: item.title,
                detail: item.detail,
                occurredAtLabel: formatTime(item.occurredAt)
              }))
            ]}
          />
        </div>
      </section>

      <section id="reports" className="scroll-mt-24">
        <EmptyState
          title="Advanced reports — S4"
          description="S2 includes Command Center collections and AP snapshots. Full owner/property reporting comes later."
        />
      </section>

      <section aria-labelledby="slice-progress-heading" className="max-w-3xl">
        <h2 id="slice-progress-heading" className="text-sm font-semibold">
          Implementation progress
        </h2>
        <ol className="mt-2 space-y-1 text-sm text-[var(--mpa-color-text-secondary)]">
          {FIN_OPS_SLICES.map((slice) => (
            <li
              key={slice.id}
              className="flex items-center justify-between gap-3 border-b border-[var(--mpa-color-border-subtle)] py-1.5"
            >
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
      <Skeleton className="h-64 w-full" />
    </main>
  );
}
