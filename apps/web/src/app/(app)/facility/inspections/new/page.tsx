import { redirect } from "next/navigation";
import { Card } from "@mpa/ui";
import { AppPage } from "../../../../../components/presentation/app-page";
import { InspectionCreateForm } from "../../../../../components/facility/inspection-create-form";
import { createAuthServerComponentClient } from "../../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../../lib/organization/server";
import { getPropertiesForOrganization } from "../../../../../lib/property/server";
import { listInspectionTemplates } from "../../../../../lib/facility/inspection-server";

export default async function FacilityInspectionNewPage({
  searchParams
}: {
  searchParams: Promise<{ propertyId?: string }>;
}) {
  const { propertyId } = await searchParams;
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
          { href: "/facility/inspections", label: "Inspections" },
          { label: "New" }
        ]}
      >
        <Card>
          <h1 className="text-xl font-semibold text-[var(--mpa-color-text-primary)]">
            No active organization
          </h1>
        </Card>
      </AppPage>
    );
  }

  const authorization = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authorization, "facility:inspection:write")) {
    redirect("/unauthorized");
  }

  const [properties, templates] = await Promise.all([
    getPropertiesForOrganization(organizationId, supabase, { limit: 200 }),
    listInspectionTemplates(organizationId, supabase)
  ]);

  return (
    <AppPage
      wide
      breadcrumbs={[
        { href: "/facility/inspections", label: "Inspections" },
        { label: "New" }
      ]}
    >
      <InspectionCreateForm
        properties={properties.map((property) => ({ id: property.id, name: property.name }))}
        templates={templates}
        {...(propertyId ? { defaultPropertyId: propertyId } : {})}
      />
    </AppPage>
  );
}
