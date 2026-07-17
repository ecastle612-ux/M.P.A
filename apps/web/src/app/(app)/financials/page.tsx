import { redirect } from "next/navigation";
import { Card } from "@mpa/ui";
import { AppPage } from "../../../components/presentation/app-page";
import { FinancialOverview } from "../../../components/financial/financial-overview";
import { createAuthServerComponentClient } from "../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../lib/organization/server";
import { fetchAuthedApi } from "../../../lib/financial/server-fetch";
import type { FinancialActivityRecord } from "../../../lib/financial/contracts";
import type { FinancialDashboardMetrics } from "../../../lib/financial/server";

const EMPTY_METRICS: FinancialDashboardMetrics = {
  rentDueToday: 0,
  lateRentCount: 0,
  outstandingBalancesTotal: 0,
  recentPayments: [],
  recentExpenses: [],
  ownerStatementStatusCounts: { draft: 0, generated: 0, sent: 0, archived: 0 }
};

export default async function FinancialsPage() {
  const supabase = await createAuthServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const organizationId = await resolveActiveOrganizationIdForUser(user.id);
  if (!organizationId) {
    return (
      <AppPage wide breadcrumbs={[{ href: "/dashboard", label: "Dashboard" }, { label: "Financials" }]}>
        <Card>
          <h1 className="text-xl font-semibold text-[var(--mpa-color-text-primary)]">No active organization</h1>
          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
            Select or create an organization before managing financial operations.
          </p>
        </Card>
      </AppPage>
    );
  }

  const authorization = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authorization, "financial:read")) {
    redirect("/unauthorized");
  }

  const [metricsResult, activityResult] = await Promise.all([
    fetchAuthedApi<{ metrics: FinancialDashboardMetrics }>("/api/financial/dashboard"),
    fetchAuthedApi<{ items: FinancialActivityRecord[] }>("/api/financial/activity?limit=8")
  ]);

  const metrics = metricsResult.ok ? metricsResult.data.metrics : EMPTY_METRICS;
  const activity = activityResult.ok ? activityResult.data.items : [];

  const permissions = {
    canCreate: evaluatePermission(authorization, "financial:create")
  };

  return (
    <AppPage wide breadcrumbs={[{ href: "/dashboard", label: "Dashboard" }, { label: "Financials" }]}>
      <FinancialOverview metrics={metrics} activity={activity} permissions={permissions} />
    </AppPage>
  );
}
