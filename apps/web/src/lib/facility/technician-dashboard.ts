import { createAuthServerComponentClient } from "../auth/server";
import {
  getWorkOrdersForOrganization,
  type WorkOrderListItem
} from "../maintenance/server";
import type { MaintenanceStatus } from "../maintenance/contracts";

type SupabaseClientType = Awaited<ReturnType<typeof createAuthServerComponentClient>>;

const WAITING_STATUSES: MaintenanceStatus[] = ["awaiting_approval", "on_hold"];

export type TechnicianDashboardBuckets = {
  today: WorkOrderListItem[];
  overdue: WorkOrderListItem[];
  waiting: WorkOrderListItem[];
  unassignedPool: WorkOrderListItem[];
};

function localDateKey(value: Date = new Date()): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dueDateKey(dueDate: string | null): string | null {
  if (!dueDate) return null;
  return dueDate.slice(0, 10);
}

function priorityRank(priority: WorkOrderListItem["priority"]): number {
  switch (priority) {
    case "emergency":
      return 0;
    case "high":
      return 1;
    case "medium":
      return 2;
    case "low":
      return 3;
    default:
      return 4;
  }
}

function sortForDashboard(items: WorkOrderListItem[]): WorkOrderListItem[] {
  return [...items].sort((a, b) => {
    const priorityDiff = priorityRank(a.priority) - priorityRank(b.priority);
    if (priorityDiff !== 0) return priorityDiff;
    const aDue = dueDateKey(a.dueDate) ?? "9999-12-31";
    const bDue = dueDateKey(b.dueDate) ?? "9999-12-31";
    if (aDue !== bDue) return aDue.localeCompare(bDue);
    return a.updatedAt < b.updatedAt ? 1 : -1;
  });
}

/**
 * FAC-002 Slice A — compose technician hub buckets from existing work orders.
 * Prefer assigned-to-me; optionally surface unassigned open pool for managers.
 */
export async function getTechnicianDashboardBuckets(
  organizationId: string,
  userId: string,
  options: { includeUnassignedPool?: boolean } = {},
  client?: SupabaseClientType
): Promise<TechnicianDashboardBuckets> {
  const supabase = client ?? (await createAuthServerComponentClient());
  const todayKey = localDateKey();

  const [assigned, unassigned] = await Promise.all([
    getWorkOrdersForOrganization(
      organizationId,
      { status: "open", assignedToUserId: userId, limit: 100, sortBy: "due_date", sortOrder: "asc" },
      supabase
    ),
    options.includeUnassignedPool
      ? getWorkOrdersForOrganization(
          organizationId,
          { status: "open", limit: 100, sortBy: "due_date", sortOrder: "asc" },
          supabase
        ).then((items) => items.filter((item) => !item.assignedToUserId))
      : Promise.resolve([] as WorkOrderListItem[])
  ]);

  const today: WorkOrderListItem[] = [];
  const overdue: WorkOrderListItem[] = [];
  const waiting: WorkOrderListItem[] = [];

  for (const item of assigned) {
    if (WAITING_STATUSES.includes(item.status)) {
      waiting.push(item);
      continue;
    }
    const due = dueDateKey(item.dueDate);
    if (due && due < todayKey) {
      overdue.push(item);
      continue;
    }
    if (due === todayKey || !due) {
      today.push(item);
    }
  }

  return {
    today: sortForDashboard(today),
    overdue: sortForDashboard(overdue),
    waiting: sortForDashboard(waiting),
    unassignedPool: sortForDashboard(unassigned).slice(0, 12)
  };
}
