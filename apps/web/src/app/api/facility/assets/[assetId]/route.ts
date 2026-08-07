import { NextResponse } from "next/server";
import { updateFacilityAssetInputSchema } from "@mpa/shared";
import { requireFacilityPermission } from "../../../../../lib/facility/authz";
import {
  buildAssetAssistantRecommendation,
  getFacilityAsset,
  listFacilityAssetTimeline,
  updateFacilityAsset
} from "../../../../../lib/facility/asset-service";

type Params = { params: Promise<{ assetId: string }> };

export async function GET(_request: Request, context: Params) {
  const authz = await requireFacilityPermission("facility.assets:read");
  if ("error" in authz) {
    return authz.error;
  }

  const { assetId } = await context.params;
  try {
    const asset = await getFacilityAsset(authz.supabase, authz.organizationId, assetId);
    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }
    const timeline = await listFacilityAssetTimeline(
      authz.supabase,
      authz.organizationId,
      assetId
    );
    const propertyId = asset.facility_sites?.property_id ?? null;
    return NextResponse.json({
      asset,
      timeline: timeline.map((event) => ({
        id: event.id as string,
        title: String(event.event_type),
        detail:
          typeof (event.payload as { name?: string } | null)?.name === "string"
            ? `${(event.payload as { name: string }).name}`
            : "Asset lifecycle event",
        occurredAt: event.created_at as string,
        kind: event.event_type as string
      })),
      assistantRecommendation: buildAssetAssistantRecommendation(asset),
      siteLink: {
        href: `/facility/sites/${asset.site_id}`,
        label: asset.facility_sites?.name ?? "Facility site"
      },
      propertyLink: propertyId
        ? {
            href: `/pm/properties/${propertyId}`,
            label: asset.facility_sites?.property_properties?.name ?? "Property record"
          }
        : null,
      documentsHref: "/shared/documents"
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load asset" },
      { status: 400 }
    );
  }
}

export async function PATCH(request: Request, context: Params) {
  const authz = await requireFacilityPermission("facility.assets:write");
  if ("error" in authz) {
    return authz.error;
  }

  const { assetId } = await context.params;
  const payload = await request.json().catch(() => null);
  const parsed = updateFacilityAssetInputSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
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
