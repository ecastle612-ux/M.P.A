export const THREAD_TYPES = [
  "resident_pm",
  "resident_maintenance",
  "pm_vendor",
  "pm_owner",
  "internal_staff",
  "applicant_leasing"
] as const;

export const SOURCE_ENTITY_TYPES = [
  "maintenance",
  "lease",
  "applicant",
  "resident",
  "vendor_assignment",
  "inspection",
  "financial",
  "general",
  "announcement_reply"
] as const;

export const THREAD_STATUSES = ["active", "unread", "read", "archived", "resolved"] as const;
export const PARTICIPANT_ROLES = ["pm", "resident", "vendor", "owner", "staff", "applicant"] as const;
export const MESSAGE_VISIBILITIES = ["resident", "internal", "vendor"] as const;
export const MESSAGE_DELIVERY_STATUSES = ["sent", "delivered", "read"] as const;

export type ThreadType = (typeof THREAD_TYPES)[number];
export type SourceEntityType = (typeof SOURCE_ENTITY_TYPES)[number];
export type ThreadStatus = (typeof THREAD_STATUSES)[number];
export type ParticipantRole = (typeof PARTICIPANT_ROLES)[number];
export type MessageVisibility = (typeof MESSAGE_VISIBILITIES)[number];
export type MessageDeliveryStatus = (typeof MESSAGE_DELIVERY_STATUSES)[number];

export type ConversationThreadRecord = {
  id: string;
  organizationId: string;
  threadType: ThreadType;
  sourceEntityType: SourceEntityType;
  sourceEntityId: string | null;
  propertyId: string | null;
  unitId: string | null;
  status: ThreadStatus;
  subject: string;
  lastMessageAt: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type ConversationParticipantRecord = {
  id: string;
  organizationId: string;
  threadId: string;
  userId: string;
  participantRole: ParticipantRole;
  lastReadAt: string | null;
  muted: boolean;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CommunicationMessageRecord = {
  id: string;
  organizationId: string;
  threadId: string;
  senderId: string;
  body: string;
  visibility: MessageVisibility;
  deliveryStatus: MessageDeliveryStatus;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type CreateThreadFromSourceInput = {
  threadType: ThreadType;
  sourceEntityType: SourceEntityType;
  sourceEntityId?: string | null;
  propertyId?: string | null;
  unitId?: string | null;
  subject: string;
  participants: Array<{ userId: string; participantRole: ParticipantRole }>;
  initialMessage?: {
    body: string;
    visibility?: MessageVisibility;
    attachmentDocumentIds?: string[];
  };
};

export type CreateMessageInput = {
  body: string;
  visibility?: MessageVisibility;
  attachmentDocumentIds?: string[];
};

export type ThreadListOptions = {
  search?: string;
  status?: ThreadStatus | "all";
  threadType?: ThreadType | "all";
  propertyId?: string;
  limit?: number;
  offset?: number;
};

export type ThreadMutationInput =
  | { action: "archive" }
  | { action: "resolve" }
  | { action: "mark_read" }
  | { action: "pin"; pinned: boolean }
  | { action: "mute"; muted: boolean };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function readStringArray(value: unknown): string[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.length > 0);
}

export function parseCreateThreadFromSourceInput(payload: unknown): CreateThreadFromSourceInput | null {
  if (!isRecord(payload)) return null;
  const subject = readString(payload["subject"]);
  if (!subject) return null;
  if (
    typeof payload["threadType"] !== "string" ||
    !THREAD_TYPES.includes(payload["threadType"] as ThreadType)
  ) {
    return null;
  }
  if (
    typeof payload["sourceEntityType"] !== "string" ||
    !SOURCE_ENTITY_TYPES.includes(payload["sourceEntityType"] as SourceEntityType)
  ) {
    return null;
  }
  const participantsRaw = payload["participants"];
  if (!Array.isArray(participantsRaw) || participantsRaw.length === 0) return null;
  const participants: CreateThreadFromSourceInput["participants"] = [];
  for (const entry of participantsRaw) {
    if (!isRecord(entry)) return null;
    const userId = readString(entry["userId"]);
    const role = entry["participantRole"];
    if (!userId || typeof role !== "string" || !PARTICIPANT_ROLES.includes(role as ParticipantRole)) {
      return null;
    }
    participants.push({ userId, participantRole: role as ParticipantRole });
  }

  const input: CreateThreadFromSourceInput = {
    threadType: payload["threadType"] as ThreadType,
    sourceEntityType: payload["sourceEntityType"] as SourceEntityType,
    subject,
    participants
  };
  if (typeof payload["sourceEntityId"] === "string") input.sourceEntityId = payload["sourceEntityId"];
  if (payload["sourceEntityId"] === null) input.sourceEntityId = null;
  if (typeof payload["propertyId"] === "string") input.propertyId = payload["propertyId"];
  if (payload["propertyId"] === null) input.propertyId = null;
  if (typeof payload["unitId"] === "string") input.unitId = payload["unitId"];
  if (payload["unitId"] === null) input.unitId = null;

  const initialMessageRaw = payload["initialMessage"];
  if (isRecord(initialMessageRaw)) {
    const body = readString(initialMessageRaw["body"]);
    if (body) {
      input.initialMessage = { body };
      if (
        typeof initialMessageRaw["visibility"] === "string" &&
        MESSAGE_VISIBILITIES.includes(initialMessageRaw["visibility"] as MessageVisibility)
      ) {
        input.initialMessage.visibility = initialMessageRaw["visibility"] as MessageVisibility;
      }
      const attachmentDocumentIds = readStringArray(initialMessageRaw["attachmentDocumentIds"]);
      if (attachmentDocumentIds !== undefined) {
        input.initialMessage.attachmentDocumentIds = attachmentDocumentIds;
      }
    }
  }
  return input;
}

export function parseCreateMessageInput(payload: unknown): CreateMessageInput | null {
  if (!isRecord(payload)) return null;
  const body = readString(payload["body"]);
  if (!body) return null;
  const input: CreateMessageInput = { body };
  if (
    typeof payload["visibility"] === "string" &&
    MESSAGE_VISIBILITIES.includes(payload["visibility"] as MessageVisibility)
  ) {
    input.visibility = payload["visibility"] as MessageVisibility;
  }
  const attachmentDocumentIds = readStringArray(payload["attachmentDocumentIds"]);
  if (attachmentDocumentIds !== undefined) input.attachmentDocumentIds = attachmentDocumentIds;
  return input;
}

export function parseThreadMutationInput(payload: unknown): ThreadMutationInput | null {
  if (!isRecord(payload) || typeof payload["action"] !== "string") return null;
  switch (payload["action"]) {
    case "archive":
    case "resolve":
    case "mark_read":
      return { action: payload["action"] };
    case "pin":
      return typeof payload["pinned"] === "boolean" ? { action: "pin", pinned: payload["pinned"] } : null;
    case "mute":
      return typeof payload["muted"] === "boolean" ? { action: "mute", muted: payload["muted"] } : null;
    default:
      return null;
  }
}

export function threadTypeLabel(threadType: ThreadType): string {
  const labels: Record<ThreadType, string> = {
    resident_pm: "Resident ↔ PM",
    resident_maintenance: "Maintenance",
    pm_vendor: "Vendor coordination",
    pm_owner: "Owner update",
    internal_staff: "Internal staff",
    applicant_leasing: "Applicant leasing"
  };
  return labels[threadType];
}

export function threadStatusLabel(status: ThreadStatus): string {
  const labels: Record<ThreadStatus, string> = {
    active: "Active",
    unread: "Unread",
    read: "Read",
    archived: "Archived",
    resolved: "Resolved"
  };
  return labels[status];
}
