import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildFacilityMissionControlNextAction,
  buildFacilitySetupIncompleteAttention,
  rankFacilityAttention
} from "@mpa/shared";
import { listFacilitySites } from "./site-service";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = SupabaseClient<any>;

export async function getFacilityMissionControlState(
  supabase: Db,
  organizationId: string,
  setupComplete: boolean
) {
  const sites = await listFacilitySites(supabase, organizationId);
  const activeSites = sites.filter((site) => site.status === "active");
  const draftSites = sites.filter((site) => site.status === "draft");
  const firstActive = activeSites[0] ?? null;

  const attention = rankFacilityAttention(
    buildFacilitySetupIncompleteAttention({
      activeSiteCount: activeSites.length,
      draftSiteCount: draftSites.length
    })
  );

  const nextAction = buildFacilityMissionControlNextAction({
    setupComplete,
    activeSiteCount: activeSites.length,
    draftSiteCount: draftSites.length,
    firstActiveSiteId: firstActive?.id ?? null
  });

  const recentEvents = await supabase
    .from("event_domain_events")
    .select("id, event_type, aggregate_id, payload, created_at")
    .eq("organization_id", organizationId)
    .like("event_type", "facility.site.%")
    .order("created_at", { ascending: false })
    .limit(10);

  return {
    siteCount: sites.length,
    activeSiteCount: activeSites.length,
    draftSiteCount: draftSites.length,
    sites: sites.slice(0, 8).map((site) => ({
      id: site.id,
      name: site.name,
      status: site.status,
      timezone: site.timezone,
      locationCount: site.facility_locations?.length ?? 0,
      propertyId: site.property_id,
      propertyName: site.property_properties?.name ?? null
    })),
    attention,
    nextAction,
    assistantRecommendation: nextAction.assistantRecommendation,
    timeline: (recentEvents.data ?? []).map((event) => ({
      id: event.id as string,
      title: String(event.event_type),
      detail:
        typeof (event.payload as { name?: string } | null)?.name === "string"
          ? `${(event.payload as { name: string }).name}`
          : "Facility site event",
      occurredAt: event.created_at as string,
      href: `/facility/sites/${event.aggregate_id as string}`
    })),
    deferredSignals: [
      "system_down",
      "wo_emergency",
      "safety_open",
      "compliance_overdue",
      "pm_overdue",
      "stockout",
      "wo_open_critical",
      "pm_due"
    ]
  };
}
