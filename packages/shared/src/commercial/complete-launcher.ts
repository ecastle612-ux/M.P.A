import type { ProductSku } from "./skus";
import { skuIncludesFacilityOperations, skuIncludesPropertyManager } from "./skus";

export type CompleteLauncherPriority = {
  id: string;
  workspace: "property_operations" | "facility_operations";
  label: string;
  detail: string;
  href: string;
  tone: "critical" | "watch" | "neutral" | "ok";
};

export type CompleteLauncherWorkspaceHandoff = {
  id: "property_operations" | "facility_operations";
  title: string;
  summary: string;
  href: string;
  cta: string;
};

export type PmLauncherBrief = {
  propertyCount: number;
  nextAction?: { title: string; detail: string; href: string } | null;
  dailyOperations?: {
    briefing?: {
      immediateCount: number;
      waitingOnMeCount: number;
      waitingOnOthersCount: number;
      firstTask: string;
    } | null;
    openMaintenance?: Array<{ id: string; title: string; priority: string; href: string }>;
  } | null;
};

export type FoLauncherBrief = {
  todayOpen: number;
  emergency: number;
  open: number;
  overdue: number;
  waitingOnTechnician: number;
  waitingOnVendor: number;
};

/** Nav / launcher naming for Complete (one product, specialized workspaces). */
export function completeWorkspaceLabels() {
  return {
    productEyebrow: "Complete Platform",
    productTagline: "Your property and facility operation, together.",
    propertyOperations: "Property Operations",
    facilityOperations: "Facility Operations",
    propertyHome: "Property Operations",
    facilityHome: "Facility Operations",
    propertyHomeHref: "/pm/mission-control",
    facilityHomeHref: "/facility/mission-control",
    addPropertyHref: "/pm/properties?new=1",
    addBuildingHref: "/facility/assets",
    propertyCreateClarifier:
      "Properties are the shared building records for your organization. Add them once for leasing, residents, and facility work.",
    buildingCreateClarifier:
      "Buildings in Facility Operations are your organization properties. Prefer Add property when you are setting up the portfolio; use Assets to continue facility setup on those same records."
  } as const;
}

export function navigationGroupTitleForSku(
  groupId: "property_manager" | "facility_operations" | "shared" | "home" | string,
  sku: ProductSku | null
): string | null {
  if (groupId === "home") {
    return sku === "mpa_complete_platform" ? "Complete" : "Home";
  }
  if (groupId === "property_manager") {
    return sku === "mpa_complete_platform" ? "Property Operations" : "Property Manager";
  }
  if (groupId === "facility_operations") {
    return "Facility Operations";
  }
  if (groupId === "shared") {
    return sku === "mpa_complete_platform" ? "Shared" : "Shared Platform";
  }
  return null;
}

export function missionControlNavLabelForSku(
  surface: "property" | "facility",
  sku: ProductSku | null
): string {
  if (sku === "mpa_complete_platform") {
    // Group title already says Property/Facility Operations — keep the item short.
    return "Mission Control";
  }
  return surface === "property" ? "PM Mission Control" : "Facility Mission Control";
}

/**
 * Build Complete "Today" priorities from authoritative PM + FO briefs only.
 * Never invents counts — skips items when underlying data is zero/absent.
 */
export function buildCompleteLauncherPriorities(input: {
  pm: PmLauncherBrief | null;
  fo: FoLauncherBrief | null;
}): CompleteLauncherPriority[] {
  const labels = completeWorkspaceLabels();
  const priorities: CompleteLauncherPriority[] = [];
  const pm = input.pm;
  const fo = input.fo;

  if (pm && pm.propertyCount === 0) {
    priorities.push({
      id: "empty_property",
      workspace: "property_operations",
      label: "Start by adding your first property",
      detail: labels.propertyCreateClarifier,
      href: labels.addPropertyHref,
      tone: "watch"
    });
  }

  if (pm?.dailyOperations?.briefing && pm.propertyCount > 0) {
    const briefing = pm.dailyOperations.briefing;
    if (briefing.immediateCount > 0) {
      priorities.push({
        id: "pm_immediate",
        workspace: "property_operations",
        label: `${briefing.immediateCount} property item${briefing.immediateCount === 1 ? "" : "s"} need immediate attention`,
        detail: briefing.firstTask || "Open Property Operations to clear blockers.",
        href: labels.propertyHomeHref,
        tone: "critical"
      });
    }
    if (briefing.waitingOnMeCount > 0) {
      priorities.push({
        id: "pm_waiting_me",
        workspace: "property_operations",
        label: `${briefing.waitingOnMeCount} property item${briefing.waitingOnMeCount === 1 ? "" : "s"} waiting on you`,
        detail: "Continue from Property Operations.",
        href: labels.propertyHomeHref,
        tone: "watch"
      });
    }
  } else if (pm?.nextAction && pm.propertyCount > 0) {
    priorities.push({
      id: "pm_next_action",
      workspace: "property_operations",
      label: pm.nextAction.title,
      detail: pm.nextAction.detail,
      href: pm.nextAction.href,
      tone: "watch"
    });
  }

  const emergencyMaintenance =
    pm?.dailyOperations?.openMaintenance?.filter((row) =>
      /emergency|critical|urgent/i.test(row.priority)
    ) ?? [];
  if (emergencyMaintenance.length > 0) {
    const first = emergencyMaintenance[0]!;
    priorities.push({
      id: "pm_emergency_maint",
      workspace: "property_operations",
      label: `${emergencyMaintenance.length} residential maintenance priorit${
        emergencyMaintenance.length === 1 ? "y" : "ies"
      }`,
      detail: first.title,
      href: first.href || "/pm/maintenance",
      tone: "critical"
    });
  }

  if (fo) {
    if (fo.emergency > 0) {
      priorities.push({
        id: "fo_emergency",
        workspace: "facility_operations",
        label: `${fo.emergency} facility emergency / critical`,
        detail: "Triage in Facility Operations.",
        href: "/facility/operations",
        tone: "critical"
      });
    }
    if (fo.overdue > 0) {
      priorities.push({
        id: "fo_overdue",
        workspace: "facility_operations",
        label: `${fo.overdue} overdue facility work`,
        detail: "Clear overdue facility work first.",
        href: "/facility/operations",
        tone: "watch"
      });
    }
    const waiting = fo.waitingOnTechnician + fo.waitingOnVendor;
    if (waiting > 0) {
      priorities.push({
        id: "fo_waiting",
        workspace: "facility_operations",
        label: `${waiting} facility assignment${waiting === 1 ? "" : "s"} waiting`,
        detail: `${fo.waitingOnTechnician} technician · ${fo.waitingOnVendor} vendor`,
        href: labels.facilityHomeHref,
        tone: "watch"
      });
    } else if (fo.todayOpen > 0) {
      priorities.push({
        id: "fo_today",
        workspace: "facility_operations",
        label: `${fo.todayOpen} facility work item${fo.todayOpen === 1 ? "" : "s"} for today`,
        detail: "Open Facility Operations to assign, start, and complete.",
        href: "/facility/operations",
        tone: "neutral"
      });
    } else if (fo.open > 0) {
      priorities.push({
        id: "fo_open",
        workspace: "facility_operations",
        label: `${fo.open} open facility work`,
        detail: "Review the facility queue when ready.",
        href: labels.facilityHomeHref,
        tone: "neutral"
      });
    }
  }

  return priorities;
}

export function buildCompleteWorkspaceHandoffs(sku: ProductSku): CompleteLauncherWorkspaceHandoff[] {
  const labels = completeWorkspaceLabels();
  const handoffs: CompleteLauncherWorkspaceHandoff[] = [];
  if (skuIncludesPropertyManager(sku)) {
    handoffs.push({
      id: "property_operations",
      title: labels.propertyOperations,
      summary:
        "Portfolio attention home — properties, residents, leasing, residential maintenance, and vendors.",
      href: labels.propertyHomeHref,
      cta: "Open Property Operations"
    });
  }
  if (skuIncludesFacilityOperations(sku)) {
    handoffs.push({
      id: "facility_operations",
      title: labels.facilityOperations,
      summary:
        "Facility attention home — buildings, work orders, preventive maintenance, inspections, and systems.",
      href: labels.facilityHomeHref,
      cta: "Open Facility Operations"
    });
  }
  return handoffs;
}

export function completeLauncherEmptyGuidance(input: {
  propertyCount: number;
  foOpen: number | null;
}): { title: string; detail: string; href: string; cta: string } | null {
  const labels = completeWorkspaceLabels();
  if (input.propertyCount === 0) {
    return {
      title: "Start by adding your first property",
      detail: labels.propertyCreateClarifier,
      href: labels.addPropertyHref,
      cta: "Add first property"
    };
  }
  if (input.foOpen === 0) {
    return {
      title: "No urgent facility work right now",
      detail:
        "When facility work arrives, it appears here and in Facility Operations. You can still open either workspace anytime.",
      href: labels.facilityHomeHref,
      cta: "Open Facility Operations"
    };
  }
  return null;
}
