import { redirect } from "next/navigation";
import { Card, PageHeader } from "@mpa/ui";
import { AppPage } from "../../../../components/presentation/app-page";
import { createAuthServerComponentClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { fetchAuthedApi } from "../../../../lib/financial/server-fetch";
import type { FinancialActivityRecord } from "../../../../lib/financial/contracts";
import { formatCurrency } from "../../../../lib/financial/contracts";

export default async function FinancialTransactionsPage() {
  const supabase = await createAuthServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const organizationId = await resolveActiveOrganizationIdForUser(user.id);
  if (!organizationId) {
    return (
      <AppPage
        wide
        breadcrumbs={[
          { href: "/dashboard", label: "Dashboard" },
          { href: "/financials", label: "Accounting" },
          { label: "Transactions" }
        ]}
      >
        <Card>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">No active organization</p>
        </Card>
      </AppPage>
    );
  }

  const authorization = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authorization, "financial:read")) {
    redirect("/unauthorized");
  }

  const activityResult = await fetchAuthedApi<{ items: FinancialActivityRecord[] }>(
    "/api/financial/activity?limit=50"
  );
  const items = activityResult.ok ? activityResult.data.items : [];

  return (
    <AppPage
      wide
      breadcrumbs={[
        { href: "/dashboard", label: "Dashboard" },
        { href: "/financials", label: "Accounting" },
        { label: "Transactions" }
      ]}
    >
      <PageHeader
        overline="Accounting"
        title="Transactions"
        description="Read-only financial activity feed. Recording payments and charges remains on existing accounting workflows."
      />
      <Card className="overflow-hidden">
        {items.length === 0 ? (
          <p className="p-6 text-sm text-[var(--mpa-color-text-secondary)]">No transactions yet.</p>
        ) : (
          <ul className="divide-y divide-[var(--mpa-color-border-default)]">
            {items.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">{item.summary}</p>
                  <p className="text-xs text-[var(--mpa-color-text-tertiary)]">
                    {item.activityType} · {new Date(item.createdAt).toLocaleString()}
                  </p>
                </div>
                <p className="text-sm font-medium tabular-nums text-[var(--mpa-color-text-primary)]">
                  {formatCurrency(item.amount)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </AppPage>
  );
}
