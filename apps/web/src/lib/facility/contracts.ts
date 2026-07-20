export const FACILITY_RECORD_STATUSES = ["active", "superseded_by_correction"] as const;
export type FacilityRecordStatus = (typeof FACILITY_RECORD_STATUSES)[number];

export const FACILITY_LIFECYCLE_STATUSES = ["provisional", "finalized"] as const;
export type FacilityLifecycleStatus = (typeof FACILITY_LIFECYCLE_STATUSES)[number];

export const SERVICE_PROVIDER_TYPES = [
  "internal_staff",
  "vendor",
  "contractor",
  "emergency_vendor",
  "owner",
  "volunteer",
  "other",
  "unassigned"
] as const;
export type ServiceProviderType = (typeof SERVICE_PROVIDER_TYPES)[number];

/** Extensible timeline event namespace — add types without UI redesign. */
export const FACILITY_TIMELINE_EVENT_TYPES = [
  "facility.repair_completed",
  "facility.record_corrected",
  "facility.service_visit",
  "facility.inspection_completed",
  "facility.inspection_failed",
  "facility.warranty_created",
  "facility.asset_installed",
  "facility.compliance_event",
  "resident.moved_in",
  "resident.moved_out",
  "lease.signed",
  "lease.activated",
  "lease.renewed",
  "ops.announcement_published",
  "financial.major_expense",
  "document.linked"
] as const;
export type FacilityTimelineEventType = (typeof FACILITY_TIMELINE_EVENT_TYPES)[number] | (string & {});

export const TIMELINE_FILTERS = [
  "all",
  "repairs",
  "residents",
  "leases",
  "financial",
  "inspections",
  "documents",
  "assets",
  "future"
] as const;
export type TimelineFilter = (typeof TIMELINE_FILTERS)[number];

export type FacilityRecord = {
  id: string;
  organizationId: string;
  propertyId: string;
  unitId: string | null;
  buildingId: string | null;
  assetId: string | null;
  workOrderId: string;
  legacyVendorId: string | null;
  serviceProviderDisplayName: string | null;
  serviceProviderType: ServiceProviderType;
  assignedStaffUserId: string | null;
  issue: string;
  resolution: string;
  completedAt: string;
  warrantyPlaceholder: string | null;
  invoicePlaceholder: string | null;
  lifecycleStatus: FacilityLifecycleStatus;
  status: FacilityRecordStatus;
  correctionOfId: string | null;
  correctionReason: string | null;
  correctedBy: string | null;
  correctedAt: string | null;
  photoDocumentIds: string[];
  documentIds: string[];
  metadata: Record<string, unknown>;
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FacilityRecordListItem = FacilityRecord & {
  propertyName: string | null;
  unitNumber: string | null;
  workOrderNumber: string | null;
  assetCode?: string | null;
  assetName?: string | null;
};

export type FacilityTimelineEvent = {
  id: string;
  organizationId: string;
  propertyId: string;
  unitId: string | null;
  buildingId: string | null;
  eventType: string;
  occurredAt: string;
  title: string;
  summary: string;
  actorUserId: string | null;
  performedByLabel: string | null;
  serviceProviderDisplayName: string | null;
  sourceEntityType: string;
  sourceEntityId: string;
  facilityRecordId: string | null;
  workOrderId: string | null;
  legacyVendorId: string | null;
  assetId: string | null;
  href: string | null;
  documentIds: string[];
  payload: Record<string, unknown>;
  createdAt: string;
  propertyName?: string | null;
  unitNumber?: string | null;
};

export type FacilityHistoryFilters = {
  search?: string | undefined;
  propertyId?: string | undefined;
  unitId?: string | undefined;
  assetId?: string | undefined;
  vendorId?: string | undefined;
  completedFrom?: string | undefined;
  completedTo?: string | undefined;
  limit?: number | undefined;
  includeSuperseded?: boolean | undefined;
};

export type TimelineListOptions = {
  propertyId?: string | undefined;
  unitId?: string | undefined;
  vendorId?: string | undefined;
  filter?: TimelineFilter | undefined;
  search?: string | undefined;
  limit?: number | undefined;
  /** When true on unit timelines, include property-wide (null unit) events. */
  includePropertyWide?: boolean | undefined;
};

export type AppendTimelineEventInput = {
  propertyId: string;
  unitId?: string | null;
  buildingId?: string | null;
  eventType: string;
  occurredAt?: string;
  title: string;
  summary: string;
  actorUserId?: string | null;
  performedByLabel?: string | null;
  serviceProviderDisplayName?: string | null;
  sourceEntityType: string;
  sourceEntityId: string;
  facilityRecordId?: string | null;
  workOrderId?: string | null;
  legacyVendorId?: string | null;
  assetId?: string | null;
  href?: string | null;
  documentIds?: string[];
  payload?: Record<string, unknown>;
};

export type CorrectFacilityRecordInput = {
  issue?: string;
  resolution?: string;
  completedAt?: string;
  warrantyPlaceholder?: string | null;
  invoicePlaceholder?: string | null;
  serviceProviderDisplayName?: string | null;
  legacyVendorId?: string | null;
  serviceProviderType?: ServiceProviderType;
  reason: string;
};

export type FacilitySearchHitKind =
  | "facility_record"
  | "facility_asset"
  | "timeline_event"
  | "service_provider"
  | "work_order"
  | "property"
  | "unit";

export type FacilitySearchHit = {
  id: string;
  kind: FacilitySearchHitKind;
  title: string;
  subtitle: string | null;
  context: string | null;
  href: string;
  occurredAt: string | null;
  score: number;
};

export type ServiceProviderIntelligence = {
  vendorId: string;
  displayName: string;
  providerType: ServiceProviderType;
  contactEmail: string | null;
  contactPhone: string | null;
  jobsCompleted: number;
  jobsOpen: number;
  averageCompletionHours: number | null;
  lastAssignmentAt: string | null;
  propertiesServed: Array<{ id: string; name: string }>;
  unitsServed: Array<{ id: string; unitNumber: string; propertyId: string }>;
  repeatRepairCount: number;
  recentRepairs: FacilityRecordListItem[];
  timeline: FacilityTimelineEvent[];
  documentCount: number;
  warrantyPlaceholderCount: number;
  futureHooks: {
    ratings: "planned";
    aiRecommendations: "planned";
    preventiveMaintenance: "planned";
    assetPassport: "planned";
    propertyHealth: "planned";
    capitalPlanning: "planned";
    compliance: "planned";
  };
};

export function isServiceProviderType(value: unknown): value is ServiceProviderType {
  return typeof value === "string" && (SERVICE_PROVIDER_TYPES as readonly string[]).includes(value);
}

export function isTimelineFilter(value: unknown): value is TimelineFilter {
  return typeof value === "string" && (TIMELINE_FILTERS as readonly string[]).includes(value);
}

export function timelineFilterPrefixes(filter: TimelineFilter): string[] | null {
  switch (filter) {
    case "all":
      return null;
    case "repairs":
      return ["facility.repair", "facility.record", "facility.service", "provider."];
    case "residents":
      return ["resident."];
    case "leases":
      return ["lease."];
    case "financial":
      return ["financial."];
    case "inspections":
      return ["facility.inspection"];
    case "documents":
      return ["document."];
    case "assets":
      return ["facility.asset"];
    case "future":
      return ["facility.compliance", "facility.warranty", "pm.", "health."];
    default:
      return null;
  }
}

export function eventMatchesFilter(eventType: string, filter: TimelineFilter): boolean {
  const prefixes = timelineFilterPrefixes(filter);
  if (!prefixes) return true;
  return prefixes.some((prefix) => eventType.startsWith(prefix));
}

export function parseCorrectFacilityRecordInput(value: unknown): CorrectFacilityRecordInput | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const reason = typeof record["reason"] === "string" ? record["reason"].trim() : "";
  if (!reason) return null;

  const input: CorrectFacilityRecordInput = { reason };
  if (typeof record["issue"] === "string") input.issue = record["issue"].trim();
  if (typeof record["resolution"] === "string") input.resolution = record["resolution"].trim();
  if (typeof record["completedAt"] === "string") input.completedAt = record["completedAt"];
  if (record["warrantyPlaceholder"] === null || typeof record["warrantyPlaceholder"] === "string") {
    input.warrantyPlaceholder = record["warrantyPlaceholder"];
  }
  if (record["invoicePlaceholder"] === null || typeof record["invoicePlaceholder"] === "string") {
    input.invoicePlaceholder = record["invoicePlaceholder"];
  }
  if (
    record["serviceProviderDisplayName"] === null ||
    typeof record["serviceProviderDisplayName"] === "string"
  ) {
    input.serviceProviderDisplayName = record["serviceProviderDisplayName"];
  }
  if (record["legacyVendorId"] === null || typeof record["legacyVendorId"] === "string") {
    input.legacyVendorId = record["legacyVendorId"];
  }
  if (isServiceProviderType(record["serviceProviderType"])) {
    input.serviceProviderType = record["serviceProviderType"];
  }
  return input;
}

export function timelineTitleForCategory(category: string, issue: string): string {
  const normalized = category.trim().toLowerCase();
  switch (normalized) {
    case "hvac":
      return "HVAC Repair Completed";
    case "plumbing":
      return issue.toLowerCase().includes("leak") ? "Leak Repaired" : "Plumbing Repair Completed";
    case "electrical":
      return issue.toLowerCase().includes("smoke")
        ? "Smoke Detector Installed"
        : "Electrical Repair Completed";
    case "appliance":
      return "Appliance Repair Completed";
    case "structural":
      return "Structural Repair Completed";
    case "landscaping":
      return "Landscaping Work Completed";
    case "pest":
      return "Pest Service Completed";
    default:
      return "Repair Completed";
  }
}

export function timelineIconForEventType(eventType: string): string {
  if (eventType.startsWith("facility.repair") || eventType === "facility.service_visit") return "🔧";
  if (eventType === "facility.record_corrected") return "✎";
  if (eventType.startsWith("facility.inspection")) return "☑";
  if (eventType.startsWith("resident.")) return "👤";
  if (eventType.startsWith("lease.")) return "📄";
  if (eventType.startsWith("financial.")) return "$";
  if (eventType.startsWith("ops.announcement")) return "📢";
  if (eventType.startsWith("document.")) return "📎";
  if (eventType.startsWith("facility.warranty")) return "🛡";
  if (eventType.startsWith("facility.asset")) return "🏗";
  if (eventType.startsWith("facility.compliance")) return "⚖";
  return "•";
}

export function hrefForTimelineEvent(event: Pick<FacilityTimelineEvent, "href" | "facilityRecordId" | "workOrderId" | "eventType" | "sourceEntityType" | "sourceEntityId" | "propertyId" | "unitId" | "legacyVendorId">): string | null {
  if (event.href) return event.href;
  if (event.facilityRecordId) return `/facility/records/${event.facilityRecordId}`;
  if (event.workOrderId) return `/maintenance/${event.workOrderId}`;
  if (event.sourceEntityType === "lease") return `/leases/${event.sourceEntityId}`;
  if (event.sourceEntityType === "tenant") return `/tenants/${event.sourceEntityId}`;
  if (event.sourceEntityType === "announcement") return `/communications/${event.sourceEntityId}`;
  if (event.sourceEntityType === "expense") return `/financials/expenses`;
  if (event.legacyVendorId) return `/vendors/${event.legacyVendorId}`;
  if (event.unitId) return `/units/${event.unitId}`;
  return `/properties/${event.propertyId}`;
}
