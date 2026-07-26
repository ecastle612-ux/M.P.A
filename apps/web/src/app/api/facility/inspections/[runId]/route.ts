import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../../lib/organization/server";
import {
  parseAddInspectionItemInput,
  parseCompleteInspectionInput,
  parseUpdateInspectionItemInput
} from "../../../../../lib/facility/inspection-contracts";
import {
  addInspectionItem,
  completeInspectionRun,
  getInspectionRun,
  startInspectionRun,
  updateInspectionItem
} from "../../../../../lib/facility/inspection-server";
import { apiError, apiInternalError, parseJsonBody } from "../../../../../lib/api/http";

export async function GET(_request: Request, { params }: { params: Promise<{ runId: string }> }) {
  try {
    const { runId } = await params;
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return apiError(401, "UNAUTHENTICATED", "Unauthenticated");

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) return apiError(400, "NO_ACTIVE_ORGANIZATION", "No active organization selected");

    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (!evaluatePermission(authorization, "facility:inspection:read")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const run = await getInspectionRun(organizationId, runId, supabase);
    if (!run) return apiError(404, "NOT_FOUND", "Inspection not found");
    return NextResponse.json({ run }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return apiInternalError();
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ runId: string }> }) {
  try {
    const { runId } = await params;
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return apiError(401, "UNAUTHENTICATED", "Unauthenticated");

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) return apiError(400, "NO_ACTIVE_ORGANIZATION", "No active organization selected");

    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (!evaluatePermission(authorization, "facility:inspection:write")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const parsedBody = await parseJsonBody(request);
    if (!parsedBody.ok) return parsedBody.response;
    const payload = parsedBody.payload;
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return apiError(400, "INVALID_PAYLOAD", "Invalid payload");
    }
    const action = (payload as Record<string, unknown>)["action"];

    if (action === "start") {
      const run = await startInspectionRun(organizationId, runId, user.id, supabase);
      return NextResponse.json({ run });
    }

    if (action === "complete") {
      const input = parseCompleteInspectionInput(payload);
      const result = await completeInspectionRun(organizationId, runId, user.id, input, supabase);
      return NextResponse.json(result);
    }

    if (action === "update_item") {
      const input = parseUpdateInspectionItemInput(payload);
      if (!input) return apiError(400, "INVALID_PAYLOAD", "Invalid item update");
      const item = await updateInspectionItem(organizationId, runId, user.id, input, supabase);
      return NextResponse.json({ item });
    }

    if (action === "add_item") {
      const input = parseAddInspectionItemInput(payload);
      if (!input) return apiError(400, "INVALID_PAYLOAD", "Invalid item label");
      const item = await addInspectionItem(organizationId, runId, user.id, input.label, supabase);
      return NextResponse.json({ item }, { status: 201 });
    }

    return apiError(400, "INVALID_ACTION", "Unknown inspection action");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Inspection update failed";
    return apiError(400, "INSPECTION_UPDATE_FAILED", message);
  }
}
