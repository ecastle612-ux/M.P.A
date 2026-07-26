/**
 * OPS-001 Slice B — channel adapter hooks.
 * Domain modules must not import OneSignal / Resend / Twilio directly.
 * Adapters are invoked only via Notification Center.
 */

export type OpsChannel = "in_app" | "push" | "email" | "sms" | "future";

export type ChannelAdapterResult = {
  channel: OpsChannel;
  status: "delivered" | "queued" | "skipped" | "failed" | "not_implemented";
  reason?: string;
};

export type ChannelSendRequest = {
  organizationId: string;
  recipientUserId: string;
  notificationId: string | null;
  title: string;
  body: string;
  href?: string | null;
  category: string;
  priority: string;
};

/** SMS / future channels are designed slots only in Slice B. */
export async function smsChannelAdapter(_request: ChannelSendRequest): Promise<ChannelAdapterResult> {
  return { channel: "sms", status: "not_implemented", reason: "sms_adapter_slot" };
}

export async function futureChannelAdapter(_request: ChannelSendRequest): Promise<ChannelAdapterResult> {
  return { channel: "future", status: "not_implemented", reason: "future_adapter_slot" };
}

export const CHANNEL_ADAPTER_HOOKS = {
  sms: smsChannelAdapter,
  future: futureChannelAdapter
} as const;
