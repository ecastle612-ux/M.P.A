export const COMMUNITY_EVENT_TYPES = ["event", "office_hours", "pool", "holiday", "package", "emergency"] as const;

export type CommunityEventType = (typeof COMMUNITY_EVENT_TYPES)[number];

export type CommunityEventRecord = {
  id: string;
  organizationId: string;
  propertyId: string | null;
  title: string;
  eventType: CommunityEventType;
  startsAt: string;
  endsAt: string | null;
  body: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type CreateCommunityEventInput = {
  title: string;
  eventType?: CommunityEventType;
  propertyId?: string | null;
  startsAt: string;
  endsAt?: string | null;
  body?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function parseCreateCommunityEventInput(payload: unknown): CreateCommunityEventInput | null {
  if (!isRecord(payload)) return null;
  const title = readString(payload["title"]);
  const startsAt = readString(payload["startsAt"]);
  if (!title || !startsAt) return null;
  const input: CreateCommunityEventInput = { title, startsAt };
  if (
    typeof payload["eventType"] === "string" &&
    COMMUNITY_EVENT_TYPES.includes(payload["eventType"] as CommunityEventType)
  ) {
    input.eventType = payload["eventType"] as CommunityEventType;
  }
  if (typeof payload["propertyId"] === "string") input.propertyId = payload["propertyId"];
  if (payload["propertyId"] === null) input.propertyId = null;
  const endsAt = readString(payload["endsAt"]);
  if (endsAt !== null) input.endsAt = endsAt;
  if (payload["endsAt"] === null) input.endsAt = null;
  const body = readString(payload["body"]);
  if (body !== null) input.body = body;
  return input;
}

export function communityEventTypeLabel(eventType: CommunityEventType): string {
  const labels: Record<CommunityEventType, string> = {
    event: "Community event",
    office_hours: "Office hours",
    pool: "Pool",
    holiday: "Holiday",
    package: "Package notice",
    emergency: "Emergency"
  };
  return labels[eventType];
}
