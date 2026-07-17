export const NOTIFICATION_CATEGORIES = [
  "message",
  "maintenance",
  "lease",
  "financial",
  "announcement",
  "applicant",
  "ai"
] as const;

export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];

export type InAppNotificationRecord = {
  id: string;
  organizationId: string;
  userId: string;
  category: NotificationCategory;
  title: string;
  body: string;
  href: string | null;
  sourceEntityType: string | null;
  sourceEntityId: string | null;
  readAt: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type CreateInAppNotificationInput = {
  userId: string;
  category: NotificationCategory;
  title: string;
  body: string;
  href?: string | null;
  sourceEntityType?: string | null;
  sourceEntityId?: string | null;
  metadata?: Record<string, unknown>;
};

export type NotificationListOptions = {
  unreadOnly?: boolean;
  category?: NotificationCategory | "all";
  limit?: number;
  offset?: number;
};

export type NotificationMutationInput = { action: "mark_read" } | { action: "mark_unread" };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseNotificationMutationInput(payload: unknown): NotificationMutationInput | null {
  if (!isRecord(payload) || typeof payload["action"] !== "string") return null;
  if (payload["action"] === "mark_read" || payload["action"] === "mark_unread") {
    return { action: payload["action"] };
  }
  return null;
}

export function notificationCategoryLabel(category: NotificationCategory): string {
  const labels: Record<NotificationCategory, string> = {
    message: "Message",
    maintenance: "Maintenance",
    lease: "Lease",
    financial: "Financial",
    announcement: "Announcement",
    applicant: "Applicant",
    ai: "AI"
  };
  return labels[category];
}
