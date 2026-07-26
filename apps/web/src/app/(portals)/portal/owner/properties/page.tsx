import { redirect } from "next/navigation";
import { AppPage } from "../../../../../components/presentation/app-page";
import { OwnerPropertyCard } from "../../../../../components/portal/owner-property-card";
import {
  OwnerFoundationNote,
  OwnerListEmpty,
  OwnerSectionHeader
} from "../../../../../components/portal/owner-section-placeholder";
import { createAuthServerComponentClient } from "../../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../../lib/organization/server";
import { loadOwnerPropertiesList } from "../../../../../lib/owner-portal/property-experience";

export default async function OwnerPropertiesPage() {
  const supabase = await createAuthServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const organizationId = await resolveActiveOrganizationIdForUser(user.id);
  if (!organizationId) redirect("/portal/owner");

  const authorization = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authorization, "property:read")) redirect("/unauthorized");

  const { properties } = await loadOwnerPropertiesList({ organizationId, user, supabase });

  return (
    <AppPage
      breadcrumbs={[
        { href: "/portal/owner", label: "Owner" },
        { label: "Properties" }
      ]}
    >
      <div className="space-y-5">
        <OwnerSectionHeader
          title="Properties"
          description="Properties available through your owner access. Open a property for financial summary, residents, documents, and activity."
        />
        <OwnerFoundationNote>
          Read-only portfolio view. Lists and detail pages use the shared owner property scope resolver — no
          editing or management actions.
        </OwnerFoundationNote>

        {properties.length === 0 ? (
          <OwnerListEmpty
            title="No properties yet"
            description="Your property manager has not linked properties to your owner access yet. Contact them to get started."
          />
        ) : (
          <ul className="space-y-3">
            {properties.map((property) => (
              <OwnerPropertyCard key={property.id} property={property} />
            ))}
          </ul>
        )}
      </div>
    </AppPage>
  );
}
