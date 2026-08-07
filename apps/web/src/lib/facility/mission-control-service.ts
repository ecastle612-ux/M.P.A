import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildFacilityCriticalAssetAttention,
  buildFacilityMissionControlNextAction,
  buildFacilitySetupIncompleteAttention,
  buildFacilitySystemDownAttention,
  rankFacilityAttention
} from "@mpa/shared";
import { listFacilityAssets } from "./asset-service";
import { listFacilitySites } from "./site-service";
import { listFacilitySystems } from "./system-service";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = SupabaseClient<any>;

export async function getFacilityMissionControlState(
  supabase: Db,
  organizationId: string,
  setupComplete: boolean
) {
  const [sites, assets, systems] = await Promise.all([
    listFacilitySites(supabase, organizationId),
    listFacilityAssets(supabase, organizationId),
    listFacilitySystems(supabase, organizationId)
  ]);

  const activeSites = sites.filter((site) => site.status === "active");
  const draftSites = sites.filter((site) => site.status === "draft");
  const firstActive = activeSites[0] ?? null;
  const operationalAssets = assets.filter((asset) => asset.status !== "decommissioned");
  const activeAssets = assets.filter((asset) => asset.status === "active");
  const firstAsset = operationalAssets[0] ?? null;
  const downSystems = systems.filter((system) => system.status === "down");

  const attention = rankFacilityAttention([
    ...buildFacilitySetupIncompleteAttention({
      activeSiteCount: activeSites.length,
      draftSiteCount: draftSites.length
    }),
    ...buildFacilitySystemDownAttention(
      systems.map((system) => ({
        id: system.id,
        name: system.name,
        siteId: system.site_id,
        status: system.status
      }))
    ),
    ...buildFacilityCriticalAssetAttention(
      assets.map((asset) => ({
        id: asset.id,
        name: asset.name,
        siteId: asset.site_id,
        status: asset.status,
        criticality: asset.criticality
      }))
    )
  ]);

  const nextAction = buildFacilityMissionControlNextAction({
    setupComplete,
    activeSiteCount: activeSites.length,
    draftSiteCount: draftSites.length,
    firstActiveSiteId: firstActive?.id ?? null,
    activeAssetCount: operationalAssets.length,
    downSystemCount: downSystems.length,
    firstAssetId: firstAsset?.id ?? null
  });

  const recentEvents = await supabase
    .from("event_domain_events")
    .select("id, event_type, aggregate_id, aggregate_type, payload, created_at")
    .eq("organization_id", organizationId)
    .or("event_type.like.facility.site.%,event_type.like.facility.asset.%,event_type.like.facility.system.%")
    .order("created_at", { ascending: false })
    .limit(12);

  return {
    siteCount: sites.length,
    activeSiteCount: activeSites.length,
    draftSiteCount: draftSites.length,
    assetCount: assets.length,
    activeAssetCount: activeAssets.length,
    systemCount: systems.length,
    downSystemCount: downSystems.length,
    sites: sites.slice(0, 8).map((site) => ({
      id: site.id,
      name: site.name,
      status: site.status,
      timezone: site.timezone,
      locationCount: site.facility_locations?.length ?? 0,
      propertyId: site.property_id,
      propertyName: site.property_properties?.name ?? null
    })),
    assets: operationalAssets.slice(0, 6).map((asset) => ({
      id: asset.id,
      name: asset.name,
      status: asset.status,
      criticality: asset.criticality,
      siteName: asset.facility_sites?.name ?? null
    })),
    systems: systems.slice(0, 6).map((system) => ({
      id: system.id,
      name: system.name,
      status: system.status,
      systemType: system.system_type,
      siteName: system.facility_sites?.name ?? null
    })),
    attention,
    nextAction,
    assistantRecommendation: nextAction.assistantRecommendation,
    timeline: (recentEvents.data ?? []).map((event) => {
      const aggregateType = event.aggregate_type as string;
      const href =
        aggregateType === "facility_assets"
          ? `/facility/assets/${event.aggregate_id as string}`
          : aggregateType === "facility_systems"
            ? `/facility/building-systems/${event.aggregate_id as string}`
            : `/facility/sites/${event.aggregate_id as string}`;
      return {
        id: event.id as string,
        title: String(event.event_type),
        detail:
          typeof (event.payload as { name?: string } | null)?.name === "string"
            ? `${(event.payload as { name: string }).name}`
            : "Facility event",
        occurredAt: event.created_at as string,
        href
      };
    }),
    deferredSignals: [
      "wo_emergency",
      "safety_open",
      "compliance_overdue",
      "pm_overdue",
      "stockout",
      "pm_due"
    ]
  };
}
