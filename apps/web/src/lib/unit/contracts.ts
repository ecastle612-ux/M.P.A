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

export type BulkUnitGeneratorInput = {
  propertyId: string;
  startNumber: number;
  endNumber: number;
  prefix: string;
  suffix: string;
  padWidth: number;
  floorTemplate: "none" | "hundreds" | "explicit";
  /** Used when floorTemplate is explicit — maps unit number → floor label, or a single floor for all */
  floorLabel: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  squareFeet: number | null;
  rentAmount: number | null;
  depositAmount: number | null;
  currencyCode: string;
  occupancyStatus: UnitOccupancyStatus;
  status: UnitStatus;
};

export type BulkUnitPreviewItem = {
  unitNumber: string;
  floor: string | null;
};

export const BULK_UNIT_MAX_COUNT = 200;

export function buildBulkUnitPreview(input: BulkUnitGeneratorInput): {
  items: BulkUnitPreviewItem[];
  errors: string[];
} {
  const errors: string[] = [];
  if (!input.propertyId) errors.push("Property is required.");
  if (!Number.isInteger(input.startNumber) || !Number.isInteger(input.endNumber)) {
    errors.push("Start and end must be whole numbers.");
  }
  if (input.startNumber < 0 || input.endNumber < 0) {
    errors.push("Unit numbers cannot be negative.");
  }
  if (input.endNumber < input.startNumber) {
    errors.push("End number must be greater than or equal to start number.");
  }
  const count = input.endNumber - input.startNumber + 1;
  if (count > BULK_UNIT_MAX_COUNT) {
    errors.push(`Cannot create more than ${BULK_UNIT_MAX_COUNT} units at once.`);
  }
  if (input.padWidth < 0 || input.padWidth > 8) {
    errors.push("Pad width must be between 0 and 8.");
  }
  if (errors.length > 0) {
    return { items: [], errors };
  }

  const items: BulkUnitPreviewItem[] = [];
  for (let n = input.startNumber; n <= input.endNumber; n += 1) {
    const core = input.padWidth > 0 ? String(n).padStart(input.padWidth, "0") : String(n);
    const unitNumber = `${input.prefix}${core}${input.suffix}`.trim();
    if (!unitNumber || unitNumber.length > 40) {
      errors.push(`Generated unit number is invalid for ${n}.`);
      continue;
    }
    let floor: string | null = null;
    if (input.floorTemplate === "hundreds") {
      floor = String(Math.floor(n / 100) || 1);
    } else if (input.floorTemplate === "explicit") {
      floor = input.floorLabel;
    }
    items.push({ unitNumber, floor });
  }
  return { items, errors };
}

export function parseBulkUnitGeneratorInput(payload: unknown): BulkUnitGeneratorInput | null {
  if (!payload || typeof payload !== "object") return null;
  const value = payload as Record<string, unknown>;
  const propertyId = readUuid(value["propertyId"]);
  const startNumber = readInteger(value["startNumber"]);
  const endNumber = readInteger(value["endNumber"]);
  if (!propertyId || startNumber === null || endNumber === null) return null;
  const floorTemplateRaw = value["floorTemplate"];
  const floorTemplate =
    floorTemplateRaw === "hundreds" || floorTemplateRaw === "explicit" || floorTemplateRaw === "none"
      ? floorTemplateRaw
      : "none";
  const padWidth = readInteger(value["padWidth"]) ?? 0;
  return {
    propertyId,
    startNumber,
    endNumber,
    prefix: readString(value["prefix"], 0, 20) ?? "",
    suffix: readString(value["suffix"], 0, 20) ?? "",
    padWidth: Math.max(0, Math.min(8, padWidth)),
    floorTemplate,
    floorLabel: readString(value["floorLabel"], 0, 60),
    bedrooms: readNumber(value["bedrooms"]),
    bathrooms: readNumber(value["bathrooms"]),
    squareFeet: readNumber(value["squareFeet"]),
    rentAmount: readCurrency(value["rentAmount"]),
    depositAmount: readCurrency(value["depositAmount"]),
    currencyCode: readString(value["currencyCode"], 3, 3)?.toUpperCase() ?? "USD",
    occupancyStatus: isUnitOccupancyStatus(value["occupancyStatus"]) ? value["occupancyStatus"] : "vacant_not_ready",
    status: isUnitStatus(value["status"]) ? value["status"] : "active"
  };
}

function readInteger(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value === "number" && Number.isInteger(value)) return value;
  if (typeof value === "string" && /^-?\d+$/.test(value.trim())) {
    return Number.parseInt(value.trim(), 10);
  }
  return null;
}

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
