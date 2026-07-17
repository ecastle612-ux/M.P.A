import { redirect } from "next/navigation";
import { Card } from "@mpa/ui";
import { AppPage } from "../../../components/presentation/app-page";
import { PropertiesTable } from "../../../components/property/properties-table";
import { createAuthServerComponentClient } from "../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../lib/organization/server";
import { getPropertiesForOrganization } from "../../../lib/property/server";

export default async function PropertiesPage() {
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
      <AppPage wide breadcrumbs={[{ href: "/dashboard", label: "Dashboard" }, { label: "Properties" }]}>
        <Card>
          <h1 className="text-xl font-semibold text-[var(--mpa-color-text-primary)]">No active organization</h1>
          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
            Select or create an organization before managing properties.
          </p>
        </Card>
      </AppPage>
    );
  }

  const authorization = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authorization, "property:read")) {
    redirect("/unauthorized");
  }

  const items = await getPropertiesForOrganization(organizationId);
  const permissions = {
    canCreate: evaluatePermission(authorization, "property:create"),
    canUpdate: evaluatePermission(authorization, "property:update"),
    canArchive: evaluatePermission(authorization, "property:archive"),
    canDelete: evaluatePermission(authorization, "property:delete")
  };

  return (
    <AppPage wide breadcrumbs={[{ href: "/dashboard", label: "Dashboard" }, { label: "Properties" }]}>
      <PropertiesTable initialItems={items} permissions={permissions} />
    </AppPage>
  );
}
