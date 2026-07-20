import type {
  DeviceRegistration,
  NotificationProvider,
  ProviderSendResult,
  RegisterDeviceInput
} from "./contracts";

/**
 * Noop provider for local/CI. Device registration is persisted by NotificationService;
 * this adapter only acknowledges provider-side calls.
 */
export const noopProvider: NotificationProvider = {
  key: "noop",

  async registerDevice(input: RegisterDeviceInput): Promise<DeviceRegistration> {
    return {
      deviceId: "noop-pending",
      providerKey: "noop",
      externalSubscriptionId: input.externalSubscriptionId,
      isActive: true
    };
  },

  async unregisterDevice(): Promise<void> {
    return;
  },

  async send(): Promise<ProviderSendResult> {
    if (process.env.NODE_ENV !== "production") {
      console.debug("[notification:noop] send skipped");
    }
    return { status: "skipped", errorCode: "noop", errorMessage: "NOTIFICATION_PROVIDER=noop" };
  },

  async health() {
    return { ok: true, detail: "noop provider active" };
  }
};
