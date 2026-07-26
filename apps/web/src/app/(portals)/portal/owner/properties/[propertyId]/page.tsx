import { redirect } from "next/navigation";
import { AppPage } from "../../../../../../components/presentation/app-page";
import { OwnerPropertyDetail } from "../../../../../../components/portal/owner-property-detail";
import { createAuthServerComponentClient } from "../../../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../../../lib/organization/server";
import { loadOwnerPropertyDetail } from "../../../../../../lib/owner-portal/property-experience";

export default async function OwnerPropertyDetailPage({
  params
}: {
  params: Promise<{ propertyId: string }>;
}) {
  const { propertyId: rawPropertyId } = await params;
  const propertyId = rawPropertyId?.trim();
  if (!propertyId) redirect("/unauthorized");

  const supabase = await createAuthServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const organizationId = await resolveActiveOrganizationIdForUser(user.id);
  if (!organizationId) redirect("/portal/owner");

  const authorization = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authorization, "property:read")) redirect("/unauthorized");

  const model = await loadOwnerPropertyDetail({
    organizationId,
    user,
    propertyId,
    supabase
  });

  if (!model) {
    redirect("/unauthorized");
  }

  return (
    <AppPage
      breadcrumbs={[
        { href: "/portal/owner", label: "Owner" },
        { href: "/portal/owner/properties", label: "Properties" },
        { label: model.name }
      ]}
    >
      <OwnerPropertyDetail model={model} />
    </AppPage>
  );
}
