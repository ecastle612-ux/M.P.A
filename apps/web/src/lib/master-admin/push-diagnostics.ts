import { createAuthServerComponentClient } from "../auth/server";
import { getEnrollmentHealthMetrics } from "../notifications/enrollment";
import { getNotificationProvider } from "../integrations/notifications/registry";

export type PushDiagnosticDevice = {
  id: string;
  userId: string;
  platform: string;
  deviceLabel: string | null;
  externalSubscriptionId: string | null;
  providerKey: string;
  isActive: boolean;
  enrolledVia: string;
  lastRegistrationAt: string;
  hasSubscription: boolean;
  subscriptionHealth: "healthy" | "inactive" | "missing_subscription";
  lastNotificationSentAt: string | null;
  lastPushStatus: string | null;
  lastPushError: string | null;
};

export type PushDiagnosticsSnapshot = {
  organizationId: string;
  global: {
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
  };
  devices: PushDiagnosticDevice[];
};

/**
 * PUSH-001 Master Admin notification diagnostics for the active organization.
 */
export async function getPushDiagnosticsSnapshot(organizationId: string): Promise<PushDiagnosticsSnapshot> {
  const supabase = await createAuthServerComponentClient();
  const enrollment = await getEnrollmentHealthMetrics(organizationId, supabase);
  const provider = getNotificationProvider();
  const health = provider.health ? await provider.health() : { ok: true, detail: undefined as string | undefined };

  const { data: deviceRows, error: deviceError } = await supabase
    .from("resident_devices")
    .select(
      "id, user_id, platform, device_label, external_subscription_id, provider_key, is_active, enrolled_via, updated_at, created_at, metadata"
    )
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(200);
  if (deviceError) throw new Error(deviceError.message);

  const userIds = [
    ...new Set(((deviceRows ?? []) as Array<{ user_id: string }>).map((row) => String(row.user_id)))
  ];

  const lastByUser = new Map<
    string,
    { createdAt: string; pushStatus: string | null; pushError: string | null }
  >();

  if (userIds.length > 0) {
    // Generated Supabase types may lag API-001 push columns — query via untyped client.
    const untyped = supabase as unknown as {
      from: (table: string) => {
        select: (cols: string) => {
          eq: (col: string, val: string) => {
            in: (col: string, vals: string[]) => {
              is: (col: string, val: null) => {
                order: (
                  col: string,
                  opts: { ascending: boolean }
                ) => {
                  limit: (n: number) => Promise<{
                    data: Array<Record<string, unknown>> | null;
                    error: { message: string } | null;
                  }>;
                };
              };
            };
          };
        };
      };
    };
    const { data: recentNotifs, error: notifError } = await untyped
      .from("in_app_notifications")
      .select("user_id, created_at, push_delivery_status, push_last_error")
      .eq("organization_id", organizationId)
      .in("user_id", userIds)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(500);
    if (notifError) throw new Error(notifError.message);

    for (const row of recentNotifs ?? []) {
      const uid = String(row["user_id"]);
      if (lastByUser.has(uid)) continue;
      lastByUser.set(uid, {
        createdAt: String(row["created_at"]),
        pushStatus: (row["push_delivery_status"] as string | null) ?? null,
        pushError: (row["push_last_error"] as string | null) ?? null
      });
    }
  }

  const devices: PushDiagnosticDevice[] = ((deviceRows ?? []) as Array<Record<string, unknown>>).map((row) => {
    const userId = String(row["user_id"]);
    const isActive = Boolean(row["is_active"]);
    const externalSubscriptionId = (row["external_subscription_id"] as string | null) ?? null;
    const last = lastByUser.get(userId) ?? null;
    let subscriptionHealth: PushDiagnosticDevice["subscriptionHealth"] = "healthy";
    if (!externalSubscriptionId) subscriptionHealth = "missing_subscription";
    else if (!isActive) subscriptionHealth = "inactive";

    return {
      id: String(row["id"]),
      userId,
      platform: String(row["platform"] ?? "web"),
      deviceLabel: (row["device_label"] as string | null) ?? null,
      externalSubscriptionId,
      providerKey: String(row["provider_key"] ?? "noop"),
      isActive,
      enrolledVia: String(row["enrolled_via"] ?? "portal"),
      lastRegistrationAt: String(row["updated_at"] ?? row["created_at"]),
      hasSubscription: Boolean(externalSubscriptionId),
      subscriptionHealth,
      lastNotificationSentAt: last?.createdAt ?? null,
      lastPushStatus: last?.pushStatus ?? null,
      lastPushError: last?.pushError ?? null
    };
  });

  return {
    organizationId,
    global: {
      registeredDevices: enrollment.registeredDevices,
      activeSubscribers: enrollment.activeSubscribers,
      pendingRegistrations: enrollment.pendingRegistrations,
      pushSuccessRate24h: enrollment.pushSuccessRate24h,
      failedDeliveries24h: enrollment.failedDeliveries24h,
      pushSent24h: enrollment.pushSent24h,
      lastPushActivityAt: enrollment.lastPushActivityAt,
      providerKey: provider.key,
      providerHealthy: health.ok,
      ...(health.detail ? { providerDetail: health.detail } : {})
    },
    devices
  };
}
