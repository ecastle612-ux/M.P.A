import { redirect } from "next/navigation";
import { Card } from "@mpa/ui";
import { AppPage } from "../../../components/presentation/app-page";
import { LeasesTable } from "../../../components/lease/leases-table";
import { createAuthServerComponentClient } from "../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../lib/organization/server";
import { getLeasesForOrganization } from "../../../lib/lease/server";

export default async function LeasesPage() {
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
      <AppPage wide breadcrumbs={[{ href: "/dashboard", label: "Dashboard" }, { label: "Leases" }]}>
        <Card>
          <h1 className="text-xl font-semibold text-[var(--mpa-color-text-primary)]">No active organization</h1>
          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
            Select or create an organization before managing leases.
          </p>
        </Card>
      </AppPage>
    );
  }

  const authorization = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authorization, "lease:read")) {
    redirect("/unauthorized");
  }

  const items = await getLeasesForOrganization(organizationId, { status: "all" }, supabase);
  const permissions = {
    canCreate: evaluatePermission(authorization, "lease:create"),
    canUpdate: evaluatePermission(authorization, "lease:update"),
    canArchive: evaluatePermission(authorization, "lease:archive"),
    canDelete: evaluatePermission(authorization, "lease:delete")
  };

  return (
    <AppPage wide breadcrumbs={[{ href: "/dashboard", label: "Dashboard" }, { label: "Leases" }]}>
      <LeasesTable initialItems={items} permissions={permissions} />
    </AppPage>
  );
}
