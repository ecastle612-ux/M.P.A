export type ExternalNotificationChannel = "push" | "email" | "sms";

export type ExternalNotificationPayload = {
  userId: string;
  organizationId: string;
  title: string;
  body: string;
  href?: string | null;
  channels: ExternalNotificationChannel[];
  metadata?: Record<string, unknown>;
};

export type NotificationProvider = {
  id: string;
  label: string;
  send: (payload: ExternalNotificationPayload) => Promise<{ status: "noop" | "sent" | "failed"; detail?: string }>;
};
