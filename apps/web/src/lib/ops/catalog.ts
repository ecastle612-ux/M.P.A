/**
 * OPS-001 Slice A — approved core catalog event types used by the bus + timeline.
 * Full catalog lives in docs/111-ops-001…/02-event-catalog.md; Slice A wires maintenance chain first.
 */

export const OPS_SLICE_A_EVENT_TYPES = [
  // Maintenance chain (validation path)
  "maintenance.request.created",
  "maintenance.vendor.assigned",
  "maintenance.vendor.accepted",
  "maintenance.vendor.declined",
  "maintenance.technician.arrived",
  "maintenance.work.completed",
  "maintenance.overdue",
  // Tenancy / property (emit-capable; project when emitted)
  "property.created",
  "property.archived",
  "unit.created",
  "tenant.created",
  "tenant.invited",
  // Lease
  "lease.created",
  "lease.signed",
  "lease.activated",
  "lease.expiring",
  "lease.renewed",
  "lease.ended",
  // AUTH-001 Slice B (secret-free provision)
  "auth.organization.provisioned",
  // AUTH-001 Slice C (secret-free invite / credential delivery / contact verify)
  "auth.user.invited",
  "auth.user.invitation_accepted",
  "auth.user.invitation_revoked",
  "auth.credentials.delivered",
  "auth.credentials.delivery_failed",
  "auth.contact_email.verified",
  // AUTH-001 Slice D (secret-free role lifecycle)
  "auth.role.assigned",
  "auth.role.changed",
  "auth.membership.activated",
  "auth.membership.disabled",
  // AUTH-001 Slice E (secret-free recovery / escalation / offboarding)
  "auth.recovery.org_admin_completed",
  "auth.recovery.subaccount_reset",
  "auth.recovery.ownership_restored",
  "auth.recovery.contact_updated",
  "auth.recovery.contact_verified",
  "auth.escalation.opened",
  "auth.escalation.escalated",
  "auth.escalation.resolved",
  "auth.offboarding.completed",
  "auth.organization.activated",
  // COM-001 Slice A (secret-free commercial outcomes)
  "commercial.opportunity.created",
  "commercial.opportunity.stage_changed",
  "commercial.activation.requested",
  "commercial.activation.completed",
  "commercial.activation.failed",
  // COM-001 Slice B (secret-free progress / trial)
  "commercial.implementation.score_updated",
  "commercial.implementation.milestone_updated",
  "commercial.trial.status_changed",
  "commercial.trial.reminder_due",
  "commercial.trial.convert_started",
  // COM-001 Slice C (secret-free health / discovery / timeline)
  "commercial.health.score_updated",
  "commercial.discovery.impressed",
  "commercial.discovery.accepted",
  "commercial.discovery.dismissed",
  "commercial.discovery.snoozed",
  "commercial.timeline.entry_appended",
  // COM-001 Slice D (secret-free offboarding / CS motions / renewal alerts)
  "commercial.offboarding.stage_changed",
  "commercial.offboarding.export_ready",
  "commercial.offboarding.frozen",
  "commercial.offboarding.archived",
  "commercial.offboarding.recovered",
  "commercial.cs_motion.scheduled",
  "commercial.cs_motion.due",
  "commercial.cs_motion.completed",
  "commercial.renewal.alert_due",
  // COM-001 Slice E (secret-free staff dashboard / marketplace prep)
  "commercial.dashboard.opened",
  "commercial.engagement.created",
  "commercial.engagement.status_changed",
  // OPS-001 Slice B (secret-free notify / reminder / schedule outcomes)
  "ops.notification.queued",
  "ops.notification.delivered",
  "ops.notification.failed",
  "ops.reminder.scheduled",
  "ops.reminder.fired",
  "ops.reminder.canceled",
  "ops.schedule.run_started",
  "ops.schedule.run_completed",
  "ops.schedule.run_failed",
  // OPS-001 Slice C (secret-free task / workflow outcomes)
  "ops.task.created",
  "ops.task.updated",
  "ops.task.completed",
  "ops.task.canceled",
  "ops.workflow.started",
  "ops.workflow.step.entered",
  "ops.workflow.step.exited",
  "ops.workflow.completed",
  // OPS-001 Slice D (secret-free AI / automation / KPI outcomes)
  "ai.recommendation.generated",
  "ai.recommendation.applied",
  "ai.recommendation.rejected",
  "ops.automation.fired",
  "ops.automation.failed",
  "ops.kpi.materialized",
  // OPS-001 Slice E (secret-free command surface outcomes)
  "ops.quick_action.invoked",
  "ops.inbox.opened",
  "ops.search.performed"
] as const;

export type OpsSliceAEventType = (typeof OPS_SLICE_A_EVENT_TYPES)[number];

export function isOpsSliceAEventType(value: string): value is OpsSliceAEventType {
  return (OPS_SLICE_A_EVENT_TYPES as readonly string[]).includes(value);
}

/** Map legacy maintenance_activity_events.event_type → catalog key (Slice A). */
export function mapMaintenanceActivityToCatalog(
  legacyType: string,
  details: Record<string, unknown> = {}
): OpsSliceAEventType | null {
  switch (legacyType) {
    case "created":
      return "maintenance.request.created";
    case "assigned":
      // Internal staff assign stays off vendor catalog; vendor id in details → vendor.assigned
      if (details["vendorId"] || details["vendor_id"]) return "maintenance.vendor.assigned";
      return null;
    case "vendor_accepted":
    case "vendor_job_accepted":
      return "maintenance.vendor.accepted";
    case "vendor_declined":
    case "vendor_job_declined":
      return "maintenance.vendor.declined";
    case "vendor_job_started":
    case "technician_arrived":
      return "maintenance.technician.arrived";
    case "completed":
    case "vendor_job_finished":
      return "maintenance.work.completed";
    case "overdue":
      return "maintenance.overdue";
    default:
      return null;
  }
}

export function categoryForEventType(eventType: string): string {
  const domain = eventType.split(".")[0] ?? "ops";
  return domain;
}
