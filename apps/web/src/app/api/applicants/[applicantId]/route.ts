import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { parseApplicantMutationInput } from "../../../../lib/applicant/contracts";
import {
  addApplicantNote,
  addApplicantTask,
  archiveApplicant,
  completeApplicantTask,
  convertApplicantToResident,
  getApplicantEvents,
  getApplicantForOrganization,
  getApplicantNotes,
  getApplicantTasks,
  restoreApplicant,
  softDeleteApplicant,
  transitionApplicantStatus,
  updateApplicant
} from "../../../../lib/applicant/server";
import { apiError, apiInternalError, parseJsonBody } from "../../../../lib/api/http";

export async function GET(_: Request, { params }: { params: Promise<{ applicantId: string }> }) {
  try {
    const { applicantId } = await params;
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return apiError(401, "UNAUTHENTICATED", "Unauthenticated");

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) return apiError(400, "NO_ACTIVE_ORGANIZATION", "No active organization selected");

    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (!evaluatePermission(authorization, "applicant:read")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const url = new URL(_.url);
    const include = url.searchParams.get("include")?.split(",") ?? [];

    const applicant = await getApplicantForOrganization(organizationId, applicantId, supabase);
    if (!applicant) return apiError(404, "NOT_FOUND", "Not found");

    const response: Record<string, unknown> = { applicant };
    if (include.includes("events")) {
      response["events"] = await getApplicantEvents(organizationId, applicantId, supabase);
    }
    if (include.includes("notes")) {
      response["notes"] = await getApplicantNotes(organizationId, applicantId, supabase);
    }
    if (include.includes("tasks")) {
      response["tasks"] = await getApplicantTasks(organizationId, applicantId, supabase);
    }

    return NextResponse.json(response, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return apiInternalError();
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ applicantId: string }> }) {
  try {
    const { applicantId } = await params;
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return apiError(401, "UNAUTHENTICATED", "Unauthenticated");

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) return apiError(400, "NO_ACTIVE_ORGANIZATION", "No active organization selected");

    const parsedBody = await parseJsonBody(request);
    if (!parsedBody.ok) return parsedBody.response;

    const mutation = parseApplicantMutationInput(parsedBody.payload);
    if (!mutation) return apiError(400, "INVALID_PAYLOAD", "Invalid applicant update payload");

    const authorization = await resolveAuthorizationContext(user, organizationId);

    if (mutation.action === "archive") {
      if (!evaluatePermission(authorization, "applicant:archive")) return apiError(403, "FORBIDDEN", "Forbidden");
      const applicant = await archiveApplicant(organizationId, applicantId, user.id, supabase);
      return applicant ? NextResponse.json({ applicant }) : apiError(404, "NOT_FOUND", "Not found");
    }

    if (mutation.action === "restore") {
      if (!evaluatePermission(authorization, "applicant:archive")) return apiError(403, "FORBIDDEN", "Forbidden");
      const applicant = await restoreApplicant(organizationId, applicantId, user.id, supabase);
      return applicant ? NextResponse.json({ applicant }) : apiError(404, "NOT_FOUND", "Not found");
    }

    if (mutation.action === "soft_delete") {
      if (!evaluatePermission(authorization, "applicant:delete")) return apiError(403, "FORBIDDEN", "Forbidden");
      const applicant = await softDeleteApplicant(organizationId, applicantId, user.id, supabase);
      return applicant ? NextResponse.json({ applicant }) : apiError(404, "NOT_FOUND", "Not found");
    }

    if (!evaluatePermission(authorization, "applicant:update")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const lifecycleActions = [
      "submit",
      "request_documents",
      "start_screening",
      "mark_pending_review",
      "approve",
      "decline",
      "withdraw"
    ] as const;

    if ((lifecycleActions as readonly string[]).includes(mutation.action)) {
      const applicant = await transitionApplicantStatus(
        organizationId,
        applicantId,
        user.id,
        mutation.action,
        "reason" in mutation ? { reason: mutation.reason } : {},
        supabase
      );
      return applicant ? NextResponse.json({ applicant }) : apiError(404, "NOT_FOUND", "Not found");
    }

    if (mutation.action === "convert_to_resident") {
      const result = await convertApplicantToResident(organizationId, applicantId, user.id, supabase);
      return NextResponse.json(result);
    }

    if (mutation.action === "add_note") {
      const note = await addApplicantNote(organizationId, applicantId, user.id, mutation.body, supabase);
      return NextResponse.json({ note });
    }

    if (mutation.action === "add_task") {
      const taskInput: { title: string; description?: string; dueDate?: string } = { title: mutation.title };
      if (mutation.description) taskInput.description = mutation.description;
      if (mutation.dueDate) taskInput.dueDate = mutation.dueDate;
      const task = await addApplicantTask(organizationId, applicantId, user.id, taskInput, supabase);
      return NextResponse.json({ task });
    }

    if (mutation.action === "complete_task") {
      const task = await completeApplicantTask(organizationId, applicantId, mutation.taskId, user.id, supabase);
      return task ? NextResponse.json({ task }) : apiError(404, "NOT_FOUND", "Task not found");
    }

    if (mutation.action !== "update") {
      return apiError(400, "INVALID_PAYLOAD", "Unsupported action");
    }

    const applicant = await updateApplicant(organizationId, applicantId, user.id, mutation.updates, supabase);
    return applicant ? NextResponse.json({ applicant }) : apiError(404, "NOT_FOUND", "Not found");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Applicant update failed";
    return apiError(400, "APPLICANT_UPDATE_FAILED", message);
  }
}
