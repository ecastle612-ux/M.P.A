/**
 * FIN-001 future extension points — wired as no-ops.
 * Scheduled reports, owner/manager delivery, AI summary, budget vs actual,
 * tax packages, and portfolio reports must plug in here later.
 */

import type { ReportJobResult, ReportRequestInput, ReportVersionSummary } from "./contracts";

export type ScheduleReportSpec = {
  reportType: ReportRequestInput["reportType"];
  propertyId: string;
  cadence: "monthly";
  dayOfMonth: number;
};

export type DeliveryChannel = "owner_portal" | "email" | "manager_inbox";

/** Future: enqueue cron-based generation. */
export async function scheduleReport(
  spec: ScheduleReportSpec
): Promise<{ accepted: false; reason: string }> {
  void spec;
  return { accepted: false, reason: "Scheduled reports are not implemented in FIN-001 Phase 1." };
}

/** Future: deliver vaulted version to owner/manager. */
export async function deliverReport(
  versionId: string,
  channel: DeliveryChannel
): Promise<{ accepted: false; reason: string }> {
  void versionId;
  void channel;
  return { accepted: false, reason: "Report delivery is not implemented in FIN-001 Phase 1." };
}

/** Future: IA-001 AI financial summary over a generated report. */
export async function summarizeReport(
  versionId: string
): Promise<{ accepted: false; reason: string }> {
  void versionId;
  return { accepted: false, reason: "AI financial summary is not implemented in FIN-001 Phase 1." };
}

/** Event hook after successful generation — future notifications / portal publish. */
export async function onReportGenerated(payload: {
  organizationId: string;
  input: ReportRequestInput;
  result: ReportJobResult;
  version: ReportVersionSummary | null;
}): Promise<void> {
  void payload;
  // Intentionally empty — extension surface for schedule/delivery/AI.
}
