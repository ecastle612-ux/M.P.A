export const FACILITY_ASSET_EVENT_TYPES = [
  "facility.asset.created",
  "facility.asset.activated",
  "facility.asset.in_repair",
  "facility.asset.returned_active",
  "facility.asset.decommissioned",
  "facility.asset.updated"
] as const;
export type FacilityAssetEventType = (typeof FACILITY_ASSET_EVENT_TYPES)[number];

export const FACILITY_SYSTEM_EVENT_TYPES = [
  "facility.system.created",
  "facility.system.status_changed",
  "facility.system.decommissioned",
  "facility.system.updated"
] as const;
export type FacilitySystemEventType = (typeof FACILITY_SYSTEM_EVENT_TYPES)[number];

export function isFacilityAssetEventType(value: string): value is FacilityAssetEventType {
  return (FACILITY_ASSET_EVENT_TYPES as readonly string[]).includes(value);
}

export function isFacilitySystemEventType(value: string): value is FacilitySystemEventType {
  return (FACILITY_SYSTEM_EVENT_TYPES as readonly string[]).includes(value);
}
