import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../lib/organization/server";
import { createUnit, getUnitsForOrganization } from "../../../lib/unit/server";
import { parseCreateUnitInput } from "../../../lib/unit/contracts";
import { apiError, apiInternalError, parseJsonBody, parsePaginationParams } from "../../../lib/api/http";

export async function GET(request: Request) {
  try {
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) {
      return apiError(401, "UNAUTHENTICATED", "Unauthenticated");
    }
    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) {
      return NextResponse.json({ items: [] }, { headers: { "Cache-Control": "no-store" } });
    }
    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (!evaluatePermission(authorization, "unit:read")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const url = new URL(request.url);
    const propertyId = url.searchParams.get("propertyId");
    const pagination = parsePaginationParams(url.searchParams);
    const items = await getUnitsForOrganization(organizationId, propertyId, supabase, pagination);
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
    if (!user) {
      return apiError(401, "UNAUTHENTICATED", "Unauthenticated");
    }
    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) {
      return apiError(400, "NO_ACTIVE_ORGANIZATION", "No active organization selected");
    }
    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (!evaluatePermission(authorization, "unit:create")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const parsedBody = await parseJsonBody(request);
    if (!parsedBody.ok) {
      return parsedBody.response;
    }

    const input = parseCreateUnitInput(parsedBody.payload);
    if (!input) {
      return apiError(400, "INVALID_PAYLOAD", "Invalid unit payload");
    }

    const unit = await createUnit(organizationId, user.id, input, supabase);
    return NextResponse.json({ unit }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unit creation failed";
    return apiError(400, "UNIT_CREATE_FAILED", message);
  }
}
