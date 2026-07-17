import { redirect } from "next/navigation";
import { Card } from "@mpa/ui";
import { AppPage } from "../../../components/presentation/app-page";
import { VendorsTable } from "../../../components/vendor/vendors-table";
import { createAuthServerComponentClient } from "../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../lib/organization/server";
import { getVendorsForOrganization } from "../../../lib/vendor/server";

export default async function VendorsPage() {
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
      <AppPage wide breadcrumbs={[{ href: "/dashboard", label: "Dashboard" }, { label: "Vendors" }]}>
        <Card>
          <h1 className="text-xl font-semibold text-[var(--mpa-color-text-primary)]">No active organization</h1>
          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
            Select or create an organization before managing vendors.
          </p>
        </Card>
      </AppPage>
    );
  }

  const authorization = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authorization, "vendor:read")) {
    redirect("/unauthorized");
  }

  const items = await getVendorsForOrganization(organizationId, { status: "all" }, supabase);
  const permissions = {
    canCreate: evaluatePermission(authorization, "vendor:create"),
    canUpdate: evaluatePermission(authorization, "vendor:update"),
    canArchive: evaluatePermission(authorization, "vendor:archive"),
    canDelete: evaluatePermission(authorization, "vendor:delete")
  };

  return (
    <AppPage wide breadcrumbs={[{ href: "/dashboard", label: "Dashboard" }, { label: "Vendors" }]}>
      <VendorsTable initialItems={items} permissions={permissions} />
    </AppPage>
  );
}
