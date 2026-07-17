import { Badge } from "@mpa/ui";
import type { MaintenancePriority, MaintenanceStatus } from "../../lib/maintenance/contracts";
import { toMaintenancePriorityLabel, toMaintenanceStatusLabel } from "../../lib/maintenance/contracts";

export function PriorityBadge({ priority }: { priority: MaintenancePriority }) {
  const variant =
    priority === "emergency"
      ? "danger"
      : priority === "high"
        ? "warning"
        : priority === "medium"
          ? "info"
          : "neutral";

  return (
    <Badge showDot variant={variant}>
      {toMaintenancePriorityLabel(priority)}
    </Badge>
  );
}

export function StatusBadge({ status }: { status: MaintenanceStatus }) {
  const variant =
    status === "completed"
      ? "success"
      : status === "cancelled"
        ? "neutral"
        : status === "on_hold"
          ? "warning"
          : status === "in_progress" || status === "assigned"
            ? "info"
            : "neutral";

  return (
    <Badge showDot variant={variant}>
      {toMaintenanceStatusLabel(status)}
    </Badge>
  );
}

export function isWorkOrderOverdue(dueDate: string | null, status: MaintenanceStatus): boolean {
  if (!dueDate) return false;
  if (status === "completed" || status === "cancelled") return false;
  return dueDate < new Date().toISOString().slice(0, 10);
}
