export const VENDOR_STATUSES = ["active", "inactive", "archived"] as const;

export const VENDOR_SERVICE_TYPES = [
  "electrical",
  "plumbing",
  "hvac",
  "roofing",
  "snow_removal",
  "cleaning",
  "painting",
  "general_maintenance",
  "landscaping",
  "custom"
] as const;

export const VENDOR_ASSIGNMENT_STATUSES = [
  "pending",
  "awaiting_response",
  "accepted",
  "en_route",
  "arrived",
  "in_progress",
  "completed",
  "cancelled"
] as const;

export type VendorStatus = (typeof VENDOR_STATUSES)[number];
export type VendorServiceType = (typeof VENDOR_SERVICE_TYPES)[number];
export type VendorAssignmentStatus = (typeof VENDOR_ASSIGNMENT_STATUSES)[number];

export type VendorContactRecord = {
  id: string;
  organizationId: string;
  vendorId: string;
  name: string;
  roleTitle: string | null;
  phone: string | null;
  email: string | null;
  isPrimary: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type VendorServiceAreaRecord = {
  id: string;
  organizationId: string;
  vendorId: string;
  label: string;
  city: string | null;
  stateRegion: string | null;
  postalCode: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type VendorRecord = {
  id: string;
  organizationId: string;
  businessName: string;
  primaryContactName: string | null;
  phone: string | null;
  email: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  stateRegion: string | null;
  postalCode: string | null;
  countryCode: string;
  website: string | null;
  licenseNumber: string | null;
  insuranceExpiration: string | null;
  taxIdPlaceholder: string | null;
  emergencyAvailability: string | null;
  afterHoursAvailability: string | null;
  preferredVendor: boolean;
  rating: number | null;
  internalNotes: string | null;
  status: VendorStatus;
  services: string[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  deletedAt: string | null;
};

export type VendorAssignmentRecord = {
  id: string;
  organizationId: string;
  workOrderId: string;
  vendorId: string;
  assignmentStatus: VendorAssignmentStatus;
  assignedAt: string;
  acceptedAt: string | null;
  arrivedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  completionNotes: string | null;
  cancellationReason: string | null;
  isCurrent: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateVendorInput = Omit<
  VendorRecord,
  "id" | "organizationId" | "createdAt" | "updatedAt" | "archivedAt" | "deletedAt"
>;

export type UpdateVendorInput = Partial<CreateVendorInput>;

export type VendorMutationInput =
  | { action: "archive" }
  | { action: "restore" }
  | { action: "soft_delete" }
  | { action: "update"; updates: UpdateVendorInput };

export type WorkOrderVendorMutationInput =
  | { action: "assign_vendor"; vendorId: string }
  | { action: "reassign_vendor"; vendorId: string }
  | {
      action: "update_vendor_status";
      assignmentStatus: VendorAssignmentStatus;
      completionNotes?: string | null;
      cancellationReason?: string | null;
    };

export function parseCreateVendorInput(payload: unknown): CreateVendorInput | null {
  if (!payload || typeof payload !== "object") return null;
  const value = payload as Record<string, unknown>;
  const businessName = readString(value["businessName"], 1, 200);
  if (!businessName) return null;

  const services = readServices(value["services"]);
  if (services === null) return null;

  return {
    businessName,
    primaryContactName: readOptionalString(value["primaryContactName"], 160),
    phone: readOptionalString(value["phone"], 40),
    email: readEmail(value["email"]),
    addressLine1: readOptionalString(value["addressLine1"], 200),
    addressLine2: readOptionalString(value["addressLine2"], 200),
    city: readOptionalString(value["city"], 120),
    stateRegion: readOptionalString(value["stateRegion"], 80),
    postalCode: readOptionalString(value["postalCode"], 20),
    countryCode: readString(value["countryCode"], 2, 2) ?? "US",
    website: readUrl(value["website"]),
    licenseNumber: readOptionalString(value["licenseNumber"], 120),
    insuranceExpiration: readDate(value["insuranceExpiration"]),
    taxIdPlaceholder: readOptionalString(value["taxIdPlaceholder"], 120),
    emergencyAvailability: readOptionalString(value["emergencyAvailability"], 500),
    afterHoursAvailability: readOptionalString(value["afterHoursAvailability"], 500),
    preferredVendor: value["preferredVendor"] === true,
    rating: readRating(value["rating"]),
    internalNotes: readOptionalString(value["internalNotes"], 4000),
    status: readVendorStatus(value["status"]) ?? "active",
    services,
    metadata: readJsonObject(value["metadata"])
  };
}

export function parseVendorMutationInput(payload: unknown): VendorMutationInput | null {
  if (!payload || typeof payload !== "object") return null;
  const value = payload as Record<string, unknown>;
  const action = value["action"];
  if (action === "archive" || action === "restore" || action === "soft_delete") {
    return { action };
  }
  if (action !== "update") return null;
  const updates = parseUpdateVendorInput(value);
  return updates ? { action: "update", updates } : null;
}

export function parseWorkOrderVendorMutationInput(payload: unknown): WorkOrderVendorMutationInput | null {
  if (!payload || typeof payload !== "object") return null;
  const value = payload as Record<string, unknown>;
  const action = value["action"];
  if (action === "assign_vendor" || action === "reassign_vendor") {
    const vendorId = readUuid(value["vendorId"]);
    return vendorId ? { action, vendorId } : null;
  }
  if (action === "update_vendor_status") {
    const assignmentStatus = readAssignmentStatus(value["assignmentStatus"]);
    if (!assignmentStatus) return null;
    return {
      action,
      assignmentStatus,
      completionNotes: readOptionalString(value["completionNotes"], 4000),
      cancellationReason: readOptionalString(value["cancellationReason"], 1000)
    };
  }
  return null;
}

export function toVendorStatusLabel(status: VendorStatus): string {
  return status[0]?.toUpperCase() + status.slice(1);
}

export function toVendorServiceLabel(service: string): string {
  return service
    .split("_")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

export function toVendorAssignmentStatusLabel(status: VendorAssignmentStatus): string {
  return status
    .split("_")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function parseUpdateVendorInput(value: Record<string, unknown>): UpdateVendorInput | null {
  const updates: UpdateVendorInput = {};
  const businessName = readString(value["businessName"], 1, 200);
  if (businessName !== null) updates.businessName = businessName;
  const primaryContactName = readOptionalString(value["primaryContactName"], 160);
  if (primaryContactName !== null) updates.primaryContactName = primaryContactName;
  if (value["phone"] !== undefined) updates.phone = readOptionalString(value["phone"], 40);
  if (value["email"] !== undefined) updates.email = readEmail(value["email"]);
  if (value["addressLine1"] !== undefined) updates.addressLine1 = readOptionalString(value["addressLine1"], 200);
  if (value["addressLine2"] !== undefined) updates.addressLine2 = readOptionalString(value["addressLine2"], 200);
  if (value["city"] !== undefined) updates.city = readOptionalString(value["city"], 120);
  if (value["stateRegion"] !== undefined) updates.stateRegion = readOptionalString(value["stateRegion"], 80);
  if (value["postalCode"] !== undefined) updates.postalCode = readOptionalString(value["postalCode"], 20);
  const countryCode = readString(value["countryCode"], 2, 2);
  if (countryCode !== null) updates.countryCode = countryCode;
  if (value["website"] !== undefined) updates.website = readUrl(value["website"]);
  if (value["licenseNumber"] !== undefined) updates.licenseNumber = readOptionalString(value["licenseNumber"], 120);
  const insuranceExpiration = readDate(value["insuranceExpiration"]);
  if (insuranceExpiration !== null || value["insuranceExpiration"] === null) {
    updates.insuranceExpiration = insuranceExpiration;
  }
  if (value["taxIdPlaceholder"] !== undefined) {
    updates.taxIdPlaceholder = readOptionalString(value["taxIdPlaceholder"], 120);
  }
  if (value["emergencyAvailability"] !== undefined) {
    updates.emergencyAvailability = readOptionalString(value["emergencyAvailability"], 500);
  }
  if (value["afterHoursAvailability"] !== undefined) {
    updates.afterHoursAvailability = readOptionalString(value["afterHoursAvailability"], 500);
  }
  if (value["preferredVendor"] !== undefined) updates.preferredVendor = value["preferredVendor"] === true;
  const rating = readRating(value["rating"]);
  if (rating !== null || value["rating"] === null) updates.rating = rating;
  if (value["internalNotes"] !== undefined) updates.internalNotes = readOptionalString(value["internalNotes"], 4000);
  const status = readVendorStatus(value["status"]);
  if (status !== null) updates.status = status;
  if (value["services"] !== undefined) {
    const services = readServices(value["services"]);
    if (services === null) return null;
    updates.services = services;
  }
  if (value["metadata"] !== undefined) updates.metadata = readJsonObject(value["metadata"]);
  return Object.keys(updates).length > 0 ? updates : null;
}

function readServices(value: unknown): string[] | null {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) return null;
  const services: string[] = [];
  for (const entry of value) {
    if (typeof entry !== "string") return null;
    const trimmed = entry.trim();
    if (!trimmed) continue;
    if (trimmed.length > 80) return null;
    services.push(trimmed);
  }
  return services;
}

function readVendorStatus(value: unknown): VendorStatus | null {
  return typeof value === "string" && VENDOR_STATUSES.includes(value as VendorStatus)
    ? (value as VendorStatus)
    : null;
}

function readAssignmentStatus(value: unknown): VendorAssignmentStatus | null {
  return typeof value === "string" && VENDOR_ASSIGNMENT_STATUSES.includes(value as VendorAssignmentStatus)
    ? (value as VendorAssignmentStatus)
    : null;
}

function readRating(value: unknown): number | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "number" || Number.isNaN(value)) return null;
  if (value < 0 || value > 5) return null;
  return Math.round(value * 100) / 100;
}

function readString(value: unknown, min: number, max: number): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length < min || trimmed.length > max) return null;
  return trimmed;
}

function readOptionalString(value: unknown, max: number): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  if (trimmed.length > max) return null;
  return trimmed;
}

function readEmail(value: unknown): string | null {
  const candidate = readOptionalString(value, 200);
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
  const candidate = readOptionalString(value, 400);
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
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}
