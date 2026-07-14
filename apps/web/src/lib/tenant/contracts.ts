export const TENANT_STATUSES = ["active", "inactive", "archived"] as const;

export type TenantStatus = (typeof TENANT_STATUSES)[number];

export type TenantRecord = {
  id: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  preferredName: string | null;
  email: string;
  phone: string | null;
  dateOfBirth: string | null;
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

  return {
    firstName,
    lastName,
    preferredName: readString(value["preferredName"], 0, 120),
    email,
    phone: readString(value["phone"], 0, 40),
    dateOfBirth: readDate(value["dateOfBirth"]),
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

  const firstName = readString(value["firstName"], 1, 120);
  if (firstName !== null) updates.firstName = firstName;

  const lastName = readString(value["lastName"], 1, 120);
  if (lastName !== null) updates.lastName = lastName;

  const preferredName = readString(value["preferredName"], 0, 120);
  if (preferredName !== null) updates.preferredName = preferredName;

  const email = readEmail(value["email"]);
  if (email !== null) updates.email = email;

  const phone = readString(value["phone"], 0, 40);
  if (phone !== null) updates.phone = phone;

  const dateOfBirth = readDate(value["dateOfBirth"]);
  if (dateOfBirth !== null) updates.dateOfBirth = dateOfBirth;

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

function readJsonObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}
