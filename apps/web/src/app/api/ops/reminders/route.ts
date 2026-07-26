import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import {
  cancelRemindersForSubject,
  scheduleReminder,
  type ReminderType
} from "../../../../lib/ops/reminder-engine";
import { apiError, apiInternalError } from "../../../../lib/api/http";

/**
 * OPS-001 Slice B — schedule an org-scoped reminder (manager).
 * POST body: reminderType, subjectType, subjectId, fireAt, idempotencyKey, …
 */
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
    const reminderType = body["reminderType"] as ReminderType | undefined;
    const subjectType = typeof body["subjectType"] === "string" ? body["subjectType"] : null;
    const subjectId = typeof body["subjectId"] === "string" ? body["subjectId"] : null;
    const fireAt = typeof body["fireAt"] === "string" ? body["fireAt"] : null;
    const idempotencyKey =
      typeof body["idempotencyKey"] === "string" ? body["idempotencyKey"] : null;

    if (!reminderType || !subjectType || !subjectId || !fireAt || !idempotencyKey) {
      return apiError(400, "INVALID_BODY", "Missing required reminder fields");
    }

    const result = await scheduleReminder({
      organizationId,
      reminderType,
      subjectType,
      subjectId,
      fireAt,
      idempotencyKey,
      action:
        body["action"] === "emit_event" ||
        body["action"] === "notify" ||
        body["action"] === "emit_and_notify"
          ? body["action"]
          : "emit_and_notify",
      eventType: typeof body["eventType"] === "string" ? body["eventType"] : null,
      recipientPrincipalId:
        typeof body["recipientPrincipalId"] === "string"
          ? body["recipientPrincipalId"]
          : user.id,
      notifyCategory:
        typeof body["notifyCategory"] === "string"
          ? (body["notifyCategory"] as never)
          : "system",
      notifyPriority:
        body["notifyPriority"] === "low" ||
        body["notifyPriority"] === "high" ||
        body["notifyPriority"] === "emergency"
          ? body["notifyPriority"]
          : "normal",
      title: typeof body["title"] === "string" ? body["title"] : null,
      body: typeof body["body"] === "string" ? body["body"] : null,
      href: typeof body["href"] === "string" ? body["href"] : null,
      propertyId: typeof body["propertyId"] === "string" ? body["propertyId"] : null,
      unitId: typeof body["unitId"] === "string" ? body["unitId"] : null,
      consolidationKey:
        typeof body["consolidationKey"] === "string" ? body["consolidationKey"] : null,
      payload:
        body["payload"] && typeof body["payload"] === "object" && !Array.isArray(body["payload"])
          ? (body["payload"] as Record<string, unknown>)
          : {}
    });

    return NextResponse.json({ result });
  } catch {
    return apiInternalError();
  }
}

/** Cancel scheduled reminders for a subject (terminal state). */
export async function DELETE(request: Request) {
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

    const url = new URL(request.url);
    const subjectType = url.searchParams.get("subjectType");
    const subjectId = url.searchParams.get("subjectId");
    const reason = url.searchParams.get("reason") ?? "subject_terminal";

    if (!subjectType || !subjectId) {
      return apiError(400, "INVALID_QUERY", "subjectType and subjectId required");
    }

    const canceled = await cancelRemindersForSubject(
      organizationId,
      subjectType,
      subjectId,
      reason
    );
    return NextResponse.json({ canceled });
  } catch {
    return apiInternalError();
  }
}
