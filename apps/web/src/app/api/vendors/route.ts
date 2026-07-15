import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../lib/organization/server";
import { parseCreateVendorInput } from "../../../lib/vendor/contracts";
import { createVendor, getVendorsForOrganization, type VendorListOptions } from "../../../lib/vendor/server";
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
    if (!evaluatePermission(authorization, "vendor:read")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const url = new URL(request.url);
    const pagination = parsePaginationParams(url.searchParams);
    const statusRaw = url.searchParams.get("status");
    const status =
      statusRaw === "active" || statusRaw === "inactive" || statusRaw === "archived" || statusRaw === "all"
        ? statusRaw
        : undefined;
    const search = url.searchParams.get("search") ?? undefined;
    const service = url.searchParams.get("service") ?? undefined;
    const preferredOnly = url.searchParams.get("preferredOnly") === "true";

    const options: VendorListOptions = { ...pagination };
    if (status) options.status = status;
    if (search && search.trim().length > 0) options.search = search;
    if (service) options.service = service;
    if (preferredOnly) options.preferredOnly = true;

    const items = await getVendorsForOrganization(organizationId, options, supabase);
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
    if (!evaluatePermission(authorization, "vendor:create")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const parsedBody = await parseJsonBody(request);
    if (!parsedBody.ok) {
      return parsedBody.response;
    }

    const input = parseCreateVendorInput(parsedBody.payload);
    if (!input) {
      return apiError(400, "INVALID_PAYLOAD", "Invalid vendor payload");
    }

    const vendor = await createVendor(organizationId, user.id, input, supabase);
    return NextResponse.json({ vendor }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Vendor creation failed";
    return apiError(400, "VENDOR_CREATE_FAILED", message);
  }
}
