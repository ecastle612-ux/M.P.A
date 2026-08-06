export const TEAM_EVENT_TYPES = [
  "invitation.created",
  "invitation.sent",
  "invitation.accepted"
] as const;

export type TeamEventType = (typeof TEAM_EVENT_TYPES)[number];

export type TeamEventDefinition = {
  type: TeamEventType;
  aggregateType: string;
  description: string;
  auditAction: string;
};

export const TEAM_EVENT_CATALOG: readonly TeamEventDefinition[] = [
  {
    type: "invitation.created",
    aggregateType: "organization_invitations",
    description: "Team invitation created",
    auditAction: "invitation.created"
  },
  {
    type: "invitation.sent",
    aggregateType: "organization_invitations",
    description: "Invitation email delivered or accepted for delivery",
    auditAction: "invitation.sent"
  },
  {
    type: "invitation.accepted",
    aggregateType: "organization_invitations",
    description: "Invitee accepted and joined the organization",
    auditAction: "invitation.accepted"
  }
];
