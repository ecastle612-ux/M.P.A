import { redirect } from "next/navigation";
import { Card } from "@mpa/ui";
import { AppPage } from "../../../../../../components/presentation/app-page";
import { ResidentWorkOrderForm } from "../../../../../../components/portal/resident-work-order-form";
import { createAuthServerComponentClient } from "../../../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../../../lib/organization/server";
import { resolveLinkedTenantForUser } from "../../../../../../lib/resident/resolve-tenant";

export default async function TenantNewMaintenancePage() {
  const supabase = await createAuthServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const organizationId = await resolveActiveOrganizationIdForUser(user.id);
  if (!organizationId) redirect("/portal/tenant");

  const authorization = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authorization, "maintenance:create")) redirect("/unauthorized");

  const tenant = await resolveLinkedTenantForUser(organizationId, user.id, user.email, supabase);
  if (!tenant?.propertyId) {
    return (
      <AppPage
        breadcrumbs={[
          { href: "/portal/tenant", label: "Tenant home" },
          { href: "/portal/tenant/maintenance", label: "Maintenance" },
          { label: "New" }
        ]}
      >
        <Card>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            Your resident profile is missing a property assignment. Ask your property manager to link your unit
            before submitting maintenance requests.
          </p>
        </Card>
      </AppPage>
    );
  }

  return (
    <AppPage
      breadcrumbs={[
        { href: "/portal/tenant", label: "Tenant home" },
        { href: "/portal/tenant/maintenance", label: "Maintenance" },
        { label: "New" }
      ]}
    >
      <ResidentWorkOrderForm
        organizationId={organizationId}
        propertyId={tenant.propertyId}
        unitId={tenant.unitId}
        tenantId={tenant.id}
      />
    </AppPage>
  );
}
