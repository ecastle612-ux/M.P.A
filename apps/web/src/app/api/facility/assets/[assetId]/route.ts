import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../../lib/organization/server";
import { getFacilityAssetForOrganization } from "../../../../../lib/facility/asset-server";
import { listFacilityRecords } from "../../../../../lib/facility/server";
import { listFacilityTimelineEvents } from "../../../../../lib/facility/timeline";
import { getVaultDocumentsForEntity } from "../../../../../lib/vault/server";
import { apiError, apiInternalError } from "../../../../../lib/api/http";

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

    const [repairs, timeline, vaultDocuments] = await Promise.all([
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
      getVaultDocumentsForEntity(organizationId, "asset", assetId, supabase)
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
      vaultDocuments
    });
  } catch {
    return apiInternalError();
  }
}
