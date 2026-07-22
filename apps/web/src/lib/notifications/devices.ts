import { createAuthServerComponentClient } from "../auth/server";
import { getNotificationProvider } from "../integrations/notifications/registry";
import type { Json } from "@mpa/supabase";

type SupabaseClientType = Awaited<ReturnType<typeof createAuthServerComponentClient>>;
type NotificationDbClient = {
  from: (table: string) => ReturnType<SupabaseClientType["from"]>;
};

async function resolveClient(client?: NotificationDbClient | SupabaseClientType): Promise<NotificationDbClient> {
  if (client && typeof client === "object" && "from" in client && !("auth" in client)) {
    return client as NotificationDbClient;
  }
  const supabase = (client as SupabaseClientType | undefined) ?? (await createAuthServerComponentClient());
  return supabase as unknown as NotificationDbClient;
}

export type DeviceRecord = {
  id: string;
  organizationId: string;
  userId: string;
  propertyId: string | null;
  platform: string;
  externalSubscriptionId: string | null;
  providerKey: string;
  isActive: boolean;
  deviceLabel?: string | null;
  updatedAt?: string | null;
};

function toDeviceRecord(row: Record<string, unknown>): DeviceRecord {
  return {
    id: String(row["id"]),
    organizationId: String(row["organization_id"]),
    userId: String(row["user_id"]),
    propertyId: (row["property_id"] as string | null) ?? null,
    platform: String(row["platform"] ?? "web"),
    externalSubscriptionId: (row["external_subscription_id"] as string | null) ?? null,
    providerKey: String(row["provider_key"] ?? "noop"),
    isActive: Boolean(row["is_active"]),
    deviceLabel: (row["device_label"] as string | null) ?? null,
    updatedAt: (row["updated_at"] as string | null) ?? null
  };
}

export async function listActiveDevicesForUser(
  organizationId: string,
  userId: string,
  client?: NotificationDbClient | SupabaseClientType
): Promise<DeviceRecord[]> {
  const db = await resolveClient(client);
  const providerKey = getNotificationProvider().key;
  const { data, error } = await db
    .from("resident_devices")
    .select("id, organization_id, user_id, property_id, platform, external_subscription_id, provider_key, is_active")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .eq("is_active", true)
    .is("deleted_at", null);
  if (error) throw new Error(error.message);

  return ((data ?? []) as Array<Record<string, unknown>>)
    .map(toDeviceRecord)
    .filter(
      (device) =>
        Boolean(device.externalSubscriptionId) &&
        (device.providerKey === providerKey || device.providerKey === "noop" || providerKey === "noop")
    );
}

export async function upsertPushDevice(input: {
  organizationId: string;
  userId: string;
  propertyId?: string | null;
  platform: "web" | "ios" | "android" | "unknown";
  externalSubscriptionId: string;
  deviceLabel?: string | null;
  enrolledVia?: "qr" | "portal" | "manual" | "pwa" | "onboarding_banner" | "settings" | "qr_join";
  client?: NotificationDbClient | SupabaseClientType;
}): Promise<DeviceRecord> {
  const db = await resolveClient(input.client);
  const provider = getNotificationProvider();
  const propertyId = input.propertyId ?? null;
  const deviceLabel = input.deviceLabel ?? null;
  const enrolledViaRaw = input.enrolledVia ?? "portal";
  /** DB check allows qr | portal | manual only; richer source stored in metadata. */
  const enrolledViaDb: "qr" | "portal" | "manual" =
    enrolledViaRaw === "qr" || enrolledViaRaw === "qr_join"
      ? "qr"
      : enrolledViaRaw === "manual"
        ? "manual"
        : "portal";

  await provider.registerDevice({
    organizationId: input.organizationId,
    userId: input.userId,
    propertyId,
    platform: input.platform,
    externalSubscriptionId: input.externalSubscriptionId,
    deviceLabel,
    enrolledVia: enrolledViaDb
  });

  const now = new Date().toISOString();
  const metadata = { enrolledVia: enrolledViaRaw } as Json;

  // Prefer match on same subscription id, then any active row for user (dedupe).
  const { data: bySubscription } = await db
    .from("resident_devices")
    .select("id")
    .eq("organization_id", input.organizationId)
    .eq("user_id", input.userId)
    .eq("external_subscription_id", input.externalSubscriptionId)
    .is("deleted_at", null)
    .limit(1)
    .maybeSingle();

  let existingQuery = db
    .from("resident_devices")
    .select("id")
    .eq("organization_id", input.organizationId)
    .eq("user_id", input.userId)
    .is("deleted_at", null)
    .limit(1);
  if (propertyId) existingQuery = existingQuery.eq("property_id", propertyId);

  const { data: existing } = bySubscription
    ? { data: bySubscription }
    : await existingQuery.maybeSingle();
  const existingId =
    existing && typeof (existing as Record<string, unknown>)["id"] === "string"
      ? String((existing as Record<string, unknown>)["id"])
      : null;

  if (existingId) {
    const { data, error } = await db
      .from("resident_devices")
      .update({
        external_subscription_id: input.externalSubscriptionId,
        push_token_placeholder: input.externalSubscriptionId,
        provider_key: provider.key,
        platform: input.platform,
        device_label: deviceLabel,
        enrolled_via: enrolledViaDb,
        is_active: true,
        updated_by: input.userId,
        updated_at: now,
        metadata
      })
      .eq("organization_id", input.organizationId)
      .eq("id", existingId)
      .select(
        "id, organization_id, user_id, property_id, platform, external_subscription_id, provider_key, is_active, device_label, updated_at"
      )
      .single();
    if (error || !data) throw new Error(error?.message ?? "Device update failed");
    return toDeviceRecord(data as Record<string, unknown>);
  }

  let resolvedPropertyId = propertyId;
  if (!resolvedPropertyId) {
    const { data: property } = await db
      .from("properties")
      .select("id")
      .eq("organization_id", input.organizationId)
      .is("deleted_at", null)
      .limit(1)
      .maybeSingle();
    resolvedPropertyId =
      property && typeof (property as Record<string, unknown>)["id"] === "string"
        ? String((property as Record<string, unknown>)["id"])
        : null;
  }
  if (!resolvedPropertyId) {
    throw new Error("A property is required to register a push device");
  }

  const { data, error } = await db
    .from("resident_devices")
    .insert({
      organization_id: input.organizationId,
      user_id: input.userId,
      property_id: resolvedPropertyId,
      platform: input.platform,
      external_subscription_id: input.externalSubscriptionId,
      push_token_placeholder: input.externalSubscriptionId,
      provider_key: provider.key,
      device_label: deviceLabel,
      enrolled_via: enrolledViaDb,
      is_active: true,
      created_by: input.userId,
      updated_by: input.userId,
      metadata
    })
    .select(
      "id, organization_id, user_id, property_id, platform, external_subscription_id, provider_key, is_active, device_label, updated_at"
    )
    .single();
  if (error || !data) throw new Error(error?.message ?? "Device registration failed");
  return toDeviceRecord(data as Record<string, unknown>);
}

export async function deactivatePushDevice(input: {
  organizationId: string;
  userId: string;
  externalSubscriptionId: string;
  client?: NotificationDbClient | SupabaseClientType;
}): Promise<void> {
  const db = await resolveClient(input.client);
  const provider = getNotificationProvider();
  await provider.unregisterDevice({
    organizationId: input.organizationId,
    userId: input.userId,
    externalSubscriptionId: input.externalSubscriptionId
  });
  const now = new Date().toISOString();
  await db
    .from("resident_devices")
    .update({ is_active: false, updated_at: now, updated_by: input.userId })
    .eq("organization_id", input.organizationId)
    .eq("user_id", input.userId)
    .eq("external_subscription_id", input.externalSubscriptionId);
}

/** PUSH-001: deactivate stale subscriptions that OneSignal can no longer deliver to. */
export async function deactivatePushSubscriptions(input: {
  organizationId: string;
  userId: string;
  externalSubscriptionIds: string[];
  /** Retained for diagnostics/logging call sites. */
  reason: string;
  client?: NotificationDbClient | SupabaseClientType;
}): Promise<number> {
  void input.reason;
  const ids = [...new Set(input.externalSubscriptionIds.filter(Boolean))];
  if (ids.length === 0) return 0;
  const db = await resolveClient(input.client);
  const now = new Date().toISOString();
  const { data, error } = await db
    .from("resident_devices")
    .update({
      is_active: false,
      updated_at: now,
      updated_by: input.userId
    })
    .eq("organization_id", input.organizationId)
    .eq("user_id", input.userId)
    .in("external_subscription_id", ids)
    .select("id");
  if (error) throw new Error(error.message);
  return (data ?? []).length;
}
