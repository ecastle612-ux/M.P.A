import { redirect } from "next/navigation";
import { AppPage } from "../../../../components/presentation/app-page";
import { TenantPortalHome } from "../../../../components/portal/tenant-portal-home";
import { MasterAdminPortalDemoPanel } from "../../../../components/master-admin/master-admin-portal-demo-panel";
import { createAuthServerComponentClient } from "../../../../lib/auth/server";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { resolveLinkedTenantForUser } from "../../../../lib/resident/resolve-tenant";
import { getActiveMasterAdminSession } from "../../../../lib/master-admin/session";

export default async function TenantPortalPage() {
  const supabase = await createAuthServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const organizationId = await resolveActiveOrganizationIdForUser(user.id);
  if (!organizationId) redirect("/dashboard");

  const session = await getActiveMasterAdminSession(user.id);
  const inPortalTest = session?.mode === "portal_test" && session.portal === "resident";

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
      {inPortalTest && !tenant ? <MasterAdminPortalDemoPanel portal="resident" /> : null}
      <TenantPortalHome residentName={residentName} hasLinkedTenant={Boolean(tenant)} />
    </AppPage>
  );
}
