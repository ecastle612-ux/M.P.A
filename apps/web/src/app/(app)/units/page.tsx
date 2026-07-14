import { redirect } from "next/navigation";
import { Card } from "@mpa/ui";
import { Breadcrumbs } from "../../../components/shell/breadcrumbs";
import { UnitsTable } from "../../../components/unit/units-table";
import { createAuthServerComponentClient } from "../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../lib/organization/server";
import { getUnitsForOrganization } from "../../../lib/unit/server";

export default async function UnitsPage({
  searchParams
}: {
  searchParams: Promise<{ propertyId?: string }>;
}) {
  const { propertyId } = await searchParams;
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
        <Breadcrumbs items={[{ href: "/dashboard", label: "Dashboard" }, { label: "Units" }]} />
        <Card>
          <h1 className="text-xl font-semibold text-[var(--mpa-color-text-primary)]">No active organization</h1>
          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
            Select or create an organization before managing units.
          </p>
        </Card>
      </main>
    );
  }

  const authorization = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authorization, "unit:read")) {
    redirect("/unauthorized");
  }

  const items = await getUnitsForOrganization(organizationId, propertyId ?? null);
  const permissions = {
    canCreate: evaluatePermission(authorization, "unit:create"),
    canUpdate: evaluatePermission(authorization, "unit:update"),
    canArchive: evaluatePermission(authorization, "unit:archive"),
    canDelete: evaluatePermission(authorization, "unit:delete")
  };

  return (
    <main className="mpa-page flex-1 space-y-5">
      <Breadcrumbs items={[{ href: "/dashboard", label: "Dashboard" }, { label: "Units" }]} />
      <UnitsTable initialItems={items} permissions={permissions} />
    </main>
  );
}
