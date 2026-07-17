import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, Button, Card } from "@mpa/ui";
import { Breadcrumbs } from "../../../../../components/shell/breadcrumbs";
import { WorkflowSuccessBanner } from "../../../../../components/workflow/workflow-success-banner";
import { createAuthServerComponentClient } from "../../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../../lib/organization/server";
import { fetchAuthedApi } from "../../../../../lib/financial/server-fetch";
import { formatCurrency, type StatementStatus } from "../../../../../lib/financial/contracts";
import type { OwnerStatementListItem } from "../../../../../lib/financial/server";
import { buildStatementGeneratedSuccess } from "../../../../../lib/workflow/shared/success-configs";

function statementStatusLabel(status: StatementStatus): string {
  const labels: Record<StatementStatus, string> = {
    draft: "Draft",
    generated: "Generated",
    sent: "Sent",
    archived: "Archived"
  };
  return labels[status];
}

export default async function OwnerStatementDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ statementId: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { statementId } = await params;
  const { from } = await searchParams;
  const supabase = await createAuthServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const organizationId = await resolveActiveOrganizationIdForUser(user.id);
  if (!organizationId) {
    redirect("/dashboard");
  }

  const authorization = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authorization, "financial:read")) {
    redirect("/unauthorized");
  }

  const result = await fetchAuthedApi<{ statement: OwnerStatementListItem }>(
    `/api/owner-statements/${statementId}`
  );
  if (!result.ok || !result.data.statement) {
    redirect("/financials/owner-statements");
  }

  const statement = result.data.statement;

  const statementSuccess =
    from === "statement-generated"
      ? buildStatementGeneratedSuccess({
          id: statement.id,
          statementNumber: statement.statementNumber,
          propertyId: statement.propertyId
        })
      : null;

  return (
    <main className="mpa-page flex-1 space-y-5">
      <Breadcrumbs
        items={[
          { href: "/dashboard", label: "Dashboard" },
          { href: "/financials", label: "Financials" },
          { href: "/financials/owner-statements", label: "Owner Statements" },
          { label: statement.statementNumber }
        ]}
      />

      {statementSuccess ? (
        <WorkflowSuccessBanner dismissPath={`/financials/owner-statements/${statementId}`} {...statementSuccess} />
      ) : null}

      <Card className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
              {statement.statementNumber}
            </h1>
            <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
              {statement.propertyName ?? "Property"} ·{" "}
              {new Date(statement.statementPeriodStart).toLocaleDateString()} –{" "}
              {new Date(statement.statementPeriodEnd).toLocaleDateString()}
            </p>
          </div>
          <Badge variant={statement.status === "sent" ? "success" : "info"}>
            {statementStatusLabel(statement.status)}
          </Badge>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Total income" value={formatCurrency(statement.totalIncome)} />
          <MetricCard label="Total expenses" value={formatCurrency(statement.totalExpenses)} />
          <MetricCard label="Net income" value={formatCurrency(statement.netIncome)} />
          <MetricCard label="Occupancy" value={`${statement.occupancyRate}%`} />
          <MetricCard label="Maintenance cost" value={formatCurrency(statement.maintenanceCost)} />
          <MetricCard label="Outstanding balances" value={formatCurrency(statement.outstandingBalances)} />
        </div>

        <div className="grid gap-2 text-sm text-[var(--mpa-color-text-secondary)] md:grid-cols-2">
          <p>Owner: {statement.ownerPlaceholder ?? "—"}</p>
          <p>
            Generated:{" "}
            {statement.generatedAt ? new Date(statement.generatedAt).toLocaleString() : "—"}
          </p>
        </div>

        <Link href="/financials/owner-statements">
          <Button variant="ghost">Back to Owner Statements</Button>
        </Link>
      </Card>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface-muted)] p-3">
      <p className="text-xs uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">{label}</p>
      <p className="mt-1 text-lg font-semibold text-[var(--mpa-color-text-primary)]">{value}</p>
    </div>
  );
}
