import { redirect } from "next/navigation";
import { AppPage } from "../../../components/presentation/app-page";
import { MigrationDashboard } from "../../../components/migration/migration-dashboard";
import { MigrationSwitchingExperience } from "../../../components/migration/migration-switching-experience";
import { createAuthServerComponentClient } from "../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../lib/organization/server";
import { getMigrationJobsForOrganization } from "../../../lib/migration/server";
import { getCustomerSwitchingSnapshot } from "../../../lib/migration/switching";

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

  const [jobs, switching] = await Promise.all([
    getMigrationJobsForOrganization(organizationId, supabase),
    getCustomerSwitchingSnapshot(organizationId, supabase)
  ]);

  return (
    <AppPage wide breadcrumbs={[{ href: "/dashboard", label: "Dashboard" }, { label: "Migration Center" }]}>
      <div className="space-y-8">
        <MigrationSwitchingExperience
          initial={switching}
          canCreate={evaluatePermission(authorization, "migration:create")}
          canUpdate={evaluatePermission(authorization, "migration:update")}
        />
        <MigrationDashboard
          jobs={jobs}
          metrics={switching.metrics}
          canCreate={evaluatePermission(authorization, "migration:create")}
        />
      </div>
    </AppPage>
  );
}
