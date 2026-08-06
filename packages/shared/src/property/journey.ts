/**
 * LAUNCH-001 Mission Control / Assistant progression (J0–J7).
 */

export type MissionControlNextAction = {
  id:
    | "complete_setup"
    | "add_first_property"
    | "invite_team"
    | "add_first_resident"
    | "create_first_lease"
    | "collect_first_rent"
    | "submit_first_maintenance"
    | "review_daily_operations"
    | "review_owner_portfolio"
    | "open_property";
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
}): MissionControlNextAction {
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
      title: "Collect your first rent",
      detail: "My resident is fully onboarded. Collect the first rent to continue operations.",
      href: "/pm/financial-operations#collect",
      assistantRecommendation: "Collect your first rent."
    };
  }

  if (!input.maintenanceReady) {
    return {
      id: "submit_first_maintenance",
      title: "Submit your first maintenance request",
      detail: "My first rent has been collected. Handle your first maintenance request next.",
      href: "/pm/maintenance",
      assistantRecommendation: "Submit your first maintenance request."
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

  return {
    id: "review_owner_portfolio",
    title: "Review your owner's portfolio.",
    detail: "I can run my property management business from this dashboard. Review your owner's portfolio next.",
    href: "/portal/owner/financials",
    assistantRecommendation: "Review your owner's portfolio."
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
  return `${residentName} is fully onboarded. Collect your first rent.`;
}

export function buildRentReadyAssistantCopy(): string {
  return "My first rent has been collected. Submit your first maintenance request.";
}

export function buildMaintenanceReadyAssistantCopy(): string {
  return "My maintenance operation is working. Review your daily operations.";
}

export {
  buildDailyOpsGreeting,
  buildDailyOpsAssistantBriefing,
  buildDailyOpsReadyAssistantCopy,
  type DailyOpsAttentionItem,
  type DailyOpsBriefingInput
} from "./daily-ops";
