import Link from "next/link";
import { Badge, Card } from "@mpa/ui";
import type { FacilityCalendarItem } from "../../lib/facility/calendar";

const secondaryLinkClass =
  "inline-flex h-9 items-center justify-center rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-4 text-sm font-medium text-[var(--mpa-color-text-primary)] shadow-[var(--mpa-shadow-xs)] hover:bg-[var(--mpa-color-interactive-row-hover)]";

function typeLabel(type: FacilityCalendarItem["type"]): string {
  switch (type) {
    case "work_order":
      return "Work order";
    case "pm_occurrence":
      return "PM occurrence";
    case "pm_schedule":
      return "PM due";
    default:
      return type;
  }
}

export function FacilityCalendar({
  items,
  year,
  month
}: {
  items: FacilityCalendarItem[];
  year: number;
  month: number;
}) {
  const prev = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
  const next = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
  const label = new Date(Date.UTC(year, month - 1, 1)).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  });

  const byDate = new Map<string, FacilityCalendarItem[]>();
  for (const item of items) {
    const list = byDate.get(item.date) ?? [];
    list.push(item);
    byDate.set(item.date, list);
  }
  const dates = [...byDate.keys()].sort();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--mpa-color-text-primary)]">Calendar</h1>
          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
            Work orders and preventive maintenance due this month.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/facility/calendar?year=${prev.year}&month=${prev.month}`}
            className={secondaryLinkClass}
          >
            Previous
          </Link>
          <Link
            href={`/facility/calendar?year=${next.year}&month=${next.month}`}
            className={secondaryLinkClass}
          >
            Next
          </Link>
          <Link href="/facility/pm" className={secondaryLinkClass}>
            Preventive
          </Link>
        </div>
      </div>

      <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">{label}</p>

      {dates.length === 0 ? (
        <Card padding="lg">
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            Nothing due in this month yet.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {dates.map((date) => (
            <Card key={date} className="space-y-2" padding="md">
              <h2 className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">{date}</h2>
              <div className="space-y-2">
                {(byDate.get(date) ?? []).map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="flex items-center justify-between gap-3 rounded-md border border-[var(--mpa-color-border-subtle)] px-3 py-2 hover:bg-[var(--mpa-color-bg-surface-muted)]"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[var(--mpa-color-text-primary)]">
                        {item.title}
                      </p>
                      <p className="truncate text-xs text-[var(--mpa-color-text-secondary)]">
                        {typeLabel(item.type)}
                        {item.subtitle ? ` · ${item.subtitle}` : ""}
                      </p>
                    </div>
                    {item.status ? <Badge>{item.status}</Badge> : null}
                  </Link>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
