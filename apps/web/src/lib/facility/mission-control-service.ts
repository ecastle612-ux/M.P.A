import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildFacilityComplianceOverdueAttention,
  buildFacilityCriticalAssetAttention,
  buildFacilityMissionControlNextAction,
  buildFacilityOpenCriticalWorkAttention,
  buildFacilityPmDueAttention,
  buildFacilityPmOverdueAttention,
  buildFacilitySafetyOpenAttention,
  buildFacilitySetupIncompleteAttention,
  buildFacilityStockoutAttention,
  buildFacilitySystemDownAttention,
  buildFacilityWorkOrderEmergencyAttention,
  rankFacilityAttention
} from "@mpa/shared";
import { listFacilityAssets } from "./asset-service";
import { listComplianceObligations, summarizeCompliance } from "./compliance-service";
import { listInventoryStock, summarizeInventory } from "./inventory-service";
import { listFacilityWorkOrders, summarizeFacilityWorkOrders } from "./operations-service";
import { listPmSchedules, summarizePmSchedules } from "./pm-service";
import { listSafetyIncidents, summarizeSafety } from "./safety-service";
import { listFacilitySites } from "./site-service";
import { listFacilitySystems } from "./system-service";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = SupabaseClient<any>;

export async function getFacilityMissionControlState(
  supabase: Db,
  organizationId: string,
  setupComplete: boolean
) {
  const [sites, assets, systems, workOrders, pmSchedules, stock, incidents, obligations] =
    await Promise.all([
      listFacilitySites(supabase, organizationId),
      listFacilityAssets(supabase, organizationId),
      listFacilitySystems(supabase, organizationId),
      listFacilityWorkOrders(supabase, organizationId),
      listPmSchedules(supabase, organizationId),
      listInventoryStock(supabase, organizationId),
      listSafetyIncidents(supabase, organizationId),
      listComplianceObligations(supabase, organizationId)
    ]);

  const activeSites = sites.filter((site) => site.status === "active");
  const draftSites = sites.filter((site) => site.status === "draft");
  const firstActive = activeSites[0] ?? null;
  const operationalAssets = assets.filter((asset) => asset.status !== "decommissioned");
  const activeAssets = assets.filter((asset) => asset.status === "active");
  const firstAsset = operationalAssets[0] ?? null;
  const downSystems = systems.filter((system) => system.status === "down");
  const workSummary = summarizeFacilityWorkOrders(workOrders);
  const pmSummary = summarizePmSchedules(pmSchedules);
  const inventorySummary = summarizeInventory(stock);
  const safetySummary = summarizeSafety(incidents);
  const complianceSummary = summarizeCompliance(obligations);
  const pmAttentionInput = pmSchedules.map((schedule) => ({
    id: schedule.id,
    name: schedule.name,
    siteId: schedule.site_id,
    status: schedule.status,
    nextDueOn: schedule.next_due_on,
    criticality: schedule.criticality
  }));
  const workOrderAttentionInput = workOrders.map((wo) => ({
    id: wo.id,
    title: wo.title,
    siteId: wo.site_id,
    priority: wo.priority,
    status: wo.status,
    productContext: wo.product_context,
    assetCriticality: wo.facility_assets?.criticality ?? null
  }));
  const stockAttentionInput = stock.map((row) => ({
    id: row.id,
    partName: row.facility_parts?.name ?? "Part",
    locationName: row.facility_inventory_locations?.name ?? "Location",
    siteId: row.facility_inventory_locations?.site_id ?? "",
    quantityOnHand: Number(row.quantity_on_hand),
    reorderThreshold: Number(row.reorder_threshold),
    minimumStock: Number(row.minimum_stock),
    criticalPart: Boolean(row.facility_parts?.critical_part)
  }));
  const stockoutAttention = buildFacilityStockoutAttention(stockAttentionInput);
  const safetyAttention = buildFacilitySafetyOpenAttention(
    incidents.map((incident) => ({
      id: incident.id,
      title: incident.title,
      siteId: incident.site_id,
      severity: incident.severity,
      status: incident.status
    }))
  );
  const complianceAttention = buildFacilityComplianceOverdueAttention(
    obligations.map((obligation) => ({
      id: obligation.id,
      title: obligation.title,
      siteId: obligation.site_id,
      dueOn: obligation.due_on,
      status: obligation.status
    }))
  );

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
    ...buildFacilityWorkOrderEmergencyAttention(workOrderAttentionInput),
    ...safetyAttention,
    ...complianceAttention,
    ...buildFacilityPmOverdueAttention(pmAttentionInput),
    ...buildFacilityCriticalAssetAttention(
      assets.map((asset) => ({
        id: asset.id,
        name: asset.name,
        siteId: asset.site_id,
        status: asset.status,
        criticality: asset.criticality
      }))
    ),
    ...buildFacilityOpenCriticalWorkAttention(workOrderAttentionInput),
    ...buildFacilityPmDueAttention(pmAttentionInput),
    ...stockoutAttention
  ]);

  const nextAction = buildFacilityMissionControlNextAction({
    setupComplete,
    activeSiteCount: activeSites.length,
    draftSiteCount: draftSites.length,
    firstActiveSiteId: firstActive?.id ?? null,
    activeAssetCount: operationalAssets.length,
    downSystemCount: downSystems.length,
    firstAssetId: firstAsset?.id ?? null,
    openFacilityWorkCount: workSummary.openCount,
    emergencyFacilityWorkCount: workSummary.emergencyCount,
    firstOpenWorkOrderId: workSummary.firstOpenId,
    overduePmCount: pmSummary.overdueCount,
    duePmCount: pmSummary.dueCount,
    firstPmScheduleId: pmSummary.firstDueOrOverdueId,
    stockoutCount: stockoutAttention.length,
    firstStockId: inventorySummary.firstStockoutId,
    openSafetyCount: safetyAttention.length,
    firstSafetyIncidentId: safetyAttention[0]?.aggregateId ?? safetySummary.firstOpenIncidentId,
    overdueComplianceCount: complianceAttention.length,
    firstComplianceObligationId: complianceSummary.firstOverdueId
  });

  const recentEvents = await supabase
    .from("event_domain_events")
    .select("id, event_type, aggregate_id, aggregate_type, payload, created_at")
    .eq("organization_id", organizationId)
    .or(
      "event_type.like.facility.site.%,event_type.like.facility.asset.%,event_type.like.facility.system.%,event_type.like.facility.pm_schedule.%,event_type.like.facility.part.%,event_type.like.facility.inventory.%,event_type.like.facility.inspection.%,event_type.like.facility.safety.%,event_type.like.facility.compliance.%,event_type.eq.work_order.created,event_type.eq.work_order.triaged,event_type.eq.work_order.assigned,event_type.eq.work_order.completed,event_type.eq.work_order.closed"
    )
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
    openFacilityWorkCount: workSummary.openCount,
    emergencyFacilityWorkCount: workSummary.emergencyCount,
    activePmCount: pmSummary.activeCount,
    duePmCount: pmSummary.dueCount,
    overduePmCount: pmSummary.overdueCount,
    stockLineCount: inventorySummary.stockLineCount,
    stockoutCount: inventorySummary.stockoutCount,
    lowStockCount: inventorySummary.lowCount,
    openSafetyCount: safetySummary.openCount,
    highSeveritySafetyCount: safetySummary.highSeverityCount,
    overdueComplianceCount: complianceSummary.overdueCount,
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
      const payload = event.payload as {
        name?: string;
        title?: string;
        workOrderId?: string;
      } | null;
      const href =
        aggregateType === "maintenance_work_orders"
          ? `/facility/operations?workOrderId=${event.aggregate_id as string}`
          : aggregateType === "facility_pm_schedules"
            ? `/facility/preventive-maintenance?scheduleId=${event.aggregate_id as string}`
            : aggregateType === "facility_assets"
              ? `/facility/assets/${event.aggregate_id as string}`
              : aggregateType === "facility_systems"
                ? `/facility/building-systems/${event.aggregate_id as string}`
                : aggregateType === "facility_inventory_stock"
                  ? `/facility/inventory?stockId=${event.aggregate_id as string}`
                  : aggregateType === "facility_parts"
                    ? `/facility/parts?partId=${event.aggregate_id as string}`
                    : aggregateType === "facility_inventory_locations"
                      ? `/facility/inventory?locationId=${event.aggregate_id as string}`
                      : aggregateType === "facility_inspection_runs" ||
                          aggregateType === "facility_inspection_programs"
                        ? `/facility/inspections?runId=${event.aggregate_id as string}`
                        : aggregateType === "facility_safety_incidents"
                          ? `/facility/safety?incidentId=${event.aggregate_id as string}`
                          : aggregateType === "facility_compliance_obligations"
                            ? `/facility/compliance?obligationId=${event.aggregate_id as string}`
                            : typeof payload?.workOrderId === "string"
                              ? `/facility/operations?workOrderId=${payload.workOrderId}`
                              : `/facility/sites/${event.aggregate_id as string}`;
      return {
        id: event.id as string,
        title: String(event.event_type),
        detail:
          typeof payload?.title === "string"
            ? payload.title
            : typeof payload?.name === "string"
              ? payload.name
              : "Facility event",
        occurredAt: event.created_at as string,
        href
      };
    }),
    deferredSignals: [] as string[]
  };
}
