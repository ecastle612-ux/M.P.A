import { redirect } from "next/navigation";
import { CreatePageLayout } from "../../../../../components/presentation/create-page-layout";
import { CreateFormContextRail } from "../../../../../components/presentation/create-form-context-rail";
import { PropertyForm } from "../../../../../components/property/property-form";
import { createAuthServerComponentClient } from "../../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../../lib/organization/server";
import { getPropertyForOrganization } from "../../../../../lib/property/server";

export default async function EditPropertyPage({ params }: { params: Promise<{ propertyId: string }> }) {
  const { propertyId } = await params;
  const supabase = await createAuthServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }
  const organizationId = await resolveActiveOrganizationIdForUser(user.id);
  if (!organizationId) {
    redirect("/dashboard");
  }
  const authorization = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authorization, "property:update")) {
    redirect("/unauthorized");
  }

  const property = await getPropertyForOrganization(organizationId, propertyId);
  if (!property) {
    redirect("/properties");
  }

  return (
    <CreatePageLayout
      breadcrumbs={[
        { href: "/dashboard", label: "Dashboard" },
        { href: "/properties", label: "Properties" },
        { href: `/properties/${property.id}`, label: property.name },
        { label: "Edit" }
      ]}
      form={<PropertyForm mode="edit" property={property} />}
      contextRail={
        <CreateFormContextRail
          module="property"
          setupSteps={[
            { id: "property", label: "Property configured", complete: true },
            { id: "units", label: "Add or update units", complete: false },
            { id: "tenant", label: "Assign tenants", complete: false },
            { id: "lease", label: "Manage leases", complete: false }
          ]}
          relatedLinks={[
            { label: property.name, href: `/properties/${property.id}` },
            { label: "Create unit", href: `/units/new?propertyId=${property.id}` }
          ]}
        />
      }
    />
  );
}
