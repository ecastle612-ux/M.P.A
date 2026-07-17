import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../lib/organization/server";
import { parseCreateApplicantInput } from "../../../lib/applicant/contracts";
import { createApplicant, getApplicantsForOrganization } from "../../../lib/applicant/server";
import { apiError, apiInternalError, parseJsonBody, parsePaginationParams } from "../../../lib/api/http";

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
    if (!evaluatePermission(authorization, "applicant:read")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const url = new URL(request.url);
    const pagination = parsePaginationParams(url.searchParams);
    const sortByRaw = url.searchParams.get("sortBy");
    const sortOrderRaw = url.searchParams.get("sortOrder");
    const statusRaw = url.searchParams.get("status");
    const sortBy =
      sortByRaw === "last_name" || sortByRaw === "created_at" || sortByRaw === "updated_at" || sortByRaw === "application_number"
        ? sortByRaw
        : undefined;
    const sortOrder = sortOrderRaw === "asc" || sortOrderRaw === "desc" ? sortOrderRaw : undefined;
    const search = url.searchParams.get("search") ?? undefined;

    const options: Parameters<typeof getApplicantsForOrganization>[1] = { ...pagination };
    if (search && search.trim().length > 0) options.search = search;
    if (sortBy) options.sortBy = sortBy;
    if (sortOrder) options.sortOrder = sortOrder;
    if (statusRaw) {
      options.status = statusRaw as NonNullable<NonNullable<Parameters<typeof getApplicantsForOrganization>[1]>["status"]>;
    }

    const items = await getApplicantsForOrganization(organizationId, options, supabase);
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
    if (!evaluatePermission(authorization, "applicant:create")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const parsedBody = await parseJsonBody(request);
    if (!parsedBody.ok) return parsedBody.response;

    const input = parseCreateApplicantInput(parsedBody.payload);
    if (!input) return apiError(400, "INVALID_PAYLOAD", "Invalid applicant payload");

    const applicant = await createApplicant(organizationId, user.id, input, supabase);
    return NextResponse.json({ applicant }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Applicant creation failed";
    return apiError(400, "APPLICANT_CREATE_FAILED", message);
  }
}
