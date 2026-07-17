import type { ExternalNotificationPayload, NotificationProvider } from "./contracts";
import { noopNotificationProvider } from "./noop-provider";

const providers: NotificationProvider[] = [noopNotificationProvider];

export function listNotificationProviders(): NotificationProvider[] {
  return [...providers];
}

export function registerNotificationProvider(provider: NotificationProvider): () => void {
  providers.push(provider);
  return () => {
    const index = providers.findIndex((entry) => entry.id === provider.id);
    if (index >= 0) providers.splice(index, 1);
  };
}

export async function dispatchExternalNotifications(payload: ExternalNotificationPayload): Promise<void> {
  await Promise.all(providers.map((provider) => provider.send(payload)));
}
