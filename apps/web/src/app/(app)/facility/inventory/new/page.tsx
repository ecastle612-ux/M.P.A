import { redirect } from "next/navigation";
import { Card } from "@mpa/ui";
import { AppPage } from "../../../../../components/presentation/app-page";
import { InventoryCreateForm } from "../../../../../components/facility/inventory-create-form";
import { createAuthServerComponentClient } from "../../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../../lib/organization/server";

export default async function FacilityInventoryNewPage() {
  const supabase = await createAuthServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const organizationId = await resolveActiveOrganizationIdForUser(user.id);
  if (!organizationId) {
    return (
      <AppPage
        wide
        breadcrumbs={[
          { href: "/facility", label: "Facility" },
          { href: "/facility/inventory", label: "Inventory" },
          { label: "Add" }
        ]}
      >
        <Card>
          <h1 className="text-xl font-semibold text-[var(--mpa-color-text-primary)]">No active organization</h1>
        </Card>
      </AppPage>
    );
  }

  const authorization = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authorization, "facility:inventory:write")) {
    redirect("/unauthorized");
  }

  return (
    <AppPage
      wide
      breadcrumbs={[
        { href: "/facility", label: "Facility" },
        { href: "/facility/inventory", label: "Inventory" },
        { label: "Add" }
      ]}
    >
      <InventoryCreateForm organizationId={organizationId} />
    </AppPage>
  );
}
