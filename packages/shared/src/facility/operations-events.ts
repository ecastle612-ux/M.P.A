export const FACILITY_OPERATIONS_EVENT_TYPES = [
  "work_order.created",
  "work_order.triaged",
  "work_order.assigned",
  "work_order.started",
  "work_order.progressed",
  "work_order.completed",
  "work_order.closed",
  "work_order.cancelled"
] as const;

export type FacilityOperationsEventType = (typeof FACILITY_OPERATIONS_EVENT_TYPES)[number];
