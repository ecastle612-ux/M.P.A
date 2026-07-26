import Link from "next/link";
import { Badge, Card } from "@mpa/ui";
import type { WorkOrderListItem } from "../../lib/maintenance/server";
import { toMaintenanceStatusLabel } from "../../lib/maintenance/contracts";
import type { TechnicianDashboardBuckets } from "../../lib/facility/technician-dashboard";

const primaryLinkClass =
  "inline-flex h-9 items-center justify-center rounded-[var(--mpa-radius-md)] bg-[var(--mpa-color-brand-primary)] px-4 text-sm font-semibold text-[var(--mpa-color-text-inverse)] shadow-[var(--mpa-shadow-xs)] hover:bg-[var(--mpa-color-brand-primary-hover)]";
const secondaryLinkClass =
  "inline-flex h-9 items-center justify-center rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-4 text-sm font-medium text-[var(--mpa-color-text-primary)] shadow-[var(--mpa-shadow-xs)] hover:bg-[var(--mpa-color-interactive-row-hover)]";

function WorkOrderRow({ item }: { item: WorkOrderListItem }) {
  return (
    <Link
      href={`/maintenance/${item.id}`}
      className="flex items-start justify-between gap-3 rounded-lg border border-[var(--mpa-color-border-subtle)] px-3 py-3 transition hover:bg-[var(--mpa-color-bg-surface-muted)]"
    >
      <div className="min-w-0 space-y-1">
        <p className="truncate text-sm font-medium text-[var(--mpa-color-text-primary)]">{item.title}</p>
        <p className="truncate text-xs text-[var(--mpa-color-text-secondary)]">
          {item.workOrderNumber}
          {item.propertyName ? ` · ${item.propertyName}` : ""}
          {item.unitNumber ? ` · Unit ${item.unitNumber}` : ""}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <Badge>{item.priority}</Badge>
        <span className="text-xs text-[var(--mpa-color-text-secondary)]">
          {item.dueDate ? `Due ${item.dueDate.slice(0, 10)}` : toMaintenanceStatusLabel(item.status)}
        </span>
      </div>
    </Link>
  );
}

function Bucket({
  title,
  empty,
  items
}: {
  title: string;
  empty: string;
  items: WorkOrderListItem[];
}) {
  return (
    <Card className="space-y-3 p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">{title}</h2>
        <Badge>{items.length}</Badge>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">{empty}</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <WorkOrderRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </Card>
  );
}

export function TechnicianDashboard({
  buckets,
  canCreateWorkOrder,
  canWriteInventory
}: {
  buckets: TechnicianDashboardBuckets;
  canCreateWorkOrder: boolean;
  canWriteInventory: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--mpa-color-text-primary)]">Facility</h1>
          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
            What needs attention today — assigned to you first.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canCreateWorkOrder ? (
            <Link href="/maintenance/new" className={primaryLinkClass}>
              New work order
            </Link>
          ) : null}
          <Link href="/facility/inventory" className={secondaryLinkClass}>
            Inventory
          </Link>
          {canWriteInventory ? (
            <Link href="/facility/inventory/new" className={secondaryLinkClass}>
              Add inventory
            </Link>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Bucket
          title="Today"
          empty="Nothing due today. Check overdue or pick up an unassigned job."
          items={buckets.today}
        />
        <Bucket title="Overdue" empty="No overdue work assigned to you." items={buckets.overdue} />
        <Bucket
          title="Waiting"
          empty="Nothing waiting on parts, vendor, or approval."
          items={buckets.waiting}
        />
      </div>

      {buckets.unassignedPool.length > 0 ? (
        <Bucket
          title="Unassigned pool"
          empty="No unassigned open work orders."
          items={buckets.unassignedPool}
        />
      ) : null}
    </div>
  );
}
