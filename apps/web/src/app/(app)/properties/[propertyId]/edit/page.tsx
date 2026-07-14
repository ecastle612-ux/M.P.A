import { redirect } from "next/navigation";
import { Breadcrumbs } from "../../../../../components/shell/breadcrumbs";
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
    <main className="mpa-page flex-1 space-y-5">
      <Breadcrumbs
        items={[
          { href: "/dashboard", label: "Dashboard" },
          { href: "/properties", label: "Properties" },
          { href: `/properties/${property.id}`, label: property.name },
          { label: "Edit" }
        ]}
      />
      <PropertyForm mode="edit" property={property} />
    </main>
  );
}
