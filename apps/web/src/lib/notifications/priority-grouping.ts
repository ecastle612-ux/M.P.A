/**
 * UX-016 Slice D — map existing in-app notifications into Critical / Today / Later.
 * Presentation only; no schema or delivery changes.
 */

import type { InAppNotificationRecord, NotificationCategory, NotificationPriority } from "./contracts";

export type NotificationPriorityGroup = "critical" | "today" | "later";

export const NOTIFICATION_PRIORITY_GROUP_ORDER: NotificationPriorityGroup[] = [
  "critical",
  "today",
  "later"
];

export function notificationPriorityGroupLabel(group: NotificationPriorityGroup): string {
  if (group === "critical") return "Critical";
  if (group === "today") return "Today";
  return "Later";
}

const CRITICAL_CATEGORIES = new Set<NotificationCategory>([
  "emergency",
  "maintenance",
  "financial",
  "inspections"
]);

function startOfLocalDay(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function isSameLocalDay(value: string, now: Date): boolean {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return date >= startOfLocalDay(now);
}

/**
 * Design-only mapping from existing priority + category + recency.
 * Critical = act now; Today = actionable this workday; Later = deferrable.
 */
export function notificationPriorityGroup(
  notification: Pick<InAppNotificationRecord, "priority" | "category" | "createdAt">,
  now: Date = new Date()
): NotificationPriorityGroup {
  const priority = notification.priority as NotificationPriority;
  const category = notification.category;

  if (priority === "emergency" || category === "emergency") {
    return "critical";
  }

  if (priority === "high" && CRITICAL_CATEGORIES.has(category)) {
    return "critical";
  }

  if (priority === "low" || category === "announcements" || category === "system") {
    return isSameLocalDay(notification.createdAt, now) && priority === "high" ? "today" : "later";
  }

  if (priority === "high") {
    return "today";
  }

  if (isSameLocalDay(notification.createdAt, now)) {
    return "today";
  }

  return "later";
}

export function groupNotificationsByPriority<T extends Pick<InAppNotificationRecord, "priority" | "category" | "createdAt">>(
  items: T[],
  now: Date = new Date()
): Record<NotificationPriorityGroup, T[]> {
  const groups: Record<NotificationPriorityGroup, T[]> = {
    critical: [],
    today: [],
    later: []
  };

  for (const item of items) {
    groups[notificationPriorityGroup(item, now)].push(item);
  }

  return groups;
}
