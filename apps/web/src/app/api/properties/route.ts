import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../lib/organization/server";
import { createProperty, getPropertiesForOrganization } from "../../../lib/property/server";
import { parseCreatePropertyInput } from "../../../lib/property/contracts";
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
    if (!evaluatePermission(authorization, "property:read")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const pagination = parsePaginationParams(new URL(request.url).searchParams);
    const items = await getPropertiesForOrganization(organizationId, supabase, pagination);
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
    if (!evaluatePermission(authorization, "property:create")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const parsedBody = await parseJsonBody(request);
    if (!parsedBody.ok) {
      return parsedBody.response;
    }

    const input = parseCreatePropertyInput(parsedBody.payload);
    if (!input) {
      return apiError(400, "INVALID_PAYLOAD", "Invalid property payload");
    }

    const property = await createProperty(organizationId, user.id, input, supabase);
    return NextResponse.json({ property }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Property creation failed";
    return apiError(400, "PROPERTY_CREATE_FAILED", message);
  }
}
