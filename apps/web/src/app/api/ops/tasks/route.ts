import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { apiError, apiInternalError } from "../../../../lib/api/http";
import {
  createOpsTask,
  listOpsTasksByPriority,
  transitionOpsTask,
  type OpsTaskStatus
} from "../../../../lib/ops/task-engine";

/**
 * OPS-001 Slice C — list / create org-scoped tasks (no Command Center UI).
 * Ordered by Priority Engine (OC-05).
 */
export async function GET() {
  try {
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return apiError(401, "UNAUTHENTICATED", "Unauthenticated");

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) return apiError(400, "NO_ACTIVE_ORGANIZATION", "No active organization selected");

    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (
      !evaluatePermission(authorization, "maintenance:read") &&
      !evaluatePermission(authorization, "maintenance:write")
    ) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const tasks = await listOpsTasksByPriority({
      organizationId,
      status: ["open", "in_progress", "blocked"]
    });

    return NextResponse.json(
      { tasks },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("[ops/tasks GET]", error);
    return apiInternalError();
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return apiError(401, "UNAUTHENTICATED", "Unauthenticated");

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) return apiError(400, "NO_ACTIVE_ORGANIZATION", "No active organization selected");

    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (!evaluatePermission(authorization, "maintenance:write")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const body = (await request.json()) as Record<string, unknown>;
    const title = typeof body["title"] === "string" ? body["title"].trim() : "";
    const subjectType = typeof body["subjectType"] === "string" ? body["subjectType"] : null;
    const subjectId = typeof body["subjectId"] === "string" ? body["subjectId"] : null;
    const idempotencyKey =
      typeof body["idempotencyKey"] === "string" ? body["idempotencyKey"] : null;

    if (!title || !subjectType || !subjectId || !idempotencyKey) {
      return apiError(400, "INVALID_BODY", "title, subjectType, subjectId, idempotencyKey required");
    }

    const priorityRaw = typeof body["priority"] === "string" ? body["priority"] : null;

    const { task, created } = await createOpsTask({
      organizationId,
      title,
      description: typeof body["description"] === "string" ? body["description"] : null,
      priority: priorityRaw,
      subjectType,
      subjectId,
      deepLink: typeof body["deepLink"] === "string" ? body["deepLink"] : null,
      dueAt: typeof body["dueAt"] === "string" ? body["dueAt"] : null,
      ownerPrincipalId:
        typeof body["ownerPrincipalId"] === "string" ? body["ownerPrincipalId"] : user.id,
      idempotencyKey,
      createdBy: "user",
      createdByPrincipalId: user.id,
      actorPrincipalId: user.id
    });

    return NextResponse.json(
      { task, created },
      { status: created ? 201 : 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("[ops/tasks POST]", error);
    return apiInternalError();
  }
}

/** PATCH — transition task status (retry-safe). */
export async function PATCH(request: Request) {
  try {
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return apiError(401, "UNAUTHENTICATED", "Unauthenticated");

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) return apiError(400, "NO_ACTIVE_ORGANIZATION", "No active organization selected");

    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (!evaluatePermission(authorization, "maintenance:write")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const body = (await request.json()) as Record<string, unknown>;
    const taskId = typeof body["taskId"] === "string" ? body["taskId"] : null;
    const toStatus = typeof body["status"] === "string" ? (body["status"] as OpsTaskStatus) : null;
    if (!taskId || !toStatus) {
      return apiError(400, "INVALID_BODY", "taskId and status required");
    }

    const task = await transitionOpsTask({
      organizationId,
      taskId,
      toStatus,
      actorPrincipalId: user.id
    });

    return NextResponse.json({ task }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Task transition failed";
    if (/Invalid task transition|not found|conflict/i.test(message)) {
      return apiError(409, "TASK_TRANSITION_FAILED", message);
    }
    console.error("[ops/tasks PATCH]", error);
    return apiInternalError();
  }
}
