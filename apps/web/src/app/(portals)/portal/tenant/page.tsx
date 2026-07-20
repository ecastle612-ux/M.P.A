import { redirect } from "next/navigation";
import { AppPage } from "../../../../components/presentation/app-page";
import { TenantPortalHome } from "../../../../components/portal/tenant-portal-home";
import { createAuthServerComponentClient } from "../../../../lib/auth/server";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { resolveLinkedTenantForUser } from "../../../../lib/resident/resolve-tenant";

export default async function TenantPortalPage() {
  const supabase = await createAuthServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const organizationId = await resolveActiveOrganizationIdForUser(user.id);
  if (!organizationId) redirect("/dashboard");

  const tenant = await resolveLinkedTenantForUser(organizationId, user.id, user.email, supabase);
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("display_name")
    .eq("user_id", user.id)
    .maybeSingle();

  const residentName =
    (profile?.display_name as string | null | undefined)?.trim() ||
    (tenant ? `${tenant.firstName} ${tenant.lastName}`.trim() : "");

  return (
    <AppPage breadcrumbs={[{ label: "Tenant home" }]}>
      <TenantPortalHome residentName={residentName} hasLinkedTenant={Boolean(tenant)} />
    </AppPage>
  );
}
