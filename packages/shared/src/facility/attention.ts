/**
 * Facility Mission Control attention — E.1 + E.2 signals.
 * Later slices populate remaining severities.
 */

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

export function buildFacilityMissionControlNextAction(input: {
  setupComplete: boolean;
  activeSiteCount: number;
  draftSiteCount: number;
  firstActiveSiteId?: string | null;
  activeAssetCount?: number;
  downSystemCount?: number;
  firstAssetId?: string | null;
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
    id: "assets_ready",
    title: "Asset registry is active",
    detail: "Review assets and building systems. Later slices add work programs.",
    href: input.firstAssetId ? `/facility/assets/${input.firstAssetId}` : "/facility/assets",
    assistantRecommendation: "Your asset registry is ready. Review critical assets and systems."
  };
}
