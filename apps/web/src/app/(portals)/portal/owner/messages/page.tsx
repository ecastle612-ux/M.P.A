import { redirect } from "next/navigation";
import { Card } from "@mpa/ui";
import { AppPage } from "../../../../../components/presentation/app-page";
import { OwnerMessagesInbox } from "../../../../../components/portal/owner-messages-inbox";
import {
  OwnerFoundationNote,
  OwnerSectionHeader
} from "../../../../../components/portal/owner-section-placeholder";
import { createAuthServerComponentClient } from "../../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../../lib/organization/server";
import { loadOwnerMessagingExperience } from "../../../../../lib/owner-portal/messaging-experience";

export default async function OwnerMessagesPage({
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
  if (!organizationId) redirect("/portal/owner");

  const authorization = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authorization, "message:read")) redirect("/unauthorized");

  let model = null;
  let loadError: string | null = null;
  try {
    model = await loadOwnerMessagingExperience({ organizationId, user, supabase });
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Messages could not be loaded.";
  }

  if (!model) {
    return (
      <AppPage
        breadcrumbs={[
          { href: "/portal/owner", label: "Owner" },
          { label: "Messages" }
        ]}
      >
        <Card variant="elevated" className="space-y-2 p-5">
          <h1 className="font-display text-xl font-semibold text-[var(--mpa-color-text-primary)]">
            Messages unavailable
          </h1>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            We couldn’t load your conversations right now. Retry in a moment, or contact your property manager
            if this continues.
          </p>
          {loadError ? (
            <p className="text-xs text-[var(--mpa-color-text-secondary)]">{loadError}</p>
          ) : null}
        </Card>
      </AppPage>
    );
  }

  const initialThreadId = threadParam?.trim() || null;

  return (
    <AppPage
      breadcrumbs={[
        { href: "/portal/owner", label: "Owner" },
        { label: "Messages" }
      ]}
    >
      <div className="space-y-5">
        <OwnerSectionHeader
          title="Messages"
          description="Secure conversations with your property management team about your authorized properties."
        />
        <OwnerFoundationNote>
          Uses the existing messaging system. Only owner–PM conversations for your properties are shown.
          Replies require the existing `message:create` permission — no temporary grants.
        </OwnerFoundationNote>
        <OwnerMessagesInbox
          initialConversations={model.conversations}
          initialThreadId={initialThreadId}
          canReply={model.canReply}
          canMarkRead={model.canMarkRead}
          currentUserId={model.currentUserId}
          loadNotes={model.loadNotes}
        />
      </div>
    </AppPage>
  );
}
