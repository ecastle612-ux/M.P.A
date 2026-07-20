import { assertAnnouncementEditable, assertAnnouncementPublishable } from "./events";
import { createAuthServerComponentClient } from "../auth/server";
import { notify } from "../notifications/service";
import type { NotificationPriority } from "../notifications/contracts";
import type { Json } from "@mpa/supabase";
import type {
  AnnouncementMutationInput,
  AnnouncementPriority,
  AnnouncementReadRecord,
  AnnouncementRecipientRecord,
  AnnouncementRecord,
  AnnouncementStatus,
  BuildingQrCodeRecord,
  CreateAnnouncementInput,
  NotificationPreferencesRecord,
  UpdateAnnouncementInput
} from "./contracts";

type AnnouncementRow = {
  id: string;
  organization_id: string;
  title: string;
  message: string;
  priority: AnnouncementRecord["priority"];
  category: AnnouncementRecord["category"];
  status: AnnouncementRecord["status"];
  targeting_scope: AnnouncementRecord["targetingScope"];
  target_property_id: string | null;
  target_building: string | null;
  target_floor_placeholder: string | null;
  target_unit_id: string | null;
  target_lease_id: string | null;
  target_tenant_id: string | null;
  selected_tenant_ids: Json;
  attachment_placeholder: string | null;
  requires_acknowledgment: boolean;
  scheduled_at: string | null;
  published_at: string | null;
  expires_at: string | null;
  recipient_count: number;
  read_count: number;
  metadata: Json | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  deleted_at: string | null;
};

type SupabaseClientType = Awaited<ReturnType<typeof createAuthServerComponentClient>>;
type CommunicationDbClient = {
  from: (table: string) => ReturnType<SupabaseClientType["from"]>;
  rpc: (fn: string, args: Record<string, unknown>) => ReturnType<SupabaseClientType["rpc"]>;
};

function communicationDb(client: SupabaseClientType): CommunicationDbClient {
  return client as unknown as CommunicationDbClient;
}

const ANNOUNCEMENT_SELECT =
  "id, organization_id, title, message, priority, category, status, targeting_scope, target_property_id, target_building, target_floor_placeholder, target_unit_id, target_lease_id, target_tenant_id, selected_tenant_ids, attachment_placeholder, requires_acknowledgment, scheduled_at, published_at, expires_at, recipient_count, read_count, metadata, created_at, updated_at, archived_at, deleted_at";

export type AnnouncementListItem = AnnouncementRecord & {
  readPercentage: number;
  propertyName: string | null;
};

export type AnnouncementDetail = AnnouncementListItem & {
  recipients: AnnouncementRecipientRecord[];
  reads: AnnouncementReadRecord[];
};

export type AnnouncementListOptions = {
  search?: string;
  status?: AnnouncementStatus | "all";
  category?: AnnouncementRecord["category"] | "all";
  priority?: AnnouncementRecord["priority"] | "all";
  propertyId?: string;
  limit?: number;
  offset?: number;
};

export type CommunicationDashboardMetrics = {
  unreadAnnouncements: number;
  scheduledAnnouncements: number;
  emergencyAnnouncements: number;
  averageReadPercentage: number;
  residentsNeedingAcknowledgment: number;
  unreadMessages: number;
  awaitingResidentReply: number;
  vendorReplies: number;
  emergencyUnread: number;
  pendingConversations: number;
  recentActivity: Array<{
    id: string;
    title: string;
    status: string;
    timestamp: string;
    href: string;
  }>;
  recentThreads: Array<{
    id: string;
    subject: string;
    threadType: string;
    status: string;
    timestamp: string;
    href: string;
  }>;
  publishedSample: AnnouncementListItem[];
};

export type ResidentAnnouncementItem = AnnouncementRecord & {
  isRead: boolean;
  acknowledgedAt: string | null;
};

export async function getAnnouncementsForOrganization(
  organizationId: string,
  options: AnnouncementListOptions = {},
  client?: CommunicationDbClient | SupabaseClientType
): Promise<AnnouncementListItem[]> {
  const db = await resolveClient(client);
  let query = db
    .from("announcements")
    .select(ANNOUNCEMENT_SELECT)
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  if (options.status && options.status !== "all") query = query.eq("status", options.status);
  if (options.category && options.category !== "all") query = query.eq("category", options.category);
  if (options.priority && options.priority !== "all") query = query.eq("priority", options.priority);
  if (options.propertyId) query = query.eq("target_property_id", options.propertyId);
  const search = options.search?.trim();
  if (search) {
    const escaped = escapeLike(search);
    query = query.or(`title.ilike.%${escaped}%,message.ilike.%${escaped}%`);
  }
  if (options.limit !== undefined) {
    const from = options.offset ?? 0;
    query = query.range(from, from + options.limit - 1);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return ((data ?? []) as AnnouncementRow[]).map(toAnnouncementListItem);
}

export async function getAnnouncementForOrganization(
  organizationId: string,
  announcementId: string,
  client?: CommunicationDbClient | SupabaseClientType
): Promise<AnnouncementDetail | null> {
  const db = await resolveClient(client);
  const { data, error } = await db
    .from("announcements")
    .select(ANNOUNCEMENT_SELECT)
    .eq("organization_id", organizationId)
    .eq("id", announcementId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;

  const [recipients, reads] = await Promise.all([
    getAnnouncementRecipients(organizationId, announcementId, db),
    getAnnouncementReads(organizationId, announcementId, db)
  ]);

  return {
    ...toAnnouncementListItem(data as AnnouncementRow),
    recipients,
    reads
  };
}

export async function createAnnouncement(
  organizationId: string,
  userId: string,
  input: CreateAnnouncementInput,
  client?: CommunicationDbClient | SupabaseClientType
): Promise<AnnouncementRecord> {
  const db = await resolveClient(client);
  const { data, error } = await db
    .from("announcements")
    .insert({
      organization_id: organizationId,
      title: input.title,
      message: input.message,
      priority: input.priority ?? "normal",
      category: input.category ?? "general",
      status: input.scheduledAt ? "scheduled" : "draft",
      targeting_scope: input.targetingScope ?? "organization",
      target_property_id: input.targetPropertyId ?? null,
      target_building: input.targetBuilding ?? null,
      target_floor_placeholder: input.targetFloorPlaceholder ?? null,
      target_unit_id: input.targetUnitId ?? null,
      target_lease_id: input.targetLeaseId ?? null,
      target_tenant_id: input.targetTenantId ?? null,
      selected_tenant_ids: (input.selectedTenantIds ?? []) as unknown as Json,
      attachment_placeholder: input.attachmentPlaceholder ?? null,
      requires_acknowledgment: input.requiresAcknowledgment ?? false,
      scheduled_at: input.scheduledAt ?? null,
      expires_at: input.expiresAt ?? null,
      created_by: userId,
      updated_by: userId
    })
    .select(ANNOUNCEMENT_SELECT)
    .single();
  if (error) throw new Error(error.message);
  return toAnnouncementRecord(data as AnnouncementRow);
}

export async function applyAnnouncementMutation(
  organizationId: string,
  announcementId: string,
  userId: string,
  mutation: AnnouncementMutationInput,
  client?: CommunicationDbClient | SupabaseClientType
): Promise<AnnouncementRecord> {
  const db = await resolveClient(client);
  const existing = await getAnnouncementForOrganization(organizationId, announcementId, db);
  if (!existing) throw new Error("Announcement not found");

  switch (mutation.action) {
    case "archive":
      return updateAnnouncementRow(organizationId, announcementId, userId, {
        status: "archived",
        archived_at: new Date().toISOString(),
        archived_by: userId
      }, db);
    case "restore":
      return updateAnnouncementRow(organizationId, announcementId, userId, {
        status: "draft",
        archived_at: null,
        archived_by: null
      }, db);
    case "soft_delete":
      return updateAnnouncementRow(organizationId, announcementId, userId, {
        deleted_at: new Date().toISOString(),
        deleted_by: userId
      }, db);
    case "duplicate":
      return duplicateAnnouncement(organizationId, userId, existing, db);
    case "publish_now":
      assertAnnouncementPublishable(existing.status);
      return publishAnnouncement(organizationId, announcementId, userId, null, db);
    case "schedule":
      assertAnnouncementPublishable(existing.status);
      return updateAnnouncementRow(organizationId, announcementId, userId, {
        status: "scheduled",
        scheduled_at: mutation.scheduledAt
      }, db);
    case "update":
      assertAnnouncementEditable(existing.status);
      return updateAnnouncementFromInput(organizationId, announcementId, userId, mutation.updates, db);
    default:
      throw new Error("Unsupported announcement mutation");
  }
}

export async function publishAnnouncement(
  organizationId: string,
  announcementId: string,
  userId: string,
  scheduledAt: string | null,
  client?: CommunicationDbClient | SupabaseClientType
): Promise<AnnouncementRecord> {
  const db = await resolveClient(client);
  const detail = await getAnnouncementForOrganization(organizationId, announcementId, db);
  if (!detail) throw new Error("Announcement not found");
  assertAnnouncementPublishable(detail.status);

  await db.from("announcement_recipients").delete().eq("organization_id", organizationId).eq("announcement_id", announcementId);

  const targets = await resolveAnnouncementTargets(organizationId, detail, db);
  const now = new Date().toISOString();
  const recipientRows = targets.flatMap((target) => [
    {
      organization_id: organizationId,
      announcement_id: announcementId,
      tenant_id: target.tenantId,
      user_id: target.userId,
      delivery_channel: "in_app" as const,
      delivery_status: "delivered" as const,
      delivered_at: now
    },
    {
      organization_id: organizationId,
      announcement_id: announcementId,
      tenant_id: target.tenantId,
      user_id: target.userId,
      delivery_channel: "push" as const,
      delivery_status: "placeholder" as const
    },
    {
      organization_id: organizationId,
      announcement_id: announcementId,
      tenant_id: target.tenantId,
      user_id: target.userId,
      delivery_channel: "email" as const,
      delivery_status: "placeholder" as const
    },
    {
      organization_id: organizationId,
      announcement_id: announcementId,
      tenant_id: target.tenantId,
      user_id: target.userId,
      delivery_channel: "sms" as const,
      delivery_status: "placeholder" as const
    }
  ]);

  if (recipientRows.length > 0) {
    const { error: recipientError } = await db.from("announcement_recipients").insert(recipientRows);
    if (recipientError) throw new Error(recipientError.message);
  }

  const recipientUserIds = [
    ...new Set(targets.map((target) => target.userId).filter((id): id is string => Boolean(id)))
  ];
  if (recipientUserIds.length > 0) {
    const notificationPriority = mapAnnouncementPriority(detail.priority);
    const notificationCategory = detail.priority === "emergency" ? "emergency" : "announcements";
    const results = await notify(
      {
        organizationId,
        actorUserId: userId,
        eventKey: `announcement.published:${announcementId}`,
        recipientUserIds,
        category: notificationCategory,
        priority: notificationPriority,
        title: detail.title,
        body: detail.message.slice(0, 240),
        href: `/portal/tenant/announcements/${announcementId}`,
        sourceEntityType: "announcement",
        sourceEntityId: announcementId,
        propertyId: detail.targetPropertyId
      },
      db
    ).catch(() => undefined);

    if (results) {
      for (const record of results) {
        const deliveryStatus =
          record.pushDeliveryStatus === "sent" || record.pushDeliveryStatus === "delivered"
            ? "delivered"
            : record.pushDeliveryStatus === "failed"
              ? "failed"
              : record.pushDeliveryStatus === "pending"
                ? "pending"
                : "placeholder";
        await db
          .from("announcement_recipients")
          .update({
            delivery_status: deliveryStatus,
            delivered_at: deliveryStatus === "delivered" ? now : null
          })
          .eq("organization_id", organizationId)
          .eq("announcement_id", announcementId)
          .eq("user_id", record.userId)
          .eq("delivery_channel", "push");
      }
    }
  }

  const { sendWorkflowEmail } = await import("../integrations/email/delivery");
  const { isValidEmailAddress } = await import("../integrations/email/resolve-recipient");
  for (const target of targets) {
    if (!isValidEmailAddress(target.email)) {
      let missingEmailUpdate = db
        .from("announcement_recipients")
        .update({ delivery_status: "failed" })
        .eq("organization_id", organizationId)
        .eq("announcement_id", announcementId)
        .eq("delivery_channel", "email");
      if (target.userId) missingEmailUpdate = missingEmailUpdate.eq("user_id", target.userId);
      else if (target.tenantId) missingEmailUpdate = missingEmailUpdate.eq("tenant_id", target.tenantId);
      await missingEmailUpdate;
      continue;
    }

    const emailResult = await sendWorkflowEmail({
      organizationId,
      templateKey: "announcement_email",
      idempotencyKey: `${organizationId}:announcement.email:${announcementId}:${target.userId ?? target.tenantId}:${target.email}`,
      to: { email: target.email },
      subject: detail.title,
      body: detail.message.slice(0, 2000),
      href: `/portal/tenant/announcements/${announcementId}`,
      correlation: {
        sourceEntityType: "announcement",
        sourceEntityId: announcementId
      }
    }).catch(() => null);

    const emailStatus =
      !emailResult
        ? "failed"
        : emailResult.status === "sent" || emailResult.status === "queued"
          ? "delivered"
          : emailResult.status === "skipped"
            ? "placeholder"
            : "failed";

    let emailUpdate = db
      .from("announcement_recipients")
      .update({
        delivery_status: emailStatus,
        delivered_at: emailStatus === "delivered" ? now : null
      })
      .eq("organization_id", organizationId)
      .eq("announcement_id", announcementId)
      .eq("delivery_channel", "email");
    if (target.userId) emailUpdate = emailUpdate.eq("user_id", target.userId);
    else if (target.tenantId) emailUpdate = emailUpdate.eq("tenant_id", target.tenantId);
    await emailUpdate;
  }

  const uniqueRecipients = new Set(targets.map((t) => t.userId ?? t.tenantId).filter(Boolean));
  const updated = await updateAnnouncementRow(organizationId, announcementId, userId, {
    status: "published",
    published_at: scheduledAt ?? now,
    scheduled_at: scheduledAt,
    recipient_count: uniqueRecipients.size
  }, db);

  if (detail.targetPropertyId) {
    const { ingestAnnouncementPublished } = await import("../facility/ingest");
    await ingestAnnouncementPublished({
      organizationId,
      userId,
      announcementId,
      propertyId: detail.targetPropertyId,
      title: detail.title,
      client: db
    });
  }

  return updated;
}

function mapAnnouncementPriority(priority: AnnouncementPriority): NotificationPriority {
  if (priority === "emergency") return "emergency";
  if (priority === "high") return "high";
  return "normal";
}

export async function markAnnouncementReadForUser(
  organizationId: string,
  announcementId: string,
  userId: string,
  acknowledged = false,
  client?: CommunicationDbClient | SupabaseClientType
): Promise<void> {
  const db = await resolveClient(client);
  const { data: recipient, error: recipientError } = await db
    .from("announcement_recipients")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("announcement_id", announcementId)
    .eq("user_id", userId)
    .eq("delivery_channel", "in_app")
    .maybeSingle();
  if (recipientError) throw new Error(recipientError.message);
  if (!recipient) throw new Error("You are not a recipient of this announcement");

  const now = new Date().toISOString();
  const { error: readError } = await db.from("announcement_reads").upsert(
    {
      organization_id: organizationId,
      announcement_id: announcementId,
      recipient_id: recipient.id,
      user_id: userId,
      read_at: now,
      acknowledged_at: acknowledged ? now : null
    },
    { onConflict: "announcement_id,user_id" }
  );
  if (readError) throw new Error(readError.message);

  const { count } = await db
    .from("announcement_reads")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("announcement_id", announcementId);

  await db
    .from("announcements")
    .update({ read_count: count ?? 0, updated_by: userId })
    .eq("organization_id", organizationId)
    .eq("id", announcementId);
}

export async function getResidentAnnouncementsForUser(
  organizationId: string,
  userId: string,
  client?: CommunicationDbClient | SupabaseClientType
): Promise<ResidentAnnouncementItem[]> {
  const db = await resolveClient(client);
  const { data: recipientRows, error: recipientError } = await db
    .from("announcement_recipients")
    .select("announcement_id")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .eq("delivery_channel", "in_app");
  if (recipientError) throw new Error(recipientError.message);

  const announcementIds = [
    ...new Set(((recipientRows ?? []) as Array<{ announcement_id: string }>).map((row) => row.announcement_id))
  ];
  if (announcementIds.length === 0) return [];

  const { data: announcements, error } = await db
    .from("announcements")
    .select(ANNOUNCEMENT_SELECT)
    .eq("organization_id", organizationId)
    .in("id", announcementIds)
    .eq("status", "published")
    .is("deleted_at", null)
    .order("published_at", { ascending: false });
  if (error) throw new Error(error.message);

  const { data: reads } = await db
    .from("announcement_reads")
    .select("announcement_id, acknowledged_at")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .in("announcement_id", announcementIds);

  type ReadRow = { announcement_id: string; acknowledged_at: string | null };
  const readMap = new Map<string, ReadRow>(
    ((reads ?? []) as ReadRow[]).map((row) => [row.announcement_id, row])
  );

  return ((announcements ?? []) as AnnouncementRow[]).map((row) => {
    const read = readMap.get(row.id);
    return {
      ...toAnnouncementRecord(row),
      isRead: Boolean(read),
      acknowledgedAt: read?.acknowledged_at ?? null
    };
  });
}

export async function resolveBuildingQrToken(
  token: string,
  client?: CommunicationDbClient | SupabaseClientType
): Promise<{ organizationId: string; propertyId: string; propertyName: string; label: string; qrToken: string } | null> {
  const db = await resolveClient(client);
  const { data, error } = await db.rpc("resolve_building_qr_token", { p_token: token });
  if (error) throw new Error(error.message);
  if (!data || data === null || (typeof data === "object" && data !== null && Object.keys(data as object).length === 0)) {
    return null;
  }
  const payload = data as Record<string, string> | null;
  if (!payload || !payload["organizationId"] || !payload["propertyId"]) return null;
  return {
    organizationId: payload["organizationId"],
    propertyId: payload["propertyId"],
    propertyName: payload["propertyName"] ?? "Property",
    label: payload["label"] ?? "Property enrollment",
    qrToken: payload["qrToken"] ?? token
  };
}

export async function getBuildingQrForProperty(
  organizationId: string,
  propertyId: string,
  client?: CommunicationDbClient | SupabaseClientType
): Promise<BuildingQrCodeRecord | null> {
  const db = await resolveClient(client);
  const { data, error } = await db
    .from("building_qr_codes")
    .select("id, organization_id, property_id, qr_token, label, building_name, is_active, enrollment_count, last_scanned_at, created_at, updated_at")
    .eq("organization_id", organizationId)
    .eq("property_id", propertyId)
    .is("deleted_at", null)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return toBuildingQrRecord(data);
}

export async function enrollResidentViaQrToken(
  organizationId: string,
  userId: string,
  userEmail: string,
  token: string,
  client?: CommunicationDbClient | SupabaseClientType
): Promise<{ propertyId: string; propertyName: string; alreadyEnrolled: boolean }> {
  const db = await resolveClient(client);
  const resolved = await resolveBuildingQrToken(token, db);
  if (!resolved) throw new Error("Invalid or expired QR code");
  if (resolved.organizationId !== organizationId) {
    throw new Error("QR code belongs to a different organization");
  }

  const { data: existingDevice } = await db
    .from("resident_devices")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .eq("property_id", resolved.propertyId)
    .is("deleted_at", null)
    .maybeSingle();

  if (existingDevice) {
    return { propertyId: resolved.propertyId, propertyName: resolved.propertyName, alreadyEnrolled: true };
  }

  const tenantId = await findTenantIdByEmail(organizationId, resolved.propertyId, userEmail, db);

  await db.from("resident_devices").insert({
    organization_id: organizationId,
    user_id: userId,
    tenant_id: tenantId,
    property_id: resolved.propertyId,
    platform: "web",
    device_label: "Web browser",
    enrolled_via: "qr",
    created_by: userId,
    updated_by: userId
  });

  const channelTypes = ["in_app", "push", "email", "sms"] as const;
  await db.from("resident_communication_channels").upsert(
    channelTypes.map((channelType) => ({
      organization_id: organizationId,
      user_id: userId,
      tenant_id: tenantId,
      property_id: resolved.propertyId,
      channel_type: channelType,
      status: channelType === "in_app" ? "active" : "placeholder",
      enrolled_via: "qr",
      is_primary: channelType === "in_app",
      created_by: userId,
      updated_by: userId
    })),
    { onConflict: "organization_id,user_id,property_id,channel_type" }
  );

  await db.from("notification_preferences").upsert(
    {
      organization_id: organizationId,
      user_id: userId,
      tenant_id: tenantId,
      property_id: resolved.propertyId,
      created_by: userId,
      updated_by: userId
    },
    { onConflict: "organization_id,user_id" }
  );

  const { data: qrRow } = await db
    .from("building_qr_codes")
    .select("id, enrollment_count")
    .eq("organization_id", organizationId)
    .eq("property_id", resolved.propertyId)
    .eq("qr_token", token)
    .maybeSingle();

  if (qrRow) {
    await db
      .from("building_qr_codes")
      .update({
        enrollment_count: (qrRow.enrollment_count as number) + 1,
        last_scanned_at: new Date().toISOString(),
        updated_by: userId
      })
      .eq("id", qrRow.id);
  }

  return { propertyId: resolved.propertyId, propertyName: resolved.propertyName, alreadyEnrolled: false };
}

export async function getNotificationPreferencesForUser(
  organizationId: string,
  userId: string,
  client?: CommunicationDbClient | SupabaseClientType
): Promise<NotificationPreferencesRecord | null> {
  const db = await resolveClient(client);
  const { data, error } = await db
    .from("notification_preferences")
    .select("id, organization_id, user_id, tenant_id, property_id, in_app_enabled, push_enabled, email_enabled, sms_enabled, emergency_override, category_preferences, quiet_hours, property_preferences, language_code, created_at, updated_at")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return toNotificationPreferencesRecord(data);
}

export async function updateNotificationPreferencesForUser(
  organizationId: string,
  userId: string,
  updates: Partial<
    Pick<
      NotificationPreferencesRecord,
      | "inAppEnabled"
      | "pushEnabled"
      | "emailEnabled"
      | "smsEnabled"
      | "emergencyOverride"
      | "categoryPreferences"
      | "quietHours"
      | "propertyPreferences"
      | "languageCode"
    >
  >,
  client?: CommunicationDbClient | SupabaseClientType
): Promise<NotificationPreferencesRecord> {
  const db = await resolveClient(client);
  const patch: Record<string, unknown> = { updated_by: userId };
  if (updates.inAppEnabled !== undefined) patch["in_app_enabled"] = updates.inAppEnabled;
  if (updates.pushEnabled !== undefined) patch["push_enabled"] = updates.pushEnabled;
  if (updates.emailEnabled !== undefined) patch["email_enabled"] = updates.emailEnabled;
  if (updates.smsEnabled !== undefined) patch["sms_enabled"] = updates.smsEnabled;
  if (updates.emergencyOverride !== undefined) patch["emergency_override"] = updates.emergencyOverride;
  if (updates.categoryPreferences !== undefined) patch["category_preferences"] = updates.categoryPreferences;
  if (updates.quietHours !== undefined) patch["quiet_hours"] = updates.quietHours;
  if (updates.propertyPreferences !== undefined) patch["property_preferences"] = updates.propertyPreferences;
  if (updates.languageCode !== undefined) patch["language_code"] = updates.languageCode;

  const { data, error } = await db
    .from("notification_preferences")
    .upsert({ organization_id: organizationId, user_id: userId, created_by: userId, ...patch }, { onConflict: "organization_id,user_id" })
    .select("id, organization_id, user_id, tenant_id, property_id, in_app_enabled, push_enabled, email_enabled, sms_enabled, emergency_override, category_preferences, quiet_hours, property_preferences, language_code, created_at, updated_at")
    .single();
  if (error) throw new Error(error.message);
  return toNotificationPreferencesRecord(data);
}

export async function getCommunicationDashboardMetrics(
  organizationId: string,
  client?: CommunicationDbClient | SupabaseClientType
): Promise<CommunicationDashboardMetrics> {
  const db = await resolveClient(client);
  const announcements = await getAnnouncementsForOrganization(organizationId, { limit: 50 }, db);
  const published = announcements.filter((item) => item.status === "published");
  const scheduled = announcements.filter((item) => item.status === "scheduled");
  const emergency = published.filter((item) => item.priority === "emergency");
  const unreadTotal = published.reduce((sum, item) => sum + Math.max(item.recipientCount - item.readCount, 0), 0);
  const readPercentages = published
    .filter((item) => item.recipientCount > 0)
    .map((item) => (item.readCount / item.recipientCount) * 100);
  const averageReadPercentage =
    readPercentages.length > 0 ? Math.round(readPercentages.reduce((a, b) => a + b, 0) / readPercentages.length) : 0;
  const needingAck = published.filter((item) => item.requiresAcknowledgment && item.readCount < item.recipientCount).length;

  return {
    unreadAnnouncements: unreadTotal,
    scheduledAnnouncements: scheduled.length,
    emergencyAnnouncements: emergency.length,
    averageReadPercentage,
    residentsNeedingAcknowledgment: needingAck,
    unreadMessages: 0,
    awaitingResidentReply: 0,
    vendorReplies: 0,
    emergencyUnread: 0,
    pendingConversations: 0,
    recentThreads: [],
    recentActivity: announcements.slice(0, 5).map((item) => ({
      id: item.id,
      title: item.title,
      status: item.status,
      timestamp: item.publishedAt ?? item.updatedAt,
      href: `/communications/${item.id}`
    })),
    publishedSample: published.slice(0, 3)
  };
}

async function resolveAnnouncementTargets(
  organizationId: string,
  announcement: AnnouncementListItem,
  client: CommunicationDbClient
): Promise<Array<{ tenantId: string | null; userId: string | null; email: string | null }>> {
  // Include tenants.user_id so portal-linked residents receive in-app/push even before a device row exists.
  let tenantQuery = client
    .from("tenants")
    .select("id, email, user_id")
    .eq("organization_id", organizationId)
    .is("deleted_at", null);

  switch (announcement.targetingScope) {
    case "property":
    case "building":
    case "floor":
      if (announcement.targetPropertyId) tenantQuery = tenantQuery.eq("property_id", announcement.targetPropertyId);
      break;
    case "unit":
      if (announcement.targetUnitId) tenantQuery = tenantQuery.eq("unit_id", announcement.targetUnitId);
      break;
    case "tenant":
      if (announcement.targetTenantId) tenantQuery = tenantQuery.eq("id", announcement.targetTenantId);
      break;
    case "lease":
      if (announcement.targetLeaseId) {
        const { data: lease } = await client
          .from("leases")
          .select("primary_tenant_id")
          .eq("organization_id", organizationId)
          .eq("id", announcement.targetLeaseId)
          .maybeSingle();
        if (lease?.primary_tenant_id) tenantQuery = tenantQuery.eq("id", lease.primary_tenant_id);
      }
      break;
    case "selected_residents":
      if (announcement.selectedTenantIds.length > 0) tenantQuery = tenantQuery.in("id", announcement.selectedTenantIds);
      break;
    default:
      break;
  }

  const { data: tenants } = await tenantQuery;
  const { data: devices } = await client
    .from("resident_devices")
    .select("user_id, tenant_id, property_id")
    .eq("organization_id", organizationId)
    .is("deleted_at", null);

  const targets = new Map<
    string,
    { tenantId: string | null; userId: string | null; email: string | null }
  >();

  for (const tenant of tenants ?? []) {
    const device = (devices ?? []).find(
      (row: { tenant_id: string | null; user_id: string | null }) => row.tenant_id === tenant.id
    );
    const linkedUserId =
      (typeof tenant.user_id === "string" && tenant.user_id ? (tenant.user_id as string) : null) ??
      (device?.user_id as string | null) ??
      null;
    const key = linkedUserId ?? (tenant.id as string);
    const email =
      typeof tenant.email === "string" && tenant.email.trim() ? String(tenant.email).trim().toLowerCase() : null;
    targets.set(key, {
      tenantId: tenant.id as string,
      userId: linkedUserId,
      email
    });
  }

  for (const device of devices ?? []) {
    if (announcement.targetingScope === "organization") {
      const existing = targets.get(device.user_id as string);
      targets.set(device.user_id as string, {
        tenantId: (device.tenant_id as string | null) ?? null,
        userId: device.user_id as string,
        email: existing?.email ?? null
      });
      continue;
    }
    if (announcement.targetPropertyId && device.property_id === announcement.targetPropertyId) {
      const existing = targets.get(device.user_id as string);
      targets.set(device.user_id as string, {
        tenantId: (device.tenant_id as string | null) ?? null,
        userId: device.user_id as string,
        email: existing?.email ?? null
      });
    }
  }

  return [...targets.values()];
}

/**
 * Users in the announcement audience who have ≥1 active push subscription.
 */
export async function getAnnouncementPushRecipientCount(
  organizationId: string,
  announcementId: string,
  client?: CommunicationDbClient | SupabaseClientType
): Promise<{ pushRecipientCount: number; audienceUserCount: number }> {
  const db = await resolveClient(client);
  const detail = await getAnnouncementForOrganization(organizationId, announcementId, db);
  if (!detail) throw new Error("Announcement not found");

  const targets = await resolveAnnouncementTargets(organizationId, detail, db);
  const userIds = [...new Set(targets.map((t) => t.userId).filter((id): id is string => Boolean(id)))];
  if (userIds.length === 0) {
    return { pushRecipientCount: 0, audienceUserCount: 0 };
  }

  const { data: devices, error } = await db
    .from("resident_devices")
    .select("user_id")
    .eq("organization_id", organizationId)
    .eq("is_active", true)
    .is("deleted_at", null)
    .not("external_subscription_id", "is", null)
    .in("user_id", userIds);
  if (error) throw new Error(error.message);

  const pushUsers = new Set(((devices ?? []) as Array<{ user_id: string }>).map((row) => row.user_id));
  return { pushRecipientCount: pushUsers.size, audienceUserCount: userIds.length };
}

async function duplicateAnnouncement(
  organizationId: string,
  userId: string,
  source: AnnouncementDetail,
  client: CommunicationDbClient
): Promise<AnnouncementRecord> {
  return createAnnouncement(
    organizationId,
    userId,
    {
      title: `${source.title} (Copy)`,
      message: source.message,
      priority: source.priority,
      category: source.category,
      targetingScope: source.targetingScope,
      targetPropertyId: source.targetPropertyId,
      targetBuilding: source.targetBuilding,
      targetFloorPlaceholder: source.targetFloorPlaceholder,
      targetUnitId: source.targetUnitId,
      targetLeaseId: source.targetLeaseId,
      targetTenantId: source.targetTenantId,
      selectedTenantIds: source.selectedTenantIds,
      attachmentPlaceholder: source.attachmentPlaceholder,
      requiresAcknowledgment: source.requiresAcknowledgment,
      expiresAt: source.expiresAt
    },
    client
  );
}

async function updateAnnouncementFromInput(
  organizationId: string,
  announcementId: string,
  userId: string,
  updates: UpdateAnnouncementInput,
  client: CommunicationDbClient
): Promise<AnnouncementRecord> {
  const patch: Record<string, unknown> = { updated_by: userId };
  if (updates.title !== undefined) patch["title"] = updates.title;
  if (updates.message !== undefined) patch["message"] = updates.message;
  if (updates.priority !== undefined) patch["priority"] = updates.priority;
  if (updates.category !== undefined) patch["category"] = updates.category;
  if (updates.targetingScope !== undefined) patch["targeting_scope"] = updates.targetingScope;
  if (updates.targetPropertyId !== undefined) patch["target_property_id"] = updates.targetPropertyId;
  if (updates.targetBuilding !== undefined) patch["target_building"] = updates.targetBuilding;
  if (updates.targetFloorPlaceholder !== undefined) patch["target_floor_placeholder"] = updates.targetFloorPlaceholder;
  if (updates.targetUnitId !== undefined) patch["target_unit_id"] = updates.targetUnitId;
  if (updates.targetLeaseId !== undefined) patch["target_lease_id"] = updates.targetLeaseId;
  if (updates.targetTenantId !== undefined) patch["target_tenant_id"] = updates.targetTenantId;
  if (updates.selectedTenantIds !== undefined) patch["selected_tenant_ids"] = updates.selectedTenantIds;
  if (updates.attachmentPlaceholder !== undefined) patch["attachment_placeholder"] = updates.attachmentPlaceholder;
  if (updates.requiresAcknowledgment !== undefined) patch["requires_acknowledgment"] = updates.requiresAcknowledgment;
  if (updates.scheduledAt !== undefined) patch["scheduled_at"] = updates.scheduledAt;
  if (updates.expiresAt !== undefined) patch["expires_at"] = updates.expiresAt;
  return updateAnnouncementRow(organizationId, announcementId, userId, patch, client);
}

async function updateAnnouncementRow(
  organizationId: string,
  announcementId: string,
  userId: string,
  patch: Record<string, unknown>,
  client: CommunicationDbClient
): Promise<AnnouncementRecord> {
  const { data, error } = await client
    .from("announcements")
    .update({ ...patch, updated_by: userId })
    .eq("organization_id", organizationId)
    .eq("id", announcementId)
    .select(ANNOUNCEMENT_SELECT)
    .single();
  if (error) throw new Error(error.message);
  return toAnnouncementRecord(data as AnnouncementRow);
}

async function getAnnouncementRecipients(
  organizationId: string,
  announcementId: string,
  client: CommunicationDbClient
): Promise<AnnouncementRecipientRecord[]> {
  const { data, error } = await client
    .from("announcement_recipients")
    .select("id, organization_id, announcement_id, tenant_id, user_id, delivery_channel, delivery_status, delivered_at, created_at, updated_at")
    .eq("organization_id", organizationId)
    .eq("announcement_id", announcementId);
  if (error) throw new Error(error.message);
  return (data ?? []).map(toRecipientRecord);
}

async function getAnnouncementReads(
  organizationId: string,
  announcementId: string,
  client: CommunicationDbClient
): Promise<AnnouncementReadRecord[]> {
  const { data, error } = await client
    .from("announcement_reads")
    .select("id, organization_id, announcement_id, recipient_id, user_id, read_at, acknowledged_at, created_at")
    .eq("organization_id", organizationId)
    .eq("announcement_id", announcementId);
  if (error) throw new Error(error.message);
  return (data ?? []).map(toReadRecord);
}

async function findTenantIdByEmail(
  organizationId: string,
  propertyId: string,
  email: string,
  client: CommunicationDbClient
): Promise<string | null> {
  const { data } = await client
    .from("tenants")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("property_id", propertyId)
    .ilike("email", email)
    .is("deleted_at", null)
    .maybeSingle();
  return (data?.id as string | undefined) ?? null;
}

function toAnnouncementRecord(row: AnnouncementRow): AnnouncementRecord {
  return {
    id: row.id,
    organizationId: row.organization_id,
    title: row.title,
    message: row.message,
    priority: row.priority,
    category: row.category,
    status: row.status,
    targetingScope: row.targeting_scope,
    targetPropertyId: row.target_property_id,
    targetBuilding: row.target_building,
    targetFloorPlaceholder: row.target_floor_placeholder,
    targetUnitId: row.target_unit_id,
    targetLeaseId: row.target_lease_id,
    targetTenantId: row.target_tenant_id,
    selectedTenantIds: Array.isArray(row.selected_tenant_ids) ? (row.selected_tenant_ids as string[]) : [],
    attachmentPlaceholder: row.attachment_placeholder,
    requiresAcknowledgment: row.requires_acknowledgment,
    scheduledAt: row.scheduled_at,
    publishedAt: row.published_at,
    expiresAt: row.expires_at,
    recipientCount: row.recipient_count,
    readCount: row.read_count,
    metadata: (row.metadata as Record<string, unknown> | null) ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
    deletedAt: row.deleted_at
  };
}

function toAnnouncementListItem(row: AnnouncementRow): AnnouncementListItem {
  const record = toAnnouncementRecord(row);
  const readPercentage = record.recipientCount > 0 ? Math.round((record.readCount / record.recipientCount) * 100) : 0;
  return { ...record, readPercentage, propertyName: null };
}

function toRecipientRecord(row: Record<string, unknown>): AnnouncementRecipientRecord {
  return {
    id: row["id"] as string,
    organizationId: row["organization_id"] as string,
    announcementId: row["announcement_id"] as string,
    tenantId: (row["tenant_id"] as string | null) ?? null,
    userId: (row["user_id"] as string | null) ?? null,
    deliveryChannel: row["delivery_channel"] as AnnouncementRecipientRecord["deliveryChannel"],
    deliveryStatus: row["delivery_status"] as AnnouncementRecipientRecord["deliveryStatus"],
    deliveredAt: (row["delivered_at"] as string | null) ?? null,
    createdAt: row["created_at"] as string,
    updatedAt: row["updated_at"] as string
  };
}

function toReadRecord(row: Record<string, unknown>): AnnouncementReadRecord {
  return {
    id: row["id"] as string,
    organizationId: row["organization_id"] as string,
    announcementId: row["announcement_id"] as string,
    recipientId: row["recipient_id"] as string,
    userId: row["user_id"] as string,
    readAt: row["read_at"] as string,
    acknowledgedAt: (row["acknowledged_at"] as string | null) ?? null,
    createdAt: row["created_at"] as string
  };
}

function toBuildingQrRecord(row: Record<string, unknown>): BuildingQrCodeRecord {
  return {
    id: row["id"] as string,
    organizationId: row["organization_id"] as string,
    propertyId: row["property_id"] as string,
    qrToken: row["qr_token"] as string,
    label: row["label"] as string,
    buildingName: (row["building_name"] as string | null) ?? null,
    isActive: row["is_active"] as boolean,
    enrollmentCount: row["enrollment_count"] as number,
    lastScannedAt: (row["last_scanned_at"] as string | null) ?? null,
    createdAt: row["created_at"] as string,
    updatedAt: row["updated_at"] as string
  };
}

function toNotificationPreferencesRecord(row: Record<string, unknown>): NotificationPreferencesRecord {
  return {
    id: row["id"] as string,
    organizationId: row["organization_id"] as string,
    userId: row["user_id"] as string,
    tenantId: (row["tenant_id"] as string | null) ?? null,
    propertyId: (row["property_id"] as string | null) ?? null,
    inAppEnabled: row["in_app_enabled"] as boolean,
    pushEnabled: row["push_enabled"] as boolean,
    emailEnabled: row["email_enabled"] as boolean,
    smsEnabled: row["sms_enabled"] as boolean,
    emergencyOverride: row["emergency_override"] === undefined ? true : Boolean(row["emergency_override"]),
    categoryPreferences: (row["category_preferences"] as Record<string, boolean>) ?? {},
    quietHours: (row["quiet_hours"] as Record<string, unknown>) ?? {},
    propertyPreferences:
      (row["property_preferences"] as Array<{ propertyId: string; muted: boolean; allowedCategories?: string[] }>) ?? [],
    languageCode: row["language_code"] as string,
    createdAt: row["created_at"] as string,
    updatedAt: row["updated_at"] as string
  };
}

function escapeLike(value: string): string {
  return value.replace(/[%_\\]/g, "\\$&");
}

async function resolveClient(client?: CommunicationDbClient | SupabaseClientType): Promise<CommunicationDbClient> {
  if (client && typeof client === "object" && "from" in client && !("auth" in client)) {
    return client as CommunicationDbClient;
  }
  const supabase = (client as SupabaseClientType | undefined) ?? (await createAuthServerComponentClient());
  return communicationDb(supabase);
}
