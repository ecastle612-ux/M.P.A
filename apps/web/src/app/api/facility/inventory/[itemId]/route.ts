import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../../lib/organization/server";
import { parseUpdateFacilityInventoryInput } from "../../../../../lib/facility/inventory-contracts";
import {
  getFacilityInventoryItem,
  updateFacilityInventoryItem
} from "../../../../../lib/facility/inventory-server";
import { apiError, apiInternalError, parseJsonBody } from "../../../../../lib/api/http";

export async function GET(
  _request: Request,
  context: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await context.params;
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return apiError(401, "UNAUTHENTICATED", "Unauthenticated");

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) return apiError(400, "NO_ACTIVE_ORGANIZATION", "No active organization selected");

    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (!evaluatePermission(authorization, "facility:inventory:read")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const item = await getFacilityInventoryItem(organizationId, itemId, supabase);
    if (!item) return apiError(404, "NOT_FOUND", "Inventory item not found");

    return NextResponse.json({ item }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return apiInternalError();
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await context.params;
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return apiError(401, "UNAUTHENTICATED", "Unauthenticated");

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) return apiError(400, "NO_ACTIVE_ORGANIZATION", "No active organization selected");

    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (!evaluatePermission(authorization, "facility:inventory:write")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const parsedBody = await parseJsonBody(request);
    if (!parsedBody.ok) return parsedBody.response;

    const input = parseUpdateFacilityInventoryInput(parsedBody.payload);
    if (!input) return apiError(400, "INVALID_PAYLOAD", "Invalid inventory update");

    const item = await updateFacilityInventoryItem(organizationId, itemId, user.id, input, supabase);
    return NextResponse.json({ item });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Inventory update failed";
    return apiError(400, "INVENTORY_UPDATE_FAILED", message);
  }
}
