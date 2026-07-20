import Link from "next/link";
import { Card } from "@mpa/ui";
import type { FacilityTimelineEvent } from "../../lib/facility/contracts";

export function FacilityTimelinePanel({
  events,
  emptyLabel = "No repair timeline events yet — completed repairs will appear here."
}: {
  events: FacilityTimelineEvent[];
  emptyLabel?: string;
}) {
  return (
    <Card variant="elevated" className="space-y-3">
      <div>
        <h2 className="mpa-section-title">Repair timeline</h2>
        <p className="mt-0.5 text-sm leading-snug text-[var(--mpa-color-text-secondary)]">
          Permanent facility events for this property, newest first.
        </p>
      </div>

      {events.length === 0 ? (
        <p className="text-sm text-[var(--mpa-color-text-muted)]">{emptyLabel}</p>
      ) : (
        <ol className="space-y-2.5 border-l border-[var(--mpa-color-border-default)] pl-3.5">
          {events.map((event) => (
            <li key={event.id} className="relative">
              <span className="absolute -left-[1.15rem] top-1.5 h-2 w-2 rounded-full bg-[var(--mpa-color-brand-primary)]" />
              <p className="text-xs uppercase tracking-wide text-[var(--mpa-color-text-muted)]">
                {new Date(event.occurredAt).toLocaleString()}
              </p>
              <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">{event.title}</p>
              <p className="text-sm leading-snug text-[var(--mpa-color-text-secondary)]">{event.summary}</p>
              {event.facilityRecordId ? (
                <Link
                  href={`/facility/records/${event.facilityRecordId}`}
                  className="mt-0.5 inline-block text-xs font-medium text-[var(--mpa-color-brand-primary)]"
                >
                  Open facility record
                </Link>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
