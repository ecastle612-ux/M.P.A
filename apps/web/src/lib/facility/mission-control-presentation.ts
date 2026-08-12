import type { FacilityMissionControlSnapshot } from "../maintenance/maintenance-service";

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
