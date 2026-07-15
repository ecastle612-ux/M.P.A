export const MAINTENANCE_CATEGORIES = [
  "general",
  "plumbing",
  "electrical",
  "hvac",
  "appliance",
  "structural",
  "landscaping",
  "pest",
  "other"
] as const;

export const MAINTENANCE_PRIORITIES = ["low", "medium", "high", "emergency"] as const;

export const MAINTENANCE_STATUSES = [
  "submitted",
  "triaged",
  "assigned",
  "in_progress",
  "on_hold",
  "completed",
  "cancelled"
] as const;

export type MaintenanceCategory = (typeof MAINTENANCE_CATEGORIES)[number];
export type MaintenancePriority = (typeof MAINTENANCE_PRIORITIES)[number];
export type MaintenanceStatus = (typeof MAINTENANCE_STATUSES)[number];

export type WorkOrderRecord = {
  id: string;
  organizationId: string;
  propertyId: string;
  unitId: string | null;
  tenantId: string | null;
  workOrderNumber: string;
  title: string;
  description: string | null;
  category: MaintenanceCategory;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  dueDate: string | null;
  assignedToUserId: string | null;
  vendorId: string | null;
  currentVendorAssignmentId: string | null;
  internalNotes: string | null;
  tenantNotes: string | null;
  photoPlaceholder: string | null;
  documentPlaceholder: string | null;
  recurringMaintenancePlaceholder: string | null;
  preventiveMaintenancePlaceholder: string | null;
  completedAt: string | null;
  metadata: Record<string, unknown>;
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  deletedAt: string | null;
};

export type CreateWorkOrderInput = {
  propertyId: string;
  unitId: string | null;
  tenantId: string | null;
  title: string;
  description: string | null;
  category: MaintenanceCategory;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  dueDate: string | null;
  assignedToUserId: string | null;
  internalNotes: string | null;
  tenantNotes: string | null;
  photoPlaceholder: string | null;
  documentPlaceholder: string | null;
  recurringMaintenancePlaceholder: string | null;
  preventiveMaintenancePlaceholder: string | null;
  metadata: Record<string, unknown>;
};

export type UpdateWorkOrderInput = Partial<CreateWorkOrderInput> & {
  status?: MaintenanceStatus;
};

export type WorkOrderMutationInput =
  | { action: "archive" }
  | { action: "restore" }
  | { action: "soft_delete" }
  | { action: "update"; updates: UpdateWorkOrderInput };

export type MaintenanceActivityEvent = {
  id: string;
  organizationId: string;
  workOrderId: string;
  eventType: string;
  summary: string;
  details: Record<string, unknown>;
  actorUserId: string | null;
  createdAt: string;
};

export function parseCreateWorkOrderInput(payload: unknown): CreateWorkOrderInput | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const value = payload as Record<string, unknown>;
  const propertyId = readUuid(value["propertyId"]);
  const title = readString(value["title"], 1, 200);
  if (!propertyId || !title) {
    return null;
  }

  const category = readCategory(value["category"]) ?? "general";
  const priority = readPriority(value["priority"]) ?? "medium";
  const status = readStatus(value["status"]) ?? "submitted";

  return {
    propertyId,
    unitId: readUuid(value["unitId"]),
    tenantId: readUuid(value["tenantId"]),
    title,
    description: readOptionalString(value["description"], 4000),
    category,
    priority,
    status,
    dueDate: readDate(value["dueDate"]),
    assignedToUserId: readUuid(value["assignedToUserId"]),
    internalNotes: readOptionalString(value["internalNotes"], 4000),
    tenantNotes: readOptionalString(value["tenantNotes"], 4000),
    photoPlaceholder: readOptionalString(value["photoPlaceholder"], 2000),
    documentPlaceholder: readOptionalString(value["documentPlaceholder"], 2000),
    recurringMaintenancePlaceholder: readOptionalString(value["recurringMaintenancePlaceholder"], 2000),
    preventiveMaintenancePlaceholder: readOptionalString(value["preventiveMaintenancePlaceholder"], 2000),
    metadata: readJsonObject(value["metadata"])
  };
}

export function parseWorkOrderMutationInput(payload: unknown): WorkOrderMutationInput | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const value = payload as Record<string, unknown>;
  const action = value["action"];
  if (action === "archive" || action === "restore" || action === "soft_delete") {
    return { action };
  }

  if (action !== "update") {
    return null;
  }

  const updates = parseUpdateWorkOrderInput(value);
  if (!updates) {
    return null;
  }
  return { action: "update", updates };
}

export function isMaintenanceStatus(value: unknown): value is MaintenanceStatus {
  return typeof value === "string" && MAINTENANCE_STATUSES.includes(value as MaintenanceStatus);
}

export function isMaintenancePriority(value: unknown): value is MaintenancePriority {
  return typeof value === "string" && MAINTENANCE_PRIORITIES.includes(value as MaintenancePriority);
}

export function toMaintenanceStatusLabel(status: MaintenanceStatus): string {
  return status
    .split("_")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

export function toMaintenancePriorityLabel(priority: MaintenancePriority): string {
  return priority[0]?.toUpperCase() + priority.slice(1);
}

export function toMaintenanceCategoryLabel(category: MaintenanceCategory): string {
  return category[0]?.toUpperCase() + category.slice(1);
}

function parseUpdateWorkOrderInput(value: Record<string, unknown>): UpdateWorkOrderInput | null {
  const updates: UpdateWorkOrderInput = {};

  const propertyId = readUuid(value["propertyId"]);
  if (propertyId !== null) updates.propertyId = propertyId;

  if (value["unitId"] === null) {
    updates.unitId = null;
  } else {
    const unitId = readUuid(value["unitId"]);
    if (unitId !== null) updates.unitId = unitId;
  }

  if (value["tenantId"] === null) {
    updates.tenantId = null;
  } else {
    const tenantId = readUuid(value["tenantId"]);
    if (tenantId !== null) updates.tenantId = tenantId;
  }

  const title = readString(value["title"], 1, 200);
  if (title !== null) updates.title = title;

  if (value["description"] !== undefined) {
    updates.description = readOptionalString(value["description"], 4000);
  }

  const category = readCategory(value["category"]);
  if (category !== null) updates.category = category;

  const priority = readPriority(value["priority"]);
  if (priority !== null) updates.priority = priority;

  const status = readStatus(value["status"]);
  if (status !== null) updates.status = status;

  const dueDate = readDate(value["dueDate"]);
  if (dueDate !== null || value["dueDate"] === null) {
    updates.dueDate = dueDate;
  }

  if (value["assignedToUserId"] === null) {
    updates.assignedToUserId = null;
  } else {
    const assignedToUserId = readUuid(value["assignedToUserId"]);
    if (assignedToUserId !== null) updates.assignedToUserId = assignedToUserId;
  }

  if (value["internalNotes"] !== undefined) {
    updates.internalNotes = readOptionalString(value["internalNotes"], 4000);
  }
  if (value["tenantNotes"] !== undefined) {
    updates.tenantNotes = readOptionalString(value["tenantNotes"], 4000);
  }
  if (value["photoPlaceholder"] !== undefined) {
    updates.photoPlaceholder = readOptionalString(value["photoPlaceholder"], 2000);
  }
  if (value["documentPlaceholder"] !== undefined) {
    updates.documentPlaceholder = readOptionalString(value["documentPlaceholder"], 2000);
  }
  if (value["recurringMaintenancePlaceholder"] !== undefined) {
    updates.recurringMaintenancePlaceholder = readOptionalString(value["recurringMaintenancePlaceholder"], 2000);
  }
  if (value["preventiveMaintenancePlaceholder"] !== undefined) {
    updates.preventiveMaintenancePlaceholder = readOptionalString(value["preventiveMaintenancePlaceholder"], 2000);
  }

  if (value["metadata"] !== undefined) {
    updates.metadata = readJsonObject(value["metadata"]);
  }

  return Object.keys(updates).length > 0 ? updates : null;
}

function readCategory(value: unknown): MaintenanceCategory | null {
  return typeof value === "string" && MAINTENANCE_CATEGORIES.includes(value as MaintenanceCategory)
    ? (value as MaintenanceCategory)
    : null;
}

function readPriority(value: unknown): MaintenancePriority | null {
  return typeof value === "string" && MAINTENANCE_PRIORITIES.includes(value as MaintenancePriority)
    ? (value as MaintenancePriority)
    : null;
}

function readStatus(value: unknown): MaintenanceStatus | null {
  return typeof value === "string" && MAINTENANCE_STATUSES.includes(value as MaintenanceStatus)
    ? (value as MaintenanceStatus)
    : null;
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

function readDate(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? trimmed : null;
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
