export const PROPERTY_TYPES = [
  "residential",
  "commercial",
  "apartment",
  "condo",
  "hoa",
  "townhome",
  "multi_family"
] as const;

export const PROPERTY_STATUSES = ["draft", "active", "inactive", "archived"] as const;

export type PropertyType = (typeof PROPERTY_TYPES)[number];
export type PropertyStatus = (typeof PROPERTY_STATUSES)[number];

export type PropertyRecord = {
  id: string;
  organizationId: string;
  name: string;
  code: string | null;
  propertyType: PropertyType;
  status: PropertyStatus;
  description: string | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  stateRegion: string;
  postalCode: string;
  countryCode: string;
  timezone: string | null;
  latitude: number | null;
  longitude: number | null;
  ownershipEntityName: string | null;
  ownerContactName: string | null;
  ownerContactEmail: string | null;
  ownerContactPhone: string | null;
  coverImageUrl: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  deletedAt: string | null;
};

export type CreatePropertyInput = Omit<
  PropertyRecord,
  "id" | "organizationId" | "createdAt" | "updatedAt" | "archivedAt" | "deletedAt"
>;

export type UpdatePropertyInput = Partial<CreatePropertyInput>;

export type PropertyMutationInput =
  | { action: "archive" }
  | { action: "restore" }
  | { action: "soft_delete" }
  | { action: "update"; updates: UpdatePropertyInput };

export function parseCreatePropertyInput(payload: unknown): CreatePropertyInput | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }
  const value = payload as Record<string, unknown>;
  const name = readString(value["name"], 2, 160);
  const propertyType = isPropertyType(value["propertyType"]) ? value["propertyType"] : null;
  const addressLine1 = readString(value["addressLine1"], 2, 200);
  const city = readString(value["city"], 2, 120);
  const stateRegion = readString(value["stateRegion"], 2, 120);
  const postalCode = readString(value["postalCode"], 2, 40);
  const countryCodeRaw = readString(value["countryCode"], 2, 2);
  const countryCode = countryCodeRaw ? countryCodeRaw.toUpperCase() : null;

  if (!name || !propertyType || !addressLine1 || !city || !stateRegion || !postalCode || !countryCode) {
    return null;
  }

  return {
    name,
    code: readString(value["code"], 2, 50),
    propertyType,
    status: isPropertyStatus(value["status"]) ? value["status"] : "draft",
    description: readString(value["description"], 0, 4000),
    addressLine1,
    addressLine2: readString(value["addressLine2"], 0, 200),
    city,
    stateRegion,
    postalCode,
    countryCode,
    timezone: readString(value["timezone"], 0, 120),
    latitude: readNumber(value["latitude"]),
    longitude: readNumber(value["longitude"]),
    ownershipEntityName: readString(value["ownershipEntityName"], 0, 200),
    ownerContactName: readString(value["ownerContactName"], 0, 200),
    ownerContactEmail: readEmail(value["ownerContactEmail"]),
    ownerContactPhone: readString(value["ownerContactPhone"], 0, 40),
    coverImageUrl: readString(value["coverImageUrl"], 0, 400),
    metadata: readJsonObject(value["metadata"])
  };
}

export function parsePropertyMutationInput(payload: unknown): PropertyMutationInput | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }
  const value = payload as Record<string, unknown>;
  const action = typeof value["action"] === "string" ? value["action"] : "update";
  if (action === "archive" || action === "restore" || action === "soft_delete") {
    return { action };
  }

  const updates = parseUpdatePropertyInput(value);
  if (!updates) {
    return null;
  }
  return { action: "update", updates };
}

export function isPropertyType(value: unknown): value is PropertyType {
  return typeof value === "string" && PROPERTY_TYPES.includes(value as PropertyType);
}

export function isPropertyStatus(value: unknown): value is PropertyStatus {
  return typeof value === "string" && PROPERTY_STATUSES.includes(value as PropertyStatus);
}

export function toPropertyTypeLabel(type: PropertyType): string {
  if (type === "multi_family") return "Multi-Family";
  if (type === "hoa") return "HOA";
  return type
    .split("_")
    .map((segment) => segment[0]?.toUpperCase() + segment.slice(1))
    .join(" ");
}

export function toPropertyStatusLabel(status: PropertyStatus): string {
  return status[0]?.toUpperCase() + status.slice(1);
}

function parseUpdatePropertyInput(value: Record<string, unknown>): UpdatePropertyInput | null {
  const updates: UpdatePropertyInput = {};

  const name = readString(value["name"], 2, 160);
  if (name !== null) updates.name = name;

  const code = readString(value["code"], 0, 50);
  if (code !== null) updates.code = code;

  if (isPropertyType(value["propertyType"])) updates.propertyType = value["propertyType"];
  if (isPropertyStatus(value["status"])) updates.status = value["status"];

  const description = readString(value["description"], 0, 4000);
  if (description !== null) updates.description = description;

  const addressLine1 = readString(value["addressLine1"], 2, 200);
  if (addressLine1 !== null) updates.addressLine1 = addressLine1;
  const addressLine2 = readString(value["addressLine2"], 0, 200);
  if (addressLine2 !== null) updates.addressLine2 = addressLine2;
  const city = readString(value["city"], 2, 120);
  if (city !== null) updates.city = city;
  const stateRegion = readString(value["stateRegion"], 2, 120);
  if (stateRegion !== null) updates.stateRegion = stateRegion;
  const postalCode = readString(value["postalCode"], 2, 40);
  if (postalCode !== null) updates.postalCode = postalCode;

  const countryCodeRaw = readString(value["countryCode"], 2, 2);
  if (countryCodeRaw !== null) updates.countryCode = countryCodeRaw.toUpperCase();

  const timezone = readString(value["timezone"], 0, 120);
  if (timezone !== null) updates.timezone = timezone;

  const latitude = readNumber(value["latitude"]);
  if (latitude !== null) updates.latitude = latitude;
  const longitude = readNumber(value["longitude"]);
  if (longitude !== null) updates.longitude = longitude;

  const ownershipEntityName = readString(value["ownershipEntityName"], 0, 200);
  if (ownershipEntityName !== null) updates.ownershipEntityName = ownershipEntityName;
  const ownerContactName = readString(value["ownerContactName"], 0, 200);
  if (ownerContactName !== null) updates.ownerContactName = ownerContactName;
  const ownerContactEmail = readEmail(value["ownerContactEmail"]);
  if (ownerContactEmail !== null) updates.ownerContactEmail = ownerContactEmail;
  const ownerContactPhone = readString(value["ownerContactPhone"], 0, 40);
  if (ownerContactPhone !== null) updates.ownerContactPhone = ownerContactPhone;

  const coverImageUrl = readString(value["coverImageUrl"], 0, 400);
  if (coverImageUrl !== null) updates.coverImageUrl = coverImageUrl;

  if (value["metadata"] !== undefined) {
    updates.metadata = readJsonObject(value["metadata"]);
  }

  return Object.keys(updates).length > 0 ? updates : null;
}

function readString(value: unknown, min: number, max: number): string | null {
  if (value === undefined) return null;
  if (value === null) return null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return min === 0 ? null : null;
  }
  if (trimmed.length < min || trimmed.length > max) return null;
  return trimmed;
}

function readEmail(value: unknown): string | null {
  const candidate = readString(value, 0, 200);
  if (candidate === null) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate) ? candidate.toLowerCase() : null;
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

function readJsonObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}
