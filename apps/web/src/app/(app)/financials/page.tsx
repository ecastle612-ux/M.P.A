import { redirect } from "next/navigation";
import { Card } from "@mpa/ui";
import { AppPage } from "../../../components/presentation/app-page";
import { FinancialUniversalDashboard } from "../../../components/financial/financial-universal-dashboard";
import { createAuthServerComponentClient } from "../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser, getOrganizationsForUser } from "../../../lib/organization/server";
import { fetchAuthedApi } from "../../../lib/financial/server-fetch";
import type { FinancialActivityRecord } from "../../../lib/financial/contracts";
import type { FinancialDashboardMetrics } from "../../../lib/financial/server";
import { buildFinancialUniversalDashboardViewModel } from "../../../lib/financial/ux016-view-model";
import {
  formatHumanGreetingName,
  formatHumanOrganizationName
} from "../../../lib/format/display-labels";
import { getUserDisplayNameForGreeting } from "../../../lib/profile/server-fetch";

const EMPTY_METRICS: FinancialDashboardMetrics = {
  rentDueToday: 0,
  lateRentCount: 0,
  outstandingBalancesTotal: 0,
  recentPayments: [],
  recentExpenses: [],
  ownerStatementStatusCounts: { draft: 0, generated: 0, sent: 0, archived: 0 }
};

/** STD-001 compliance remediation — Financial ops on Universal Dashboard Framework. */
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

  const [metricsResult, activityResult, organizations, profileDisplayName] = await Promise.all([
    fetchAuthedApi<{ metrics: FinancialDashboardMetrics }>("/api/financial/dashboard"),
    fetchAuthedApi<{ items: FinancialActivityRecord[] }>("/api/financial/activity?limit=8"),
    getOrganizationsForUser(user.id),
    getUserDisplayNameForGreeting(user.id, user.email ?? null)
  ]);

  const metrics = metricsResult.ok ? metricsResult.data.metrics : EMPTY_METRICS;
  const activity = activityResult.ok ? activityResult.data.items : [];
  const organizationName = organizations.find((organization) => organization.id === organizationId)?.name ?? null;
  const canCreate = evaluatePermission(authorization, "financial:create");

  const model = buildFinancialUniversalDashboardViewModel({
    metrics,
    activity,
    canCreate,
    userName: formatHumanGreetingName(profileDisplayName, user.email ?? null),
    organizationName: organizationName ? formatHumanOrganizationName(organizationName) : null
  });

  return (
    <AppPage wide breadcrumbs={[{ href: "/dashboard", label: "Dashboard" }, { label: "Financials" }]}>
      <FinancialUniversalDashboard
        model={model}
        metrics={metrics}
        activity={activity}
        canCreate={canCreate}
      />
    </AppPage>
  );
}
