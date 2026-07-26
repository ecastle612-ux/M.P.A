import { redirect } from "next/navigation";
import { Card } from "@mpa/ui";
import { AppPage } from "../../../components/presentation/app-page";
import { TechnicianDashboard } from "../../../components/facility/technician-dashboard";
import { createAuthServerComponentClient } from "../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../lib/organization/server";
import { getTechnicianDashboardBuckets } from "../../../lib/facility/technician-dashboard";

export default async function FacilityHubPage() {
  const supabase = await createAuthServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const organizationId = await resolveActiveOrganizationIdForUser(user.id);
  if (!organizationId) {
    return (
      <AppPage wide breadcrumbs={[{ href: "/dashboard", label: "Dashboard" }, { label: "Facility" }]}>
        <Card>
          <h1 className="text-xl font-semibold text-[var(--mpa-color-text-primary)]">No active organization</h1>
          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
            Select or create an organization before opening Facility Operations.
          </p>
        </Card>
      </AppPage>
    );
  }

  const authorization = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authorization, "facility:dashboard")) {
    redirect("/unauthorized");
  }

  const canAssign = evaluatePermission(authorization, "maintenance:assign");
  const buckets = await getTechnicianDashboardBuckets(
    organizationId,
    user.id,
    { includeUnassignedPool: canAssign },
    supabase
  );

  return (
    <AppPage wide breadcrumbs={[{ href: "/dashboard", label: "Dashboard" }, { label: "Facility" }]}>
      <TechnicianDashboard
        buckets={buckets}
        canCreateWorkOrder={evaluatePermission(authorization, "maintenance:create")}
        canWriteInventory={evaluatePermission(authorization, "facility:inventory:write")}
      />
    </AppPage>
  );
}
