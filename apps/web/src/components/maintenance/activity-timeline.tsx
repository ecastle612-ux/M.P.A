import type { MaintenanceActivityEvent } from "../../lib/maintenance/contracts";

export function MaintenanceActivityTimeline({ events }: { events: MaintenanceActivityEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--mpa-color-border-default)] p-4 text-center">
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">No activity recorded yet.</p>
      </div>
    );
  }

  return (
    <ol className="relative space-y-0 border-l border-[var(--mpa-color-border-default)] pl-4">
      {events.map((event, index) => (
        <li key={event.id} className={`relative pb-4 ${index === events.length - 1 ? "pb-0" : ""}`}>
          <span
            className="absolute -left-[1.35rem] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-[var(--mpa-color-brand-primary)]"
            aria-hidden="true"
          />
          <div className="rounded-lg px-2 py-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[var(--mpa-color-bg-app)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
                {formatEventType(event.eventType)}
              </span>
              <span className="text-xs text-[var(--mpa-color-text-secondary)]">
                {formatRelativeTime(event.createdAt)}
              </span>
            </div>
            <p className="mt-1 text-sm font-medium text-[var(--mpa-color-text-primary)]">{event.summary}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function formatEventType(value: string): string {
  return value
    .split("_")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function formatRelativeTime(value: string): string {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return "recently";
  const diffMs = Date.now() - timestamp;
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(
    timestamp
  );
}
