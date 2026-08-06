export const TEAM_AUDIT_ACTIONS = [
  "invitation.created",
  "invitation.sent",
  "invitation.accepted"
] as const;

export type TeamAuditAction = (typeof TEAM_AUDIT_ACTIONS)[number];

export const TEAM_AUDIT_CATALOG = [
  {
    action: "invitation.created" as const,
    entityType: "organization_invitations",
    description: "Invitation created for a teammate"
  },
  {
    action: "invitation.sent" as const,
    entityType: "organization_invitations",
    description: "Invitation email send attempted/succeeded"
  },
  {
    action: "invitation.accepted" as const,
    entityType: "organization_invitations",
    description: "Invitation accepted; membership activated"
  }
];
