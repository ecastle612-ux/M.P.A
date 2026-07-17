import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { parseGenerateOwnerStatementInput } from "../../../../lib/financial/contracts";
import {
  generateOwnerStatement,
  getOwnerStatementsForOrganization,
  type OwnerStatementListOptions
} from "../../../../lib/financial/server";
import { apiError, apiInternalError, parseJsonBody, parsePaginationParams } from "../../../../lib/api/http";

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
    if (!evaluatePermission(authorization, "financial:read")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const url = new URL(request.url);
    const pagination = parsePaginationParams(url.searchParams);
    const options: OwnerStatementListOptions = { ...pagination };

    const statusRaw = url.searchParams.get("status");
    if (
      statusRaw === "draft" ||
      statusRaw === "generated" ||
      statusRaw === "sent" ||
      statusRaw === "archived" ||
      statusRaw === "all"
    ) {
      options.status = statusRaw;
    }

    const search = url.searchParams.get("search");
    if (search?.trim()) options.search = search;

    const propertyId = url.searchParams.get("propertyId");
    if (propertyId) options.propertyId = propertyId;

    const items = await getOwnerStatementsForOrganization(organizationId, options, supabase);
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
    if (!evaluatePermission(authorization, "financial:create")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const parsedBody = await parseJsonBody(request);
    if (!parsedBody.ok) return parsedBody.response;

    const input = parseGenerateOwnerStatementInput(parsedBody.payload);
    if (!input) return apiError(400, "INVALID_PAYLOAD", "Invalid owner statement payload");

    const statement = await generateOwnerStatement(organizationId, user.id, input, supabase);
    return NextResponse.json({ statement }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Owner statement generation failed";
    return apiError(400, "OWNER_STATEMENT_GENERATE_FAILED", message);
  }
}
