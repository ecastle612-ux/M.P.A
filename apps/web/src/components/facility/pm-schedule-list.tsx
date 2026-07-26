import Link from "next/link";
import { Badge, Card } from "@mpa/ui";
import {
  formatPmCadenceLabel,
  type FacilityPmScheduleListItem
} from "../../lib/facility/pm-contracts";
import { PmRunDueButton } from "./pm-run-due-button";

const primaryLinkClass =
  "inline-flex h-9 items-center justify-center rounded-[var(--mpa-radius-md)] bg-[var(--mpa-color-brand-primary)] px-4 text-sm font-semibold text-[var(--mpa-color-text-inverse)] shadow-[var(--mpa-shadow-xs)] hover:bg-[var(--mpa-color-brand-primary-hover)]";
const secondaryLinkClass =
  "inline-flex h-9 items-center justify-center rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-4 text-sm font-medium text-[var(--mpa-color-text-primary)] shadow-[var(--mpa-shadow-xs)] hover:bg-[var(--mpa-color-interactive-row-hover)]";

export function PmScheduleList({
  items,
  canWrite
}: {
  items: FacilityPmScheduleListItem[];
  canWrite: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
            Preventive maintenance
          </h1>
          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
            Define the cadence once — M.P.A. drafts the work order when due.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/facility/calendar" className={secondaryLinkClass}>
            Calendar
          </Link>
          {canWrite ? (
            <Link href="/facility/pm/new" className={primaryLinkClass}>
              New schedule
            </Link>
          ) : null}
        </div>
      </div>

      {items.length === 0 ? (
        <Card className="space-y-3" padding="lg">
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            No preventive schedules yet.
          </p>
          {canWrite ? (
            <Link href="/facility/pm/new" className={primaryLinkClass}>
              Create the first schedule
            </Link>
          ) : null}
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/facility/pm/${item.id}`}
              className="flex items-center justify-between gap-3 rounded-lg border border-[var(--mpa-color-border-subtle)] px-3 py-3 transition hover:bg-[var(--mpa-color-bg-surface-muted)]"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[var(--mpa-color-text-primary)]">
                  {item.title}
                </p>
                <p className="truncate text-xs text-[var(--mpa-color-text-secondary)]">
                  {item.propertyName ?? "Building/site"}
                  {" · "}
                  {formatPmCadenceLabel(item.cadence)}
                  {" · Next "}
                  {item.nextDue}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {!item.active ? <Badge>Paused</Badge> : null}
                {item.overdue ? <Badge>Overdue</Badge> : <Badge>On track</Badge>}
              </div>
            </Link>
          ))}
        </div>
      )}

      {canWrite ? <PmRunDueButton /> : null}
    </div>
  );
}
