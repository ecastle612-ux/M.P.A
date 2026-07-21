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
  searchParams: Promise<{ propertyId?: string; intent?: string; title?: string }>;
}) {
  const { propertyId, intent, title } = await searchParams;
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
  const ownerUpdate = intent === "owner-update";
  const propertyName = propertyId
    ? properties.find((property) => property.id === propertyId)?.name ?? null
    : null;
  const initialTitle =
    title?.trim() ||
    (ownerUpdate
      ? propertyName
        ? `Owner update — ${propertyName}`
        : "Owner update"
      : null);

  return (
    <main className="mpa-page flex-1 space-y-5">
      <Breadcrumbs
        items={[
          { href: "/dashboard", label: "Dashboard" },
          { href: "/communications", label: "Communications" },
          { label: ownerUpdate ? "Notify owner" : "Create" }
        ]}
      />
      <AnnouncementForm
        mode="create"
        properties={properties.map((property) => ({ id: property.id, name: property.name }))}
        initialPropertyId={propertyId ?? null}
        initialTitle={initialTitle}
        initialTargetingScope={ownerUpdate && propertyId ? "property" : null}
        initialMessage={
          ownerUpdate
            ? "Sharing an operational update for this property. Edit before sending to the owner."
            : null
        }
      />
    </main>
  );
}
