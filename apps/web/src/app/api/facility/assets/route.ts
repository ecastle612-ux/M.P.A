import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { parseCreateFacilityAssetInput } from "../../../../lib/facility/asset-contracts";
import { createFacilityAsset, listFacilityAssets } from "../../../../lib/facility/asset-server";
import { apiError, apiInternalError, parseJsonBody } from "../../../../lib/api/http";
import type { FacilityAssetStatus } from "../../../../lib/facility/asset-contracts";

export async function GET(request: Request) {
  try {
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return apiError(401, "UNAUTHENTICATED", "Unauthenticated");

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) return NextResponse.json({ items: [] }, { headers: { "Cache-Control": "no-store" } });

    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (!evaluatePermission(authorization, "maintenance:read")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const url = new URL(request.url);
    const propertyId = url.searchParams.get("propertyId") ?? undefined;
    const unitId = url.searchParams.get("unitId") ?? undefined;
    const search = url.searchParams.get("q") ?? undefined;
    const status = url.searchParams.get("status") as FacilityAssetStatus | null;
    const limitRaw = url.searchParams.get("limit");
    const limit = limitRaw ? Number.parseInt(limitRaw, 10) : undefined;

    const items = await listFacilityAssets(
      organizationId,
      {
        propertyId,
        unitId,
        search,
        status: status === "active" || status === "replaced" || status === "retired" ? status : undefined,
        limit: Number.isFinite(limit) ? limit : undefined
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
    if (!evaluatePermission(authorization, "maintenance:update")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const parsedBody = await parseJsonBody(request);
    if (!parsedBody.ok) return parsedBody.response;

    const input = parseCreateFacilityAssetInput(parsedBody.payload);
    if (!input) return apiError(400, "INVALID_PAYLOAD", "Invalid asset payload");

    const asset = await createFacilityAsset(organizationId, user.id, input, supabase);
    return NextResponse.json({ asset }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Asset creation failed";
    if (/duplicate|unique/i.test(message)) {
      return apiError(409, "ASSET_CODE_CONFLICT", "An asset with this code already exists.");
    }
    return apiError(400, "ASSET_CREATE_FAILED", message);
  }
}
