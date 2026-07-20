import { redirect } from "next/navigation";
import { Card } from "@mpa/ui";
import { AppPage } from "../../../../components/presentation/app-page";
import { ReportsView } from "../../../../components/financial/reports-view";
import { createAuthServerComponentClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { ReportingService } from "../../../../lib/reporting/service";

export default async function FinancialReportsPage() {
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
          { label: "Reports" }
        ]}
      >
        <Card className="p-6">
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">No active organization</p>
        </Card>
      </AppPage>
    );
  }

  const authorization = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authorization, "financial:read")) {
    redirect("/unauthorized");
  }

  const properties = await ReportingService.listProperties(organizationId, supabase);

  return (
    <AppPage
      wide
      breadcrumbs={[
        { href: "/dashboard", label: "Dashboard" },
        { href: "/financials", label: "Accounting" },
        { label: "Reports" }
      ]}
    >
      <ReportsView initialProperties={properties} />
    </AppPage>
  );
}
