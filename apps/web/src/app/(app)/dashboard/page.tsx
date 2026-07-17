import { redirect } from "next/navigation";
import { DashboardShell } from "../../../components/shell/dashboard-shell";
import { createAuthServerComponentClient } from "../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../lib/auth/authorization";
import { getDashboardSnapshot } from "../../../lib/dashboard/server";
import { formatHumanGreetingName, formatHumanOrganizationName, getTimeGreeting } from "../../../lib/format/display-labels";
import { getOrganizationsForUser, resolveActiveOrganizationIdForUser } from "../../../lib/organization/server";
import { getUserDisplayNameForGreeting } from "../../../lib/profile/server-fetch";

export default async function DashboardPage() {
  const supabase = await createAuthServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const organizationId = await resolveActiveOrganizationIdForUser(user.id);
  if (!organizationId) {
    redirect("/setup");
  }

  const authorization = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authorization, "dashboard:read")) {
    redirect("/unauthorized");
  }

  const [snapshot, organizations, profileDisplayName] = await Promise.all([
    getDashboardSnapshot(organizationId, supabase, user.id),
    getOrganizationsForUser(user.id),
    getUserDisplayNameForGreeting(user.id, user.email ?? null)
  ]);
  const organizationName = organizations.find((organization) => organization.id === organizationId)?.name ?? null;
  const organizationDisplayName = organizationName ? formatHumanOrganizationName(organizationName) : null;
  const userGreetingName = formatHumanGreetingName(profileDisplayName, user.email ?? null);
  const permissions = {
    canCreateProperty: evaluatePermission(authorization, "property:create"),
    canCreateUnit: evaluatePermission(authorization, "unit:create"),
    canCreateTenant: evaluatePermission(authorization, "tenant:create"),
    canCreateApplicant: evaluatePermission(authorization, "applicant:create"),
    canReadApplicants: evaluatePermission(authorization, "applicant:read"),
    canCreateMaintenance: evaluatePermission(authorization, "maintenance:create"),
    canReadMaintenance: evaluatePermission(authorization, "maintenance:read"),
    canCreateVendor: evaluatePermission(authorization, "vendor:create"),
    canReadVendors: evaluatePermission(authorization, "vendor:read"),
    canCreateLease: evaluatePermission(authorization, "lease:create"),
    canReadLeases: evaluatePermission(authorization, "lease:read"),
    canCreateCommunication: evaluatePermission(authorization, "communication:create"),
    canReadCommunications: evaluatePermission(authorization, "communication:read"),
    canCreateFinancial: evaluatePermission(authorization, "financial:create"),
    canReadFinancials: evaluatePermission(authorization, "financial:read"),
    canReadAi: evaluatePermission(authorization, "ai:read"),
    canUseAi: evaluatePermission(authorization, "ai:use"),
    canReadMigration: evaluatePermission(authorization, "migration:read"),
    canCreateMigration: evaluatePermission(authorization, "migration:create")
  };

  return (
    <DashboardShell
      organizationName={organizationDisplayName}
      snapshot={snapshot}
      permissions={permissions}
      userGreetingName={userGreetingName}
      timeGreeting={getTimeGreeting()}
    />
  );
}
