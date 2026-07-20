import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../../lib/organization/server";
import { parseLinkFacilityRecordAssetInput } from "../../../../../lib/facility/asset-contracts";
import { parseCorrectFacilityRecordInput } from "../../../../../lib/facility/contracts";
import { linkFacilityRecordToAsset } from "../../../../../lib/facility/asset-server";
import { correctFacilityRecord, getFacilityRecordForOrganization } from "../../../../../lib/facility/server";
import { getVaultDocumentsForEntity } from "../../../../../lib/vault/server";
import { apiError, apiInternalError, parseJsonBody } from "../../../../../lib/api/http";

export async function GET(_request: Request, { params }: { params: Promise<{ recordId: string }> }) {
  try {
    const { recordId } = await params;
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

    const record = await getFacilityRecordForOrganization(organizationId, recordId, supabase);
    if (!record) return apiError(404, "NOT_FOUND", "Not found");

    const vaultDocuments = await getVaultDocumentsForEntity(
      organizationId,
      "maintenance",
      record.workOrderId,
      supabase
    );

    return NextResponse.json({ record, vaultDocuments });
  } catch {
    return apiInternalError();
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ recordId: string }> }) {
  try {
    const { recordId } = await params;
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
    if (!authorization.roles.includes("property_manager")) {
      return apiError(403, "FORBIDDEN", "Administrative correction requires a property manager");
    }

    const parsedBody = await parseJsonBody(request);
    if (!parsedBody.ok) return parsedBody.response;

    const payload = parsedBody.payload as Record<string, unknown>;

    if (payload["action"] === "link_asset") {
      const link = parseLinkFacilityRecordAssetInput(payload);
      if (!link) return apiError(400, "INVALID_PAYLOAD", "assetId is required (or null to unlink)");
      await linkFacilityRecordToAsset(organizationId, recordId, link.assetId, user.id, supabase);
      const record = await getFacilityRecordForOrganization(organizationId, recordId, supabase);
      return NextResponse.json({ record });
    }

    if (payload["action"] !== "correct") {
      return apiError(
        400,
        "IMMUTABLE",
        "Facility records are immutable. Use action=correct or action=link_asset."
      );
    }

    const input = parseCorrectFacilityRecordInput(payload);
    if (!input) {
      return apiError(400, "INVALID_PAYLOAD", "Correction requires a reason");
    }

    const record = await correctFacilityRecord(organizationId, recordId, user.id, input, supabase);
    return NextResponse.json({ record });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Correction failed";
    if (message.includes("not found")) return apiError(404, "NOT_FOUND", message);
    return apiInternalError();
  }
}
