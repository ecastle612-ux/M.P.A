import { redirect } from "next/navigation";
import { Card } from "@mpa/ui";
import { AppPage } from "../../../components/presentation/app-page";
import { FacilityUniversalDashboard } from "../../../components/facility/facility-universal-dashboard";
import { createAuthServerComponentClient } from "../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../lib/auth/authorization";
import {
  resolveActiveOrganizationIdForUser,
  getOrganizationsForUser
} from "../../../lib/organization/server";
import { getTechnicianDashboardBuckets } from "../../../lib/facility/technician-dashboard";
import { buildFacilityUniversalDashboardViewModel } from "../../../lib/facility/ux016-view-model";
import {
  formatHumanGreetingName,
  formatHumanOrganizationName
} from "../../../lib/format/display-labels";
import { getUserDisplayNameForGreeting } from "../../../lib/profile/server-fetch";

/** STD-001 operational remediation — Facility Operations on Universal Dashboard Framework. */
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
  const canCreateWorkOrder = evaluatePermission(authorization, "maintenance:create");
  const canWriteInventory = evaluatePermission(authorization, "facility:inventory:write");

  const [buckets, organizations, profileDisplayName] = await Promise.all([
    getTechnicianDashboardBuckets(
      organizationId,
      user.id,
      { includeUnassignedPool: canAssign },
      supabase
    ),
    getOrganizationsForUser(user.id),
    getUserDisplayNameForGreeting(user.id, user.email ?? null)
  ]);

  const organizationName = organizations.find((organization) => organization.id === organizationId)?.name ?? null;

  const model = buildFacilityUniversalDashboardViewModel({
    buckets,
    canCreateWorkOrder,
    canWriteInventory,
    userName: formatHumanGreetingName(profileDisplayName, user.email ?? null),
    organizationName: organizationName ? formatHumanOrganizationName(organizationName) : null
  });

  return (
    <AppPage wide breadcrumbs={[{ href: "/dashboard", label: "Dashboard" }, { label: "Facility" }]}>
      <FacilityUniversalDashboard
        model={model}
        buckets={buckets}
        canCreateWorkOrder={canCreateWorkOrder}
        canWriteInventory={canWriteInventory}
      />
    </AppPage>
  );
}
