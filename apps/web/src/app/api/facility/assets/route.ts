import { NextResponse } from "next/server";
import { createFacilityAssetInputSchema, FACILITY_MANAGER_ROLES } from "@mpa/shared";
import { requireFacilityAssetPermission } from "../../../../lib/facility/authz";
import {
  createFacilityAsset,
  FacilityConflictError,
  listFacilityAssets
} from "../../../../lib/facility/asset-service";
import { listPortfolioProperties } from "../../../../lib/property/property-catalog";
import { listVendors } from "../../../../lib/maintenance/maintenance-service";

function isManager(roles: string[]) {
  return roles.some((role) => (FACILITY_MANAGER_ROLES as readonly string[]).includes(role));
}

export async function GET() {
  const authz = await requireFacilityAssetPermission("pm.maintenance:read");
  if ("error" in authz) return authz.error;

  try {
    const manager = isManager(authz.roles);
    const [assets, properties, vendors] = await Promise.all([
      listFacilityAssets(authz.supabase, authz.organizationId, {
        technicianUserId: manager ? null : authz.user.id
      }),
      manager ? listPortfolioProperties(authz.supabase, authz.organizationId) : Promise.resolve([]),
      manager ? listVendors(authz.supabase, authz.organizationId) : Promise.resolve([])
    ]);
    return NextResponse.json({ assets, properties, vendors, canManage: manager });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load assets" },
      { status: 400 }
    );
  }
}

export async function POST(request: Request) {
  const authz = await requireFacilityAssetPermission("pm.maintenance:write", { managerOnly: true });
  if ("error" in authz) return authz.error;

  const payload = await request.json().catch(() => null);
  const parsed = createFacilityAssetInputSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const asset = await createFacilityAsset(
      authz.supabase,
      authz.organizationId,
      authz.user.id,
      parsed.data
    );
    return NextResponse.json({ asset }, { status: 201 });
  } catch (error) {
    const status = error instanceof FacilityConflictError ? error.status : 400;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create asset" },
      { status }
    );
  }
}
