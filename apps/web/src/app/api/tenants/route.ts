import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../lib/organization/server";
import { parseCreateTenantInput } from "../../../lib/tenant/contracts";
import { createTenant, getTenantsForOrganization } from "../../../lib/tenant/server";
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
    if (!evaluatePermission(authorization, "tenant:read")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const url = new URL(request.url);
    const pagination = parsePaginationParams(url.searchParams);
    const sortByRaw = url.searchParams.get("sortBy");
    const sortOrderRaw = url.searchParams.get("sortOrder");
    const sortBy =
      sortByRaw === "last_name" || sortByRaw === "created_at" || sortByRaw === "updated_at" ? sortByRaw : undefined;
    const sortOrder = sortOrderRaw === "asc" || sortOrderRaw === "desc" ? sortOrderRaw : undefined;
    const search = url.searchParams.get("search") ?? undefined;
    const options = { ...pagination } as {
      limit?: number;
      offset?: number;
      search?: string;
      sortBy?: "updated_at" | "last_name" | "created_at";
      sortOrder?: "asc" | "desc";
    };
    if (search && search.trim().length > 0) options.search = search;
    if (sortBy) options.sortBy = sortBy;
    if (sortOrder) options.sortOrder = sortOrder;

    const items = await getTenantsForOrganization(organizationId, options, supabase);
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
    if (!evaluatePermission(authorization, "tenant:create")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const parsedBody = await parseJsonBody(request);
    if (!parsedBody.ok) {
      return parsedBody.response;
    }

    const input = parseCreateTenantInput(parsedBody.payload);
    if (!input) {
      return apiError(400, "INVALID_PAYLOAD", "Invalid tenant payload");
    }

    const tenant = await createTenant(organizationId, user.id, input, supabase);
    return NextResponse.json({ tenant }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Tenant creation failed";
    return apiError(400, "TENANT_CREATE_FAILED", message);
  }
}
