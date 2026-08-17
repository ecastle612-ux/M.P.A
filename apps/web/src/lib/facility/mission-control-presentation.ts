import type { ProductSku } from "@mpa/shared";
import type { FacilityMissionControlSnapshot } from "../maintenance/maintenance-service";

export type FacilityMissionControlQuickAction = {
  href: string;
  label: string;
  primary?: boolean;
};

/**
 * P1-01 — FO Mission Control handoffs follow the member's entitlements,
 * not the organization's Complete SKU alone.
 */
export function facilityMissionControlQuickActions(input: {
  productSku: ProductSku | null;
  canAccess: (entitlement: string) => boolean;
}): FacilityMissionControlQuickAction[] {
  const isComplete = input.productSku === "mpa_complete_platform";
  const actions: FacilityMissionControlQuickAction[] = [
    { href: "/facility/operations", label: "Open operations", primary: true },
    { href: "/facility/vendors", label: "Vendors" },
    { href: "/facility/assets", label: "Buildings" },
    { href: "/shared/documents", label: "Documents" },
    { href: "/shared/communications", label: "Communications" }
  ];
  if (input.canAccess("pm.maintenance")) {
    actions.push({
      href: "/pm/maintenance",
      label: isComplete ? "Property maintenance" : "PM Maintenance"
    });
  }
  if (input.canAccess("pm.mission_control")) {
    actions.push({ href: "/pm/mission-control", label: "Property Operations" });
  }
  return actions;
}

export type FoGlanceMetric = {
  id: string;
  label: string;
  value: number;
  hint: string;
  tone: "ok" | "watch" | "critical" | "neutral";
};

/**
 * PPS1-003 — glance metrics from authoritative snapshot fields only.
 * Never reuse one value under two different operational labels.
 */
export function facilityMissionControlGlanceMetrics(
  snapshot: FacilityMissionControlSnapshot
): FoGlanceMetric[] {
  return [
    {
      id: "today",
      label: "Today's work",
      value: snapshot.todayOpen,
      hint: "Open work submitted or due today",
      tone: snapshot.todayOpen > 0 ? "watch" : "ok"
    },
    {
      id: "emergency",
      label: "Emergency / critical",
      value: snapshot.emergency,
      hint: "Open emergency-priority facility work",
      tone: snapshot.emergency > 0 ? "critical" : "ok"
    },
    {
      id: "open",
      label: "Open work",
      value: snapshot.open,
      hint: `${snapshot.overdue} overdue`,
      tone: snapshot.overdue > 0 ? "watch" : "neutral"
    },
    {
      id: "waiting_technician",
      label: "Waiting on technicians",
      value: snapshot.waitingOnTechnician,
      hint: "Assigned to a technician and awaiting start or progress",
      tone: snapshot.waitingOnTechnician > 0 ? "watch" : "neutral"
    },
    {
      id: "waiting_vendor",
      label: "Waiting on vendors",
      value: snapshot.waitingOnVendor,
      hint: "Assigned to a vendor and awaiting start or progress",
      tone: snapshot.waitingOnVendor > 0 ? "watch" : "neutral"
    },
    {
      id: "completed",
      label: "Recently completed",
      value: snapshot.completedRecently,
      hint: "Completed or closed in the last 7 days",
      tone: "ok"
    }
  ];
}

export type MissionControlLoadView = "loading" | "error" | "ready";

/** PPS1-003 — never show skeletons once loading finished (including on error). */
export function facilityMissionControlLoadView(input: {
  loading: boolean;
  error: string | null;
  hasSnapshot: boolean;
}): MissionControlLoadView {
  if (input.loading) {
    return "loading";
  }
  // Prefer an explicit error over a stale snapshot so Retry is always reachable.
  if (input.error) {
    return "error";
  }
  if (input.hasSnapshot) {
    return "ready";
  }
  return "error";
}

export function facilityMissionControlErrorMessage(_raw: unknown): string {
  void _raw;
  return "We couldn’t load Facility Mission Control. Check your connection and try again.";
}
