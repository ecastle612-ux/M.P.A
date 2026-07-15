import { redirect } from "next/navigation";
import { DashboardShell } from "../../../components/shell/dashboard-shell";
import { createAuthServerComponentClient } from "../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../lib/auth/authorization";
import { getDashboardSnapshot } from "../../../lib/dashboard/server";
import { getOrganizationsForUser, resolveActiveOrganizationIdForUser } from "../../../lib/organization/server";

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
    return <DashboardShell organizationName={null} snapshot={null} />;
  }

  const authorization = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authorization, "dashboard:read")) {
    redirect("/unauthorized");
  }

  const [snapshot, organizations] = await Promise.all([
    getDashboardSnapshot(organizationId),
    getOrganizationsForUser(user.id)
  ]);
  const organizationName = organizations.find((organization) => organization.id === organizationId)?.name ?? null;
  const permissions = {
    canCreateProperty: evaluatePermission(authorization, "property:create"),
    canCreateUnit: evaluatePermission(authorization, "unit:create"),
    canCreateTenant: evaluatePermission(authorization, "tenant:create"),
    canCreateMaintenance: evaluatePermission(authorization, "maintenance:create"),
    canReadMaintenance: evaluatePermission(authorization, "maintenance:read"),
    canCreateVendor: evaluatePermission(authorization, "vendor:create"),
    canReadVendors: evaluatePermission(authorization, "vendor:read"),
    canCreateLease: evaluatePermission(authorization, "lease:create"),
    canReadLeases: evaluatePermission(authorization, "lease:read")
  };

  return <DashboardShell organizationName={organizationName} snapshot={snapshot} permissions={permissions} />;
}
