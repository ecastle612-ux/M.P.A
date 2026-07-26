import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import {
  isFacilityInventoryStatus,
  parseCreateFacilityInventoryInput,
  type FacilityInventoryStatus
} from "../../../../lib/facility/inventory-contracts";
import {
  createFacilityInventoryItem,
  listFacilityInventory
} from "../../../../lib/facility/inventory-server";
import { apiError, apiInternalError, parseJsonBody } from "../../../../lib/api/http";

export async function GET(request: Request) {
  try {
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return apiError(401, "UNAUTHENTICATED", "Unauthenticated");

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) {
      return NextResponse.json({ items: [] }, { headers: { "Cache-Control": "no-store" } });
    }

    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (!evaluatePermission(authorization, "facility:inventory:read")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const url = new URL(request.url);
    const search = url.searchParams.get("q") ?? undefined;
    const propertyId = url.searchParams.get("propertyId") ?? undefined;
    const statusRaw = url.searchParams.get("status");
    const status: FacilityInventoryStatus | undefined =
      statusRaw && isFacilityInventoryStatus(statusRaw) ? statusRaw : undefined;

    const items = await listFacilityInventory(
      organizationId,
      {
        ...(search ? { search } : {}),
        ...(propertyId ? { propertyId } : {}),
        ...(status ? { status } : {}),
        limit: 200
      },
      supabase
    );

    return NextResponse.json({ items }, { headers: { "Cache-Control": "no-store" } });
  } catch {
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
    if (!evaluatePermission(authorization, "facility:inventory:write")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const parsedBody = await parseJsonBody(request);
    if (!parsedBody.ok) return parsedBody.response;

    const input = parseCreateFacilityInventoryInput(parsedBody.payload);
    if (!input) return apiError(400, "INVALID_PAYLOAD", "Photo and name are required");

    const item = await createFacilityInventoryItem(organizationId, user.id, input, supabase);
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Inventory create failed";
    return apiError(400, "INVENTORY_CREATE_FAILED", message);
  }
}
