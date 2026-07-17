import { redirect } from "next/navigation";
import { AppPage } from "../../../../../components/presentation/app-page";
import { ConversationView } from "../../../../../components/messaging/conversation-view";
import { createAuthServerComponentClient } from "../../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../../lib/organization/server";
import { getThreadForOrganization } from "../../../../../lib/messaging/server";

export default async function ConversationThreadPage({ params }: { params: Promise<{ threadId: string }> }) {
  const { threadId } = await params;
  const supabase = await createAuthServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const organizationId = await resolveActiveOrganizationIdForUser(user.id);
  if (!organizationId) redirect("/dashboard");

  const authorization = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authorization, "message:read")) redirect("/unauthorized");

  const thread = await getThreadForOrganization(organizationId, threadId, user.id, supabase);
  if (!thread) redirect("/communications/inbox");

  const canUpdate = evaluatePermission(authorization, "message:update");

  return (
    <AppPage
      wide
      breadcrumbs={[
        { href: "/dashboard", label: "Dashboard" },
        { href: "/communications", label: "Communications" },
        { href: "/communications/inbox", label: "Inbox" },
        { label: thread.subject }
      ]}
    >
      <ConversationView initialThread={thread} currentUserId={user.id} canUpdate={canUpdate} />
    </AppPage>
  );
}
