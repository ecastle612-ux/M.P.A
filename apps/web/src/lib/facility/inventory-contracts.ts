export const FACILITY_INVENTORY_STATUSES = [
  "available",
  "in_service",
  "repair",
  "disposed",
  "retired",
  "lost",
  "stolen"
] as const;

export type FacilityInventoryStatus = (typeof FACILITY_INVENTORY_STATUSES)[number];

export type FacilityInventoryItem = {
  id: string;
  organizationId: string;
  name: string;
  status: FacilityInventoryStatus;
  category: string | null;
  propertyId: string | null;
  assignedTechnicianUserId: string | null;
  purchaseDate: string | null;
  warrantyEndsOn: string | null;
  warrantyNotes: string | null;
  serialNumber: string | null;
  notes: string | null;
  primaryMediaAssetId: string | null;
  metadata: Record<string, unknown>;
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type FacilityInventoryListItem = FacilityInventoryItem & {
  propertyName: string | null;
};

export type CreateFacilityInventoryInput = {
  name: string;
  primaryMediaAssetId: string;
  status?: FacilityInventoryStatus;
  category?: string | null;
  propertyId?: string | null;
  assignedTechnicianUserId?: string | null;
  purchaseDate?: string | null;
  warrantyEndsOn?: string | null;
  warrantyNotes?: string | null;
  serialNumber?: string | null;
  notes?: string | null;
};

export type UpdateFacilityInventoryInput = {
  name?: string;
  status?: FacilityInventoryStatus;
  category?: string | null;
  propertyId?: string | null;
  assignedTechnicianUserId?: string | null;
  purchaseDate?: string | null;
  warrantyEndsOn?: string | null;
  warrantyNotes?: string | null;
  serialNumber?: string | null;
  notes?: string | null;
  primaryMediaAssetId?: string | null;
};

export type ListFacilityInventoryOptions = {
  search?: string;
  status?: FacilityInventoryStatus;
  propertyId?: string;
  limit?: number;
  offset?: number;
};

export function isFacilityInventoryStatus(value: string): value is FacilityInventoryStatus {
  return (FACILITY_INVENTORY_STATUSES as readonly string[]).includes(value);
}

export function formatInventoryStatusLabel(status: FacilityInventoryStatus): string {
  switch (status) {
    case "available":
      return "Available";
    case "in_service":
      return "In service";
    case "repair":
      return "Repair";
    case "disposed":
      return "Disposed";
    case "retired":
      return "Retired";
    case "lost":
      return "Lost";
    case "stolen":
      return "Stolen";
    default:
      return status;
  }
}

function asTrimmedString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function parseCreateFacilityInventoryInput(payload: unknown): CreateFacilityInventoryInput | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  const record = payload as Record<string, unknown>;
  const name = asTrimmedString(record["name"]);
  const primaryMediaAssetId = asTrimmedString(record["primaryMediaAssetId"]);
  if (!name || !primaryMediaAssetId) return null;

  const statusRaw = asTrimmedString(record["status"]);
  const status =
    statusRaw && isFacilityInventoryStatus(statusRaw) ? statusRaw : ("available" as const);

  return {
    name,
    primaryMediaAssetId,
    status,
    category: asTrimmedString(record["category"]),
    propertyId: asTrimmedString(record["propertyId"]),
    assignedTechnicianUserId: asTrimmedString(record["assignedTechnicianUserId"]),
    purchaseDate: asTrimmedString(record["purchaseDate"]),
    warrantyEndsOn: asTrimmedString(record["warrantyEndsOn"]),
    warrantyNotes: asTrimmedString(record["warrantyNotes"]),
    serialNumber: asTrimmedString(record["serialNumber"]),
    notes: asTrimmedString(record["notes"])
  };
}

export function parseUpdateFacilityInventoryInput(payload: unknown): UpdateFacilityInventoryInput | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  const record = payload as Record<string, unknown>;
  const next: UpdateFacilityInventoryInput = {};

  if ("name" in record) {
    const name = asTrimmedString(record["name"]);
    if (!name) return null;
    next.name = name;
  }
  if ("status" in record) {
    const status = asTrimmedString(record["status"]);
    if (!status || !isFacilityInventoryStatus(status)) return null;
    next.status = status;
  }
  if ("category" in record) next.category = asTrimmedString(record["category"]);
  if ("propertyId" in record) next.propertyId = asTrimmedString(record["propertyId"]);
  if ("assignedTechnicianUserId" in record) {
    next.assignedTechnicianUserId = asTrimmedString(record["assignedTechnicianUserId"]);
  }
  if ("purchaseDate" in record) next.purchaseDate = asTrimmedString(record["purchaseDate"]);
  if ("warrantyEndsOn" in record) next.warrantyEndsOn = asTrimmedString(record["warrantyEndsOn"]);
  if ("warrantyNotes" in record) next.warrantyNotes = asTrimmedString(record["warrantyNotes"]);
  if ("serialNumber" in record) next.serialNumber = asTrimmedString(record["serialNumber"]);
  if ("notes" in record) next.notes = asTrimmedString(record["notes"]);
  if ("primaryMediaAssetId" in record) {
    next.primaryMediaAssetId = asTrimmedString(record["primaryMediaAssetId"]);
  }

  return Object.keys(next).length > 0 ? next : null;
}
