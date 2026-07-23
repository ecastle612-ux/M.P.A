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
            className="absolute -left-[1.35rem] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-[var(--mpa-color-bg-surface)] bg-[var(--mpa-color-brand-primary)]"
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
  const labels: Record<string, string> = {
    created: "Created",
    assigned: "Assigned",
    vendor_assigned: "Assigned",
    vendor_reassigned: "Vendor reassigned",
    vendor_accepted: "Vendor Accepted",
    vendor_status_accepted: "Vendor Accepted",
    status_changed: "Status updated",
    completed: "Completed",
    note_added: "Notes added",
    updated: "Updated",
    archived: "Closed",
    restored: "Restored",
    photo_added: "Photos Added",
    resident_confirmed: "Resident Confirmed"
  };
  if (labels[value]) return labels[value];
  if (value.includes("accept")) return "Vendor Accepted";
  if (value.includes("progress") || value.includes("en_route") || value.includes("arrived")) return "Work Started";
  if (value.includes("confirm")) return "Resident Confirmed";
  if (value.includes("complete")) return "Completed";
  if (value.includes("archiv") || value.includes("closed")) return "Closed";
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
