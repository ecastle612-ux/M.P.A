/** Client-safe Owner messaging types and helpers (no server imports). */

export type OwnerConversationListItem = {
  id: string;
  subject: string;
  propertyId: string | null;
  propertyName: string | null;
  propertyHref: string | null;
  lastMessagePreview: string | null;
  lastActivityAt: string | null;
  lastActivityLabel: string;
  unreadCount: number;
  isUnread: boolean;
  participantRoleLabels: string[];
};

export type OwnerMessageViewItem = {
  id: string;
  body: string;
  createdAt: string;
  createdAtLabel: string;
  senderId: string;
  senderLabel: string;
  attachmentCount: number;
  attachmentIds: string[];
};

export function formatOwnerParticipantRole(role: string): string {
  switch (role) {
    case "pm":
      return "Property manager";
    case "owner":
      return "Owner";
    case "staff":
      return "Staff";
    case "resident":
      return "Resident";
    case "vendor":
      return "Vendor";
    case "applicant":
      return "Applicant";
    default:
      return role;
  }
}

export function formatOwnerActivityLabel(value: string | null | undefined): string {
  if (!value) return "No activity yet";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}
