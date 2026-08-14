import {
  WORK_ORDER_CATEGORY_LABELS,
  WORK_ORDER_PRIORITY_LABELS,
  WORK_ORDER_STATUS_LABELS,
  type WorkOrderCategory,
  type WorkOrderPriority,
  type WorkOrderStatus
} from "../maintenance/schemas";
import {
  COMPLETED_WORK_ORDER_STATUSES,
  OPEN_WORK_ORDER_STATUSES,
  type WorkOrderReportBreakdownItem,
  type WorkOrderReportMetrics
} from "./schemas";

export type WorkOrderReportFact = {
  id: string;
  status: WorkOrderStatus;
  category: string;
  priority: WorkOrderPriority;
  createdAt: string;
  completedAt: string | null;
  vendorName: string | null;
  assigneeType: "unassigned" | "technician" | "vendor";
};

function labelForCategory(category: string): string {
  return WORK_ORDER_CATEGORY_LABELS[category as WorkOrderCategory] ?? category;
}

function labelForPriority(priority: WorkOrderPriority): string {
  return WORK_ORDER_PRIORITY_LABELS[priority] ?? priority;
}

function breakdown(
  counts: Map<string, { label: string; count: number }>
): WorkOrderReportBreakdownItem[] {
  return [...counts.entries()]
    .map(([key, value]) => ({ key, label: value.label, count: value.count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export function isOpenWorkOrderStatus(status: WorkOrderStatus): boolean {
  return (OPEN_WORK_ORDER_STATUSES as readonly string[]).includes(status);
}

export function isCompletedWorkOrderStatus(status: WorkOrderStatus): boolean {
  return (COMPLETED_WORK_ORDER_STATUSES as readonly string[]).includes(status);
}

export function computeAverageCompletionHours(facts: WorkOrderReportFact[]): number | null {
  const durations: number[] = [];
  for (const fact of facts) {
    if (!isCompletedWorkOrderStatus(fact.status) || !fact.completedAt) {
      continue;
    }
    const start = Date.parse(fact.createdAt);
    const end = Date.parse(fact.completedAt);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
      continue;
    }
    durations.push((end - start) / (1000 * 60 * 60));
  }
  if (durations.length === 0) {
    return null;
  }
  const mean = durations.reduce((sum, value) => sum + value, 0) / durations.length;
  return Math.round(mean * 10) / 10;
}

export function aggregateWorkOrderReportMetrics(facts: WorkOrderReportFact[]): WorkOrderReportMetrics {
  let open = 0;
  let inProgress = 0;
  let completed = 0;
  const byCategory = new Map<string, { label: string; count: number }>();
  const byPriority = new Map<string, { label: string; count: number }>();
  const byVendor = new Map<string, { label: string; count: number }>();

  for (const fact of facts) {
    if (isOpenWorkOrderStatus(fact.status)) {
      open += 1;
    }
    if (fact.status === "in_progress") {
      inProgress += 1;
    }
    if (isCompletedWorkOrderStatus(fact.status)) {
      completed += 1;
    }

    const categoryKey = fact.category || "other";
    const categoryEntry = byCategory.get(categoryKey) ?? {
      label: labelForCategory(categoryKey),
      count: 0
    };
    categoryEntry.count += 1;
    byCategory.set(categoryKey, categoryEntry);

    const priorityEntry = byPriority.get(fact.priority) ?? {
      label: labelForPriority(fact.priority),
      count: 0
    };
    priorityEntry.count += 1;
    byPriority.set(fact.priority, priorityEntry);

    const vendorKey =
      fact.assigneeType === "vendor" && fact.vendorName
        ? `vendor:${fact.vendorName}`
        : fact.assigneeType === "technician"
          ? "technician"
          : "unassigned";
    const vendorLabel =
      vendorKey === "technician"
        ? "Technician (no vendor)"
        : vendorKey === "unassigned"
          ? "Unassigned"
          : fact.vendorName ?? "Vendor";
    const vendorEntry = byVendor.get(vendorKey) ?? { label: vendorLabel, count: 0 };
    vendorEntry.count += 1;
    byVendor.set(vendorKey, vendorEntry);
  }

  const stillOpenLike = open + inProgress;
  const completionRate =
    completed + stillOpenLike > 0
      ? Math.round((completed / (completed + stillOpenLike)) * 1000) / 10
      : null;

  return {
    total: facts.length,
    open,
    inProgress,
    completed,
    averageCompletionHours: computeAverageCompletionHours(facts),
    completionRate,
    byCategory: breakdown(byCategory),
    byPriority: breakdown(byPriority),
    byVendor: breakdown(byVendor)
  };
}

export function formatCompletionDuration(hours: number | null): string {
  if (hours == null) {
    return "No completed work in this set";
  }
  if (hours < 24) {
    return `${hours.toFixed(1)} hours`;
  }
  const days = Math.round((hours / 24) * 10) / 10;
  return `${days.toFixed(1)} days`;
}

export function statusLabel(status: string): string {
  return WORK_ORDER_STATUS_LABELS[status as WorkOrderStatus] ?? status;
}
