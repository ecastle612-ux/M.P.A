import Link from "next/link";
import { Button, Card } from "@mpa/ui";
import type { ConversationThreadRecord } from "../../lib/messaging/contracts";

export function MaintenanceConversationPanel({
  thread
}: {
  thread: ConversationThreadRecord | null;
}) {
  if (!thread) {
    return (
      <Card className="space-y-2 p-4">
        <h3 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">Resident conversation</h3>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          A conversation thread will appear here once the work order is synced. If this is a new work order, refresh in a moment.
        </p>
      </Card>
    );
  }

  return (
    <Card className="space-y-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">Resident conversation</h3>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">{thread.subject}</p>
        </div>
        <Link href={`/communications/threads/${thread.id}`}>
          <Button variant="secondary" size="sm">
            Open thread
          </Button>
        </Link>
      </div>
      <p className="text-sm text-[var(--mpa-color-text-secondary)]">
        Keep residents updated on progress without leaving the work order. Internal notes stay in the activity log.
      </p>
    </Card>
  );
}
