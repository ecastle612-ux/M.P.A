import type { ActivityTimelineEntry } from "../../lib/ops/timeline-query";

/**
 * OPS-001 Slice A — org Activity Timeline.
 * Styling uses UX-012 Slice A semantic tokens only.
 */
export function ActivityTimeline({
  items,
  emptyLabel = "No activity yet."
}: {
  items: ActivityTimelineEntry[];
  emptyLabel?: string;
}) {
  if (items.length === 0) {
    return (
      <p className="mpa-text-body text-[var(--mpa-color-text-secondary)]">{emptyLabel}</p>
    );
  }

  return (
    <ol className="flex flex-col gap-[var(--mpa-space-3)]">
      {items.map((item) => (
        <li
          key={item.entryId}
          className="rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] px-[var(--mpa-space-4)] py-[var(--mpa-space-3)]"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-[var(--mpa-space-2)]">
            <p className="mpa-text-body font-[var(--mpa-font-weight-medium)] text-[var(--mpa-color-text-primary)]">
              {item.summary}
            </p>
            <time
              className="mpa-text-caption text-[var(--mpa-color-text-muted)]"
              dateTime={item.occurredAt}
            >
              {new Date(item.occurredAt).toLocaleString()}
            </time>
          </div>
          <p className="mpa-text-caption mt-[var(--mpa-space-1)] text-[var(--mpa-color-text-secondary)]">
            {item.actorLabel}
            <span className="text-[var(--mpa-color-text-muted)]"> · {item.eventType}</span>
            {item.category ? (
              <span className="text-[var(--mpa-color-text-muted)]"> · {item.category}</span>
            ) : null}
          </p>
          {item.href ? (
            <a
              href={item.href}
              className="mpa-text-caption mt-[var(--mpa-space-2)] inline-block text-[var(--mpa-color-text-link)]"
            >
              View
            </a>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
