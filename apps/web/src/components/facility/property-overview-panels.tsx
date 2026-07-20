import Link from "next/link";
import { Button, Card } from "@mpa/ui";
import type { FacilityRecordListItem, FacilityTimelineEvent } from "../../lib/facility/contracts";
import { hrefForTimelineEvent, timelineIconForEventType } from "../../lib/facility/contracts";

type VaultDoc = {
  id: string;
  title: string;
  documentType: string;
  fileUrl: string | null;
};

export function PropertyOverviewPanels({
  recentRepairs,
  recentTimeline,
  recentDocuments,
  propertyId
}: {
  recentRepairs: FacilityRecordListItem[];
  recentTimeline: FacilityTimelineEvent[];
  recentDocuments: VaultDoc[];
  propertyId: string;
}) {
  return (
    <div className="grid gap-3 lg:grid-cols-2" id="recent-activity">
      <Card variant="elevated" className="space-y-3">
        <Header title="Recent activity" description="Latest operational signals across this property." href="#property-timeline" label="Open timeline" />
        {recentTimeline.length === 0 ? (
          <p className="text-sm text-[var(--mpa-color-text-muted)]">No recent activity yet.</p>
        ) : (
          <ul className="divide-y divide-[var(--mpa-color-border-default)]">
            {recentTimeline.slice(0, 5).map((event) => {
              const href = hrefForTimelineEvent(event);
              return (
                <li key={event.id} className="flex items-start gap-2 py-1.5">
                  <span aria-hidden>{timelineIconForEventType(event.eventType)}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">{event.title}</p>
                    <p className="text-xs text-[var(--mpa-color-text-muted)]">
                      {new Date(event.occurredAt).toLocaleString()}
                    </p>
                    {href ? (
                      <Link href={href} className="text-xs font-medium text-[var(--mpa-color-brand-primary)]">
                        View
                      </Link>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card variant="elevated" className="space-y-3">
        <Header title="Recent repairs" description="Permanent facility records, newest first." href="#repair-history" label="All repairs" />
        {recentRepairs.length === 0 ? (
          <p className="text-sm text-[var(--mpa-color-text-muted)]">No completed repairs yet.</p>
        ) : (
          <ul className="divide-y divide-[var(--mpa-color-border-default)]">
            {recentRepairs.slice(0, 5).map((repair) => (
              <li key={repair.id} className="py-2">
                <Link
                  href={`/facility/records/${repair.id}`}
                  className="text-sm font-medium text-[var(--mpa-color-brand-primary)]"
                >
                  {repair.issue}
                </Link>
                <p className="text-xs text-[var(--mpa-color-text-muted)]">
                  {new Date(repair.completedAt).toLocaleDateString()}
                  {repair.unitNumber ? ` · Unit ${repair.unitNumber}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card variant="elevated" className="space-y-3">
        <Header title="Recent timeline" description="Cross-pillar history for this building." href="#property-timeline" label="Full timeline" />
        {recentTimeline.length === 0 ? (
          <p className="text-sm text-[var(--mpa-color-text-muted)]">Timeline is empty.</p>
        ) : (
          <ul className="divide-y divide-[var(--mpa-color-border-default)]">
            {recentTimeline.slice(0, 4).map((event) => (
              <li key={`tl-${event.id}`} className="py-2 text-sm text-[var(--mpa-color-text-secondary)]">
                <span className="font-medium text-[var(--mpa-color-text-primary)]">{event.title}</span>
                {" · "}
                {event.summary}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card variant="elevated" className="space-y-3">
        <Header
          title="Recent documents"
          description="Vault references for this property — storage is not duplicated."
          href={`/properties/${propertyId}`}
          label="Property"
        />
        {recentDocuments.length === 0 ? (
          <p className="text-sm text-[var(--mpa-color-text-muted)]">No property documents linked yet.</p>
        ) : (
          <ul className="divide-y divide-[var(--mpa-color-border-default)]">
            {recentDocuments.slice(0, 5).map((doc) => (
              <li key={doc.id} className="py-2 text-sm text-[var(--mpa-color-text-secondary)]">
                {doc.fileUrl ? (
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-[var(--mpa-color-brand-primary)]"
                  >
                    {doc.title}
                  </a>
                ) : (
                  <span className="font-medium text-[var(--mpa-color-text-primary)]">{doc.title}</span>
                )}
                <p className="text-xs text-[var(--mpa-color-text-muted)]">{doc.documentType}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card variant="elevated" className="space-y-2 lg:col-span-2">
        <h2 className="mpa-section-title">Open maintenance</h2>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          Track active work orders from Maintenance. Preventive schedules and capital planning stay on the
          property timeline as records are completed.
        </p>
        <Link
          href="/maintenance"
          className="inline-flex text-sm font-medium text-[var(--mpa-color-brand-primary)] hover:underline"
        >
          Open Maintenance
        </Link>
      </Card>
    </div>
  );
}

function Header({
  title,
  description,
  href,
  label
}: {
  title: string;
  description: string;
  href: string;
  label: string;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div>
        <h2 className="mpa-section-title">{title}</h2>
        <p className="mt-0.5 text-sm leading-snug text-[var(--mpa-color-text-secondary)]">{description}</p>
      </div>
      <Link href={href}>
        <Button variant="ghost" size="sm">
          {label}
        </Button>
      </Link>
    </div>
  );
}
