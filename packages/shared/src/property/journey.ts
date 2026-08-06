/**
 * LAUNCH-001 J1 Mission Control / Assistant progression.
 */

export type MissionControlNextAction = {
  id: "complete_setup" | "add_first_property" | "invite_team" | "open_property";
  title: string;
  detail: string;
  href: string;
  assistantRecommendation: string;
};

export function buildMissionControlNextAction(input: {
  setupComplete: boolean;
  propertyCount: number;
  firstPropertyId?: string | null;
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

  if (input.firstPropertyId) {
    return {
      id: "invite_team",
      title: "Invite your team",
      detail: "Your property is ready. Bring teammates in so they can help run day-to-day operations.",
      href: "/settings/organization",
      assistantRecommendation: "Invite your team."
    };
  }

  return {
    id: "invite_team",
    title: "Invite your team",
    detail: "Your property is ready. Invite teammates next.",
    href: "/settings/organization",
    assistantRecommendation: "Invite your team."
  };
}

export function buildPropertyReadyAssistantCopy(propertyName: string): string {
  return `${propertyName} is ready. Invite your team.`;
}
