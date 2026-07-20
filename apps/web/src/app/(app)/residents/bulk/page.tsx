import { redirect } from "next/navigation";
import { AppPage } from "../../../../components/presentation/app-page";
import { BulkLifecyclePanel } from "../../../../components/resident-lifecycle/bulk-lifecycle-panel";
import { createAuthServerComponentClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { getTenantsForOrganization } from "../../../../lib/tenant/server";

export default async function ResidentBulkPage() {
  const supabase = await createAuthServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const organizationId = await resolveActiveOrganizationIdForUser(user.id);
  if (!organizationId) redirect("/setup");

  const authorization = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authorization, "tenant:update")) {
    redirect("/unauthorized");
  }

  const tenants = await getTenantsForOrganization(organizationId);

  return (
    <AppPage
      wide
      breadcrumbs={[
        { href: "/dashboard", label: "Dashboard" },
        { href: "/tenants", label: "Tenants" },
        { label: "Bulk operations" }
      ]}
    >
      <BulkLifecyclePanel tenants={tenants} />
    </AppPage>
  );
}
