/**
 * LAUNCH-001 Mission Control / Assistant progression (J0–J8).
 * Recommendations are role-appropriate — staff never get resident-only CTAs.
 */

import type { UserRole } from "../types/roles";

export type MissionControlNextAction = {
  id:
    | "complete_setup"
    | "add_first_property"
    | "invite_team"
    | "add_first_resident"
    | "create_first_lease"
    | "collect_first_rent"
    | "review_maintenance_queue"
    | "submit_first_maintenance"
    | "start_assigned_work"
    | "view_vendor_assignments"
    | "review_daily_operations"
    | "review_owner_portfolio"
    | "customer_promise_complete"
    | "open_property"
    | "platform_operations";
  title: string;
  detail: string;
  href: string;
  assistantRecommendation: string;
};

export function buildMissionControlNextAction(input: {
  setupComplete: boolean;
  propertyCount: number;
  firstPropertyId?: string | null;
  /** True when at least one teammate has accepted / active membership beyond the creator alone. */
  teamReady?: boolean;
  /** True when at least one operational resident exists for the organization. */
  residentReady?: boolean;
  /** True when at least one lease has been signed/activated. */
  leaseReady?: boolean;
  /** True when at least one successful rent/payment collection exists. */
  rentReady?: boolean;
  /** True when at least one maintenance work order has been closed end-to-end. */
  maintenanceReady?: boolean;
  /** True when the daily operations briefing has been reviewed on Mission Control. */
  dailyOpsReady?: boolean;
  /** True when the owner portfolio home has been reviewed (J8). */
  ownerPortfolioReady?: boolean;
  /** Active actor role — keeps CTAs executable for that role. */
  actorRole?: UserRole | null;
}): MissionControlNextAction {
  if (input.actorRole === "tenant") {
    return {
      id: "submit_first_maintenance",
      title: "Submit a maintenance request",
      detail: "Tell your property team what needs attention.",
      href: "/portal/tenant/maintenance",
      assistantRecommendation: "Submit a maintenance request."
    };
  }

  if (input.actorRole === "vendor") {
    return {
      id: "view_vendor_assignments",
      title: "View assigned work",
      detail: "Open your vendor workspace for assigned work orders.",
      href: "/portal/vendor",
      assistantRecommendation: "View assigned work."
    };
  }

  if (input.actorRole === "property_owner") {
    return {
      id: "review_owner_portfolio",
      title: "Review your portfolio",
      detail: "Check occupancy, rent, balances, and maintenance for your properties.",
      href: "/portal/owner",
      assistantRecommendation: "Review your portfolio."
    };
  }

  if (input.actorRole === "maintenance_technician") {
    return {
      id: "start_assigned_work",
      title: "Start assigned work",
      detail: "Open Maintenance to see work orders assigned to you.",
      href: "/pm/maintenance",
      assistantRecommendation: "Start assigned work."
    };
  }

  if (input.actorRole === "leasing_agent") {
    return {
      id: "create_first_lease",
      title: "Open leasing",
      detail: "Continue leasing work from your workspace.",
      href: "/pm/leasing",
      assistantRecommendation: "Open leasing."
    };
  }
  if (!input.setupComplete) {
    return {
      id: "complete_setup",
      title: "Finish Guided Setup",
      detail: "Complete setup before daily operations begin.",
      href: "/setup",
      assistantRecommendation: "Finish Guided Setup so Mission Control can guide your first property."
    };
  }

  if (input.propertyCount <= 0) {
    return {
      id: "add_first_property",
      title: "Add your first property",
      detail: "Create and activate a property to begin managing your portfolio.",
      href: "/pm/properties?new=1",
      assistantRecommendation: "Add your first property. Keep it simple — name and units are enough to start."
    };
  }

  if (!input.teamReady) {
    return {
      id: "invite_team",
      title: "Invite your team",
      detail: "Your property is ready. Bring teammates in so they can help run day-to-day operations.",
      href: "/settings/team",
      assistantRecommendation: "Invite your team."
    };
  }

  if (!input.residentReady) {
    return {
      id: "add_first_resident",
      title: "Add your first resident",
      detail: "My team is ready. Add a resident to continue onboarding.",
      href: "/pm/residents?new=1",
      assistantRecommendation: "Add your first resident."
    };
  }

  if (!input.leaseReady) {
    return {
      id: "create_first_lease",
      title: "Create your first lease",
      detail: "My first resident has been added. Create a lease to continue the lifecycle.",
      href: "/pm/leasing?new=1",
      assistantRecommendation: "Create your first lease."
    };
  }

  if (!input.rentReady) {
    return {
      id: "collect_first_rent",
      title: "Record your first payment",
      detail: "My resident is fully onboarded. Record the first payment to continue operations.",
      href: "/pm/financial-operations#record",
      assistantRecommendation: "Record your first payment."
    };
  }

  if (!input.maintenanceReady) {
    return {
      id: "review_maintenance_queue",
      title: "Review your maintenance queue",
      detail:
        "First payment recorded. Open Maintenance to triage resident requests — residents submit from their portal.",
      href: "/pm/maintenance",
      assistantRecommendation: "Review your maintenance queue."
    };
  }

  if (!input.dailyOpsReady) {
    return {
      id: "review_daily_operations",
      title: "Review today's operations.",
      detail: "My maintenance operation is working. Review today's operations next.",
      href: "/pm/mission-control",
      assistantRecommendation: "Review your daily operations."
    };
  }

  if (!input.ownerPortfolioReady) {
    return {
      id: "review_owner_portfolio",
      title: "Review your owner's portfolio.",
      detail:
        "I can run my property management business from this dashboard. Review your owner's portfolio next.",
      href: "/portal/owner",
      assistantRecommendation: "Review your owner's portfolio."
    };
  }

  return {
    id: "customer_promise_complete",
    title: "Customer promise complete",
    detail: "I can confidently monitor my investment portfolio using M.P.A.",
    href: "/portal/owner",
    assistantRecommendation: "I can confidently monitor my investment portfolio using M.P.A."
  };
}

export function buildPropertyReadyAssistantCopy(propertyName: string): string {
  return `${propertyName} is ready. Invite your team.`;
}

export function buildTeamReadyAssistantCopy(): string {
  return "My team is ready. Add your first resident.";
}

export function buildResidentReadyAssistantCopy(residentName: string): string {
  return `${residentName} is ready. Create your first lease.`;
}

export function buildLeaseReadyAssistantCopy(residentName: string): string {
  return `${residentName} is fully onboarded. Record your first payment.`;
}

export function buildRentReadyAssistantCopy(): string {
  return "First payment recorded. Review your maintenance queue.";
}

export function buildMaintenanceReadyAssistantCopy(): string {
  return "My maintenance operation is working. Review your daily operations.";
}

export {
  buildDailyOpsGreeting,
  buildDailyOpsAssistantBriefing,
  buildDailyOpsReadyAssistantCopy,
  resolveDailyOpsBriefingAccess,
  MPA_ASSISTANT_LABEL,
  MPA_ASSISTANT_KIND,
  type DailyOpsAttentionItem,
  type DailyOpsBriefingInput,
  type DailyOpsBriefingAccess
} from "./daily-ops";

export {
  buildOwnerPortfolioAssistantSummary,
  buildOwnerPortfolioReadyAssistantCopy,
  buildOwnerPortfolioGreeting,
  type OwnerPortfolioBriefingInput
} from "./owner-portfolio";
