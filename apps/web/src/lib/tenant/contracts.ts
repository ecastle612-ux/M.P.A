export const TENANT_STATUSES = ["active", "inactive", "archived"] as const;

export type TenantStatus = (typeof TENANT_STATUSES)[number];

export type TenantRecord = {
  id: string;
  organizationId: string;
  propertyId: string | null;
  unitId: string | null;
  firstName: string;
  lastName: string;
  preferredName: string | null;
  email: string;
  avatarUrl: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  moveInDate: string | null;
  moveOutDate: string | null;
  documentsPlaceholder: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  notes: string | null;
  status: TenantStatus;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  deletedAt: string | null;
};

export type CreateTenantInput = Omit<
  TenantRecord,
  "id" | "organizationId" | "createdAt" | "updatedAt" | "archivedAt" | "deletedAt"
>;

export type UpdateTenantInput = Partial<CreateTenantInput>;

export type TenantMutationInput =
  | { action: "archive" }
  | { action: "restore" }
  | { action: "soft_delete" }
  | { action: "update"; updates: UpdateTenantInput };

export function parseCreateTenantInput(payload: unknown): CreateTenantInput | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const value = payload as Record<string, unknown>;
  const firstName = readString(value["firstName"], 1, 120);
  const lastName = readString(value["lastName"], 1, 120);
  const email = readEmail(value["email"]);

  if (!firstName || !lastName || !email) {
    return null;
  }

  const propertyId = readUuid(value["propertyId"]);
  const unitId = readUuid(value["unitId"]);
  const moveInDate = readDate(value["moveInDate"]);
  const moveOutDate = readDate(value["moveOutDate"]);
  if (moveInDate && moveOutDate && moveOutDate < moveInDate) {
    return null;
  }
  if (unitId && !propertyId) {
    return null;
  }

  return {
    propertyId,
    unitId,
    firstName,
    lastName,
    preferredName: readString(value["preferredName"], 0, 120),
    email,
    avatarUrl: readUrl(value["avatarUrl"]),
    phone: readString(value["phone"], 0, 40),
    dateOfBirth: readDate(value["dateOfBirth"]),
    moveInDate,
    moveOutDate,
    documentsPlaceholder: readString(value["documentsPlaceholder"], 0, 2000),
    emergencyContactName: readString(value["emergencyContactName"], 0, 160),
    emergencyContactPhone: readString(value["emergencyContactPhone"], 0, 40),
    notes: readString(value["notes"], 0, 4000),
    status: isTenantStatus(value["status"]) ? value["status"] : "active",
    metadata: readJsonObject(value["metadata"])
  };
}

export function parseTenantMutationInput(payload: unknown): TenantMutationInput | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const value = payload as Record<string, unknown>;
  const action = typeof value["action"] === "string" ? value["action"] : "update";
  if (action === "archive" || action === "restore" || action === "soft_delete") {
    return { action };
  }

  const updates = parseUpdateTenantInput(value);
  if (!updates) {
    return null;
  }
  return { action: "update", updates };
}

export function isTenantStatus(value: unknown): value is TenantStatus {
  return typeof value === "string" && TENANT_STATUSES.includes(value as TenantStatus);
}

export function toTenantStatusLabel(status: TenantStatus): string {
  return status[0]?.toUpperCase() + status.slice(1);
}

function parseUpdateTenantInput(value: Record<string, unknown>): UpdateTenantInput | null {
  const updates: UpdateTenantInput = {};

  if (value["propertyId"] === null) {
    updates.propertyId = null;
  } else {
    const propertyId = readUuid(value["propertyId"]);
    if (propertyId !== null) updates.propertyId = propertyId;
  }

  if (value["unitId"] === null) {
    updates.unitId = null;
  } else {
    const unitId = readUuid(value["unitId"]);
    if (unitId !== null) updates.unitId = unitId;
  }

  const firstName = readString(value["firstName"], 1, 120);
  if (firstName !== null) updates.firstName = firstName;

  const lastName = readString(value["lastName"], 1, 120);
  if (lastName !== null) updates.lastName = lastName;

  const preferredName = readString(value["preferredName"], 0, 120);
  if (preferredName !== null) updates.preferredName = preferredName;

  const email = readEmail(value["email"]);
  if (email !== null) updates.email = email;

  const avatarUrl = readUrl(value["avatarUrl"]);
  if (avatarUrl !== null) updates.avatarUrl = avatarUrl;

  const phone = readString(value["phone"], 0, 40);
  if (phone !== null) updates.phone = phone;

  const dateOfBirth = readDate(value["dateOfBirth"]);
  if (dateOfBirth !== null) updates.dateOfBirth = dateOfBirth;

  const moveInDate = readDate(value["moveInDate"]);
  if (moveInDate !== null) updates.moveInDate = moveInDate;

  const moveOutDate = readDate(value["moveOutDate"]);
  if (moveOutDate !== null) updates.moveOutDate = moveOutDate;

  const documentsPlaceholder = readString(value["documentsPlaceholder"], 0, 2000);
  if (documentsPlaceholder !== null) updates.documentsPlaceholder = documentsPlaceholder;

  const emergencyContactName = readString(value["emergencyContactName"], 0, 160);
  if (emergencyContactName !== null) updates.emergencyContactName = emergencyContactName;

  const emergencyContactPhone = readString(value["emergencyContactPhone"], 0, 40);
  if (emergencyContactPhone !== null) updates.emergencyContactPhone = emergencyContactPhone;

  const notes = readString(value["notes"], 0, 4000);
  if (notes !== null) updates.notes = notes;

  if (isTenantStatus(value["status"])) updates.status = value["status"];

  if (value["metadata"] !== undefined) {
    updates.metadata = readJsonObject(value["metadata"]);
  }

  const nextMoveInDate = updates.moveInDate ?? null;
  const nextMoveOutDate = updates.moveOutDate ?? null;
  if (nextMoveInDate && nextMoveOutDate && nextMoveOutDate < nextMoveInDate) {
    return null;
  }

  if (updates.unitId && updates.propertyId === null) {
    return null;
  }

  return Object.keys(updates).length > 0 ? updates : null;
}

function readString(value: unknown, min: number, max: number): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  if (trimmed.length < min || trimmed.length > max) return null;
  return trimmed;
}

function readEmail(value: unknown): string | null {
  const candidate = readString(value, 3, 200);
  if (candidate === null) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate) ? candidate.toLowerCase() : null;
}

function readDate(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? trimmed : null;
}

function readUrl(value: unknown): string | null {
  const candidate = readString(value, 0, 400);
  if (candidate === null) return null;
  try {
    const parsed = new URL(candidate);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.toString() : null;
  } catch {
    return null;
  }
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
