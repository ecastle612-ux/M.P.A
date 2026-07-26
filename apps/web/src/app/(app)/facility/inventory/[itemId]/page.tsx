import { redirect } from "next/navigation";
import { AppPage } from "../../../../../components/presentation/app-page";
import { InventoryDetailForm } from "../../../../../components/facility/inventory-detail-form";
import { createAuthServerComponentClient } from "../../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../../lib/organization/server";
import { getFacilityInventoryItem } from "../../../../../lib/facility/inventory-server";
import { getPropertiesForOrganization } from "../../../../../lib/property/server";

export default async function FacilityInventoryDetailPage({
  params
}: {
  params: Promise<{ itemId: string }>;
}) {
  const { itemId } = await params;
  const supabase = await createAuthServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const organizationId = await resolveActiveOrganizationIdForUser(user.id);
  if (!organizationId) redirect("/facility/inventory");

  const authorization = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authorization, "facility:inventory:read")) {
    redirect("/unauthorized");
  }

  const [item, properties] = await Promise.all([
    getFacilityInventoryItem(organizationId, itemId, supabase),
    getPropertiesForOrganization(organizationId, supabase, { limit: 200 })
  ]);

  if (!item) redirect("/facility/inventory");

  return (
    <AppPage
      wide
      breadcrumbs={[
        { href: "/facility", label: "Facility" },
        { href: "/facility/inventory", label: "Inventory" },
        { label: item.name }
      ]}
    >
      <InventoryDetailForm
        item={item}
        properties={properties.map((property) => ({ id: property.id, name: property.name }))}
        canWrite={evaluatePermission(authorization, "facility:inventory:write")}
      />
    </AppPage>
  );
}
