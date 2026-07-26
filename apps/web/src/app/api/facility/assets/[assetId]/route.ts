import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../../lib/organization/server";
import { parseUpdateFacilityAssetInput } from "../../../../../lib/facility/asset-contracts";
import {
  getFacilityAssetForOrganization,
  updateFacilityAsset
} from "../../../../../lib/facility/asset-server";
import { listPmSchedules } from "../../../../../lib/facility/pm-server";
import { listFacilityRecords } from "../../../../../lib/facility/server";
import { listFacilityTimelineEvents } from "../../../../../lib/facility/timeline";
import { getVaultDocumentsForEntity } from "../../../../../lib/vault/server";
import { apiError, apiInternalError, parseJsonBody } from "../../../../../lib/api/http";

export async function GET(_request: Request, { params }: { params: Promise<{ assetId: string }> }) {
  try {
    const { assetId } = await params;
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return apiError(401, "UNAUTHENTICATED", "Unauthenticated");

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) return apiError(400, "NO_ACTIVE_ORGANIZATION", "No active organization selected");

    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (!evaluatePermission(authorization, "maintenance:read")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const asset = await getFacilityAssetForOrganization(organizationId, assetId, supabase);
    if (!asset) return apiError(404, "NOT_FOUND", "Asset not found");

    const [repairs, timeline, vaultDocuments, pmSchedules] = await Promise.all([
      listFacilityRecords(organizationId, { assetId, limit: 50 }, supabase),
      listFacilityTimelineEvents(
        organizationId,
        {
          propertyId: asset.propertyId,
          ...(asset.unitId ? { unitId: asset.unitId } : {}),
          filter: "assets",
          limit: 40
        },
        supabase
      ),
      getVaultDocumentsForEntity(organizationId, "asset", assetId, supabase),
      evaluatePermission(authorization, "facility:pm:read")
        ? listPmSchedules(organizationId, { assetId }, supabase)
        : Promise.resolve([])
    ]);

    const assetTimeline = timeline.filter(
      (event) =>
        event.assetId === assetId ||
        event.sourceEntityId === assetId ||
        (event.payload["assetId"] as string | undefined) === assetId
    );

    return NextResponse.json({
      asset,
      repairs,
      timeline: assetTimeline,
      vaultDocuments,
      pmSchedules
    });
  } catch {
    return apiInternalError();
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ assetId: string }> }) {
  try {
    const { assetId } = await params;
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return apiError(401, "UNAUTHENTICATED", "Unauthenticated");

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) return apiError(400, "NO_ACTIVE_ORGANIZATION", "No active organization selected");

    const authorization = await resolveAuthorizationContext(user, organizationId);
    const canWrite =
      evaluatePermission(authorization, "facility:asset:write") ||
      evaluatePermission(authorization, "maintenance:update");
    if (!canWrite) return apiError(403, "FORBIDDEN", "Forbidden");

    const parsedBody = await parseJsonBody(request);
    if (!parsedBody.ok) return parsedBody.response;

    const input = parseUpdateFacilityAssetInput(parsedBody.payload);
    if (!input) return apiError(400, "INVALID_PAYLOAD", "Invalid asset update payload");

    const asset = await updateFacilityAsset(organizationId, assetId, user.id, input, supabase);
    return NextResponse.json({ asset });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Asset update failed";
    return apiError(400, "ASSET_UPDATE_FAILED", message);
  }
}
