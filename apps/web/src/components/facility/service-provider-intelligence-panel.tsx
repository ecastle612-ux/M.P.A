import Link from "next/link";
import { Badge, Card } from "@mpa/ui";
import type { ServiceProviderIntelligence } from "../../lib/facility/contracts";
import { hrefForTimelineEvent, timelineIconForEventType } from "../../lib/facility/contracts";

export function ServiceProviderIntelligencePanel({
  intelligence
}: {
  intelligence: ServiceProviderIntelligence;
}) {
  return (
    <div className="space-y-3">
      <Card variant="elevated" className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="mpa-section-title">Service provider intelligence</h2>
            <p className="mt-0.5 text-sm leading-snug text-[var(--mpa-color-text-secondary)]">
              Historical performance over the Vendor bridge. Read-only — assignment workflows unchanged.
            </p>
          </div>
          <Badge variant="neutral">Provider type · {intelligence.providerType}</Badge>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Jobs completed" value={String(intelligence.jobsCompleted)} />
          <Metric label="Jobs open" value={String(intelligence.jobsOpen)} />
          <Metric
            label="Avg completion"
            value={
              intelligence.averageCompletionHours !== null
                ? `${intelligence.averageCompletionHours}h`
                : "—"
            }
          />
          <Metric
            label="Last assignment"
            value={
              intelligence.lastAssignmentAt
                ? new Date(intelligence.lastAssignmentAt).toLocaleDateString()
                : "—"
            }
          />
          <Metric label="Properties served" value={String(intelligence.propertiesServed.length)} />
          <Metric label="Units served" value={String(intelligence.unitsServed.length)} />
          <Metric label="Repeat repairs" value={String(intelligence.repeatRepairCount)} />
          <Metric label="Documents" value={String(intelligence.documentCount)} />
        </div>

        <div className="grid gap-2 text-sm text-[var(--mpa-color-text-secondary)] md:grid-cols-2">
          <p>Company: {intelligence.displayName}</p>
          <p>Contact: {intelligence.contactEmail ?? intelligence.contactPhone ?? "—"}</p>
          <p>Warranty references on file: {intelligence.warrantyPlaceholderCount}</p>
        </div>
      </Card>

      <Card variant="elevated" className="space-y-3">
        <h3 className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">Properties served</h3>
        {intelligence.propertiesServed.length === 0 ? (
          <p className="text-sm text-[var(--mpa-color-text-muted)]">No facility history linked yet.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {intelligence.propertiesServed.map((property) => (
              <li key={property.id}>
                <Link
                  href={`/properties/${property.id}`}
                  className="text-sm font-medium text-[var(--mpa-color-brand-primary)]"
                >
                  {property.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card variant="elevated" className="space-y-3">
        <h3 className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">Recent repairs</h3>
        {intelligence.recentRepairs.length === 0 ? (
          <p className="text-sm text-[var(--mpa-color-text-muted)]">No permanent facility records yet.</p>
        ) : (
          <ul className="divide-y divide-[var(--mpa-color-border-default)]">
            {intelligence.recentRepairs.map((repair) => (
              <li key={repair.id} className="flex flex-wrap justify-between gap-2 py-2">
                <div>
                  <Link
                    href={`/facility/records/${repair.id}`}
                    className="text-sm font-medium text-[var(--mpa-color-brand-primary)]"
                  >
                    {repair.issue}
                  </Link>
                  <p className="text-xs text-[var(--mpa-color-text-muted)]">
                    {repair.propertyName}
                    {repair.unitNumber ? ` · Unit ${repair.unitNumber}` : ""}
                  </p>
                </div>
                <p className="text-xs text-[var(--mpa-color-text-muted)]">
                  {new Date(repair.completedAt).toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card variant="elevated" className="space-y-3">
        <h3 className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">Provider timeline</h3>
        {intelligence.timeline.length === 0 ? (
          <p className="text-sm text-[var(--mpa-color-text-muted)]">No timeline events for this provider.</p>
        ) : (
          <ul className="space-y-2">
            {intelligence.timeline.slice(0, 8).map((event) => {
              const href = hrefForTimelineEvent(event);
              return (
                <li key={event.id} className="flex gap-2 text-sm">
                  <span aria-hidden>{timelineIconForEventType(event.eventType)}</span>
                  <div>
                    {href ? (
                      <Link href={href} className="font-medium text-[var(--mpa-color-brand-primary)]">
                        {event.title}
                      </Link>
                    ) : (
                      <span className="font-medium">{event.title}</span>
                    )}
                    <p className="text-xs text-[var(--mpa-color-text-muted)]">
                      {new Date(event.occurredAt).toLocaleString()}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface-muted)] p-3">
      <p className="text-xs uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">{label}</p>
      <p className="mt-1 text-lg font-semibold text-[var(--mpa-color-text-primary)]">{value}</p>
    </div>
  );
}
