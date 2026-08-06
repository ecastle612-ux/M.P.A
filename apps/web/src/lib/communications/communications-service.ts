import type { SupabaseClient } from "@supabase/supabase-js";
import {
  isCommsAudienceType,
  isCommsChannel,
  type CommsAudienceType,
  type CommsChannel,
  type CommsMessageRecord,
  type UnifiedNotificationRecord
} from "@mpa/shared";
import { emitPropertyEvent, writePropertyAudit } from "../property/events-audit";
import { sendOperationalNoticeEmail } from "./email";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = SupabaseClient<any>;

function mapMessage(row: Record<string, unknown>, audienceLabel?: string | null): CommsMessageRecord {
  return {
    id: row["id"] as string,
    organizationId: row["organization_id"] as string,
    audienceType: row["audience_type"] as CommsAudienceType,
    subject: row["subject"] as string,
    body: row["body"] as string,
    propertyId: (row["property_id"] as string | null) ?? null,
    residentId: (row["resident_id"] as string | null) ?? null,
    vendorId: (row["vendor_id"] as string | null) ?? null,
    ownerUserId: (row["owner_user_id"] as string | null) ?? null,
    recipientUserId: (row["recipient_user_id"] as string | null) ?? null,
    channel: row["channel"] as CommsChannel,
    deliveryStatus: row["delivery_status"] as string,
    createdBy: (row["created_by"] as string | null) ?? null,
    createdAt: row["created_at"] as string,
    audienceLabel: audienceLabel ?? null
  };
}

export async function listUnifiedNotifications(
  supabase: Db,
  organizationId: string,
  userId: string
): Promise<UnifiedNotificationRecord[]> {
  const [finance, maintenance, comms] = await Promise.all([
    supabase
      .from("financial_notifications")
      .select("id, title, body, href, read_at, created_at, notification_key")
      .eq("organization_id", organizationId)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(40),
    supabase
      .from("maintenance_notifications")
      .select("id, title, body, href, read_at, created_at, notification_key")
      .eq("organization_id", organizationId)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(40),
    supabase
      .from("comms_notifications")
      .select("id, title, body, href, read_at, created_at, notification_key")
      .eq("organization_id", organizationId)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(40)
  ]);

  const items: UnifiedNotificationRecord[] = [
    ...(finance.data ?? []).map((row) => ({
      id: `finance:${row.id}`,
      source: "finance" as const,
      title: row.title as string,
      body: row.body as string,
      href: (row.href as string | null) ?? null,
      readAt: (row.read_at as string | null) ?? null,
      createdAt: row.created_at as string,
      notificationKey: row.notification_key as string
    })),
    ...(maintenance.data ?? []).map((row) => ({
      id: `maintenance:${row.id}`,
      source: "maintenance" as const,
      title: row.title as string,
      body: row.body as string,
      href: (row.href as string | null) ?? null,
      readAt: (row.read_at as string | null) ?? null,
      createdAt: row.created_at as string,
      notificationKey: row.notification_key as string
    })),
    ...(comms.data ?? []).map((row) => ({
      id: `comms:${row.id}`,
      source: "comms" as const,
      title: row.title as string,
      body: row.body as string,
      href: (row.href as string | null) ?? "/shared/communications",
      readAt: (row.read_at as string | null) ?? null,
      createdAt: row.created_at as string,
      notificationKey: row.notification_key as string
    }))
  ];

  return items.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).slice(0, 60);
}

export async function markNotificationRead(
  supabase: Db,
  organizationId: string,
  userId: string,
  notificationId: string
) {
  const now = new Date().toISOString();
  if (notificationId.startsWith("finance:")) {
    const id = notificationId.slice("finance:".length);
    const { error } = await supabase
      .from("financial_notifications")
      .update({ read_at: now })
      .eq("organization_id", organizationId)
      .eq("user_id", userId)
      .eq("id", id);
    if (error) {
      throw new Error(error.message);
    }
    return { ok: true };
  }
  if (notificationId.startsWith("maintenance:")) {
    const id = notificationId.slice("maintenance:".length);
    const { error } = await supabase
      .from("maintenance_notifications")
      .update({ read_at: now })
      .eq("organization_id", organizationId)
      .eq("user_id", userId)
      .eq("id", id);
    if (error) {
      throw new Error(error.message);
    }
    return { ok: true };
  }
  if (notificationId.startsWith("comms:")) {
    const id = notificationId.slice("comms:".length);
    const { error } = await supabase
      .from("comms_notifications")
      .update({ read_at: now })
      .eq("organization_id", organizationId)
      .eq("user_id", userId)
      .eq("id", id);
    if (error) {
      throw new Error(error.message);
    }
    return { ok: true };
  }
  throw new Error("Unknown notification id");
}

export async function listCommunicationHistory(
  supabase: Db,
  organizationId: string,
  filters?: { audienceType?: CommsAudienceType | "all"; query?: string }
): Promise<CommsMessageRecord[]> {
  let query = supabase
    .from("comms_messages")
    .select(
      "id, organization_id, audience_type, subject, body, property_id, resident_id, vendor_id, owner_user_id, recipient_user_id, channel, delivery_status, created_by, created_at"
    )
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(80);

  if (filters?.audienceType && filters.audienceType !== "all") {
    query = query.eq("audience_type", filters.audienceType);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  const residentIds = [...new Set((data ?? []).map((row) => row.resident_id).filter(Boolean))];
  const vendorIds = [...new Set((data ?? []).map((row) => row.vendor_id).filter(Boolean))];
  const [{ data: residents }, { data: vendors }] = await Promise.all([
    residentIds.length
      ? supabase
          .from("pm_residents")
          .select("id, display_name")
          .eq("organization_id", organizationId)
          .in("id", residentIds as string[])
      : Promise.resolve({ data: [] as Array<{ id: string; display_name: string }> }),
    vendorIds.length
      ? supabase
          .from("vendor_vendors")
          .select("id, name")
          .eq("organization_id", organizationId)
          .in("id", vendorIds as string[])
      : Promise.resolve({ data: [] as Array<{ id: string; name: string }> })
  ]);
  const residentName = new Map((residents ?? []).map((row) => [row.id, row.display_name]));
  const vendorName = new Map((vendors ?? []).map((row) => [row.id, row.name]));

  const rows = (data ?? []).map((row) => {
    const label =
      row.audience_type === "resident"
        ? residentName.get(row.resident_id as string) ?? "Resident"
        : row.audience_type === "vendor"
          ? vendorName.get(row.vendor_id as string) ?? "Vendor"
          : "Owner";
    return mapMessage(row as Record<string, unknown>, label);
  });

  const needle = filters?.query?.trim().toLowerCase();
  if (!needle) {
    return rows;
  }
  return rows.filter(
    (row) =>
      row.subject.toLowerCase().includes(needle) ||
      row.body.toLowerCase().includes(needle) ||
      (row.audienceLabel ?? "").toLowerCase().includes(needle)
  );
}

async function resolveAudience(
  supabase: Db,
  organizationId: string,
  input: {
    audienceType: CommsAudienceType;
    residentId?: string;
    vendorId?: string;
    ownerUserId?: string;
  }
): Promise<{
  recipientUserId: string | null;
  recipientEmail: string | null;
  audienceLabel: string;
  residentId: string | null;
  vendorId: string | null;
  ownerUserId: string | null;
  propertyId: string | null;
}> {
  if (input.audienceType === "resident") {
    if (!input.residentId) {
      throw new Error("residentId is required");
    }
    const { data } = await supabase
      .from("pm_residents")
      .select("id, display_name, email, user_id, property_id")
      .eq("organization_id", organizationId)
      .eq("id", input.residentId)
      .maybeSingle();
    if (!data) {
      throw new Error("Resident not found");
    }
    return {
      recipientUserId: (data.user_id as string | null) ?? null,
      recipientEmail: (data.email as string | null) ?? null,
      audienceLabel: (data.display_name as string) ?? "Resident",
      residentId: data.id as string,
      vendorId: null,
      ownerUserId: null,
      propertyId: (data.property_id as string | null) ?? null
    };
  }

  if (input.audienceType === "vendor") {
    if (!input.vendorId) {
      throw new Error("vendorId is required");
    }
    const { data } = await supabase
      .from("vendor_vendors")
      .select("id, name, email, user_id")
      .eq("organization_id", organizationId)
      .eq("id", input.vendorId)
      .maybeSingle();
    if (!data) {
      throw new Error("Vendor not found");
    }
    return {
      recipientUserId: (data.user_id as string | null) ?? null,
      recipientEmail: (data.email as string | null) ?? null,
      audienceLabel: (data.name as string) ?? "Vendor",
      residentId: null,
      vendorId: data.id as string,
      ownerUserId: null,
      propertyId: null
    };
  }

  if (!input.ownerUserId) {
    // Prefer an active property_owner membership when not specified.
    const { data: owners } = await supabase
      .from("organization_memberships")
      .select("user_id, roles")
      .eq("organization_id", organizationId)
      .eq("status", "active");
    const owner = (owners ?? []).find((row) =>
      ((row.roles as string[] | null) ?? []).includes("property_owner")
    );
    if (!owner?.user_id) {
      throw new Error("No property owner membership found — provide ownerUserId");
    }
    input.ownerUserId = owner.user_id as string;
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("user_id, display_name, contact_email, notification_preferences")
    .eq("user_id", input.ownerUserId)
    .maybeSingle();

  return {
    recipientUserId: input.ownerUserId,
    recipientEmail: (profile?.contact_email as string | null) ?? null,
    audienceLabel: (profile?.display_name as string | null) ?? "Owner",
    residentId: null,
    vendorId: null,
    ownerUserId: input.ownerUserId,
    propertyId: null
  };
}

export async function sendOperationalMessage(
  supabase: Db,
  organizationId: string,
  actorId: string,
  input: {
    audienceType: string;
    subject: string;
    body: string;
    channel?: string;
    residentId?: string;
    vendorId?: string;
    ownerUserId?: string;
    propertyId?: string;
  }
) {
  if (!isCommsAudienceType(input.audienceType)) {
    throw new Error("Invalid audience type");
  }
  const channel: CommsChannel =
    input.channel && isCommsChannel(input.channel) ? input.channel : "in_app";
  const subject = input.subject.trim();
  const body = input.body.trim();
  if (!subject || !body) {
    throw new Error("Subject and body are required");
  }

  const audience = await resolveAudience(supabase, organizationId, {
    audienceType: input.audienceType,
    ...(input.residentId ? { residentId: input.residentId } : {}),
    ...(input.vendorId ? { vendorId: input.vendorId } : {}),
    ...(input.ownerUserId ? { ownerUserId: input.ownerUserId } : {})
  });

  let deliveryStatus = "delivered";
  let emailProviderId: string | null = null;

  if ((channel === "email" || channel === "both") && audience.recipientEmail) {
    const emailResult = await sendOperationalNoticeEmail({
      to: audience.recipientEmail,
      subject,
      body,
      audienceLabel: audience.audienceLabel
    });
    if (emailResult.ok) {
      deliveryStatus = "email_sent";
      emailProviderId = emailResult.providerId;
    } else {
      deliveryStatus = channel === "email" ? "email_failed" : "delivered";
    }
  }

  const { data, error } = await supabase
    .from("comms_messages")
    .insert({
      organization_id: organizationId,
      audience_type: input.audienceType,
      subject,
      body,
      property_id: input.propertyId ?? audience.propertyId,
      resident_id: audience.residentId,
      vendor_id: audience.vendorId,
      owner_user_id: audience.ownerUserId,
      recipient_user_id: audience.recipientUserId,
      channel,
      delivery_status: deliveryStatus,
      email_provider_id: emailProviderId,
      created_by: actorId
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (audience.recipientUserId) {
    await supabase.from("comms_notifications").insert({
      organization_id: organizationId,
      user_id: audience.recipientUserId,
      message_id: data.id,
      notification_key: "comms.message.received",
      title: subject,
      body,
      href: "/shared/communications"
    });
  }

  await emitPropertyEvent({
    supabase,
    organizationId,
    actorId,
    eventType: "comms.message.sent",
    aggregateType: "comms_messages",
    aggregateId: data.id as string,
    payload: {
      audienceType: input.audienceType,
      subject,
      deliveryStatus,
      recipientUserId: audience.recipientUserId
    }
  });
  await writePropertyAudit({
    supabase,
    organizationId,
    actorId,
    action: "comms.message.sent",
    entityType: "comms_messages",
    entityId: data.id as string,
    payload: {
      audienceType: input.audienceType,
      subject,
      deliveryStatus
    }
  });

  return mapMessage(data as Record<string, unknown>, audience.audienceLabel);
}

export async function getCommunicationsReadiness(supabase: Db, organizationId: string) {
  const [{ count: messageCount }, { count: notificationCount }, { count: eventCount }] =
    await Promise.all([
      supabase
        .from("comms_messages")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId),
      supabase
        .from("comms_notifications")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId),
      supabase
        .from("event_domain_events")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .eq("event_type", "comms.message.sent")
    ]);

  const messagesSent = (messageCount ?? 0) > 0;
  return {
    messageCount: messageCount ?? 0,
    notificationCount: notificationCount ?? 0,
    sentEventCount: eventCount ?? 0,
    communicationsReady: messagesSent
  };
}
