import { redirect } from "next/navigation";
import { Card } from "@mpa/ui";
import { AppPage } from "../../../../components/presentation/app-page";
import { OwnerStatementsTable } from "../../../../components/financial/owner-statements-table";
import { createAuthServerComponentClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { fetchAuthedApi } from "../../../../lib/financial/server-fetch";
import type { OwnerStatementListItem } from "../../../../lib/financial/server";

export default async function OwnerStatementsPage() {
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
          { label: "Owner Statements" }
        ]}
      >
        <Card>
          <h1 className="text-xl font-semibold text-[var(--mpa-color-text-primary)]">No active organization</h1>
        </Card>
      </AppPage>
    );
  }

  const authorization = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authorization, "financial:read")) {
    redirect("/unauthorized");
  }

  const result = await fetchAuthedApi<{ items: OwnerStatementListItem[] }>("/api/owner-statements");
  const items = result.ok ? result.data.items : [];

  const permissions = {
    canCreate: evaluatePermission(authorization, "financial:create")
  };

  return (
    <AppPage
      wide
      breadcrumbs={[
        { href: "/dashboard", label: "Dashboard" },
        { href: "/financials", label: "Financials" },
        { label: "Owner Statements" }
      ]}
    >
      <OwnerStatementsTable initialItems={items} permissions={permissions} />
    </AppPage>
  );
}
