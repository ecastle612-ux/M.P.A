import Link from "next/link";
import { Badge, Card } from "@mpa/ui";
import type { WorkOrderListItem } from "../../lib/maintenance/server";
import { toMaintenanceStatusLabel } from "../../lib/maintenance/contracts";
import { toMaintenanceWorkflowLabel } from "../../lib/maintenance/workflow";
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
        <p className="text-xs text-[var(--mpa-color-text-tertiary)]">
          {toMaintenanceWorkflowLabel(item.workflowStage)}
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
  canWriteInventory,
  userName
}: {
  buckets: TechnicianDashboardBuckets;
  canCreateWorkOrder: boolean;
  canWriteInventory: boolean;
  userName?: string | null;
}) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const next = buckets.nextRecommended;

  return (
    <div className="space-y-4" data-core004="technician-day-view">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
            {greeting}
            {userName ? `, ${userName.split(" ")[0]}` : ""}
          </h1>
          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
            M.P.A. Assistant · today&apos;s route · emergencies · parts · completion
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
          <Link href="/facility/calendar" className={secondaryLinkClass}>
            Calendar / route
          </Link>
          {canWriteInventory ? (
            <Link href="/facility/inventory/new" className={secondaryLinkClass}>
              Add inventory
            </Link>
          ) : null}
        </div>
      </div>

      {next ? (
        <Card className="space-y-3 p-4" data-core004="next-recommended-job">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">
              Next recommended job
            </h2>
            <Badge>{next.priority}</Badge>
          </div>
          <p className="text-sm text-[var(--mpa-color-text-primary)]">{next.title}</p>
          <p className="text-xs text-[var(--mpa-color-text-secondary)]">
            {next.workOrderNumber} · {toMaintenanceWorkflowLabel(next.workflowStage)}
            {next.propertyName ? ` · ${next.propertyName}` : ""}
          </p>
          <div className="flex flex-wrap gap-2">
            <Link href={`/maintenance/${next.id}`} className={primaryLinkClass}>
              Open job
            </Link>
            <Link href={`/maintenance/${next.id}#photos`} className={secondaryLinkClass}>
              Photos
            </Link>
            <Link href={`/properties/${next.propertyId}`} className={secondaryLinkClass}>
              Navigate / property
            </Link>
          </div>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        <Bucket title="Emergency work" empty="No emergency work assigned." items={buckets.emergency} />
        <Bucket
          title="Today's route"
          empty="Nothing due today. Check overdue or pick up an unassigned job."
          items={buckets.today}
        />
        <Bucket title="Overdue" empty="No overdue work assigned to you." items={buckets.overdue} />
        <Bucket
          title="Parts required"
          empty="No jobs flagged for parts."
          items={buckets.partsRequired}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Bucket
          title="Waiting"
          empty="Nothing waiting on parts, vendor, or approval."
          items={buckets.waiting}
        />
        {buckets.unassignedPool.length > 0 ? (
          <Bucket
            title="Unassigned pool"
            empty="No unassigned open work orders."
            items={buckets.unassignedPool}
          />
        ) : (
          <Card className="space-y-2 p-4">
            <h2 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">
              Completion checklist
            </h2>
            <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--mpa-color-text-secondary)]">
              <li>Arrive and update field execution</li>
              <li>Capture photos before / after</li>
              <li>Note parts used</li>
              <li>Advance to quality review</li>
            </ul>
          </Card>
        )}
      </div>
    </div>
  );
}
