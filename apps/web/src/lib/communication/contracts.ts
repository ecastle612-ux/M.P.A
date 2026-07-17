export const ANNOUNCEMENT_STATUSES = ["draft", "scheduled", "published", "archived"] as const;
export const ANNOUNCEMENT_PRIORITIES = ["normal", "high", "emergency"] as const;
export const ANNOUNCEMENT_CATEGORIES = ["general", "community", "emergency", "maintenance", "lease"] as const;
export const ANNOUNCEMENT_TARGETING_SCOPES = [
  "organization",
  "property",
  "building",
  "floor",
  "unit",
  "lease",
  "tenant",
  "selected_residents"
] as const;
export const DELIVERY_CHANNELS = ["in_app", "push", "email", "sms"] as const;
export const DELIVERY_STATUSES = ["pending", "delivered", "failed", "placeholder"] as const;

export type AnnouncementStatus = (typeof ANNOUNCEMENT_STATUSES)[number];
export type AnnouncementPriority = (typeof ANNOUNCEMENT_PRIORITIES)[number];
export type AnnouncementCategory = (typeof ANNOUNCEMENT_CATEGORIES)[number];
export type AnnouncementTargetingScope = (typeof ANNOUNCEMENT_TARGETING_SCOPES)[number];
export type DeliveryChannel = (typeof DELIVERY_CHANNELS)[number];
export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];

export type AnnouncementRecord = {
  id: string;
  organizationId: string;
  title: string;
  message: string;
  priority: AnnouncementPriority;
  category: AnnouncementCategory;
  status: AnnouncementStatus;
  targetingScope: AnnouncementTargetingScope;
  targetPropertyId: string | null;
  targetBuilding: string | null;
  targetFloorPlaceholder: string | null;
  targetUnitId: string | null;
  targetLeaseId: string | null;
  targetTenantId: string | null;
  selectedTenantIds: string[];
  attachmentPlaceholder: string | null;
  requiresAcknowledgment: boolean;
  scheduledAt: string | null;
  publishedAt: string | null;
  expiresAt: string | null;
  recipientCount: number;
  readCount: number;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  deletedAt: string | null;
};

export type AnnouncementRecipientRecord = {
  id: string;
  organizationId: string;
  announcementId: string;
  tenantId: string | null;
  userId: string | null;
  deliveryChannel: DeliveryChannel;
  deliveryStatus: DeliveryStatus;
  deliveredAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AnnouncementReadRecord = {
  id: string;
  organizationId: string;
  announcementId: string;
  recipientId: string;
  userId: string;
  readAt: string;
  acknowledgedAt: string | null;
  createdAt: string;
};

export type BuildingQrCodeRecord = {
  id: string;
  organizationId: string;
  propertyId: string;
  qrToken: string;
  label: string;
  buildingName: string | null;
  isActive: boolean;
  enrollmentCount: number;
  lastScannedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type NotificationPreferencesRecord = {
  id: string;
  organizationId: string;
  userId: string;
  tenantId: string | null;
  propertyId: string | null;
  inAppEnabled: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  categoryPreferences: Record<string, boolean>;
  quietHours: Record<string, unknown>;
  languageCode: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateAnnouncementInput = {
  title: string;
  message: string;
  priority?: AnnouncementPriority;
  category?: AnnouncementCategory;
  targetingScope?: AnnouncementTargetingScope;
  targetPropertyId?: string | null;
  targetBuilding?: string | null;
  targetFloorPlaceholder?: string | null;
  targetUnitId?: string | null;
  targetLeaseId?: string | null;
  targetTenantId?: string | null;
  selectedTenantIds?: string[];
  attachmentPlaceholder?: string | null;
  requiresAcknowledgment?: boolean;
  scheduledAt?: string | null;
  expiresAt?: string | null;
};

export type UpdateAnnouncementInput = Partial<CreateAnnouncementInput>;

export type AnnouncementMutationInput =
  | { action: "archive" }
  | { action: "restore" }
  | { action: "soft_delete" }
  | { action: "duplicate" }
  | { action: "update"; updates: UpdateAnnouncementInput }
  | { action: "publish_now" }
  | { action: "schedule"; scheduledAt: string }
  | { action: "mark_read"; acknowledged?: boolean };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function readOptionalUuid(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return typeof value === "string" && value.length > 0 ? value : null;
}

function readStringArray(value: unknown): string[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.length > 0);
}

export function parseCreateAnnouncementInput(payload: unknown): CreateAnnouncementInput | null {
  if (!isRecord(payload)) return null;
  const title = readString(payload["title"]);
  const message = readString(payload["message"]);
  if (!title || !message) return null;

  const input: CreateAnnouncementInput = { title, message };
  if (
    typeof payload["priority"] === "string" &&
    ANNOUNCEMENT_PRIORITIES.includes(payload["priority"] as AnnouncementPriority)
  ) {
    input.priority = payload["priority"] as AnnouncementPriority;
  }
  if (
    typeof payload["category"] === "string" &&
    ANNOUNCEMENT_CATEGORIES.includes(payload["category"] as AnnouncementCategory)
  ) {
    input.category = payload["category"] as AnnouncementCategory;
  }
  if (
    typeof payload["targetingScope"] === "string" &&
    ANNOUNCEMENT_TARGETING_SCOPES.includes(payload["targetingScope"] as AnnouncementTargetingScope)
  ) {
    input.targetingScope = payload["targetingScope"] as AnnouncementTargetingScope;
  }
  const targetPropertyId = readOptionalUuid(payload["targetPropertyId"]);
  if (targetPropertyId !== undefined) input.targetPropertyId = targetPropertyId;
  const targetBuilding = readString(payload["targetBuilding"]);
  if (targetBuilding !== null) input.targetBuilding = targetBuilding;
  const targetFloorPlaceholder = readString(payload["targetFloorPlaceholder"]);
  if (targetFloorPlaceholder !== null) input.targetFloorPlaceholder = targetFloorPlaceholder;
  const targetUnitId = readOptionalUuid(payload["targetUnitId"]);
  if (targetUnitId !== undefined) input.targetUnitId = targetUnitId;
  const targetLeaseId = readOptionalUuid(payload["targetLeaseId"]);
  if (targetLeaseId !== undefined) input.targetLeaseId = targetLeaseId;
  const targetTenantId = readOptionalUuid(payload["targetTenantId"]);
  if (targetTenantId !== undefined) input.targetTenantId = targetTenantId;
  const selectedTenantIds = readStringArray(payload["selectedTenantIds"]);
  if (selectedTenantIds !== undefined) input.selectedTenantIds = selectedTenantIds;
  const attachmentPlaceholder = readString(payload["attachmentPlaceholder"]);
  if (attachmentPlaceholder !== null) input.attachmentPlaceholder = attachmentPlaceholder;
  if (typeof payload["requiresAcknowledgment"] === "boolean") {
    input.requiresAcknowledgment = payload["requiresAcknowledgment"];
  }
  const scheduledAt = readString(payload["scheduledAt"]);
  if (scheduledAt !== null) input.scheduledAt = scheduledAt;
  const expiresAt = readString(payload["expiresAt"]);
  if (expiresAt !== null) input.expiresAt = expiresAt;
  return input;
}

export function parseAnnouncementMutationInput(payload: unknown): AnnouncementMutationInput | null {
  if (!isRecord(payload) || typeof payload["action"] !== "string") return null;
  switch (payload["action"]) {
    case "archive":
    case "restore":
    case "soft_delete":
    case "duplicate":
    case "publish_now":
      return { action: payload["action"] };
    case "schedule": {
      const scheduledAt = readString(payload["scheduledAt"]);
      if (!scheduledAt) return null;
      return { action: "schedule", scheduledAt };
    }
    case "mark_read": {
      const result: Extract<AnnouncementMutationInput, { action: "mark_read" }> = { action: "mark_read" };
      if (typeof payload["acknowledged"] === "boolean") {
        result.acknowledged = payload["acknowledged"];
      }
      return result;
    }
    case "update": {
      const updatesPayload = payload["updates"];
      if (!isRecord(updatesPayload)) return null;
      const updates = parseCreateAnnouncementInput({
        ...updatesPayload,
        title: updatesPayload["title"] ?? "x",
        message: updatesPayload["message"] ?? "x"
      });
      if (!updates) return null;
      const { title: _t, message: _m, ...rest } = updates;
      void _t;
      void _m;
      const patch: UpdateAnnouncementInput = { ...rest };
      const titlePatch = readString(updatesPayload["title"]);
      if (titlePatch !== null) patch.title = titlePatch;
      const messagePatch = readString(updatesPayload["message"]);
      if (messagePatch !== null) patch.message = messagePatch;
      return { action: "update", updates: patch };
    }
    default:
      return null;
  }
}

export function announcementStatusLabel(status: AnnouncementStatus): string {
  const labels: Record<AnnouncementStatus, string> = {
    draft: "Draft",
    scheduled: "Scheduled",
    published: "Published",
    archived: "Archived"
  };
  return labels[status];
}

export function announcementPriorityLabel(priority: AnnouncementPriority): string {
  const labels: Record<AnnouncementPriority, string> = {
    normal: "Normal",
    high: "High",
    emergency: "Emergency"
  };
  return labels[priority];
}

export function announcementCategoryLabel(category: AnnouncementCategory): string {
  const labels: Record<AnnouncementCategory, string> = {
    general: "General",
    community: "Community",
    emergency: "Emergency",
    maintenance: "Maintenance",
    lease: "Lease"
  };
  return labels[category];
}
