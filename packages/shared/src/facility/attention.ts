/**
 * Facility Mission Control attention — Phase E.1 signals only.
 * Later slices populate additional severities; placeholders stay empty until authorized.
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

export function buildFacilityMissionControlNextAction(input: {
  setupComplete: boolean;
  activeSiteCount: number;
  draftSiteCount: number;
  firstActiveSiteId?: string | null;
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

  return {
    id: "site_ready",
    title: "Facility site is active",
    detail: "Review Overview. Later slices add assets, systems, and work programs.",
    href: input.firstActiveSiteId
      ? `/facility/sites/${input.firstActiveSiteId}`
      : "/facility/overview",
    assistantRecommendation: "Your facility site is ready. Review Facility Overview."
  };
}
