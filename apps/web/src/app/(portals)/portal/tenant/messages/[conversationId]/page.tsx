import Link from "next/link";
import { ConversationThread } from "../../../../../../components/communications/conversation-thread";
import { ResidentPageIntro } from "../../../../../../components/shell/resident-workspace";

export default async function TenantConversationPage({
  params
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <ResidentPageIntro
        eyebrow="Messages"
        title="Conversation"
        description="History stays with this thread. Attachments use the same secure media path as the rest of M.P.A."
      />
      <Link
        href="/portal/tenant/messages"
        className="inline-flex min-h-11 items-center text-sm font-medium text-[var(--mpa-color-brand-primary)] underline"
      >
        Back to inbox
      </Link>
      <ConversationThread
        plane="tenant"
        conversationId={conversationId}
        apiBase="/api/portal/tenant/conversations"
      />
    </div>
  );
}
