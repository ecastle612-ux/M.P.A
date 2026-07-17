import Link from "next/link";
import { Button, Card } from "@mpa/ui";
import type { ConversationThreadRecord } from "../../lib/messaging/contracts";

export function ApplicantMessagingPanel({
  applicantName,
  thread
}: {
  applicantName: string;
  thread: ConversationThreadRecord | null;
}) {
  return (
    <Card className="space-y-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">Leasing messages</h3>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            Coordinate with {applicantName} about documents, screening, and move-in steps.
          </p>
        </div>
        {thread ? (
          <Link href={`/communications/threads/${thread.id}`}>
            <Button variant="secondary" size="sm">
              Open thread
            </Button>
          </Link>
        ) : (
          <Link href="/communications/inbox">
            <Button variant="secondary" size="sm">
              Go to inbox
            </Button>
          </Link>
        )}
      </div>
      {thread ? (
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">Active thread: {thread.subject}</p>
      ) : (
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          Start a leasing conversation from the inbox to keep applicant messaging tied to this application.
        </p>
      )}
    </Card>
  );
}
