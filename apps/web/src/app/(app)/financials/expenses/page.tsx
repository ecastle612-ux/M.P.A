import { redirect } from "next/navigation";
import { AppPage } from "../../../../components/presentation/app-page";
import { WorkflowSuccessPanel } from "../../../../components/presentation/workflow-success-panel";
import { ExpensesTable } from "../../../../components/financial/expenses-table";
import { createAuthServerComponentClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { fetchAuthedApi } from "../../../../lib/financial/server-fetch";
import type { ExpenseListItem } from "../../../../lib/financial/server";
import { buildExpenseCreatedSuccess } from "../../../../lib/workflow/shared/success-configs";

export default async function ExpensesPage({
  searchParams
}: {
  searchParams: Promise<{ from?: string }>;
}) {
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
    return (
      <AppPage
        wide
        breadcrumbs={[
          { href: "/dashboard", label: "Dashboard" },
          { href: "/financials", label: "Financials" },
          { label: "Expenses" }
        ]}
      >
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">No active organization</p>
      </AppPage>
    );
  }

  const authorization = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authorization, "financial:read")) {
    redirect("/unauthorized");
  }

  const result = await fetchAuthedApi<{ items: ExpenseListItem[] }>("/api/expenses");
  const items = result.ok ? result.data.items : [];

  const permissions = {
    canCreate: evaluatePermission(authorization, "financial:create")
  };

  const expenseSuccess = from === "expense-created" ? buildExpenseCreatedSuccess() : null;

  return (
    <AppPage
      wide
      breadcrumbs={[
        { href: "/dashboard", label: "Dashboard" },
        { href: "/financials", label: "Financials" },
        { label: "Expenses" }
      ]}
    >
      {expenseSuccess ? (
        <WorkflowSuccessPanel {...expenseSuccess} primaryAction={expenseSuccess.primaryAction} />
      ) : null}
      <ExpensesTable initialItems={items} permissions={permissions} />
    </AppPage>
  );
}
