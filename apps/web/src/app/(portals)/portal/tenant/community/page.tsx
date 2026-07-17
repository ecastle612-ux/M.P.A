import { redirect } from "next/navigation";
import { AppPage } from "../../../../../components/presentation/app-page";
import { CommunityHub } from "../../../../../components/community/community-hub";
import { createAuthServerComponentClient } from "../../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../../lib/organization/server";
import { getCommunityEventsForOrganization } from "../../../../../lib/community/server";
import { getResidentAnnouncementsForUser } from "../../../../../lib/communication/server";

export default async function TenantCommunityPage() {
  const supabase = await createAuthServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const organizationId = await resolveActiveOrganizationIdForUser(user.id);
  if (!organizationId) redirect("/portal/tenant");

  const authorization = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authorization, "communication:read")) redirect("/unauthorized");

  const [announcements, events] = await Promise.all([
    getResidentAnnouncementsForUser(organizationId, user.id, supabase),
    getCommunityEventsForOrganization(organizationId, { upcomingOnly: true, limit: 20 }, supabase)
  ]);

  return (
    <AppPage breadcrumbs={[{ href: "/portal/tenant", label: "Tenant home" }, { label: "Community" }]}>
      <CommunityHub announcements={announcements} events={events} />
    </AppPage>
  );
}
