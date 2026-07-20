export type NotificationProviderKey = "onesignal" | "noop" | "firebase" | "apns" | "web_push" | string;

export type NotificationPriority = "low" | "normal" | "high" | "emergency";

export type RegisterDeviceInput = {
  organizationId: string;
  userId: string;
  propertyId?: string | null;
  platform: "web" | "ios" | "android" | "unknown";
  externalSubscriptionId: string;
  deviceLabel?: string | null;
  enrolledVia: "qr" | "portal" | "manual" | "pwa";
  metadata?: Record<string, unknown>;
};

export type UnregisterDeviceInput = {
  organizationId: string;
  userId: string;
  externalSubscriptionId: string;
};

export type DeviceRegistration = {
  deviceId: string;
  providerKey: string;
  externalSubscriptionId: string;
  isActive: boolean;
};

export type ProviderSendInput = {
  organizationId: string;
  notificationId: string;
  idempotencyKey: string;
  userId: string;
  externalSubscriptionIds: string[];
  title: string;
  body: string;
  category: string;
  priority: NotificationPriority;
  href?: string | null;
  data?: Record<string, string>;
  collapseKey?: string | null;
};

export type ProviderSendResult = {
  status: "queued" | "sent" | "skipped" | "failed";
  externalId?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  raw?: unknown;
};

export type ProviderDeliveryStatus = {
  externalId: string;
  status: "pending" | "sent" | "delivered" | "failed" | "unknown";
};

export type ProviderWebhookResult = {
  handled: boolean;
  notificationId?: string | null;
  deliveryStatus?: ProviderSendResult["status"];
};

export interface NotificationProvider {
  readonly key: NotificationProviderKey;
  registerDevice(input: RegisterDeviceInput): Promise<DeviceRegistration>;
  unregisterDevice(input: UnregisterDeviceInput): Promise<void>;
  send(input: ProviderSendInput): Promise<ProviderSendResult>;
  getDeliveryStatus?(externalId: string): Promise<ProviderDeliveryStatus>;
  handleWebhook?(
    payload: unknown,
    headers: Record<string, string>
  ): Promise<ProviderWebhookResult>;
  /** Optional health probe for Ops Center */
  health?(): Promise<{ ok: boolean; detail?: string }>;
}
