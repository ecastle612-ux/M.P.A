import { createServiceRoleServerClient } from "../auth/server";
import { emitOpsDomainEvent } from "./emit";
import {
  compareTasksByPriorityThenDue,
  type OpsPriority,
  resolveOpsPriority
} from "./priority-engine";
import type { OpsDbClient } from "./types";

export type OpsTaskStatus = "open" | "in_progress" | "blocked" | "done" | "canceled";

export type OpsTaskRecord = {
  taskId: string;
  organizationId: string;
  title: string;
  description: string | null;
  priority: OpsPriority;
  status: OpsTaskStatus;
  dueAt: string | null;
  ownerPrincipalId: string | null;
  followers: string[];
  dependencyTaskIds: string[];
  subjectType: string;
  subjectId: string;
  deepLink: string | null;
  sourceEventId: string | null;
  workflowInstanceId: string | null;
  workflowStepId: string | null;
  idempotencyKey: string;
  createdBy: string;
  attemptCount: number;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
};

function serviceClient(): OpsDbClient {
  return createServiceRoleServerClient() as unknown as OpsDbClient;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

function mapRow(row: Record<string, unknown>): OpsTaskRecord {
  return {
    taskId: String(row["task_id"]),
    organizationId: String(row["organization_id"]),
    title: String(row["title"]),
    description: typeof row["description"] === "string" ? row["description"] : null,
    priority: row["priority"] as OpsPriority,
    status: row["status"] as OpsTaskStatus,
    dueAt: typeof row["due_at"] === "string" ? row["due_at"] : null,
    ownerPrincipalId:
      typeof row["owner_principal_id"] === "string" ? row["owner_principal_id"] : null,
    followers: asStringArray(row["followers"]),
    dependencyTaskIds: asStringArray(row["dependency_task_ids"]),
    subjectType: String(row["subject_type"]),
    subjectId: String(row["subject_id"]),
    deepLink: typeof row["deep_link"] === "string" ? row["deep_link"] : null,
    sourceEventId: typeof row["source_event_id"] === "string" ? row["source_event_id"] : null,
    workflowInstanceId:
      typeof row["workflow_instance_id"] === "string" ? row["workflow_instance_id"] : null,
    workflowStepId: typeof row["workflow_step_id"] === "string" ? row["workflow_step_id"] : null,
    idempotencyKey: String(row["idempotency_key"]),
    createdBy: String(row["created_by"] ?? "system"),
    attemptCount: Number(row["attempt_count"] ?? 0),
    createdAt: String(row["created_at"]),
    updatedAt: String(row["updated_at"]),
    completedAt: typeof row["completed_at"] === "string" ? row["completed_at"] : null
  };
}

export type CreateOpsTaskInput = {
  organizationId: string;
  title: string;
  description?: string | null;
  priority?: OpsPriority | string | null;
  safetyText?: string | null;
  eventType?: string | null;
  inheritedPriority?: OpsPriority | null;
  dueAt?: string | null;
  ownerPrincipalId?: string | null;
  followers?: string[];
  dependencyTaskIds?: string[];
  subjectType: string;
  subjectId: string;
  deepLink?: string | null;
  sourceEventId?: string | null;
  workflowInstanceId?: string | null;
  workflowStepId?: string | null;
  idempotencyKey: string;
  createdBy?: "system" | "automation" | "user" | "workflow";
  createdByPrincipalId?: string | null;
  actorPrincipalId?: string | null;
  correlationId?: string | null;
  emitEvent?: boolean;
};

/**
 * Create an org-scoped task. Retry-safe: same (organizationId, idempotencyKey) returns existing row.
 */
export async function createOpsTask(
  input: CreateOpsTaskInput,
  client?: OpsDbClient
): Promise<{ task: OpsTaskRecord; created: boolean }> {
  const db = client ?? serviceClient();
  const priority = resolveOpsPriority({
    eventType: input.eventType,
    domainPriority: input.priority,
    safetyText: input.safetyText ?? input.title,
    inherited: input.inheritedPriority
  });

  const { data: existing } = await db
    .from("ops_tasks")
    .select("*")
    .eq("organization_id", input.organizationId)
    .eq("idempotency_key", input.idempotencyKey)
    .maybeSingle();

  if (existing) {
    return { task: mapRow(existing as Record<string, unknown>), created: false };
  }

  const insertRow = {
    organization_id: input.organizationId,
    title: input.title,
    description: input.description ?? null,
    priority,
    status: "open",
    due_at: input.dueAt ?? null,
    owner_principal_id: input.ownerPrincipalId ?? null,
    followers: input.followers ?? [],
    dependency_task_ids: input.dependencyTaskIds ?? [],
    subject_type: input.subjectType,
    subject_id: input.subjectId,
    deep_link: input.deepLink ?? null,
    source_event_id: input.sourceEventId ?? null,
    workflow_instance_id: input.workflowInstanceId ?? null,
    workflow_step_id: input.workflowStepId ?? null,
    idempotency_key: input.idempotencyKey,
    created_by: input.createdBy ?? "system",
    created_by_principal_id: input.createdByPrincipalId ?? null
  };

  const { data, error } = await db.from("ops_tasks").insert(insertRow).select("*").single();
  if (error) {
    // Concurrent insert race → fetch existing
    const { data: raced } = await db
      .from("ops_tasks")
      .select("*")
      .eq("organization_id", input.organizationId)
      .eq("idempotency_key", input.idempotencyKey)
      .maybeSingle();
    if (raced) return { task: mapRow(raced as Record<string, unknown>), created: false };
    throw new Error(error.message ?? "Failed to create ops task");
  }

  const task = mapRow(data as Record<string, unknown>);

  if (input.emitEvent !== false) {
    await emitOpsDomainEvent(db, {
      eventType: "ops.task.created",
      organizationId: input.organizationId,
      subject: { type: "ops_task", id: task.taskId },
      actor: {
        actor_type: input.actorPrincipalId ? "user" : "system",
        principal_id: input.actorPrincipalId ?? null
      },
      summary: `Task created: ${task.title}`,
      payload: {
        summary: `Task created: ${task.title}`,
        taskId: task.taskId,
        priority: task.priority,
        status: task.status,
        subjectType: task.subjectType,
        subjectId: task.subjectId,
        href: task.deepLink
      },
      correlationId: input.correlationId ?? input.sourceEventId ?? task.taskId,
      causationId: input.sourceEventId ?? null
    });
  }

  return { task, created: true };
}

export type TransitionOpsTaskInput = {
  organizationId: string;
  taskId: string;
  toStatus: OpsTaskStatus;
  actorPrincipalId?: string | null;
  correlationId?: string | null;
};

const ALLOWED: Record<OpsTaskStatus, OpsTaskStatus[]> = {
  open: ["in_progress", "blocked", "done", "canceled"],
  in_progress: ["blocked", "done", "canceled", "open"],
  blocked: ["open", "in_progress", "canceled"],
  done: [],
  canceled: []
};

/**
 * Transition task status with retry-safe attempt increment. Emits ops.task.completed on done.
 */
export async function transitionOpsTask(
  input: TransitionOpsTaskInput,
  client?: OpsDbClient
): Promise<OpsTaskRecord> {
  const db = client ?? serviceClient();
  const { data: row, error } = await db
    .from("ops_tasks")
    .select("*")
    .eq("organization_id", input.organizationId)
    .eq("task_id", input.taskId)
    .maybeSingle();

  if (error || !row) throw new Error(error?.message ?? "Task not found");
  const current = mapRow(row as Record<string, unknown>);
  if (current.status === input.toStatus) return current;

  const allowed = ALLOWED[current.status] ?? [];
  if (!allowed.includes(input.toStatus)) {
    throw new Error(`Invalid task transition ${current.status} → ${input.toStatus}`);
  }

  const now = new Date().toISOString();
  const patch: Record<string, unknown> = {
    status: input.toStatus,
    updated_at: now,
    attempt_count: current.attemptCount + 1
  };
  if (input.toStatus === "done") patch["completed_at"] = now;
  if (input.toStatus === "canceled") patch["canceled_at"] = now;

  const { data: updated, error: updateError } = await db
    .from("ops_tasks")
    .update(patch)
    .eq("organization_id", input.organizationId)
    .eq("task_id", input.taskId)
    .eq("status", current.status)
    .select("*")
    .maybeSingle();

  if (updateError || !updated) {
    throw new Error(updateError?.message ?? "Task transition conflict — retry");
  }

  const task = mapRow(updated as Record<string, unknown>);
  const eventType =
    input.toStatus === "done"
      ? "ops.task.completed"
      : input.toStatus === "canceled"
        ? "ops.task.canceled"
        : "ops.task.updated";

  await emitOpsDomainEvent(db, {
    eventType,
    organizationId: input.organizationId,
    subject: { type: "ops_task", id: task.taskId },
    actor: {
      actor_type: input.actorPrincipalId ? "user" : "system",
      principal_id: input.actorPrincipalId ?? null
    },
    summary: `Task ${input.toStatus}: ${task.title}`,
    payload: {
      summary: `Task ${input.toStatus}: ${task.title}`,
      taskId: task.taskId,
      priority: task.priority,
      status: task.status,
      previousStatus: current.status,
      subjectType: task.subjectType,
      subjectId: task.subjectId,
      href: task.deepLink
    },
    correlationId: input.correlationId ?? task.taskId,
    causationId: null
  });

  return task;
}

export type ListOpsTasksInput = {
  organizationId: string;
  status?: OpsTaskStatus | OpsTaskStatus[];
  subjectType?: string;
  subjectId?: string;
  ownerPrincipalId?: string;
  limit?: number;
};

/** List tasks ordered by Priority Engine rank then due date (OC-05). */
export async function listOpsTasksByPriority(
  input: ListOpsTasksInput,
  client?: OpsDbClient
): Promise<OpsTaskRecord[]> {
  const db = client ?? serviceClient();
  let query = db
    .from("ops_tasks")
    .select("*")
    .eq("organization_id", input.organizationId);

  if (input.subjectType) query = query.eq("subject_type", input.subjectType);
  if (input.subjectId) query = query.eq("subject_id", input.subjectId);
  if (input.ownerPrincipalId) query = query.eq("owner_principal_id", input.ownerPrincipalId);
  if (input.status) {
    const statuses = Array.isArray(input.status) ? input.status : [input.status];
    query = query.in("status", statuses);
  }

  const { data, error } = await query.limit(input.limit ?? 200);
  if (error) throw new Error(error.message ?? "Failed to list tasks");

  const tasks = ((data ?? []) as Record<string, unknown>[]).map(mapRow);
  return tasks.sort(compareTasksByPriorityThenDue);
}
