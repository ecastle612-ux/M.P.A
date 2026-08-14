import { NextResponse } from "next/server";
import { FACILITY_MANAGER_ROLES, updateFacilityAssetInputSchema } from "@mpa/shared";
import { requireFacilityAssetPermission } from "../../../../../lib/facility/authz";
import {
  getFacilityAsset,
  listAssetWorkHistory,
  listFacilityAssets,
  updateFacilityAsset
} from "../../../../../lib/facility/asset-service";

function isManager(roles: string[]) {
  return roles.some((role) => (FACILITY_MANAGER_ROLES as readonly string[]).includes(role));
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ assetId: string }> }
) {
  const authz = await requireFacilityAssetPermission("pm.maintenance:read");
  if ("error" in authz) return authz.error;
  const { assetId } = await context.params;

  try {
    const manager = isManager(authz.roles);
    if (!manager) {
      const assigned = await listFacilityAssets(authz.supabase, authz.organizationId, {
        technicianUserId: authz.user.id
      });
      if (!assigned.some((row) => row.id === assetId)) {
        return NextResponse.json({ error: "Asset not found" }, { status: 404 });
      }
    }
    const asset = await getFacilityAsset(authz.supabase, authz.organizationId, assetId);
    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }
    const history = await listAssetWorkHistory(authz.supabase, authz.organizationId, assetId);
    return NextResponse.json({ asset, history, canManage: manager });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load asset" },
      { status: 400 }
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ assetId: string }> }
) {
  const authz = await requireFacilityAssetPermission("pm.maintenance:write", { managerOnly: true });
  if ("error" in authz) return authz.error;
  const { assetId } = await context.params;
  const payload = await request.json().catch(() => null);
  const parsed = updateFacilityAssetInputSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const asset = await updateFacilityAsset(
      authz.supabase,
      authz.organizationId,
      authz.user.id,
      assetId,
      parsed.data
    );
    return NextResponse.json({ asset });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update asset" },
      { status: 400 }
    );
  }
}
