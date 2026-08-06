export const MAINTENANCE_EVENT_TYPES = [
  "work_order.created",
  "work_order.triaged",
  "work_order.assigned",
  "vendor.assigned",
  "work_order.started",
  "work_order.progressed",
  "work_order.completed",
  "work_order.resident_confirmed",
  "work_order.closed"
] as const;

export type MaintenanceEventType = (typeof MAINTENANCE_EVENT_TYPES)[number];

export type MaintenanceEventDefinition = {
  type: MaintenanceEventType;
  aggregateType: string;
  description: string;
  auditAction: string;
};

export const MAINTENANCE_EVENT_CATALOG: readonly MaintenanceEventDefinition[] = [
  {
    type: "work_order.created",
    aggregateType: "maintenance_work_orders",
    description: "Resident submitted a maintenance request",
    auditAction: "work_order.created"
  },
  {
    type: "work_order.triaged",
    aggregateType: "maintenance_work_orders",
    description: "Property manager prioritized the request",
    auditAction: "work_order.triaged"
  },
  {
    type: "work_order.assigned",
    aggregateType: "maintenance_work_orders",
    description: "Technician assigned to the work order",
    auditAction: "work_order.assigned"
  },
  {
    type: "vendor.assigned",
    aggregateType: "maintenance_work_orders",
    description: "Vendor assigned to the work order",
    auditAction: "vendor.assigned"
  },
  {
    type: "work_order.started",
    aggregateType: "maintenance_work_orders",
    description: "Assigned worker started the job",
    auditAction: "work_order.started"
  },
  {
    type: "work_order.progressed",
    aggregateType: "maintenance_work_orders",
    description: "Progress note added on the work order",
    auditAction: "work_order.progressed"
  },
  {
    type: "work_order.completed",
    aggregateType: "maintenance_work_orders",
    description: "Worker marked the job complete",
    auditAction: "work_order.completed"
  },
  {
    type: "work_order.resident_confirmed",
    aggregateType: "maintenance_work_orders",
    description: "Resident confirmed the issue is resolved",
    auditAction: "work_order.resident_confirmed"
  },
  {
    type: "work_order.closed",
    aggregateType: "maintenance_work_orders",
    description: "Work order closed after resident confirmation",
    auditAction: "work_order.closed"
  }
];
