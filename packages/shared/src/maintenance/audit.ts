export const MAINTENANCE_AUDIT_ACTIONS = [
  "work_order.created",
  "work_order.triaged",
  "work_order.assigned",
  "vendor.assigned",
  "work_order.started",
  "work_order.progressed",
  "work_order.completed",
  "work_order.cancelled",
  "work_order.resident_confirmed",
  "work_order.closed"
] as const;

export type MaintenanceAuditAction = (typeof MAINTENANCE_AUDIT_ACTIONS)[number];
