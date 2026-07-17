import { redirect } from "next/navigation";
import { AppPage } from "../../../components/presentation/app-page";
import { MigrationDashboard } from "../../../components/migration/migration-dashboard";
import { createAuthServerComponentClient } from "../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../lib/organization/server";
import { getMigrationDashboardMetrics, getMigrationJobsForOrganization } from "../../../lib/migration/server";

export default async function MigrationPage() {
  const supabase = await createAuthServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const organizationId = await resolveActiveOrganizationIdForUser(user.id);
  if (!organizationId) redirect("/setup");

  const authorization = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authorization, "migration:read")) redirect("/unauthorized");

  const [jobs, metrics] = await Promise.all([
    getMigrationJobsForOrganization(organizationId, supabase),
    getMigrationDashboardMetrics(organizationId, supabase)
  ]);

  return (
    <AppPage wide breadcrumbs={[{ href: "/dashboard", label: "Dashboard" }, { label: "Migration Center" }]}>
      <MigrationDashboard
        jobs={jobs}
        metrics={metrics}
        canCreate={evaluatePermission(authorization, "migration:create")}
      />
    </AppPage>
  );
}
