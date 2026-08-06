/**
 * LAUNCH-001 Mission Control / Assistant progression (J0–J3).
 */

export type MissionControlNextAction = {
  id:
    | "complete_setup"
    | "add_first_property"
    | "invite_team"
    | "add_first_resident"
    | "create_first_lease"
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

  return {
    id: "create_first_lease",
    title: "Create your first lease",
    detail: "My first resident has been added. Create a lease to continue the lifecycle.",
    href: "/pm/leasing?new=1",
    assistantRecommendation: "Create your first lease."
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
