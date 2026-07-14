import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { archiveUnit, getUnitForOrganization, restoreUnit, softDeleteUnit, updateUnit } from "../../../../lib/unit/server";
import { parseUnitMutationInput } from "../../../../lib/unit/contracts";
import { apiError, apiInternalError, parseJsonBody } from "../../../../lib/api/http";

export async function GET(_: Request, { params }: { params: Promise<{ unitId: string }> }) {
  try {
    const { unitId } = await params;
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) {
      return apiError(401, "UNAUTHENTICATED", "Unauthenticated");
    }
    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) {
      return apiError(400, "NO_ACTIVE_ORGANIZATION", "No active organization selected");
    }
    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (!evaluatePermission(authorization, "unit:read")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const unit = await getUnitForOrganization(organizationId, unitId, supabase);
    return unit ? NextResponse.json({ unit }) : apiError(404, "NOT_FOUND", "Not found");
  } catch {
    return apiInternalError();
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ unitId: string }> }) {
  try {
    const { unitId } = await params;
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) {
      return apiError(401, "UNAUTHENTICATED", "Unauthenticated");
    }
    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) {
      return apiError(400, "NO_ACTIVE_ORGANIZATION", "No active organization selected");
    }

    const parsedBody = await parseJsonBody(request);
    if (!parsedBody.ok) {
      return parsedBody.response;
    }
    const mutation = parseUnitMutationInput(parsedBody.payload);
    if (!mutation) {
      return apiError(400, "INVALID_PAYLOAD", "Invalid unit update payload");
    }

    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (mutation.action === "archive") {
      if (!evaluatePermission(authorization, "unit:archive")) {
        return apiError(403, "FORBIDDEN", "Forbidden");
      }
      const unit = await archiveUnit(organizationId, unitId, user.id, supabase);
      return unit ? NextResponse.json({ unit }) : apiError(404, "NOT_FOUND", "Not found");
    }
    if (mutation.action === "restore") {
      if (!evaluatePermission(authorization, "unit:archive")) {
        return apiError(403, "FORBIDDEN", "Forbidden");
      }
      const unit = await restoreUnit(organizationId, unitId, user.id, supabase);
      return unit ? NextResponse.json({ unit }) : apiError(404, "NOT_FOUND", "Not found");
    }
    if (mutation.action === "soft_delete") {
      if (!evaluatePermission(authorization, "unit:delete")) {
        return apiError(403, "FORBIDDEN", "Forbidden");
      }
      const unit = await softDeleteUnit(organizationId, unitId, user.id, supabase);
      return unit ? NextResponse.json({ unit }) : apiError(404, "NOT_FOUND", "Not found");
    }

    if (!evaluatePermission(authorization, "unit:update")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }
    const unit = await updateUnit(organizationId, unitId, user.id, mutation.updates, supabase);
    return unit ? NextResponse.json({ unit }) : apiError(404, "NOT_FOUND", "Not found");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unit update failed";
    return apiError(400, "UNIT_UPDATE_FAILED", message);
  }
}
