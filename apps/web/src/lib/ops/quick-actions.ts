/**
 * OPS-001 Slice E — Global Quick Actions catalog + execution helpers.
 * Actions invoke domain command APIs / navigation; emit secret-free OPS events.
 */

import { createServiceRoleServerClient } from "../auth/server";
import { emitOpsDomainEvent } from "./emit";
import { createOpsTask } from "./task-engine";
import type { OpsDbClient } from "./types";

export type QuickActionContext = "command_center" | "global" | "search";

export type QuickActionDefinition = {
  actionId: string;
  label: string;
  description: string;
  href?: string;
  command?: "create_task" | "open_inbox" | "open_activity" | "open_maintenance" | "open_director";
  requiredPermissions: string[];
  contexts: Array<QuickActionContext>;
  confirm?: boolean;
};

const CATALOG: QuickActionDefinition[] = [
  {
    actionId: "create_work_order",
    label: "Create work order",
    description: "Open maintenance create flow",
    href: "/maintenance?create=1",
    requiredPermissions: ["maintenance:write", "maintenance:create"],
    contexts: ["command_center", "global", "search"]
  },
  {
    actionId: "create_task",
    label: "Create ops task",
    description: "Create a priority-aware operational task",
    command: "create_task",
    requiredPermissions: ["maintenance:write"],
    contexts: ["command_center", "global", "search"]
  },
  {
    actionId: "open_inbox",
    label: "Open Unified Inbox",
    description: "Review notifications, tasks, and AI items",
    href: "/inbox",
    command: "open_inbox",
    requiredPermissions: ["maintenance:read", "dashboard:read"],
    contexts: ["command_center", "global", "search"]
  },
  {
    actionId: "open_activity",
    label: "Open activity timeline",
    description: "Browse org operational timeline",
    href: "/activity",
    command: "open_activity",
    requiredPermissions: ["maintenance:read", "dashboard:read"],
    contexts: ["command_center", "global", "search"]
  },
  {
    actionId: "assign_follow_up",
    label: "Create follow-up task",
    description: "Create a follow-up ops task for the active org",
    command: "create_task",
    requiredPermissions: ["maintenance:write"],
    contexts: ["command_center", "search"],
    confirm: false
  },
  {
    actionId: "review_ai",
    label: "Review AI recommendations",
    description: "Open pending AI Operations Director items",
    href: "/inbox?kind=ai",
    command: "open_director",
    requiredPermissions: ["maintenance:read"],
    contexts: ["command_center", "global", "search"]
  },
  {
    actionId: "open_maintenance",
    label: "Open maintenance",
    description: "Navigate to maintenance tools",
    href: "/maintenance",
    command: "open_maintenance",
    requiredPermissions: ["maintenance:read"],
    contexts: ["command_center", "global", "search"]
  }
];

function hasAnyPermission(permissions: readonly string[], required: string[]): boolean {
  if (required.length === 0) return true;
  return required.some((p) => permissions.includes(p));
}

export function listQuickActionsForContext(input: {
  rolePlane: string;
  permissions: readonly string[];
  context: QuickActionContext;
}): QuickActionDefinition[] {
  void input.rolePlane;
  return CATALOG.filter(
    (action) =>
      action.contexts.includes(input.context) &&
      hasAnyPermission(input.permissions, action.requiredPermissions)
  );
}

export async function executeQuickAction(input: {
  organizationId: string;
  principalId: string;
  actionId: string;
  permissions: readonly string[];
  rolePlane?: string;
  title?: string;
  params?: Record<string, unknown>;
}): Promise<{ ok: true; href?: string; taskId?: string } | { ok: false; error: string }> {
  void input.rolePlane;
  const action = CATALOG.find((a) => a.actionId === input.actionId);
  if (!action) return { ok: false, error: "Unknown action" };
  if (!hasAnyPermission(input.permissions, action.requiredPermissions)) {
    return { ok: false, error: "Forbidden" };
  }

  const db = createServiceRoleServerClient() as unknown as OpsDbClient;
  const titleFromParams =
    typeof input.params?.["title"] === "string" ? String(input.params["title"]) : undefined;

  if (action.command === "create_task" || action.actionId === "assign_follow_up") {
    const { task } = await createOpsTask({
      organizationId: input.organizationId,
      title: (input.title ?? titleFromParams)?.trim() || action.label,
      priority: "high",
      subjectType: "organization",
      subjectId: input.organizationId,
      deepLink: "/dashboard#priority-tasks",
      idempotencyKey: `qa:${action.actionId}:${input.principalId}:${Date.now()}`,
      createdBy: "user",
      createdByPrincipalId: input.principalId,
      actorPrincipalId: input.principalId
    });

    await emitOpsDomainEvent(db, {
      eventType: "ops.task.created",
      organizationId: input.organizationId,
      subject: { type: "ops_task", id: task.taskId },
      actor: { actor_type: "user", principal_id: input.principalId },
      summary: `Quick action created task: ${task.title}`,
      payload: {
        summary: `Quick action created task: ${task.title}`,
        actionId: action.actionId,
        taskId: task.taskId
      }
    });

    return { ok: true, taskId: task.taskId, href: "/dashboard#priority-tasks" };
  }

  await emitOpsDomainEvent(db, {
    eventType: "ops.quick_action.invoked",
    organizationId: input.organizationId,
    subject: { type: "ops_quick_action", id: action.actionId },
    actor: { actor_type: "user", principal_id: input.principalId },
    summary: `Quick action invoked: ${action.label}`,
    payload: {
      summary: `Quick action invoked: ${action.label}`,
      actionId: action.actionId,
      href: action.href ?? null
    }
  }).catch(() => undefined);

  return action.href ? { ok: true, href: action.href } : { ok: true };
}

/** Search Commands corpus entries for Global Search. */
export function searchQuickActionCommands(input: {
  query: string;
  permissions: readonly string[];
}): Array<{ actionId: string; title: string; snippet: string; href: string }> {
  const q = input.query.trim().toLowerCase();
  return listQuickActionsForContext({
    rolePlane: "ops",
    permissions: input.permissions,
    context: "search"
  })
    .filter(
      (a) =>
        !q ||
        a.label.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.actionId.includes(q)
    )
    .map((a) => ({
      actionId: a.actionId,
      title: a.label,
      snippet: a.description,
      href: a.href ?? `/api/ops/quick-actions?actionId=${a.actionId}`
    }));
}
