import type { NotificationProvider } from "./contracts";
import { noopProvider } from "./noop-provider";
import { onesignalProvider } from "./onesignal-provider";

export function getNotificationProviderKey(): string {
  return (process.env["NOTIFICATION_PROVIDER"] ?? "noop").trim().toLowerCase() || "noop";
}

export function getNotificationProvider(): NotificationProvider {
  switch (getNotificationProviderKey()) {
    case "onesignal":
      return onesignalProvider;
    case "noop":
    default:
      return noopProvider;
  }
}

/** @deprecated Prefer getNotificationProvider — kept for transitional callers */
export function listNotificationProviders(): NotificationProvider[] {
  return [getNotificationProvider()];
}
