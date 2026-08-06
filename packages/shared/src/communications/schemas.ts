export const COMMS_AUDIENCE_TYPES = ["resident", "owner", "vendor"] as const;

export type CommsAudienceType = (typeof COMMS_AUDIENCE_TYPES)[number];

export const COMMS_CHANNELS = ["in_app", "email", "both"] as const;

export type CommsChannel = (typeof COMMS_CHANNELS)[number];

export type CommsMessageRecord = {
  id: string;
  organizationId: string;
  audienceType: CommsAudienceType;
  subject: string;
  body: string;
  propertyId: string | null;
  residentId: string | null;
  vendorId: string | null;
  ownerUserId: string | null;
  recipientUserId: string | null;
  channel: CommsChannel;
  deliveryStatus: string;
  createdBy: string | null;
  createdAt: string;
  audienceLabel?: string | null;
};

export type UnifiedNotificationRecord = {
  id: string;
  source: "finance" | "maintenance" | "comms";
  title: string;
  body: string;
  href: string | null;
  readAt: string | null;
  createdAt: string;
  notificationKey: string;
};

export function isCommsAudienceType(value: string): value is CommsAudienceType {
  return (COMMS_AUDIENCE_TYPES as readonly string[]).includes(value);
}

export function isCommsChannel(value: string): value is CommsChannel {
  return (COMMS_CHANNELS as readonly string[]).includes(value);
}
