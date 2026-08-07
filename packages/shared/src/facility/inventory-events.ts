export const FACILITY_INVENTORY_EVENT_TYPES = [
  "facility.part.created",
  "facility.part.received",
  "facility.part.issued",
  "facility.part.returned",
  "facility.inventory.location_created",
  "facility.inventory.adjusted",
  "facility.inventory.thresholds_updated",
  "facility.inventory.stockout",
  "facility.inventory.low_stock"
] as const;

export type FacilityInventoryEventType = (typeof FACILITY_INVENTORY_EVENT_TYPES)[number];
