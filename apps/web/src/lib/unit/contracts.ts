export const UNIT_OCCUPANCY_STATUSES = [
  "occupied",
  "vacant_ready",
  "vacant_not_ready",
  "notice",
  "offline"
] as const;

export const UNIT_STATUSES = ["active", "inactive", "archived"] as const;

export type UnitOccupancyStatus = (typeof UNIT_OCCUPANCY_STATUSES)[number];
export type UnitStatus = (typeof UNIT_STATUSES)[number];

export type UnitRecord = {
  id: string;
  organizationId: string;
  propertyId: string;
  unitNumber: string;
  unitLabel: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  squareFeet: number | null;
  floor: string | null;
  rentAmount: number | null;
  depositAmount: number | null;
  currencyCode: string;
  occupancyStatus: UnitOccupancyStatus;
  status: UnitStatus;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  deletedAt: string | null;
};

export type CreateUnitInput = Omit<UnitRecord, "id" | "organizationId" | "createdAt" | "updatedAt" | "archivedAt" | "deletedAt">;
export type UpdateUnitInput = Partial<CreateUnitInput>;

export type UnitMutationInput =
  | { action: "archive" }
  | { action: "restore" }
  | { action: "soft_delete" }
  | { action: "update"; updates: UpdateUnitInput };

export function parseCreateUnitInput(payload: unknown): CreateUnitInput | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }
  const value = payload as Record<string, unknown>;
  const propertyId = readUuid(value["propertyId"]);
  const unitNumber = readString(value["unitNumber"], 1, 40);
  if (!propertyId || !unitNumber) {
    return null;
  }
  return {
    propertyId,
    unitNumber,
    unitLabel: readString(value["unitLabel"], 0, 120),
    bedrooms: readNumber(value["bedrooms"]),
    bathrooms: readNumber(value["bathrooms"]),
    squareFeet: readNumber(value["squareFeet"]),
    floor: readString(value["floor"], 0, 60),
    rentAmount: readCurrency(value["rentAmount"]),
    depositAmount: readCurrency(value["depositAmount"]),
    currencyCode: readString(value["currencyCode"], 3, 3)?.toUpperCase() ?? "USD",
    occupancyStatus: isUnitOccupancyStatus(value["occupancyStatus"]) ? value["occupancyStatus"] : "vacant_not_ready",
    status: isUnitStatus(value["status"]) ? value["status"] : "active",
    metadata: readJsonObject(value["metadata"])
  };
}

export function parseUnitMutationInput(payload: unknown): UnitMutationInput | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }
  const value = payload as Record<string, unknown>;
  const action = typeof value["action"] === "string" ? value["action"] : "update";
  if (action === "archive" || action === "restore" || action === "soft_delete") {
    return { action };
  }
  const updates = parseUpdateUnitInput(value);
  if (!updates) {
    return null;
  }
  return { action: "update", updates };
}

export function isUnitOccupancyStatus(value: unknown): value is UnitOccupancyStatus {
  return typeof value === "string" && UNIT_OCCUPANCY_STATUSES.includes(value as UnitOccupancyStatus);
}

export function isUnitStatus(value: unknown): value is UnitStatus {
  return typeof value === "string" && UNIT_STATUSES.includes(value as UnitStatus);
}

export function toUnitOccupancyLabel(status: UnitOccupancyStatus): string {
  return status
    .split("_")
    .map((segment) => segment[0]?.toUpperCase() + segment.slice(1))
    .join(" ");
}

export function toUnitStatusLabel(status: UnitStatus): string {
  return status[0]?.toUpperCase() + status.slice(1);
}

function parseUpdateUnitInput(value: Record<string, unknown>): UpdateUnitInput | null {
  const updates: UpdateUnitInput = {};

  const propertyId = readUuid(value["propertyId"]);
  if (propertyId !== null) updates.propertyId = propertyId;
  const unitNumber = readString(value["unitNumber"], 1, 40);
  if (unitNumber !== null) updates.unitNumber = unitNumber;
  const unitLabel = readString(value["unitLabel"], 0, 120);
  if (unitLabel !== null) updates.unitLabel = unitLabel;
  const bedrooms = readNumber(value["bedrooms"]);
  if (bedrooms !== null) updates.bedrooms = bedrooms;
  const bathrooms = readNumber(value["bathrooms"]);
  if (bathrooms !== null) updates.bathrooms = bathrooms;
  const squareFeet = readNumber(value["squareFeet"]);
  if (squareFeet !== null) updates.squareFeet = squareFeet;
  const floor = readString(value["floor"], 0, 60);
  if (floor !== null) updates.floor = floor;
  const rentAmount = readCurrency(value["rentAmount"]);
  if (rentAmount !== null) updates.rentAmount = rentAmount;
  const depositAmount = readCurrency(value["depositAmount"]);
  if (depositAmount !== null) updates.depositAmount = depositAmount;
  const currencyCode = readString(value["currencyCode"], 3, 3);
  if (currencyCode !== null) updates.currencyCode = currencyCode.toUpperCase();
  if (isUnitOccupancyStatus(value["occupancyStatus"])) updates.occupancyStatus = value["occupancyStatus"];
  if (isUnitStatus(value["status"])) updates.status = value["status"];

  if (value["metadata"] !== undefined) {
    updates.metadata = readJsonObject(value["metadata"]);
  }

  return Object.keys(updates).length > 0 ? updates : null;
}

function readString(value: unknown, min: number, max: number): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return min === 0 ? null : null;
  }
  if (trimmed.length < min || trimmed.length > max) return null;
  return trimmed;
}

function readNumber(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function readCurrency(value: unknown): number | null {
  const parsed = readNumber(value);
  if (parsed === null) return null;
  return parsed >= 0 ? parsed : null;
}

function readUuid(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") return null;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    ? value
    : null;
}

function readJsonObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}
