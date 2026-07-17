import { Card } from "@mpa/ui";
import type { ApplicantEventRecord } from "../../lib/applicant/contracts";

export function ApplicantTimelinePanel({ events }: { events: ApplicantEventRecord[] }) {
  return (
    <Card className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">Timeline</h3>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">Permanent history of application lifecycle events.</p>
      </div>
      {events.length === 0 ? (
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">No events recorded yet.</p>
      ) : (
        <ol className="space-y-3">
          {events.map((event) => (
            <li key={event.id} className="rounded-lg border border-[var(--mpa-color-border-default)] px-3 py-2.5">
              <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">{event.summary}</p>
              <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                {event.eventType.replaceAll("_", " ")} · {formatTimestamp(event.createdAt)}
              </p>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}

function formatTimestamp(value: string): string {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
