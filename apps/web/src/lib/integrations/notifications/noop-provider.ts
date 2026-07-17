import type { NotificationProvider } from "./contracts";

export const noopNotificationProvider: NotificationProvider = {
  id: "noop",
  label: "In-app only (external channels stubbed)",
  async send() {
    return { status: "noop", detail: "External notification channels are not configured yet." };
  }
};
