import { ResidentPageIntro, ResidentSection } from "../../../../../components/shell/resident-workspace";
import { TenantMessagesInbox } from "../../../../../components/communications/tenant-messages-inbox";

export default function TenantMessagesPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <ResidentPageIntro
        eyebrow="Messages"
        title="Your inbox"
        description="Messages from your property team, with history attached to your home."
      />
      <ResidentSection title="Conversations" description="Unread first. Open a thread to reply or add a photo.">
        <TenantMessagesInbox />
      </ResidentSection>
    </div>
  );
}
