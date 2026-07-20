export const NOTIFICATION_CATEGORIES = [
  "maintenance",
  "messages",
  "announcements",
  "residents",
  "applicants",
  "leases",
  "financial",
  "vendors",
  "inspections",
  "emergency",
  "ai_operations",
  "system"
] as const;

export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];

export type NotificationPriority = "low" | "normal" | "high" | "emergency";

export type PushDeliveryStatus = "pending" | "sent" | "delivered" | "failed" | "skipped";

/** Legacy category aliases still accepted on read paths during transition */
const LEGACY_CATEGORY_MAP: Record<string, NotificationCategory> = {
  message: "messages",
  lease: "leases",
  announcement: "announcements",
  applicant: "applicants",
  ai: "ai_operations"
};

export function normalizeNotificationCategory(value: string): NotificationCategory | null {
  if ((NOTIFICATION_CATEGORIES as readonly string[]).includes(value)) {
    return value as NotificationCategory;
  }
  return LEGACY_CATEGORY_MAP[value] ?? null;
}

export type InAppNotificationRecord = {
  id: string;
  organizationId: string;
  userId: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  body: string;
  href: string | null;
  sourceEntityType: string | null;
  sourceEntityId: string | null;
  propertyId: string | null;
  unitId: string | null;
  readAt: string | null;
  archivedAt: string | null;
  deletedAt: string | null;
  pushDeliveryStatus: PushDeliveryStatus;
  pushExternalId: string | null;
  pushLastError: string | null;
  idempotencyKey: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type CreateInAppNotificationInput = {
  userId: string;
  category: NotificationCategory;
  title: string;
  body: string;
  priority?: NotificationPriority;
  href?: string | null;
  sourceEntityType?: string | null;
  sourceEntityId?: string | null;
  propertyId?: string | null;
  unitId?: string | null;
  idempotencyKey?: string | null;
  metadata?: Record<string, unknown>;
};

export type NotifyInput = {
  organizationId: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  body: string;
  /** Stable key for idempotency: eventType + entityId (+ occurrence) */
  eventKey: string;
  recipientUserIds: string[];
  propertyId?: string | null;
  unitId?: string | null;
  href?: string | null;
  sourceEntityType?: string | null;
  sourceEntityId?: string | null;
  metadata?: Record<string, unknown>;
  channels?: { inApp?: boolean; push?: boolean; email?: boolean };
  actorUserId?: string | null;
};

export type NotificationListOptions = {
  unreadOnly?: boolean;
  category?: NotificationCategory | "all";
  propertyId?: string;
  priority?: NotificationPriority | "critical";
  archived?: boolean;
  q?: string;
  limit?: number;
  offset?: number;
};

export type NotificationMutationInput =
  | { action: "mark_read" }
  | { action: "mark_unread" }
  | { action: "archive" }
  | { action: "unarchive" }
  | { action: "delete" };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseNotificationMutationInput(payload: unknown): NotificationMutationInput | null {
  if (!isRecord(payload) || typeof payload["action"] !== "string") return null;
  const action = payload["action"];
  if (
    action === "mark_read" ||
    action === "mark_unread" ||
    action === "archive" ||
    action === "unarchive" ||
    action === "delete"
  ) {
    return { action };
  }
  return null;
}

export function notificationCategoryLabel(category: NotificationCategory): string {
  const labels: Record<NotificationCategory, string> = {
    maintenance: "Maintenance",
    messages: "Messages",
    announcements: "Announcements",
    residents: "Residents",
    applicants: "Applicants",
    leases: "Leases",
    financial: "Financial",
    vendors: "Vendors",
    inspections: "Inspections",
    emergency: "Emergency",
    ai_operations: "AI Operations",
    system: "System"
  };
  return labels[category];
}

export function buildIdempotencyKey(
  organizationId: string,
  eventKey: string,
  recipientUserId: string
): string {
  return `${organizationId}:${eventKey}:${recipientUserId}`;
}
