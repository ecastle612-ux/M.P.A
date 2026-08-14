import { StaffConversationPage } from "../../../../../../components/communications/staff-conversation-page";

export default async function Page({ params }: { params: Promise<{ conversationId: string }> }) {
  const { conversationId } = await params;
  return (
    <main className="p-4 md:p-6">
      <StaffConversationPage conversationId={conversationId} />
    </main>
  );
}
