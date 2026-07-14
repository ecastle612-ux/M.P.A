import { redirect } from "next/navigation";
import { Card } from "@mpa/ui";
import { Breadcrumbs } from "../../../components/shell/breadcrumbs";
import { TenantsTable } from "../../../components/tenant/tenants-table";
import { createAuthServerComponentClient } from "../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../lib/organization/server";
import { getTenantsForOrganization } from "../../../lib/tenant/server";

export default async function TenantsPage() {
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
      <main className="mpa-page flex-1 space-y-5">
        <Breadcrumbs items={[{ href: "/dashboard", label: "Dashboard" }, { label: "Tenants" }]} />
        <Card>
          <h1 className="text-xl font-semibold text-[var(--mpa-color-text-primary)]">No active organization</h1>
          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
            Select or create an organization before managing tenants.
          </p>
        </Card>
      </main>
    );
  }

  const authorization = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authorization, "tenant:read")) {
    redirect("/unauthorized");
  }

  const items = await getTenantsForOrganization(organizationId);
  const permissions = {
    canCreate: evaluatePermission(authorization, "tenant:create"),
    canUpdate: evaluatePermission(authorization, "tenant:update"),
    canArchive: evaluatePermission(authorization, "tenant:archive"),
    canDelete: evaluatePermission(authorization, "tenant:delete")
  };

  return (
    <main className="mpa-page flex-1 space-y-5">
      <Breadcrumbs items={[{ href: "/dashboard", label: "Dashboard" }, { label: "Tenants" }]} />
      <TenantsTable initialItems={items} permissions={permissions} />
    </main>
  );
}
