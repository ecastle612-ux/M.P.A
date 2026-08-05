/**
 * UX-016 Slice B — role surface catalog (presentation copy only).
 */

export type Ux016Surface =
  | "organization_admin"
  | "property_manager"
  | "facility_technician"
  | "leasing_agent"
  | "resident"
  | "vendor"
  | "owner"
  | "support";

export type Ux016SurfaceCopy = {
  surface: Ux016Surface;
  eyebrow: string;
  supportingLine: string;
  attentionEmptyTitle: string;
  attentionEmptyDescription: string;
  attentionEmptyWhy: string;
  missionEmpty: string;
  insightsHint: string;
};

export const UX016_SURFACE_COPY: Record<Ux016Surface, Ux016SurfaceCopy> = {
  organization_admin: {
    surface: "organization_admin",
    eyebrow: "Organization Admin",
    supportingLine: "Keep the workspace healthy — people, billing, and platform risk first.",
    attentionEmptyTitle: "Workspace looks healthy",
    attentionEmptyDescription:
      "Immediate Attention highlights setup gaps, billing issues, compliance, and pending approvals.",
    attentionEmptyWhy: "When an organization needs you, it will surface here before everything else.",
    missionEmpty: "No org activation, invitation, or subscription actions waiting right now.",
    insightsHint: "Org health stays below the fold — work comes first."
  },
  property_manager: {
    surface: "property_manager",
    eyebrow: "Property Manager",
    supportingLine: "Ready to tackle today’s operations?",
    attentionEmptyTitle: "You’re clear for now",
    attentionEmptyDescription:
      "Emergencies, vacancies, expiring leases, and resident escalations appear here first.",
    attentionEmptyWhy: "When residents or properties need you, you’ll see it immediately.",
    missionEmpty: "No open work orders, moves, inspections, or renewals in your queues.",
    insightsHint: "Portfolio analytics stay below the fold — work comes first."
  },
  facility_technician: {
    surface: "facility_technician",
    eyebrow: "Technician",
    supportingLine: "Your jobs are ordered by urgency — start with what needs you now.",
    attentionEmptyTitle: "No urgent jobs right now",
    attentionEmptyDescription: "Emergencies, high-priority repairs, and overdue work show here first.",
    attentionEmptyWhy: "Field work stays calm when only true urgency breaks through.",
    missionEmpty: "No assigned jobs for today. Check back or contact the office if you expect work.",
    insightsHint: "Job counts stay light — your queue is the product."
  },
  leasing_agent: {
    surface: "leasing_agent",
    eyebrow: "Leasing",
    supportingLine: "Move prospects to signed leases without hunting for the next follow-up.",
    attentionEmptyTitle: "Pipeline is quiet",
    attentionEmptyDescription: "Tours, pending applications, and unsent leases will appear here.",
    attentionEmptyWhy: "Leasing wins when today’s showings and signatures stay obvious.",
    missionEmpty: "No showings, applications, or signatures waiting in your leasing queues.",
    insightsHint: "Pipeline metrics stay secondary to today’s leasing work."
  },
  resident: {
    surface: "resident",
    eyebrow: "Home",
    supportingLine: "Your home portal — payments, maintenance, and messages in one place.",
    attentionEmptyTitle: "Everything looks good today",
    attentionEmptyDescription: "Payment reminders, maintenance updates, and messages from your office show here.",
    attentionEmptyWhy: "You’ll never miss something that needs a response.",
    missionEmpty: "No open requests or upcoming items right now.",
    insightsHint: "Resident homes stay calm — insights are optional."
  },
  vendor: {
    surface: "vendor",
    eyebrow: "Vendor job",
    supportingLine: "Accept, start, and finish assigned work without hunting for instructions.",
    attentionEmptyTitle: "No urgent actions on this job",
    attentionEmptyDescription: "New assignments, acceptances, and invoice requests appear here.",
    attentionEmptyWhy: "You should always know the next step for this work order.",
    missionEmpty: "This job has no additional schedule items right now.",
    insightsHint: "Vendors focus on the job — not portfolio analytics."
  },
  owner: {
    surface: "owner",
    eyebrow: "Owner",
    supportingLine: "See portfolio attention first — performance details stay below.",
    attentionEmptyTitle: "Portfolio is calm",
    attentionEmptyDescription: "Occupancy changes, revenue alerts, and items needing your approval appear here.",
    attentionEmptyWhy: "Owners should never dig for decisions that matter.",
    missionEmpty: "No portfolio reviews, reports, or approvals waiting right now.",
    insightsHint: "Financial snapshots stay below the fold."
  },
  support: {
    surface: "support",
    eyebrow: "Support",
    supportingLine: "Critical tickets and platform incidents before everything else.",
    attentionEmptyTitle: "No critical support fires",
    attentionEmptyDescription: "Incidents, failed integrations, and escalations surface here first.",
    attentionEmptyWhy: "Support starts with what is breaking — not a KPI wall.",
    missionEmpty: "No assigned tickets or SLA deadlines in this view right now.",
    insightsHint: "Platform health KPIs stay below operational attention."
  }
};

export function resolveUx016SurfaceFromRole(
  primaryRole: string | null | undefined
): Ux016Surface {
  switch (primaryRole) {
    case "organization_admin":
      return "organization_admin";
    case "leasing_agent":
      return "leasing_agent";
    case "facility_technician":
      return "facility_technician";
    case "tenant":
      return "resident";
    case "property_owner":
      return "owner";
    case "vendor":
      return "vendor";
    case "property_manager":
    default:
      return "property_manager";
  }
}
