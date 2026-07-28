/**
 * OPS-001 Slice E — Unified Inbox aggregation.
 * Composes notifications, tasks, AI recommendations (A–D). No parallel bus.
 */

import {
  getNotificationsForUser,
  mutateNotification
} from "../notifications/server";
import { listAiRecommendations } from "./ai-director";
import { listOpsTasksByPriority } from "./task-engine";
import type { OpsDbClient } from "./types";

export type InboxItemKind =
  | "notification"
  | "task"
  | "ai"
  | "system"
  | "announcement"
  | "thread";

export type UnifiedInboxItem = {
  itemId: string;
  organizationId: string;
  recipientPrincipalId: string;
  kind: InboxItemKind;
  refId: string;
  title: string;
  preview: string;
  priority: string;
  readAt: string | null;
  archivedAt: string | null;
  occurredAt: string;
  deepLink: string | null;
  assignmentState: string | null;
  status: string | null;
};

export type UnifiedInboxFilters = {
  organizationId: string;
  principalId: string;
  kind?: InboxItemKind | "all";
  status?: "all" | "open" | "read" | "unread";
  unreadOnly?: boolean;
  assignedToMe?: boolean;
  limit?: number;
};

function mapNotifyPriority(priority: string | null | undefined): string {
  if (priority === "emergency" || priority === "high") return priority;
  if (priority === "low") return "low";
  return "normal";
}

/**
 * Aggregate per-principal inbox from existing A–D substrates (on-demand; org-scoped).
 */
export async function listUnifiedInbox(
  input: UnifiedInboxFilters,
  _client?: OpsDbClient
): Promise<{ items: UnifiedInboxItem[]; unreadCount: number }> {
  void _client;
  const limit = input.limit ?? 80;
  const kindFilter = input.kind && input.kind !== "all" ? input.kind : null;
  const unreadOnly =
    input.unreadOnly === true || input.status === "unread";

  const items: UnifiedInboxItem[] = [];

  if (!kindFilter || kindFilter === "notification" || kindFilter === "announcement" || kindFilter === "system") {
    const summary = await getNotificationsForUser(input.organizationId, input.principalId, {
      limit: Math.min(limit, 50),
      unreadOnly
    });
    for (const n of summary.items) {
      let kind: InboxItemKind = "notification";
      if (n.category === "announcements") kind = "announcement";
      if (n.category === "system" || n.category === "emergency") kind = "system";
      if (kindFilter === "announcement" && kind !== "announcement") continue;
      if (kindFilter === "system" && kind !== "system") continue;
      if (kindFilter === "notification" && kind !== "notification") continue;
      items.push({
        itemId: `notification:${n.id}`,
        organizationId: input.organizationId,
        recipientPrincipalId: input.principalId,
        kind,
        refId: n.id,
        title: n.title,
        preview: n.body?.slice(0, 180) ?? n.title,
        priority: mapNotifyPriority(n.priority),
        readAt: n.readAt,
        archivedAt: n.archivedAt,
        occurredAt: n.createdAt,
        deepLink: n.href ?? "/inbox",
        assignmentState: null,
        status: n.readAt ? "read" : "unread"
      });
    }
  }

  if (!kindFilter || kindFilter === "task") {
    const tasks = await listOpsTasksByPriority({
      organizationId: input.organizationId,
      status: ["open", "in_progress", "blocked"],
      limit: 40
    });
    for (const task of tasks) {
      const assignedToMe =
        task.ownerPrincipalId === input.principalId ||
        (task.followers ?? []).includes(input.principalId);
      const unassigned = task.ownerPrincipalId == null;
      if (input.assignedToMe && !assignedToMe) continue;
      if (!input.assignedToMe && !assignedToMe && !unassigned) continue;
      const isUnread = task.status === "open" || task.status === "blocked";
      if (unreadOnly && !isUnread) continue;
      if (input.status === "open" && task.status !== "open" && task.status !== "in_progress") {
        continue;
      }
      if (input.status === "read" && isUnread) continue;
      items.push({
        itemId: `task:${task.taskId}`,
        organizationId: input.organizationId,
        recipientPrincipalId: input.principalId,
        kind: "task",
        refId: task.taskId,
        title: task.title,
        preview: `Priority ${task.priority} · ${task.status}`,
        priority: task.priority,
        readAt: isUnread ? null : task.updatedAt,
        archivedAt: null,
        occurredAt: task.updatedAt ?? task.createdAt,
        deepLink: task.deepLink ?? "/dashboard#priority-tasks",
        assignmentState: assignedToMe
          ? "assigned_to_me"
          : unassigned
            ? "unassigned"
            : "assigned",
        status: task.status
      });
    }
  }

  if (!kindFilter || kindFilter === "ai") {
    const recs = await listAiRecommendations({
      organizationId: input.organizationId,
      status: ["pending", "approved"],
      limit: 30
    });
    for (const rec of recs) {
      if (unreadOnly && rec.status !== "pending") continue;
      if (input.status === "read" && rec.status === "pending") continue;
      if (input.status === "open" && rec.status !== "pending") continue;
      items.push({
        itemId: `ai:${rec.recommendationId}`,
        organizationId: input.organizationId,
        recipientPrincipalId: input.principalId,
        kind: "ai",
        refId: rec.recommendationId,
        title: rec.title,
        preview: rec.summary.slice(0, 180),
        priority: rec.confidenceBand === "high" ? "high" : "normal",
        readAt: rec.status === "pending" ? null : rec.approvedAt,
        archivedAt: null,
        occurredAt: rec.createdAt,
        deepLink: rec.deepLink ?? "/inbox?kind=ai",
        assignmentState: rec.requiresHumanGate ? "needs_approval" : null,
        status: rec.status
      });
    }
  }

  items.sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : a.occurredAt > b.occurredAt ? -1 : 0));
  const sliced = items.slice(0, limit);
  const unreadCount = sliced.filter((i) => !i.readAt).length;
  return { items: sliced, unreadCount };
}

export async function markInboxItemRead(input: {
  organizationId: string;
  principalId: string;
  sourceId: string;
  read?: boolean;
}): Promise<boolean> {
  const notificationPrefix = "notification:";
  if (!input.sourceId.startsWith(notificationPrefix)) {
    // Tasks / AI use their own status transitions; notification read is the mutable stream.
    return false;
  }
  const notificationId = input.sourceId.slice(notificationPrefix.length);
  await mutateNotification(input.organizationId, input.principalId, notificationId, {
    action: input.read === false ? "mark_unread" : "mark_read"
  });
  return true;
}

export async function markInboxNotificationRead(input: {
  organizationId: string;
  principalId: string;
  notificationId: string;
}): Promise<void> {
  await mutateNotification(input.organizationId, input.principalId, input.notificationId, {
    action: "mark_read"
  });
}
