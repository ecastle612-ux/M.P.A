import { redirect } from "next/navigation";
import { Card } from "@mpa/ui";
import { AppPage } from "../../../components/presentation/app-page";
import { WorkOrdersTable } from "../../../components/maintenance/work-orders-table";
import { RoleUniversalDashboard } from "../../../components/dashboard-framework/role-universal-dashboard";
import { createAuthServerComponentClient } from "../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser, getOrganizationsForUser } from "../../../lib/organization/server";
import { getWorkOrdersForOrganization } from "../../../lib/maintenance/server";
import { getVendorsForOrganization } from "../../../lib/vendor/server";
import { getTechnicianDashboardBuckets } from "../../../lib/facility/technician-dashboard";
import { getUserDisplayNameForGreeting } from "../../../lib/profile/server-fetch";
import {
  formatHumanGreetingName,
  formatHumanOrganizationName,
  getTimeGreeting
} from "../../../lib/format/display-labels";
import { primaryRoleByPriority } from "@mpa/shared";
import { buildTechnicianDashboardViewModel } from "../../../lib/dashboard/ux016-role-builders";

export default async function MaintenancePage({
  searchParams
}: {
  searchParams: Promise<{ status?: string; priority?: string; q?: string }>;
}) {
  const { status: statusParam, priority: priorityParam, q: queryParam } = await searchParams;
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
      <AppPage wide breadcrumbs={[{ href: "/dashboard", label: "Dashboard" }, { label: "Maintenance" }]}>
        <Card>
          <h1 className="text-xl font-semibold text-[var(--mpa-color-text-primary)]">No active organization</h1>
          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
            Select or create an organization before managing maintenance.
          </p>
        </Card>
      </AppPage>
    );
  }

  const authorization = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authorization, "maintenance:read")) {
    redirect("/unauthorized");
  }

  const canAssignVendor = evaluatePermission(authorization, "vendor:assign");
  const primaryRole = primaryRoleByPriority(authorization.roles);
  const showTechCommandCenter = primaryRole === "facility_technician";

  const [items, vendors, buckets, organizations, profileDisplayName] = await Promise.all([
    getWorkOrdersForOrganization(organizationId, { status: "all" }, supabase),
    canAssignVendor ? getVendorsForOrganization(organizationId, { status: "active" }, supabase) : Promise.resolve([]),
    showTechCommandCenter
      ? getTechnicianDashboardBuckets(organizationId, user.id, { includeUnassignedPool: false }, supabase)
      : Promise.resolve(null),
    showTechCommandCenter ? getOrganizationsForUser(user.id) : Promise.resolve([]),
    showTechCommandCenter
      ? getUserDisplayNameForGreeting(user.id, user.email ?? null)
      : Promise.resolve(null)
  ]);

  const permissions = {
    canCreate: evaluatePermission(authorization, "maintenance:create"),
    canUpdate: evaluatePermission(authorization, "maintenance:update"),
    canAssign: evaluatePermission(authorization, "maintenance:assign"),
    canArchive: evaluatePermission(authorization, "maintenance:archive"),
    canDelete: evaluatePermission(authorization, "maintenance:delete"),
    canAssignVendor
  };

  const techModel =
    buckets && showTechCommandCenter
      ? buildTechnicianDashboardViewModel({
          timeGreeting: getTimeGreeting(),
          userGreetingName: formatHumanGreetingName(profileDisplayName, user.email ?? null),
          organizationName: (() => {
            const name = organizations.find((organization) => organization.id === organizationId)?.name ?? null;
            return name ? formatHumanOrganizationName(name) : null;
          })(),
          dateLabel: new Intl.DateTimeFormat(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric"
          }).format(new Date()),
          buckets
        })
      : null;

  return (
    <AppPage wide breadcrumbs={[{ href: "/dashboard", label: "Dashboard" }, { label: "Maintenance" }]}>
      <div className="space-y-6">
        {techModel ? <RoleUniversalDashboard model={techModel} /> : null}
        <WorkOrdersTable
          initialItems={items}
          permissions={permissions}
          vendors={vendors.map((vendor) => ({ id: vendor.id, businessName: vendor.businessName }))}
          {...(statusParam ? { initialStatusFilter: statusParam } : {})}
          {...(priorityParam ? { initialPriorityFilter: priorityParam } : {})}
          {...(queryParam ? { initialQuery: queryParam } : {})}
        />
      </div>
    </AppPage>
  );
}
