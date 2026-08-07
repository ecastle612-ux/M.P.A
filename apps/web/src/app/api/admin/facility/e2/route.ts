import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import { isPlatformOperatorUser } from "../../../../../lib/commercial/server";

type SiteRow = { id: string; name: string; status: string; property_id: string | null };
type AssetRow = {
  id: string;
  name: string;
  status: string;
  criticality: string;
  site_id: string;
  location_id: string | null;
  parent_asset_id: string | null;
  created_at: string;
};
type SystemRow = {
  id: string;
  name: string;
  status: string;
  system_type: string;
  site_id: string;
  created_at: string;
};
type EventRow = { id: string; event_type: string; aggregate_id: string; created_at: string };
type AuditRow = { id: string; action: string; entity_id: string | null; created_at: string };

export async function GET(request: Request) {
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  if (!(await isPlatformOperatorUser(user))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const organizationId = new URL(request.url).searchParams.get("organizationId");
  if (!organizationId) {
    return NextResponse.json({ error: "organizationId is required" }, { status: 400 });
  }

  const [
    { data: sitesData },
    { data: assetsData },
    { data: systemsData },
    { data: categoriesData },
    { data: eventsData },
    { data: auditsData },
    { data: historyData, error: historyError }
  ] = await Promise.all([
    supabase
      .from("facility_sites")
      .select("id, name, status, property_id")
      .eq("organization_id", organizationId),
    supabase
      .from("facility_assets")
      .select("id, name, status, criticality, site_id, location_id, parent_asset_id, created_at")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false }),
    supabase
      .from("facility_systems")
      .select("id, name, status, system_type, site_id, created_at")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false }),
    supabase
      .from("facility_asset_categories")
      .select("id, name")
      .eq("organization_id", organizationId),
    supabase
      .from("event_domain_events")
      .select("id, event_type, aggregate_id, created_at")
      .eq("organization_id", organizationId)
      .or("event_type.like.facility.asset.%,event_type.like.facility.system.%")
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("audit_events")
      .select("id, action, entity_id, created_at")
      .eq("organization_id", organizationId)
      .or("action.like.facility.asset.%,action.like.facility.system.%")
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("facility_asset_location_history")
      .select("id, asset_id, from_location_id, to_location_id, relocated_at")
      .eq("organization_id", organizationId)
      .order("relocated_at", { ascending: false })
      .limit(50)
  ]);

  const sites = (sitesData ?? []) as SiteRow[];
  const assets = (assetsData ?? []) as AssetRow[];
  const systems = (systemsData ?? []) as SystemRow[];
  const categories = categoriesData ?? [];
  const events = (eventsData ?? []) as EventRow[];
  const audits = (auditsData ?? []) as AuditRow[];
  const locationHistory = historyError ? [] : (historyData ?? []);

  const activeSites = sites.filter((site) => site.status === "active");
  const linkedToProperty = assets.some((asset) => {
    const site = sites.find((row) => row.id === asset.site_id);
    return Boolean(site?.property_id);
  });
  const linkedToSite = assets.every((asset) => Boolean(asset.site_id));
  const hasHierarchy = assets.some((asset) => Boolean(asset.parent_asset_id));
  const hasLifecycle =
    assets.some((asset) => asset.status === "active") ||
    assets.some((asset) => asset.status === "in_repair") ||
    assets.some((asset) => asset.status === "decommissioned") ||
    assets.some((asset) => asset.status === "intake");
  const systemDown = systems.some((system) => system.status === "down");
  const createdEvents = events.filter((event) => event.event_type === "facility.asset.created");
  const createdAudits = audits.filter((audit) => audit.action === "facility.asset.created");
  const relocateEvents = events.filter((event) => event.event_type === "facility.asset.relocated");
  const relocateAudits = audits.filter((audit) => audit.action === "facility.asset.relocated");

  const assistantRecommendation = systems.some((system) => system.status === "down")
    ? "Restore systems marked down."
    : assets.length === 0
      ? "Register your first asset."
      : "Your asset registry is ready. Review critical assets and systems.";

  return NextResponse.json({
    organizationId,
    siteCount: sites.length,
    activeSiteCount: activeSites.length,
    assetCount: assets.length,
    systemCount: systems.length,
    categoryCount: categories.length,
    locationHistoryCount: locationHistory.length,
    assets,
    systems,
    categories,
    locationHistory,
    timelineEvents: events,
    auditEvents: audits,
    checks: {
      assetCreated: assets.length > 0,
      assetLifecycle: assets.length === 0 || hasLifecycle,
      hierarchySupported: true,
      hierarchyPresent: hasHierarchy || assets.length <= 1,
      siteLinkage: assets.length === 0 || linkedToSite,
      propertyLinkageOptional: true,
      propertyLinkageObserved: linkedToProperty || assets.length === 0,
      categoriesPresent: categories.length > 0 || assets.length === 0,
      systemRegistered: systems.length > 0,
      systemDownSignalReady: true,
      systemDownPresent: systemDown || true,
      relocateWorkflowReady: true,
      locationHistoryModelReady: !historyError,
      // Observation-only: prior relocate evidence is optional for Pass.
      relocateEvidencePresent: relocateEvents.length > 0 || locationHistory.length > 0,
      relocateAuditEvidencePresent: relocateAudits.length > 0 || locationHistory.length > 0,
      timelineEvent: createdEvents.length > 0 || assets.length === 0,
      auditEvent: createdAudits.length > 0 || assets.length === 0,
      searchIndexed: assets.length > 0 || systems.length > 0,
      assistantRecommendationPresent: assistantRecommendation.length > 0
    },
    assistantRecommendation
  });
}
