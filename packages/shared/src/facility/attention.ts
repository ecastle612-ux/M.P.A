/**
 * Facility Mission Control attention — E.1–E.4 signals.
 * Later slices populate remaining severities.
 */

import { daysBetweenUtcDates, todayUtcDate } from "./pm-schemas";

const OPEN_WO_STATUSES = new Set([
  "submitted",
  "triaged",
  "assigned",
  "in_progress",
  "completed"
]);

export const FACILITY_ATTENTION_SEVERITIES = [
  "system_down",
  "wo_emergency",
  "safety_open",
  "compliance_overdue",
  "pm_overdue",
  "stockout",
  "wo_open_critical",
  "pm_due",
  "setup_incomplete"
] as const;

export type FacilityAttentionSeverity = (typeof FACILITY_ATTENTION_SEVERITIES)[number];

export type FacilityAttentionItem = {
  id: string;
  severity: FacilityAttentionSeverity;
  /** 1–5 (5 = act now) */
  priority: number;
  title: string;
  detail: string;
  href: string;
  aggregateType: string | null;
  aggregateId: string | null;
  siteId: string | null;
};

const SEVERITY_PRIORITY: Record<FacilityAttentionSeverity, number> = {
  system_down: 5,
  wo_emergency: 5,
  safety_open: 5,
  compliance_overdue: 4,
  pm_overdue: 4,
  stockout: 3,
  wo_open_critical: 2,
  pm_due: 2,
  setup_incomplete: 1
};

export function priorityForFacilitySeverity(severity: FacilityAttentionSeverity): number {
  return SEVERITY_PRIORITY[severity];
}

export function rankFacilityAttention(
  items: readonly FacilityAttentionItem[]
): FacilityAttentionItem[] {
  return [...items].sort((a, b) => {
    if (b.priority !== a.priority) {
      return b.priority - a.priority;
    }
    return a.title.localeCompare(b.title);
  });
}

export function buildFacilitySetupIncompleteAttention(input: {
  activeSiteCount: number;
  draftSiteCount: number;
}): FacilityAttentionItem[] {
  if (input.activeSiteCount > 0) {
    return [];
  }

  if (input.draftSiteCount > 0) {
    return [
      {
        id: "setup_incomplete:activate_site",
        severity: "setup_incomplete",
        priority: priorityForFacilitySeverity("setup_incomplete"),
        title: "Activate your facility site",
        detail: "Finish site profile requirements so Facility Operations can run.",
        href: "/facility/sites",
        aggregateType: "facility_sites",
        aggregateId: null,
        siteId: null
      }
    ];
  }

  return [
    {
      id: "setup_incomplete:create_site",
      severity: "setup_incomplete",
      priority: priorityForFacilitySeverity("setup_incomplete"),
      title: "Create your facility site",
      detail: "Add and activate a site profile to establish Facility Operations identity.",
      href: "/facility/sites?new=1",
      aggregateType: "facility_sites",
      aggregateId: null,
      siteId: null
    }
  ];
}

export function buildFacilitySystemDownAttention(
  systems: readonly {
    id: string;
    name: string;
    siteId: string;
    status: string;
  }[]
): FacilityAttentionItem[] {
  return systems
    .filter((system) => system.status === "down")
    .map((system) => ({
      id: `system_down:${system.id}`,
      severity: "system_down" as const,
      priority: priorityForFacilitySeverity("system_down"),
      title: `${system.name} is down`,
      detail: "Building system marked down — restore or open corrective work.",
      href: `/facility/building-systems/${system.id}`,
      aggregateType: "facility_systems",
      aggregateId: system.id,
      siteId: system.siteId
    }));
}

export function buildFacilityCriticalAssetAttention(
  assets: readonly {
    id: string;
    name: string;
    siteId: string;
    status: string;
    criticality: string;
  }[]
): FacilityAttentionItem[] {
  return assets
    .filter((asset) => asset.criticality === "critical" && asset.status === "in_repair")
    .map((asset) => ({
      id: `critical_asset_repair:${asset.id}`,
      severity: "wo_open_critical" as const,
      priority: priorityForFacilitySeverity("wo_open_critical"),
      title: `${asset.name} needs attention`,
      detail: "Critical asset is in repair.",
      href: `/facility/assets/${asset.id}`,
      aggregateType: "facility_assets",
      aggregateId: asset.id,
      siteId: asset.siteId
    }));
}

export function buildFacilityWorkOrderEmergencyAttention(
  workOrders: readonly {
    id: string;
    title: string;
    siteId: string | null;
    priority: string;
    status: string;
    productContext: string;
  }[]
): FacilityAttentionItem[] {
  return workOrders
    .filter(
      (wo) =>
        wo.productContext === "facility" &&
        wo.priority === "emergency" &&
        OPEN_WO_STATUSES.has(wo.status)
    )
    .map((wo) => ({
      id: `wo_emergency:${wo.id}`,
      severity: "wo_emergency" as const,
      priority: priorityForFacilitySeverity("wo_emergency"),
      title: `Emergency work: ${wo.title}`,
      detail: "Facility corrective work marked emergency — assign and restore.",
      href: `/facility/operations?workOrderId=${wo.id}`,
      aggregateType: "maintenance_work_orders",
      aggregateId: wo.id,
      siteId: wo.siteId
    }));
}

export function buildFacilityOpenCriticalWorkAttention(
  workOrders: readonly {
    id: string;
    title: string;
    siteId: string | null;
    priority: string;
    status: string;
    productContext: string;
    assetCriticality?: string | null;
  }[]
): FacilityAttentionItem[] {
  return workOrders
    .filter(
      (wo) =>
        wo.productContext === "facility" &&
        OPEN_WO_STATUSES.has(wo.status) &&
        wo.priority !== "emergency" &&
        (wo.priority === "high" || wo.assetCriticality === "critical")
    )
    .map((wo) => ({
      id: `wo_open_critical:${wo.id}`,
      severity: "wo_open_critical" as const,
      priority: priorityForFacilitySeverity("wo_open_critical"),
      title: `Open critical work: ${wo.title}`,
      detail: "High-priority or critical-asset facility work is still open.",
      href: `/facility/operations?workOrderId=${wo.id}`,
      aggregateType: "maintenance_work_orders",
      aggregateId: wo.id,
      siteId: wo.siteId
    }));
}

function pmAttentionPriority(
  severity: "pm_due" | "pm_overdue",
  criticality: string,
  daysOverdue: number
): number {
  const base = priorityForFacilitySeverity(severity);
  if (severity === "pm_due") {
    return base;
  }
  let bump = 0;
  if (criticality === "critical") {
    bump += 1;
  } else if (criticality === "high") {
    bump += 0.5;
  }
  if (daysOverdue >= 7) {
    bump += 1;
  } else if (daysOverdue >= 3) {
    bump += 0.5;
  }
  return Math.min(5, Math.round(base + bump));
}

export function buildFacilityPmDueAttention(
  schedules: readonly {
    id: string;
    name: string;
    siteId: string;
    status: string;
    nextDueOn: string | null;
    criticality: string;
  }[],
  asOf: string = todayUtcDate()
): FacilityAttentionItem[] {
  return schedules
    .filter(
      (schedule) =>
        schedule.status === "active" &&
        schedule.nextDueOn != null &&
        schedule.nextDueOn === asOf
    )
    .map((schedule) => ({
      id: `pm_due:${schedule.id}`,
      severity: "pm_due" as const,
      priority: pmAttentionPriority("pm_due", schedule.criticality, 0),
      title: `PM due: ${schedule.name}`,
      detail: "Preventive maintenance is due today — generate or complete work.",
      href: `/facility/preventive-maintenance?scheduleId=${schedule.id}`,
      aggregateType: "facility_pm_schedules",
      aggregateId: schedule.id,
      siteId: schedule.siteId
    }));
}

export function buildFacilityPmOverdueAttention(
  schedules: readonly {
    id: string;
    name: string;
    siteId: string;
    status: string;
    nextDueOn: string | null;
    criticality: string;
  }[],
  asOf: string = todayUtcDate()
): FacilityAttentionItem[] {
  return schedules
    .filter(
      (schedule) =>
        schedule.status === "active" &&
        schedule.nextDueOn != null &&
        schedule.nextDueOn < asOf
    )
    .map((schedule) => {
      const daysOverdue = daysBetweenUtcDates(schedule.nextDueOn!, asOf);
      return {
        id: `pm_overdue:${schedule.id}`,
        severity: "pm_overdue" as const,
        priority: pmAttentionPriority("pm_overdue", schedule.criticality, daysOverdue),
        title: `PM overdue: ${schedule.name}`,
        detail: `${daysOverdue} day${daysOverdue === 1 ? "" : "s"} overdue — restore program health.`,
        href: `/facility/preventive-maintenance?scheduleId=${schedule.id}`,
        aggregateType: "facility_pm_schedules",
        aggregateId: schedule.id,
        siteId: schedule.siteId
      };
    });
}

export function buildFacilityMissionControlNextAction(input: {
  setupComplete: boolean;
  activeSiteCount: number;
  draftSiteCount: number;
  firstActiveSiteId?: string | null;
  activeAssetCount?: number;
  downSystemCount?: number;
  firstAssetId?: string | null;
  openFacilityWorkCount?: number;
  emergencyFacilityWorkCount?: number;
  firstOpenWorkOrderId?: string | null;
  overduePmCount?: number;
  duePmCount?: number;
  firstPmScheduleId?: string | null;
}): {
  id: string;
  title: string;
  detail: string;
  href: string;
  assistantRecommendation: string;
} {
  if (!input.setupComplete) {
    return {
      id: "complete_setup",
      title: "Finish Guided Setup",
      detail: "Complete setup before daily facility operations begin.",
      href: "/setup",
      assistantRecommendation: "Finish Guided Setup."
    };
  }

  if (input.activeSiteCount <= 0) {
    if (input.draftSiteCount > 0) {
      return {
        id: "activate_first_site",
        title: "Activate your facility site",
        detail: "Complete required fields and activate so Mission Control has a site identity.",
        href: "/facility/sites",
        assistantRecommendation: "Activate your facility site."
      };
    }
    return {
      id: "add_first_site",
      title: "Add your first facility site",
      detail: "Create a site profile with timezone and a root location.",
      href: "/facility/sites?new=1",
      assistantRecommendation: "Add your first facility site."
    };
  }

  if ((input.downSystemCount ?? 0) > 0) {
    return {
      id: "restore_system",
      title: "Restore down building systems",
      detail: "A building system is marked down — review System Command Center.",
      href: "/facility/building-systems",
      assistantRecommendation: "Restore systems marked down."
    };
  }

  if ((input.emergencyFacilityWorkCount ?? 0) > 0) {
    return {
      id: "resolve_emergency_work",
      title: "Resolve emergency facility work",
      detail: "Emergency corrective work is open in Facility Operations.",
      href: input.firstOpenWorkOrderId
        ? `/facility/operations?workOrderId=${input.firstOpenWorkOrderId}`
        : "/facility/operations",
      assistantRecommendation: "Assign and resolve emergency facility work orders."
    };
  }

  if ((input.overduePmCount ?? 0) > 0) {
    return {
      id: "catch_up_pm",
      title: "Catch up overdue preventive maintenance",
      detail: "Active PM schedules are past due — generate work and restore program health.",
      href: input.firstPmScheduleId
        ? `/facility/preventive-maintenance?scheduleId=${input.firstPmScheduleId}`
        : "/facility/preventive-maintenance",
      assistantRecommendation: "Generate and complete overdue preventive maintenance work."
    };
  }

  if ((input.openFacilityWorkCount ?? 0) > 0) {
    return {
      id: "advance_facility_work",
      title: "Advance open facility work",
      detail: "Facility Operations has open corrective work waiting on execution.",
      href: input.firstOpenWorkOrderId
        ? `/facility/operations?workOrderId=${input.firstOpenWorkOrderId}`
        : "/facility/operations",
      assistantRecommendation: "Review the Facility Operations queue and hand off to Maintenance."
    };
  }

  if ((input.duePmCount ?? 0) > 0) {
    return {
      id: "run_due_pm",
      title: "Run preventive maintenance due today",
      detail: "Generate shared work orders for schedules due today.",
      href: input.firstPmScheduleId
        ? `/facility/preventive-maintenance?scheduleId=${input.firstPmScheduleId}`
        : "/facility/preventive-maintenance",
      assistantRecommendation: "Generate preventive work orders that are due today."
    };
  }

  if ((input.activeAssetCount ?? 0) <= 0) {
    return {
      id: "register_first_asset",
      title: "Register your first asset",
      detail: "Build the asset registry for your active facility site.",
      href: "/facility/assets?new=1",
      assistantRecommendation: "Register your first asset."
    };
  }

  return {
    id: "programs_ready",
    title: "Facility programs are ready",
    detail: "Create preventive schedules and open corrective work when issues arise.",
    href: "/facility/preventive-maintenance",
    assistantRecommendation:
      "Preventive Maintenance is ready. Activate schedules so due work generates into Maintenance."
  };
}
