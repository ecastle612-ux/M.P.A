import Link from "next/link";
import { ContextRail, ContextRailSection } from "../context-rail";
import { CONTEXT_RAIL_EMPTY } from "../../../lib/experience/context-rail-empty";
import { toVendorAssignmentStatusLabel } from "../../../lib/vendor/contracts";

type AssignmentEntry = {
  id: string;
  workOrderId: string;
  assignmentStatus: string;
  assignedAt: string;
  workOrderNumber?: string | undefined;
  workOrderTitle?: string | undefined;
};

type ActivityEntry = {
  id: string;
  label: string;
  detail: string;
  at: string;
};

export function VendorContextRail({
  rating,
  performance,
  openJobs,
  assignments,
  recentActivity
}: {
  rating: number | null;
  performance: {
    totalAssignments: number;
    completedAssignments: number;
    completionRate: number | null;
  };
  openJobs: number;
  assignments: AssignmentEntry[];
  recentActivity: ActivityEntry[];
}) {
  return (
    <ContextRail title="Vendor context">
      <ContextRailSection title="Rating">
        <p className="text-lg font-semibold text-[var(--mpa-color-text-primary)]">
          {rating !== null ? `${rating.toFixed(1)} / 5` : "Not rated"}
        </p>
      </ContextRailSection>

      <ContextRailSection title="Performance">
        <div className="space-y-1">
          <Metric label="Total assignments" value={performance.totalAssignments.toString()} />
          <Metric label="Completed" value={performance.completedAssignments.toString()} />
          <Metric
            label="Completion rate"
            value={performance.completionRate !== null ? `${performance.completionRate}%` : "—"}
          />
          <Metric label="Response time" value="Tracked via assignment timestamps" />
        </div>
      </ContextRailSection>

      <ContextRailSection title="Open jobs">
        <p className="text-lg font-semibold">{openJobs}</p>
        <p className="text-xs">Active work order assignments</p>
      </ContextRailSection>

      <ContextRailSection title="Assigned work orders" emptyMessage={CONTEXT_RAIL_EMPTY.vendor.workOrders}>
        {assignments.length > 0 ? (
          <ul className="space-y-2">
            {assignments.slice(0, 6).map((entry) => (
              <li key={entry.id}>
                <Link href={`/maintenance/${entry.workOrderId}`} className="font-medium text-[var(--mpa-color-brand-primary)] hover:underline">
                  {entry.workOrderNumber ?? "Work order"}
                </Link>
                <p className="text-xs">
                  {entry.workOrderTitle ?? toVendorAssignmentStatusLabel(entry.assignmentStatus as Parameters<typeof toVendorAssignmentStatusLabel>[0])}
                </p>
                <p className="text-xs text-[var(--mpa-color-text-muted)]">
                  {toVendorAssignmentStatusLabel(entry.assignmentStatus as Parameters<typeof toVendorAssignmentStatusLabel>[0])} ·{" "}
                  {new Date(entry.assignedAt).toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        ) : null}
      </ContextRailSection>

      <ContextRailSection title="Recent activity" emptyMessage={CONTEXT_RAIL_EMPTY.vendor.recentActivity}>
        {recentActivity.length > 0 ? (
          <ul className="space-y-2">
            {recentActivity.map((entry) => (
              <li key={entry.id} className="text-xs">
                <p className="font-medium">{entry.label}</p>
                <p>{entry.detail}</p>
                <p className="text-[var(--mpa-color-text-muted)]">{entry.at}</p>
              </li>
            ))}
          </ul>
        ) : null}
      </ContextRailSection>
    </ContextRail>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <span>{label}</span>
      <span className="font-medium text-[var(--mpa-color-text-primary)]">{value}</span>
    </div>
  );
}
