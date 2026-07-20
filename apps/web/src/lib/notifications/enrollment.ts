import { createAuthServerComponentClient } from "../auth/server";
import { getNotificationProvider } from "../integrations/notifications/registry";
import type { NotificationDbClient } from "./server";

type SupabaseClientType = Awaited<ReturnType<typeof createAuthServerComponentClient>>;

async function resolveClient(client?: NotificationDbClient | SupabaseClientType): Promise<NotificationDbClient> {
  if (client && typeof client === "object" && "from" in client && !("auth" in client)) {
    return client as NotificationDbClient;
  }
  const supabase = (client as SupabaseClientType | undefined) ?? (await createAuthServerComponentClient());
  return supabase as unknown as NotificationDbClient;
}

export type PushDeviceStatusRecord = {
  id: string;
  platform: string;
  deviceLabel: string | null;
  externalSubscriptionId: string | null;
  providerKey: string;
  isActive: boolean;
  enrolledVia: string;
  lastRegistrationAt: string;
  createdAt: string;
};

export async function listDevicesForUser(
  organizationId: string,
  userId: string,
  client?: NotificationDbClient | SupabaseClientType
): Promise<PushDeviceStatusRecord[]> {
  const db = await resolveClient(client);
  const { data, error } = await db
    .from("resident_devices")
    .select(
      "id, platform, device_label, external_subscription_id, provider_key, is_active, enrolled_via, updated_at, created_at, metadata"
    )
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);

  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
    id: String(row["id"]),
    platform: String(row["platform"] ?? "web"),
    deviceLabel: (row["device_label"] as string | null) ?? null,
    externalSubscriptionId: (row["external_subscription_id"] as string | null) ?? null,
    providerKey: String(row["provider_key"] ?? "noop"),
    isActive: Boolean(row["is_active"]),
    enrolledVia: String(row["enrolled_via"] ?? "portal"),
    lastRegistrationAt: String(row["updated_at"] ?? row["created_at"]),
    createdAt: String(row["created_at"])
  }));
}

export async function userHasActivePushDevice(
  organizationId: string,
  userId: string,
  client?: NotificationDbClient | SupabaseClientType
): Promise<boolean> {
  const db = await resolveClient(client);
  const { data, error } = await db
    .from("resident_devices")
    .select("id, external_subscription_id, is_active")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .eq("is_active", true)
    .is("deleted_at", null)
    .not("external_subscription_id", "is", null)
    .limit(1);
  if (error) throw new Error(error.message);
  return (data ?? []).length > 0;
}

/** After successful device registration: create prefs if missing; enable push. */
export async function ensurePreferencesAfterPushEnroll(
  organizationId: string,
  userId: string,
  client?: NotificationDbClient | SupabaseClientType
): Promise<void> {
  const db = await resolveClient(client);
  const { error } = await db.from("notification_preferences").upsert(
    {
      organization_id: organizationId,
      user_id: userId,
      in_app_enabled: true,
      push_enabled: true,
      emergency_override: true,
      created_by: userId,
      updated_by: userId
    },
    { onConflict: "organization_id,user_id" }
  );
  if (error) throw new Error(error.message);
}

export async function getEnrollmentHealthMetrics(
  organizationId: string,
  client?: NotificationDbClient | SupabaseClientType
): Promise<{
  registeredDevices: number;
  activeSubscribers: number;
  pendingRegistrations: number;
  pushSuccessRate24h: number | null;
  failedDeliveries24h: number;
  pushSent24h: number;
  lastPushActivityAt: string | null;
  providerKey: string;
  providerHealthy: boolean;
  providerDetail?: string;
}> {
  const db = await resolveClient(client);
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const provider = getNotificationProvider();
  const health = provider.health ? await provider.health() : { ok: true };

  const [registered, active, prefsNeedingDevice, sent, failed, lastPush] = await Promise.all([
    db
      .from("resident_devices")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .is("deleted_at", null),
    db
      .from("resident_devices")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("is_active", true)
      .is("deleted_at", null)
      .not("external_subscription_id", "is", null),
    db
      .from("notification_preferences")
      .select("user_id")
      .eq("organization_id", organizationId)
      .eq("push_enabled", true),
    db
      .from("in_app_notifications")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("push_delivery_status", "sent")
      .gte("created_at", since),
    db
      .from("in_app_notifications")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("push_delivery_status", "failed")
      .gte("created_at", since),
    db
      .from("in_app_notifications")
      .select("created_at")
      .eq("organization_id", organizationId)
      .in("push_delivery_status", ["sent", "failed", "delivered"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
  ]);

  const pushEnabledUserIds = new Set(
    ((prefsNeedingDevice.data ?? []) as Array<{ user_id: string }>).map((row) => row.user_id)
  );
  let pendingRegistrations = 0;
  if (pushEnabledUserIds.size > 0) {
    const { data: activeRows } = await db
      .from("resident_devices")
      .select("user_id")
      .eq("organization_id", organizationId)
      .eq("is_active", true)
      .is("deleted_at", null)
      .not("external_subscription_id", "is", null);
    const withDevice = new Set(((activeRows ?? []) as Array<{ user_id: string }>).map((row) => row.user_id));
    for (const userId of pushEnabledUserIds) {
      if (!withDevice.has(userId)) pendingRegistrations += 1;
    }
  }

  const sentCount = sent.count ?? 0;
  const failedCount = failed.count ?? 0;
  const denom = sentCount + failedCount;
  const pushSuccessRate24h = denom > 0 ? Math.round((sentCount / denom) * 1000) / 10 : null;

  const lastRow = lastPush.data as { created_at?: string } | null;

  return {
    registeredDevices: registered.count ?? 0,
    activeSubscribers: active.count ?? 0,
    pendingRegistrations,
    pushSuccessRate24h,
    failedDeliveries24h: failedCount,
    pushSent24h: sentCount,
    lastPushActivityAt: lastRow?.created_at ?? null,
    providerKey: provider.key,
    providerHealthy: health.ok,
    ...(health.detail ? { providerDetail: health.detail } : {})
  };
}
