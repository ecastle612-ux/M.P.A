import { redirect } from "next/navigation";
import { AppPage } from "../../../../components/presentation/app-page";
import { MessagingInbox } from "../../../../components/messaging/messaging-inbox";
import { createAuthServerComponentClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { getThreadsForOrganization } from "../../../../lib/messaging/server";

export default async function CommunicationsInboxPage() {
  const supabase = await createAuthServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const organizationId = await resolveActiveOrganizationIdForUser(user.id);
  if (!organizationId) redirect("/dashboard");

  const authorization = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authorization, "message:read")) redirect("/unauthorized");

  const items = await getThreadsForOrganization(organizationId, user.id, { limit: 100 }, supabase);
  const canCreate = evaluatePermission(authorization, "message:create");

  return (
    <AppPage
      wide
      breadcrumbs={[
        { href: "/dashboard", label: "Dashboard" },
        { href: "/communications", label: "Communications" },
        { label: "Inbox" }
      ]}
    >
      <MessagingInbox initialItems={items} canCreate={canCreate} />
    </AppPage>
  );
}
