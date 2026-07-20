import { createAuthServerComponentClient } from "../auth/server";
import type { Json } from "@mpa/supabase";
import type {
  CreateInAppNotificationInput,
  InAppNotificationRecord,
  NotificationListOptions,
  NotificationMutationInput,
  NotificationPriority,
  PushDeliveryStatus
} from "./contracts";
import { normalizeNotificationCategory } from "./contracts";
import { getNotificationProvider } from "../integrations/notifications/registry";
import {
  evaluateDeliveryChannels,
  parsePropertyPreferences,
  parseQuietHours,
  type EvaluatedPreferences
} from "./preferences";
import { buildIdempotencyKey, type NotifyInput } from "./contracts";

type NotificationRow = {
  id: string;
  organization_id: string;
  user_id: string;
  category: string;
  priority: NotificationPriority;
  title: string;
  body: string;
  href: string | null;
  source_entity_type: string | null;
  source_entity_id: string | null;
  property_id: string | null;
  unit_id: string | null;
  read_at: string | null;
  archived_at: string | null;
  deleted_at: string | null;
  push_delivery_status: PushDeliveryStatus;
  push_external_id: string | null;
  push_last_error: string | null;
  idempotency_key: string | null;
  metadata: Json | null;
  created_at: string;
  updated_at: string;
};

type SupabaseClientType = Awaited<ReturnType<typeof createAuthServerComponentClient>>;
export type NotificationDbClient = {
  from: (table: string) => ReturnType<SupabaseClientType["from"]>;
};

function notificationDb(client: SupabaseClientType): NotificationDbClient {
  return client as unknown as NotificationDbClient;
}

function toNotificationRecord(row: NotificationRow): InAppNotificationRecord {
  const category = normalizeNotificationCategory(row.category) ?? "system";
  return {
    id: row.id,
    organizationId: row.organization_id,
    userId: row.user_id,
    category,
    priority: row.priority ?? "normal",
    title: row.title,
    body: row.body,
    href: row.href,
    sourceEntityType: row.source_entity_type,
    sourceEntityId: row.source_entity_id,
    propertyId: row.property_id ?? null,
    unitId: row.unit_id ?? null,
    readAt: row.read_at,
    archivedAt: row.archived_at ?? null,
    deletedAt: row.deleted_at ?? null,
    pushDeliveryStatus: row.push_delivery_status ?? "skipped",
    pushExternalId: row.push_external_id ?? null,
    pushLastError: row.push_last_error ?? null,
    idempotencyKey: row.idempotency_key ?? null,
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function resolveClient(client?: NotificationDbClient | SupabaseClientType): Promise<NotificationDbClient> {
  if (client && typeof client === "object" && "from" in client && !("auth" in client)) {
    return client as NotificationDbClient;
  }
  const supabase = (client as SupabaseClientType | undefined) ?? (await createAuthServerComponentClient());
  return notificationDb(supabase);
}

const NOTIFICATION_SELECT =
  "id, organization_id, user_id, category, priority, title, body, href, source_entity_type, source_entity_id, property_id, unit_id, read_at, archived_at, deleted_at, push_delivery_status, push_external_id, push_last_error, idempotency_key, metadata, created_at, updated_at";

export type NotificationSummary = {
  unreadCount: number;
  items: InAppNotificationRecord[];
};

export async function getNotificationsForUser(
  organizationId: string,
  userId: string,
  options: NotificationListOptions = {},
  client?: NotificationDbClient | SupabaseClientType
): Promise<NotificationSummary> {
  const db = await resolveClient(client);
  let query = db
    .from("in_app_notifications")
    .select(NOTIFICATION_SELECT)
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (options.archived) {
    query = query.not("archived_at", "is", null);
  } else {
    query = query.is("archived_at", null);
  }
  if (options.unreadOnly) query = query.is("read_at", null);
  if (options.category && options.category !== "all") query = query.eq("category", options.category);
  if (options.propertyId) query = query.eq("property_id", options.propertyId);
  if (options.priority === "critical") {
    query = query.in("priority", ["high", "emergency"]);
  } else if (options.priority) {
    query = query.eq("priority", options.priority);
  }
  if (options.q && options.q.trim()) {
    const q = options.q.trim().replaceAll(",", " ");
    query = query.or(`title.ilike.%${q}%,body.ilike.%${q}%`);
  }
  if (options.limit) query = query.limit(options.limit);
  if (options.offset) query = query.range(options.offset, options.offset + (options.limit ?? 50) - 1);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  const items = ((data ?? []) as NotificationRow[]).map(toNotificationRecord);

  const { count } = await db
    .from("in_app_notifications")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .is("read_at", null)
    .is("deleted_at", null)
    .is("archived_at", null);

  return { unreadCount: count ?? 0, items };
}

export async function insertInAppNotificationRow(
  organizationId: string,
  actorUserId: string | null,
  input: CreateInAppNotificationInput & {
    pushDeliveryStatus?: PushDeliveryStatus;
    idempotencyKey?: string | null;
  },
  client?: NotificationDbClient | SupabaseClientType
): Promise<InAppNotificationRecord> {
  const db = await resolveClient(client);
  const { data, error } = await db
    .from("in_app_notifications")
    .insert({
      organization_id: organizationId,
      user_id: input.userId,
      category: input.category,
      priority: input.priority ?? "normal",
      title: input.title,
      body: input.body,
      href: input.href ?? null,
      source_entity_type: input.sourceEntityType ?? null,
      source_entity_id: input.sourceEntityId ?? null,
      property_id: input.propertyId ?? null,
      unit_id: input.unitId ?? null,
      push_delivery_status: input.pushDeliveryStatus ?? "skipped",
      idempotency_key: input.idempotencyKey ?? null,
      metadata: (input.metadata ?? {}) as Json,
      // created_by is NOT NULL; system/test sends may omit actor — use recipient.
      created_by: actorUserId ?? input.userId
    })
    .select(NOTIFICATION_SELECT)
    .single();

  if (error) {
    if (error.code === "23505" && input.idempotencyKey) {
      const { data: existing } = await db
        .from("in_app_notifications")
        .select(NOTIFICATION_SELECT)
        .eq("organization_id", organizationId)
        .eq("idempotency_key", input.idempotencyKey)
        .maybeSingle();
      if (existing) return toNotificationRecord(existing as NotificationRow);
    }
    throw new Error(error.message);
  }
  if (!data) throw new Error("Notification creation failed");
  return toNotificationRecord(data as NotificationRow);
}

export async function updatePushDeliveryStatus(
  organizationId: string,
  notificationId: string,
  update: {
    pushDeliveryStatus: PushDeliveryStatus;
    pushExternalId?: string | null;
    pushLastError?: string | null;
  },
  client?: NotificationDbClient | SupabaseClientType
): Promise<void> {
  const db = await resolveClient(client);
  const now = new Date().toISOString();
  await db
    .from("in_app_notifications")
    .update({
      push_delivery_status: update.pushDeliveryStatus,
      push_external_id: update.pushExternalId ?? null,
      push_last_error: update.pushLastError ?? null,
      updated_at: now
    })
    .eq("organization_id", organizationId)
    .eq("id", notificationId);
}

export async function markAllNotificationsRead(
  organizationId: string,
  userId: string,
  client?: NotificationDbClient | SupabaseClientType
): Promise<number> {
  const db = await resolveClient(client);
  const now = new Date().toISOString();
  const { data, error } = await db
    .from("in_app_notifications")
    .update({ read_at: now, updated_at: now })
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .is("read_at", null)
    .is("deleted_at", null)
    .select("id");
  if (error) throw new Error(error.message);
  return (data ?? []).length;
}

export async function mutateNotification(
  organizationId: string,
  userId: string,
  notificationId: string,
  input: NotificationMutationInput,
  client?: NotificationDbClient | SupabaseClientType
): Promise<InAppNotificationRecord | null> {
  const db = await resolveClient(client);
  const now = new Date().toISOString();
  const patch: Record<string, string | null> = { updated_at: now };
  if (input.action === "mark_read") patch["read_at"] = now;
  if (input.action === "mark_unread") patch["read_at"] = null;
  if (input.action === "archive") patch["archived_at"] = now;
  if (input.action === "unarchive") patch["archived_at"] = null;
  if (input.action === "delete") patch["deleted_at"] = now;

  const { data, error } = await db
    .from("in_app_notifications")
    .update(patch)
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .eq("id", notificationId)
    .select(NOTIFICATION_SELECT)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toNotificationRecord(data as NotificationRow) : null;
}

export async function getUnreadNotificationCount(
  organizationId: string,
  userId: string,
  client?: NotificationDbClient | SupabaseClientType
): Promise<number> {
  const db = await resolveClient(client);
  const { count, error } = await db
    .from("in_app_notifications")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .is("read_at", null)
    .is("deleted_at", null)
    .is("archived_at", null);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function loadEvaluatedPreferences(
  organizationId: string,
  userId: string,
  client?: NotificationDbClient | SupabaseClientType
): Promise<EvaluatedPreferences | null> {
  const db = await resolveClient(client);
  const { data, error } = await db
    .from("notification_preferences")
    .select(
      "in_app_enabled, push_enabled, email_enabled, sms_enabled, emergency_override, category_preferences, quiet_hours, property_preferences"
    )
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const row = data as Record<string, unknown>;
  return {
    inAppEnabled: Boolean(row["in_app_enabled"] ?? true),
    pushEnabled: Boolean(row["push_enabled"] ?? false),
    emailEnabled: Boolean(row["email_enabled"] ?? true),
    smsEnabled: Boolean(row["sms_enabled"] ?? false),
    emergencyOverride: row["emergency_override"] === undefined ? true : Boolean(row["emergency_override"]),
    categoryPreferences: (row["category_preferences"] as Record<string, boolean>) ?? {},
    quietHours: parseQuietHours(row["quiet_hours"]),
    propertyPreferences: parsePropertyPreferences(row["property_preferences"])
  };
}

export async function getNotificationOpsMetrics(
  organizationId: string,
  userId: string,
  client?: NotificationDbClient | SupabaseClientType
): Promise<{
  unreadCount: number;
  criticalCount: number;
  emergencyCount: number;
  recent: InAppNotificationRecord[];
  pushSent24h: number;
  pushFailed24h: number;
  providerKey: string;
  providerHealthy: boolean;
  providerDetail?: string;
  registeredDevices: number;
  activeSubscribers: number;
  pendingRegistrations: number;
  pushSuccessRate24h: number | null;
  failedDeliveries24h: number;
  lastPushActivityAt: string | null;
}> {
  const db = await resolveClient(client);
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const provider = getNotificationProvider();
  const health = provider.health ? await provider.health() : { ok: true };

  const { getEnrollmentHealthMetrics } = await import("./enrollment");
  const enrollment = await getEnrollmentHealthMetrics(organizationId, db);

  const [unread, critical, emergency, recent, sent, failed] = await Promise.all([
    getUnreadNotificationCount(organizationId, userId, db),
    db
      .from("in_app_notifications")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("user_id", userId)
      .is("deleted_at", null)
      .is("archived_at", null)
      .is("read_at", null)
      .in("priority", ["high", "emergency"]),
    db
      .from("in_app_notifications")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("user_id", userId)
      .is("deleted_at", null)
      .or("priority.eq.emergency,category.eq.emergency")
      .gte("created_at", since),
    getNotificationsForUser(organizationId, userId, { limit: 10 }, db),
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
      .gte("created_at", since)
  ]);

  return {
    unreadCount: unread,
    criticalCount: critical.count ?? 0,
    emergencyCount: emergency.count ?? 0,
    recent: recent.items,
    pushSent24h: sent.count ?? 0,
    pushFailed24h: failed.count ?? 0,
    providerKey: provider.key,
    providerHealthy: health.ok,
    ...(health.detail ? { providerDetail: health.detail } : {}),
    registeredDevices: enrollment.registeredDevices,
    activeSubscribers: enrollment.activeSubscribers,
    pendingRegistrations: enrollment.pendingRegistrations,
    pushSuccessRate24h: enrollment.pushSuccessRate24h,
    failedDeliveries24h: enrollment.failedDeliveries24h,
    lastPushActivityAt: enrollment.lastPushActivityAt
  };
}

export { evaluateDeliveryChannels, buildIdempotencyKey };
export type { NotifyInput };
