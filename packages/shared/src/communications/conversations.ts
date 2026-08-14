export const CONVERSATION_STATUSES = ["open", "closed"] as const;
export type ConversationStatus = (typeof CONVERSATION_STATUSES)[number];

export const CONVERSATION_LINKED_ENTITY_TYPES = ["work_order", "lease", "property"] as const;
export type ConversationLinkedEntityType = (typeof CONVERSATION_LINKED_ENTITY_TYPES)[number];

export const CONVERSATION_SENDER_PLANES = ["tenant", "staff"] as const;
export type ConversationSenderPlane = (typeof CONVERSATION_SENDER_PLANES)[number];

export const CONVERSATION_PARTICIPANT_TYPES = ["tenant", "staff"] as const;
export type ConversationParticipantType = (typeof CONVERSATION_PARTICIPANT_TYPES)[number];

export const CONVERSATION_MESSAGE_PAGE_SIZE = 50;
export const CONVERSATION_PREVIEW_MAX_CHARS = 140;

export type ConversationRecord = {
  id: string;
  organizationId: string;
  propertyId: string;
  leaseId: string;
  tenantAccountId: string;
  subject: string;
  status: ConversationStatus;
  linkedEntityType: ConversationLinkedEntityType | null;
  linkedEntityId: string | null;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
};

export type ConversationMessageRecord = {
  id: string;
  conversationId: string;
  organizationId: string;
  senderUserId: string;
  senderPlane: ConversationSenderPlane;
  senderDisplayName: string;
  body: string;
  linkedDocumentId: string | null;
  createdAt: string;
  hiddenAt: string | null;
  hiddenBy: string | null;
  readByCounterparty: boolean;
  attachmentCount: number;
};

export type ConversationInboxItem = ConversationRecord & {
  unread: boolean;
  tenantDisplayName: string | null;
  propertyName: string | null;
  unitLabel: string | null;
  linkedEntityLabel: string | null;
};

export function isConversationStatus(value: unknown): value is ConversationStatus {
  return typeof value === "string" && (CONVERSATION_STATUSES as readonly string[]).includes(value);
}

export function isConversationLinkedEntityType(
  value: unknown
): value is ConversationLinkedEntityType {
  return (
    typeof value === "string" &&
    (CONVERSATION_LINKED_ENTITY_TYPES as readonly string[]).includes(value)
  );
}

export function isConversationSenderPlane(value: unknown): value is ConversationSenderPlane {
  return typeof value === "string" && (CONVERSATION_SENDER_PLANES as readonly string[]).includes(value);
}

export function conversationPreviewFromBody(body: string): string {
  const trimmed = body.trim().replace(/\s+/g, " ");
  if (!trimmed) return "Attachment";
  return trimmed.length > CONVERSATION_PREVIEW_MAX_CHARS
    ? `${trimmed.slice(0, CONVERSATION_PREVIEW_MAX_CHARS - 1)}…`
    : trimmed;
}

export function defaultConversationSubject(input: {
  linkedEntityType?: ConversationLinkedEntityType | null;
  linkedEntityLabel?: string | null;
  firstMessageBody?: string | null;
}): string {
  if (input.linkedEntityType === "work_order") {
    return input.linkedEntityLabel?.trim() || "Work order";
  }
  if (input.linkedEntityType === "lease") {
    return input.linkedEntityLabel?.trim() || "Lease";
  }
  if (input.linkedEntityType === "property") {
    return input.linkedEntityLabel?.trim() || "Property";
  }
  const preview = conversationPreviewFromBody(input.firstMessageBody ?? "");
  return preview === "Attachment" ? "Conversation" : preview;
}

export function isConversationUnread(input: {
  lastMessageAt: string | null;
  lastReadAt: string | null;
  lastSenderUserId: string | null;
  viewerUserId: string;
}): boolean {
  if (!input.lastMessageAt) return false;
  if (input.lastSenderUserId && input.lastSenderUserId === input.viewerUserId) return false;
  if (!input.lastReadAt) return true;
  return Date.parse(input.lastMessageAt) > Date.parse(input.lastReadAt);
}

export function staffHasTenantCommsEntitlement(granted: readonly string[]): boolean {
  return granted.includes("platform.communications") && granted.includes("pm.portal_tenant");
}

export function validateConversationMessageContent(input: {
  body?: unknown;
  mediaIds?: unknown;
}): { ok: true; body: string; mediaIds: string[] } | { ok: false; error: string } {
  const body = typeof input.body === "string" ? input.body.trim() : "";
  const mediaIds = Array.isArray(input.mediaIds)
    ? input.mediaIds.filter((id): id is string => typeof id === "string" && id.length > 0)
    : [];
  if (!body && mediaIds.length === 0) {
    return { ok: false, error: "Message body or at least one attachment is required." };
  }
  if (body.length > 8000) {
    return { ok: false, error: "Message is too long." };
  }
  return { ok: true, body, mediaIds: Array.from(new Set(mediaIds)) };
}

export function tenantConversationHref(conversationId: string): string {
  return `/portal/tenant/messages/${conversationId}`;
}

export function staffConversationHref(conversationId: string): string {
  return `/shared/communications/conversations/${conversationId}`;
}
