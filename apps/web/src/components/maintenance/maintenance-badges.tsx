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
        : status === "on_hold" || status === "awaiting_approval"
          ? "warning"
          : status === "in_progress" ||
              status === "assigned" ||
              status === "vendor_on_site"
            ? "info"
            : "neutral";

  const label =
    status === "vendor_on_site"
      ? "Vendor On Site"
      : status === "awaiting_approval"
        ? "Awaiting Approval"
        : toMaintenanceStatusLabel(status);

  return (
    <Badge showDot variant={variant}>
      {label}
    </Badge>
  );
}

export function isWorkOrderOverdue(dueDate: string | null, status: MaintenanceStatus): boolean {
  if (!dueDate) return false;
  if (status === "completed" || status === "cancelled") return false;
  return dueDate < new Date().toISOString().slice(0, 10);
}
