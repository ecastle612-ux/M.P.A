export const FACILITY_SITE_EVENT_TYPES = [
  "facility.site.created",
  "facility.site.activated",
  "facility.site.archived"
] as const;
export type FacilitySiteEventType = (typeof FACILITY_SITE_EVENT_TYPES)[number];

export type FacilityEventDefinition = {
  type: FacilitySiteEventType;
  aggregateType: string;
  description: string;
  auditAction: string;
};

export const FACILITY_EVENT_CATALOG: readonly FacilityEventDefinition[] = [
  {
    type: "facility.site.created",
    aggregateType: "facility_sites",
    description: "Facility site profile created",
    auditAction: "facility.site.created"
  },
  {
    type: "facility.site.activated",
    aggregateType: "facility_sites",
    description: "Facility site activated for operations",
    auditAction: "facility.site.activated"
  },
  {
    type: "facility.site.archived",
    aggregateType: "facility_sites",
    description: "Facility site archived",
    auditAction: "facility.site.archived"
  }
];

export function isFacilitySiteEventType(value: string): value is FacilitySiteEventType {
  return (FACILITY_SITE_EVENT_TYPES as readonly string[]).includes(value);
}
