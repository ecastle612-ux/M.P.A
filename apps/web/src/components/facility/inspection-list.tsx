import Link from "next/link";
import { Badge, Button, Card } from "@mpa/ui";
import type { FacilityInspectionRunListItem } from "../../lib/facility/inspection-contracts";
import { formatInspectionStatusLabel } from "../../lib/facility/inspection-contracts";

const primaryLinkClass =
  "inline-flex h-9 items-center justify-center rounded-[var(--mpa-radius-md)] bg-[var(--mpa-color-brand-primary)] px-4 text-sm font-semibold text-[var(--mpa-color-text-inverse)] shadow-[var(--mpa-shadow-xs)] hover:bg-[var(--mpa-color-brand-primary-hover)]";

export function InspectionList({
  items,
  canWrite,
  statusFilter
}: {
  items: FacilityInspectionRunListItem[];
  canWrite: boolean;
  statusFilter?: string;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--mpa-color-text-primary)]">Inspections</h1>
          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
            Walkthroughs with permanent Facility Record memory on complete.
          </p>
        </div>
        {canWrite ? (
          <Link href="/facility/inspections/new" className={primaryLinkClass}>
            Start inspection
          </Link>
        ) : null}
      </div>

      <form className="flex flex-wrap gap-2" method="get">
        <select
          name="status"
          defaultValue={statusFilter ?? ""}
          className="rounded-md border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] px-3 py-2 text-sm text-[var(--mpa-color-text-primary)]"
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="in_progress">In progress</option>
          <option value="completed">Completed</option>
          <option value="canceled">Canceled</option>
        </select>
        <Button type="submit" variant="secondary">
          Filter
        </Button>
      </form>

      {items.length === 0 ? (
        <Card className="space-y-3" padding="lg">
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            No inspections yet{statusFilter ? " match this filter" : ""}.
          </p>
          {canWrite ? (
            <Link href="/facility/inspections/new" className={primaryLinkClass}>
              Start the first inspection
            </Link>
          ) : null}
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/facility/inspections/${item.id}`}
              className="block rounded-lg border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-4 py-3 transition hover:border-[var(--mpa-color-brand-primary)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-[var(--mpa-color-text-primary)]">{item.title}</p>
                  <p className="mt-0.5 text-sm text-[var(--mpa-color-text-secondary)]">
                    {item.propertyName ?? "Property"}
                    {item.unitNumber ? ` · Unit ${item.unitNumber}` : ""}
                    {" · "}
                    {item.itemCount} item{item.itemCount === 1 ? "" : "s"}
                    {item.failCount > 0 ? ` · ${item.failCount} fail` : ""}
                  </p>
                </div>
                <Badge>{formatInspectionStatusLabel(item.status)}</Badge>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
