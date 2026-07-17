import { createAuthServerComponentClient } from "../auth/server";
import type { Json } from "@mpa/supabase";
import type {
  CreateInAppNotificationInput,
  InAppNotificationRecord,
  NotificationListOptions,
  NotificationMutationInput
} from "./contracts";

type NotificationRow = {
  id: string;
  organization_id: string;
  user_id: string;
  category: InAppNotificationRecord["category"];
  title: string;
  body: string;
  href: string | null;
  source_entity_type: string | null;
  source_entity_id: string | null;
  read_at: string | null;
  metadata: Json | null;
  created_at: string;
  updated_at: string;
};

type SupabaseClientType = Awaited<ReturnType<typeof createAuthServerComponentClient>>;
type NotificationDbClient = {
  from: (table: string) => ReturnType<SupabaseClientType["from"]>;
};

function notificationDb(client: SupabaseClientType): NotificationDbClient {
  return client as unknown as NotificationDbClient;
}

function toNotificationRecord(row: NotificationRow): InAppNotificationRecord {
  return {
    id: row.id,
    organizationId: row.organization_id,
    userId: row.user_id,
    category: row.category,
    title: row.title,
    body: row.body,
    href: row.href,
    sourceEntityType: row.source_entity_type,
    sourceEntityId: row.source_entity_id,
    readAt: row.read_at,
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
  "id, organization_id, user_id, category, title, body, href, source_entity_type, source_entity_id, read_at, metadata, created_at, updated_at";

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
    .order("created_at", { ascending: false });

  if (options.unreadOnly) query = query.is("read_at", null);
  if (options.category && options.category !== "all") query = query.eq("category", options.category);
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
    .is("read_at", null);

  return { unreadCount: count ?? 0, items };
}

export async function createInAppNotification(
  organizationId: string,
  actorUserId: string | null,
  input: CreateInAppNotificationInput,
  client?: NotificationDbClient | SupabaseClientType
): Promise<InAppNotificationRecord> {
  const db = await resolveClient(client);
  const { data, error } = await db
    .from("in_app_notifications")
    .insert({
      organization_id: organizationId,
      user_id: input.userId,
      category: input.category,
      title: input.title,
      body: input.body,
      href: input.href ?? null,
      source_entity_type: input.sourceEntityType ?? null,
      source_entity_id: input.sourceEntityId ?? null,
      metadata: (input.metadata ?? {}) as Json,
      created_by: actorUserId
    })
    .select(NOTIFICATION_SELECT)
    .single();
  if (error || !data) throw new Error(error?.message ?? "Notification creation failed");
  return toNotificationRecord(data as NotificationRow);
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
  const readAt = input.action === "mark_read" ? now : null;
  const { data, error } = await db
    .from("in_app_notifications")
    .update({ read_at: readAt, updated_at: now })
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
    .is("read_at", null);
  if (error) throw new Error(error.message);
  return count ?? 0;
}
