import { redirect } from "next/navigation";
import { Breadcrumbs } from "../../../../components/shell/breadcrumbs";
import { AnnouncementForm } from "../../../../components/communication/announcement-form";
import { createAuthServerComponentClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { getPropertiesForOrganization } from "../../../../lib/property/server";

export default async function NewAnnouncementPage({
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
    redirect("/dashboard");
  }

  const authorization = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authorization, "communication:create")) {
    redirect("/unauthorized");
  }

  const properties = await getPropertiesForOrganization(organizationId);

  return (
    <main className="mpa-page flex-1 space-y-5">
      <Breadcrumbs
        items={[
          { href: "/dashboard", label: "Dashboard" },
          { href: "/communications", label: "Communications" },
          { label: "Create" }
        ]}
      />
      <AnnouncementForm
        mode="create"
        properties={properties.map((property) => ({ id: property.id, name: property.name }))}
        initialPropertyId={propertyId ?? null}
      />
    </main>
  );
}
