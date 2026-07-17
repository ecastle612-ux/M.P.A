"use client";

import Link from "next/link";
import { Badge, Button, Card, KpiMetric, PageHeader } from "@mpa/ui";
import {
  formatCurrency,
  type FinancialActivityRecord,
  type FinancialActivityType,
  type StatementStatus
} from "../../lib/financial/contracts";
import type { FinancialDashboardMetrics } from "../../lib/financial/server";
import { GuidanceTip } from "../experience/guidance-tip";

const SECTION_LINKS = [
  { href: "/financials/charges", label: "Rent Charges", description: "Track charges, balances, and due dates" },
  { href: "/financials/expenses", label: "Expenses", description: "Record property operating expenses" },
  { href: "/financials/owner-statements", label: "Owner Statements", description: "Generate and review owner reports" }
] as const;

function activityTypeLabel(type: FinancialActivityType): string {
  const labels: Record<FinancialActivityType, string> = {
    charge_created: "Charge created",
    payment_received: "Payment received",
    late_fee_applied: "Late fee applied",
    expense_recorded: "Expense recorded",
    statement_generated: "Statement generated",
    balance_updated: "Balance updated"
  };
  return labels[type];
}

function activityBadgeVariant(type: FinancialActivityType): "success" | "warning" | "info" {
  if (type === "payment_received") return "success";
  if (type === "late_fee_applied") return "warning";
  return "info";
}

function statementCountLabel(status: StatementStatus, count: number): string {
  const labels: Record<StatementStatus, string> = {
    draft: "Draft",
    generated: "Generated",
    sent: "Sent",
    archived: "Archived"
  };
  return `${labels[status]}: ${count}`;
}

export function FinancialOverview({
  metrics,
  activity,
  permissions
}: {
  metrics: FinancialDashboardMetrics;
  activity: FinancialActivityRecord[];
  permissions: { canCreate: boolean };
}) {
  const statementTotal = Object.values(metrics.ownerStatementStatusCounts).reduce((sum, count) => sum + count, 0);
  const hasFinancialActivity =
    metrics.rentDueToday > 0 ||
    metrics.lateRentCount > 0 ||
    metrics.outstandingBalancesTotal > 0 ||
    statementTotal > 0 ||
    activity.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        overline="Operations"
        title="Financials"
        description="Rent collection, expenses, and owner reporting for your portfolio."
        actions={
          permissions.canCreate ? (
            <div className="flex flex-wrap gap-2">
              <Link href="/financials/charges/new">
                <Button>Create Charge</Button>
              </Link>
              <Link href="/financials/expenses/new">
                <Button variant="secondary">Record Expense</Button>
              </Link>
            </div>
          ) : null
        }
      />

      {!hasFinancialActivity ? (
        <Card variant="elevated" className="space-y-4 border-dashed border-[var(--mpa-color-border-default)]">
          <div>
            <h2 className="font-display text-lg font-semibold text-[var(--mpa-color-text-primary)]">
              Financial activity starts with leases
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-[var(--mpa-color-text-secondary)]">
              Once leases are active, rent charges, payments, and owner statements flow through this workspace.
              Create a lease first, or manually record a charge when you are ready to collect.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/leases/new">
              <Button>Create Lease</Button>
            </Link>
            <Link href="/financials/charges/new">
              <Button variant="secondary">Create Charge</Button>
            </Link>
          </div>
          <GuidanceTip tipKey="financials" />
        </Card>
      ) : (
        <Card variant="elevated" className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <KpiMetric label="Rent due today" value={metrics.rentDueToday.toString()} />
            <KpiMetric
              label="Late charges"
              value={metrics.lateRentCount.toString()}
              tone={metrics.lateRentCount > 0 ? "warning" : "default"}
            />
            <KpiMetric label="Outstanding balances" value={formatCurrency(metrics.outstandingBalancesTotal)} />
            <KpiMetric label="Owner statements" value={statementTotal.toString()} />
          </div>

          {statementTotal > 0 ? (
            <div className="flex flex-wrap gap-2">
              {(Object.entries(metrics.ownerStatementStatusCounts) as Array<[StatementStatus, number]>)
                .filter(([, count]) => count > 0)
                .map(([status, count]) => (
                  <Badge key={status} variant="neutral">
                    {statementCountLabel(status, count)}
                  </Badge>
                ))}
            </div>
          ) : null}
        </Card>
      )}

      <section className="grid gap-5 lg:grid-cols-[2fr_1fr]">
        <Card variant="elevated" className="space-y-4">
          <h2 className="mpa-section-title">Sections</h2>
          <ul className="space-y-2">
            {SECTION_LINKS.map((section) => (
              <li key={section.href}>
                <Link
                  href={section.href}
                  className="block rounded-[var(--mpa-radius-lg)] border border-[var(--mpa-color-border-subtle)] p-4 transition hover:border-[var(--mpa-color-border-default)] hover:bg-[var(--mpa-color-bg-surface-muted)]/50"
                >
                  <p className="font-medium text-[var(--mpa-color-brand-primary)]">{section.label}</p>
                  <p className="mt-0.5 text-xs text-[var(--mpa-color-text-secondary)]">{section.description}</p>
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        <Card variant="elevated" className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="mpa-section-title">Recent activity</h2>
            {permissions.canCreate ? (
              <Link href="/financials/owner-statements/generate">
                <Button variant="ghost" size="sm">
                  Generate statement
                </Button>
              </Link>
            ) : null}
          </div>
          {activity.length === 0 ? (
            <div className="space-y-2 rounded-[var(--mpa-radius-lg)] border border-dashed border-[var(--mpa-color-border-default)] p-4">
              <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">
                Payments and charges will appear here
              </p>
              <p className="text-sm text-[var(--mpa-color-text-secondary)]">
                Record a charge or payment to start building your financial timeline.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {activity.map((item) => (
                <li
                  key={item.id}
                  className="rounded-[var(--mpa-radius-lg)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface-muted)]/40 p-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={activityBadgeVariant(item.activityType)}>
                      {activityTypeLabel(item.activityType)}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-[var(--mpa-color-text-primary)]">{item.summary}</p>
                  <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                    {item.amount > 0 ? formatCurrency(item.amount) : "—"} ·{" "}
                    {new Date(item.createdAt).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>
    </div>
  );
}
