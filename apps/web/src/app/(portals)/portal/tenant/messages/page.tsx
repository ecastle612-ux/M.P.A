import { redirect } from "next/navigation";
import { AppPage } from "../../../../../components/presentation/app-page";
import { TenantMessagesInbox } from "../../../../../components/messaging/tenant-messages-inbox";
import { createAuthServerComponentClient } from "../../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../../lib/organization/server";
import { getThreadsForOrganization } from "../../../../../lib/messaging/server";

export default async function TenantMessagesPage({
  searchParams
}: {
  searchParams: Promise<{ thread?: string }>;
}) {
  const { thread: threadParam } = await searchParams;
  const supabase = await createAuthServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const organizationId = await resolveActiveOrganizationIdForUser(user.id);
  if (!organizationId) redirect("/portal/tenant");

  const authorization = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authorization, "message:read")) redirect("/unauthorized");

  const items = await getThreadsForOrganization(organizationId, user.id, { limit: 50 }, supabase);
  const initialThreadId = threadParam?.trim() || null;

  return (
    <AppPage breadcrumbs={[{ href: "/portal/tenant", label: "Tenant home" }, { label: "Messages" }]}>
      <TenantMessagesInbox initialItems={items} initialThreadId={initialThreadId} />
    </AppPage>
  );
}
