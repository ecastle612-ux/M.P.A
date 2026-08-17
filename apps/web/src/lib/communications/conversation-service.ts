import type { SupabaseClient } from "@supabase/supabase-js";
import {
  conversationPreviewFromBody,
  defaultConversationSubject,
  isConversationLinkedEntityType,
  isConversationUnread,
  staffConversationHref,
  tenantConversationHref,
  validateConversationMessageContent,
  type ConversationInboxItem,
  type ConversationLinkedEntityType,
  type ConversationMessageRecord,
  type ConversationRecord,
  type ConversationSenderPlane
} from "@mpa/shared";
import { attachMediaToEntity, listMediaForEntity } from "../media/media-service";
import { emitPropertyEvent, writePropertyAudit } from "../property/events-audit";
import { sendOperationalNoticeEmail } from "./email";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = SupabaseClient<any>;

type ConversationRow = {
  id: string;
  organization_id: string;
  property_id: string;
  lease_id: string;
  tenant_account_id: string;
  subject: string;
  status: "open" | "closed";
  linked_entity_type: ConversationLinkedEntityType | null;
  linked_entity_id: string | null;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
  last_message_preview: string | null;
  last_sender_user_id: string | null;
};

function mapConversation(row: ConversationRow): ConversationRecord {
  return {
    id: row.id,
    organizationId: row.organization_id,
    propertyId: row.property_id,
    leaseId: row.lease_id,
    tenantAccountId: row.tenant_account_id,
    subject: row.subject,
    status: row.status,
    linkedEntityType: row.linked_entity_type,
    linkedEntityId: row.linked_entity_id,
    createdByUserId: row.created_by_user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastMessageAt: row.last_message_at,
    lastMessagePreview: row.last_message_preview
  };
}

export class ConversationServiceError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function assertPropertyInOrg(
  supabase: Db,
  organizationId: string,
  propertyId: string
) {
  const { data } = await supabase
    .from("property_properties")
    .select("id, organization_id, name")
    .eq("id", propertyId)
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (!data) {
    throw new ConversationServiceError("Property not found", 403);
  }
  return data as { id: string; organization_id: string; name: string };
}

export async function loadMessageableResident(
  supabase: Db,
  organizationId: string,
  tenantAccountId: string
) {
  const { data } = await supabase
    .from("pm_residents")
    .select("id, user_id, lease_id, property_id, unit_id, display_name, email, portal_status")
    .eq("id", tenantAccountId)
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (!data) {
    throw new ConversationServiceError("Tenant not found", 404);
  }
  if (!data.user_id || !data.lease_id || !data.property_id) {
    throw new ConversationServiceError("Active lease and tenant portal access are required", 400);
  }
  return data as {
    id: string;
    user_id: string;
    lease_id: string;
    property_id: string;
    unit_id: string | null;
    display_name: string | null;
    email: string | null;
    portal_status: string | null;
  };
}

async function findExistingConversation(
  supabase: Db,
  organizationId: string,
  tenantAccountId: string,
  linkedEntityType: ConversationLinkedEntityType | null,
  linkedEntityId: string | null
) {
  let query = supabase
    .from("comms_conversations")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("tenant_account_id", tenantAccountId);
  if (linkedEntityType && linkedEntityId) {
    query = query.eq("linked_entity_type", linkedEntityType).eq("linked_entity_id", linkedEntityId);
  } else {
    query = query.is("linked_entity_type", null).is("linked_entity_id", null);
  }
  const { data } = await query.maybeSingle();
  return (data as ConversationRow | null) ?? null;
}

async function upsertParticipant(input: {
  supabase: Db;
  conversationId: string;
  organizationId: string;
  userId: string;
  participantType: "tenant" | "staff";
  tenantAccountId?: string | null;
  lastReadAt?: string | null;
}) {
  const { data: existing } = await input.supabase
    .from("comms_conversation_participants")
    .select("id")
    .eq("conversation_id", input.conversationId)
    .eq("user_id", input.userId)
    .maybeSingle();
  if (existing) {
    if (input.lastReadAt) {
      await input.supabase
        .from("comms_conversation_participants")
        .update({ last_read_at: input.lastReadAt })
        .eq("id", existing.id);
    }
    return;
  }
  await input.supabase.from("comms_conversation_participants").insert({
    conversation_id: input.conversationId,
    organization_id: input.organizationId,
    participant_type: input.participantType,
    user_id: input.userId,
    tenant_account_id: input.tenantAccountId ?? null,
    last_read_at: input.lastReadAt ?? null
  });
}

async function emitConversationEvents(input: {
  supabase: Db;
  organizationId: string;
  actorId: string;
  eventType: string;
  conversation: ConversationRow;
  messageId?: string;
  payload?: Record<string, unknown>;
}) {
  const payload = {
    conversation_id: input.conversation.id,
    tenant_account_id: input.conversation.tenant_account_id,
    lease_id: input.conversation.lease_id,
    property_id: input.conversation.property_id,
    linked_entity_type: input.conversation.linked_entity_type,
    linked_entity_id: input.conversation.linked_entity_id,
    ...(input.messageId ? { message_id: input.messageId } : {}),
    ...input.payload
  };
  await emitPropertyEvent({
    supabase: input.supabase,
    organizationId: input.organizationId,
    actorId: input.actorId,
    eventType: input.eventType,
    aggregateType: "comms_conversations",
    aggregateId: input.conversation.id,
    payload
  });
  await emitPropertyEvent({
    supabase: input.supabase,
    organizationId: input.organizationId,
    actorId: input.actorId,
    eventType: input.eventType,
    aggregateType: "property_properties",
    aggregateId: input.conversation.property_id,
    payload
  });
  if (input.conversation.linked_entity_type === "work_order" && input.conversation.linked_entity_id) {
    await emitPropertyEvent({
      supabase: input.supabase,
      organizationId: input.organizationId,
      actorId: input.actorId,
      eventType: input.eventType,
      aggregateType: "maintenance_work_orders",
      aggregateId: input.conversation.linked_entity_id,
      payload
    });
  }
  await writePropertyAudit({
    supabase: input.supabase,
    organizationId: input.organizationId,
    actorId: input.actorId,
    action: input.eventType,
    entityType: "comms_conversations",
    entityId: input.conversation.id,
    payload
  });
}

async function notifyCounterparty(input: {
  supabase: Db;
  organizationId: string;
  userId: string;
  conversation: ConversationRow;
  title: string;
  preview: string;
  href: string;
  notificationKey: string;
  email?: string | null;
}) {
  await input.supabase.from("comms_notifications").insert({
    organization_id: input.organizationId,
    user_id: input.userId,
    message_id: null,
    conversation_id: input.conversation.id,
    notification_key: input.notificationKey,
    title: input.title,
    body: input.preview,
    href: input.href
  });
  if (input.email) {
    const emailResult = await sendOperationalNoticeEmail({
      to: input.email,
      subject: "New message from your property team",
      body: input.preview
        ? `${input.preview}\n\nOpen the message to read the full note and reply.`
        : "Your property team sent you a new message.",
      audienceLabel: "Conversation",
      ctaUrl: input.href,
      ctaLabel: "Open Message",
      idempotencyKey: `conversation:${input.notificationKey}`.slice(0, 256)
    });
    if (!emailResult.ok) {
      console.error(
        JSON.stringify({
          scope: "mpa.email",
          template: "conversation",
          status: "failed",
          error: emailResult.error,
          notificationKey: input.notificationKey
        })
      );
    }
  }
}

async function resolveLinkedWorkOrder(
  supabase: Db,
  organizationId: string,
  workOrderId: string,
  resident: { id: string; property_id: string }
) {
  const { data } = await supabase
    .from("maintenance_work_orders")
    .select("id, title, work_surface, resident_id, property_id, organization_id")
    .eq("id", workOrderId)
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (!data) {
    throw new ConversationServiceError("Work order not found", 404);
  }
  if (data.work_surface === "facility") {
    throw new ConversationServiceError("Facility work orders do not support tenant messaging", 403);
  }
  if (data.resident_id && data.resident_id !== resident.id) {
    throw new ConversationServiceError("Work order does not belong to this tenant", 403);
  }
  if (data.property_id && data.property_id !== resident.property_id) {
    throw new ConversationServiceError("Work order property does not match tenant", 403);
  }
  return data as { id: string; title: string };
}

export function assertCanAccessConversation(
  conversation: ConversationRow,
  actor: {
    organizationId: string;
    plane: "staff" | "tenant";
    tenantAccountId: string | null;
  }
) {
  if (conversation.organization_id !== actor.organizationId) {
    throw new ConversationServiceError("Forbidden", 403);
  }
  if (actor.plane === "tenant" && conversation.tenant_account_id !== actor.tenantAccountId) {
    throw new ConversationServiceError("Forbidden", 403);
  }
}

export async function loadConversation(
  supabase: Db,
  organizationId: string,
  conversationId: string
) {
  const { data } = await supabase
    .from("comms_conversations")
    .select("*")
    .eq("id", conversationId)
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (!data) {
    throw new ConversationServiceError("Conversation not found", 404);
  }
  return data as ConversationRow;
}

async function insertMessage(input: {
  supabase: Db;
  conversation: ConversationRow;
  senderUserId: string;
  senderPlane: ConversationSenderPlane;
  body: string;
  mediaIds: string[];
  linkedDocumentId?: string | null | undefined;
  idempotencyKey?: string | null | undefined;
}) {
  if (input.idempotencyKey) {
    const { data: existing } = await input.supabase
      .from("comms_conversation_messages")
      .select("*")
      .eq("organization_id", input.conversation.organization_id)
      .eq("idempotency_key", input.idempotencyKey)
      .maybeSingle();
    if (existing) {
      return existing as { id: string; created_at: string; body: string };
    }
  }

  const now = new Date().toISOString();
  const { data, error } = await input.supabase
    .from("comms_conversation_messages")
    .insert({
      conversation_id: input.conversation.id,
      organization_id: input.conversation.organization_id,
      sender_user_id: input.senderUserId,
      sender_plane: input.senderPlane,
      body: input.body,
      linked_document_id: input.linkedDocumentId ?? null,
      idempotency_key: input.idempotencyKey ?? null
    })
    .select("*")
    .single();
  if (error || !data) {
    throw new ConversationServiceError(error?.message ?? "Failed to send message", 400);
  }

  if (input.mediaIds.length > 0) {
    const attached = await attachMediaToEntity({
      supabase: input.supabase,
      organizationId: input.conversation.organization_id,
      userId: input.senderUserId,
      mediaIds: input.mediaIds,
      relatedEntityType: "conversation_message",
      relatedEntityId: data.id as string
    });
    if ("error" in attached) {
      throw new ConversationServiceError(attached.error, attached.status ?? 400);
    }
    await emitConversationEvents({
      supabase: input.supabase,
      organizationId: input.conversation.organization_id,
      actorId: input.senderUserId,
      eventType: "conversation.attachment.added",
      conversation: input.conversation,
      messageId: data.id as string,
      payload: { media_ids: input.mediaIds }
    });
  }

  const preview = conversationPreviewFromBody(input.body);
  const nextStatus = input.conversation.status === "closed" ? "open" : input.conversation.status;
  await input.supabase
    .from("comms_conversations")
    .update({
      last_message_at: now,
      last_message_preview: preview,
      last_sender_user_id: input.senderUserId,
      status: nextStatus,
      updated_at: now
    })
    .eq("id", input.conversation.id);

  return data as { id: string; created_at: string; body: string };
}

export async function startConversation(
  supabase: Db,
  organizationId: string,
  actorId: string,
  input: {
    tenantAccountId: string;
    body?: unknown;
    mediaIds?: unknown;
    subject?: string | undefined;
    linkedEntityType?: unknown;
    linkedEntityId?: string | undefined;
    linkedDocumentId?: string | undefined;
    idempotencyKey?: string | undefined;
  }
) {
  const content = validateConversationMessageContent({
    body: input.body,
    mediaIds: input.mediaIds
  });
  if (!content.ok) {
    throw new ConversationServiceError(content.error, 400);
  }

  const resident = await loadMessageableResident(supabase, organizationId, input.tenantAccountId);
  await assertPropertyInOrg(supabase, organizationId, resident.property_id);

  let linkedEntityType: ConversationLinkedEntityType | null = null;
  let linkedEntityId: string | null = null;
  let linkedLabel: string | null = null;
  if (input.linkedEntityType) {
    if (!isConversationLinkedEntityType(input.linkedEntityType) || !input.linkedEntityId) {
      throw new ConversationServiceError("Invalid linked entity", 400);
    }
    linkedEntityType = input.linkedEntityType;
    linkedEntityId = input.linkedEntityId;
    if (linkedEntityType === "work_order") {
      const workOrder = await resolveLinkedWorkOrder(supabase, organizationId, linkedEntityId, resident);
      linkedLabel = workOrder.title;
    } else if (linkedEntityType === "lease") {
      if (linkedEntityId !== resident.lease_id) {
        throw new ConversationServiceError("Lease does not belong to this tenant", 403);
      }
      linkedLabel = "Lease";
    } else if (linkedEntityType === "property") {
      if (linkedEntityId !== resident.property_id) {
        throw new ConversationServiceError("Property does not belong to this tenant", 403);
      }
    }
  }

  const existing = await findExistingConversation(
    supabase,
    organizationId,
    resident.id,
    linkedEntityType,
    linkedEntityId
  );
  if (existing) {
    return sendConversationMessage(supabase, organizationId, actorId, "staff", existing.id, {
      body: content.body,
      mediaIds: content.mediaIds,
      linkedDocumentId: input.linkedDocumentId,
      idempotencyKey: input.idempotencyKey
    });
  }

  const subject =
    input.subject?.trim() ||
    defaultConversationSubject({
      linkedEntityType,
      linkedEntityLabel: linkedLabel,
      firstMessageBody: content.body
    });
  const now = new Date().toISOString();
  const { data: created, error } = await supabase
    .from("comms_conversations")
    .insert({
      organization_id: organizationId,
      property_id: resident.property_id,
      lease_id: resident.lease_id,
      tenant_account_id: resident.id,
      subject,
      status: "open",
      linked_entity_type: linkedEntityType,
      linked_entity_id: linkedEntityId,
      created_by_user_id: actorId,
      created_at: now,
      updated_at: now
    })
    .select("*")
    .single();
  if (error || !created) {
    throw new ConversationServiceError(error?.message ?? "Failed to start conversation", 400);
  }
  const conversation = created as ConversationRow;

  await upsertParticipant({
    supabase,
    conversationId: conversation.id,
    organizationId,
    userId: resident.user_id,
    participantType: "tenant",
    tenantAccountId: resident.id
  });
  await upsertParticipant({
    supabase,
    conversationId: conversation.id,
    organizationId,
    userId: actorId,
    participantType: "staff",
    lastReadAt: now
  });

  const message = await insertMessage({
    supabase,
    conversation,
    senderUserId: actorId,
    senderPlane: "staff",
    body: content.body,
    mediaIds: content.mediaIds,
    linkedDocumentId: input.linkedDocumentId,
    idempotencyKey: input.idempotencyKey
  });

  const refreshed = await loadConversation(supabase, organizationId, conversation.id);
  await emitConversationEvents({
    supabase,
    organizationId,
    actorId,
    eventType: "conversation.started",
    conversation: refreshed,
    messageId: message.id
  });
  await emitConversationEvents({
    supabase,
    organizationId,
    actorId,
    eventType: "conversation.message.sent",
    conversation: refreshed,
    messageId: message.id,
    payload: { sender_plane: "staff", has_attachments: content.mediaIds.length > 0 }
  });

  await notifyCounterparty({
    supabase,
    organizationId,
    userId: resident.user_id,
    conversation: refreshed,
    title: refreshed.subject,
    preview: conversationPreviewFromBody(content.body),
    href: tenantConversationHref(refreshed.id),
    notificationKey: `conversation.message.sent:${message.id}`,
    email: resident.email
  });

  return { conversation: mapConversation(refreshed), messageId: message.id };
}

export async function sendConversationMessage(
  supabase: Db,
  organizationId: string,
  actorId: string,
  plane: ConversationSenderPlane,
  conversationId: string,
  input: {
    body?: unknown;
    mediaIds?: unknown;
    linkedDocumentId?: string | undefined;
    idempotencyKey?: string | undefined;
    tenantAccountId?: string | null;
  }
) {
  const content = validateConversationMessageContent({
    body: input.body,
    mediaIds: input.mediaIds
  });
  if (!content.ok) {
    throw new ConversationServiceError(content.error, 400);
  }
  const conversation = await loadConversation(supabase, organizationId, conversationId);
  await assertCanAccessConversation(conversation, {
    organizationId,
    plane,
    tenantAccountId: input.tenantAccountId ?? null
  });
  await assertPropertyInOrg(supabase, organizationId, conversation.property_id);

  const now = new Date().toISOString();
  const wasClosed = conversation.status === "closed";
  await upsertParticipant({
    supabase,
    conversationId: conversation.id,
    organizationId,
    userId: actorId,
    participantType: plane,
    tenantAccountId: plane === "tenant" ? conversation.tenant_account_id : null,
    lastReadAt: now
  });

  const message = await insertMessage({
    supabase,
    conversation,
    senderUserId: actorId,
    senderPlane: plane,
    body: content.body,
    mediaIds: content.mediaIds,
    linkedDocumentId: input.linkedDocumentId,
    idempotencyKey: input.idempotencyKey
  });
  const refreshed = await loadConversation(supabase, organizationId, conversation.id);
  if (wasClosed) {
    await emitConversationEvents({
      supabase,
      organizationId,
      actorId,
      eventType: "conversation.reopened",
      conversation: refreshed,
      messageId: message.id
    });
  }
  await emitConversationEvents({
    supabase,
    organizationId,
    actorId,
    eventType: "conversation.message.sent",
    conversation: refreshed,
    messageId: message.id,
    payload: { sender_plane: plane, has_attachments: content.mediaIds.length > 0 }
  });

  if (plane === "staff") {
    const { data: resident } = await supabase
      .from("pm_residents")
      .select("user_id, email")
      .eq("id", conversation.tenant_account_id)
      .maybeSingle();
    if (resident?.user_id) {
      await notifyCounterparty({
        supabase,
        organizationId,
        userId: resident.user_id as string,
        conversation: refreshed,
        title: refreshed.subject,
        preview: conversationPreviewFromBody(content.body),
        href: tenantConversationHref(refreshed.id),
        notificationKey: `conversation.message.sent:${message.id}`,
        email: (resident.email as string | null) ?? null
      });
    }
  } else {
    const { data: participants } = await supabase
      .from("comms_conversation_participants")
      .select("user_id, participant_type")
      .eq("conversation_id", conversation.id)
      .eq("participant_type", "staff");
    const staffIds = new Set<string>([conversation.created_by_user_id]);
    for (const row of participants ?? []) {
      staffIds.add(row.user_id as string);
    }
    staffIds.delete(actorId);
    for (const staffId of staffIds) {
      await notifyCounterparty({
        supabase,
        organizationId,
        userId: staffId,
        conversation: refreshed,
        title: refreshed.subject,
        preview: conversationPreviewFromBody(content.body),
        href: staffConversationHref(refreshed.id),
        notificationKey: `conversation.message.sent:${message.id}:${staffId}`
      });
    }
  }

  return { conversation: mapConversation(refreshed), messageId: message.id };
}

export async function markConversationRead(
  supabase: Db,
  organizationId: string,
  actorId: string,
  plane: ConversationSenderPlane,
  conversationId: string,
  tenantAccountId?: string | null
) {
  const conversation = await loadConversation(supabase, organizationId, conversationId);
  await assertCanAccessConversation(conversation, {
    organizationId,
    plane,
    tenantAccountId: tenantAccountId ?? null
  });
  const now = new Date().toISOString();
  await upsertParticipant({
    supabase,
    conversationId: conversation.id,
    organizationId,
    userId: actorId,
    participantType: plane,
    tenantAccountId: plane === "tenant" ? conversation.tenant_account_id : null,
    lastReadAt: now
  });

  const { data: messages } = await supabase
    .from("comms_conversation_messages")
    .select("id, sender_user_id")
    .eq("conversation_id", conversation.id)
    .is("hidden_at", null);
  for (const message of messages ?? []) {
    if (message.sender_user_id === actorId) continue;
    await supabase.from("comms_message_reads").upsert(
      {
        message_id: message.id,
        user_id: actorId,
        organization_id: organizationId,
        read_at: now
      },
      { onConflict: "message_id,user_id" }
    );
  }

  const { error: notificationError } = await supabase
    .from("comms_notifications")
    .update({ read_at: now })
    .eq("organization_id", organizationId)
    .eq("user_id", actorId)
    .eq("conversation_id", conversation.id)
    .is("read_at", null);
  if (notificationError) {
    throw new ConversationServiceError(notificationError.message, 400);
  }

  await emitConversationEvents({
    supabase,
    organizationId,
    actorId,
    eventType: "conversation.read",
    conversation,
    payload: { last_read_at: now }
  });
  return { ok: true, lastReadAt: now };
}

export async function closeConversation(
  supabase: Db,
  organizationId: string,
  actorId: string,
  conversationId: string
) {
  const conversation = await loadConversation(supabase, organizationId, conversationId);
  await assertPropertyInOrg(supabase, organizationId, conversation.property_id);
  const now = new Date().toISOString();
  await supabase
    .from("comms_conversations")
    .update({ status: "closed", updated_at: now })
    .eq("id", conversation.id);
  const refreshed = await loadConversation(supabase, organizationId, conversation.id);
  await emitConversationEvents({
    supabase,
    organizationId,
    actorId,
    eventType: "conversation.closed",
    conversation: refreshed
  });
  return { conversation: mapConversation(refreshed) };
}

export async function listConversationInbox(
  supabase: Db,
  organizationId: string,
  actor: { userId: string; plane: ConversationSenderPlane; tenantAccountId: string | null }
): Promise<ConversationInboxItem[]> {
  let query = supabase
    .from("comms_conversations")
    .select("*")
    .eq("organization_id", organizationId)
    .order("last_message_at", { ascending: false, nullsFirst: false });
  if (actor.plane === "tenant") {
    if (!actor.tenantAccountId) return [];
    query = query.eq("tenant_account_id", actor.tenantAccountId);
  }
  const { data, error } = await query.limit(100);
  if (error) throw new ConversationServiceError(error.message, 400);
  const rows = (data ?? []) as ConversationRow[];
  if (rows.length === 0) return [];

  const conversationIds = rows.map((row) => row.id);
  const tenantIds = Array.from(new Set(rows.map((row) => row.tenant_account_id)));
  const propertyIds = Array.from(new Set(rows.map((row) => row.property_id)));

  const [{ data: participants }, { data: residents }, { data: properties }] = await Promise.all([
    supabase
      .from("comms_conversation_participants")
      .select("conversation_id, last_read_at")
      .eq("user_id", actor.userId)
      .in("conversation_id", conversationIds),
    supabase.from("pm_residents").select("id, display_name, unit_id").in("id", tenantIds),
    supabase.from("property_properties").select("id, name").in("id", propertyIds)
  ]);

  const unitIds = (residents ?? [])
    .map((row) => row.unit_id as string | null)
    .filter((id): id is string => Boolean(id));
  const { data: units } =
    unitIds.length > 0
      ? await supabase.from("property_units").select("id, unit_label").in("id", unitIds)
      : { data: [] as Array<{ id: string; unit_label: string }> };

  const readByConversation = new Map(
    (participants ?? []).map((row) => [row.conversation_id as string, row.last_read_at as string | null])
  );
  const residentById = new Map((residents ?? []).map((row) => [row.id as string, row]));
  const propertyById = new Map((properties ?? []).map((row) => [row.id as string, row.name as string]));
  const unitById = new Map((units ?? []).map((row) => [row.id as string, row.unit_label as string]));

  return rows.map((row) => {
    const resident = residentById.get(row.tenant_account_id);
    return {
      ...mapConversation(row),
      unread: isConversationUnread({
        lastMessageAt: row.last_message_at,
        lastReadAt: readByConversation.get(row.id) ?? null,
        lastSenderUserId: row.last_sender_user_id,
        viewerUserId: actor.userId
      }),
      tenantDisplayName: (resident?.display_name as string | null) ?? null,
      propertyName: propertyById.get(row.property_id) ?? null,
      unitLabel: resident?.unit_id ? (unitById.get(resident.unit_id as string) ?? null) : null,
      linkedEntityLabel:
        row.linked_entity_type === "work_order"
          ? "Work order"
          : row.linked_entity_type === "lease"
            ? "Lease"
            : row.linked_entity_type === "property"
              ? "Property"
              : null
    };
  });
}

export async function getConversationThread(
  supabase: Db,
  organizationId: string,
  actor: { userId: string; plane: ConversationSenderPlane; tenantAccountId: string | null },
  conversationId: string
) {
  const conversation = await loadConversation(supabase, organizationId, conversationId);
  await assertCanAccessConversation(conversation, {
    organizationId,
    plane: actor.plane,
    tenantAccountId: actor.tenantAccountId
  });
  await assertPropertyInOrg(supabase, organizationId, conversation.property_id);

  let messageQuery = supabase
    .from("comms_conversation_messages")
    .select("*")
    .eq("conversation_id", conversation.id)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true })
    .limit(50);
  if (actor.plane === "tenant") {
    messageQuery = messageQuery.is("hidden_at", null);
  }
  const { data: messageRows, error } = await messageQuery;
  if (error) throw new ConversationServiceError(error.message, 400);
  const messages = messageRows ?? [];
  const messageIds = messages.map((row) => row.id as string);

  const [{ data: reads }, { data: staffProfiles }, { data: resident }] = await Promise.all([
    messageIds.length
      ? supabase.from("comms_message_reads").select("message_id, user_id").in("message_id", messageIds)
      : Promise.resolve({ data: [] as Array<{ message_id: string; user_id: string }> }),
    supabase
      .from("user_profiles")
      .select("user_id, display_name")
      .in("user_id", Array.from(new Set(messages.map((row) => row.sender_user_id as string)))),
    supabase
      .from("pm_residents")
      .select("id, display_name")
      .eq("id", conversation.tenant_account_id)
      .maybeSingle()
  ]);

  const profileByUser = new Map(
    (staffProfiles ?? []).map((row) => [row.user_id as string, row.display_name as string | null])
  );
  const readsByMessage = new Map<string, string[]>();
  for (const read of reads ?? []) {
    const list = readsByMessage.get(read.message_id as string) ?? [];
    list.push(read.user_id as string);
    readsByMessage.set(read.message_id as string, list);
  }

  const mapped: ConversationMessageRecord[] = [];
  for (const row of messages) {
    const media = await listMediaForEntity({
      supabase,
      organizationId,
      relatedEntityType: "conversation_message",
      relatedEntityId: row.id as string
    });
    const readerIds = readsByMessage.get(row.id as string) ?? [];
    const counterpartyRead =
      row.sender_plane === "staff"
        ? readerIds.some((id) => id !== row.sender_user_id)
        : readerIds.some((id) => id !== row.sender_user_id);
    const senderName =
      row.sender_plane === "tenant"
        ? ((resident?.display_name as string | null) ?? "Resident")
        : (profileByUser.get(row.sender_user_id as string) ?? "Property team");
    mapped.push({
      id: row.id as string,
      conversationId: conversation.id,
      organizationId,
      senderUserId: row.sender_user_id as string,
      senderPlane: row.sender_plane as ConversationSenderPlane,
      senderDisplayName: senderName,
      body: row.body as string,
      linkedDocumentId: (row.linked_document_id as string | null) ?? null,
      createdAt: row.created_at as string,
      hiddenAt: (row.hidden_at as string | null) ?? null,
      hiddenBy: (row.hidden_by as string | null) ?? null,
      readByCounterparty: counterpartyRead,
      attachmentCount: media.length
    });
  }

  const inbox = await listConversationInbox(supabase, organizationId, actor);
  const item = inbox.find((row) => row.id === conversation.id);
  return {
    conversation: item ?? {
      ...mapConversation(conversation),
      unread: false,
      tenantDisplayName: (resident?.display_name as string | null) ?? null,
      propertyName: null,
      unitLabel: null,
      linkedEntityLabel: null
    },
    messages: mapped
  };
}

export async function listMessageableTenants(supabase: Db, organizationId: string) {
  const { data, error } = await supabase
    .from("pm_residents")
    .select("id, display_name, email, property_id, lease_id, user_id, unit_id")
    .eq("organization_id", organizationId)
    .not("user_id", "is", null)
    .not("lease_id", "is", null)
    .order("display_name")
    .limit(100);
  if (error) throw new ConversationServiceError(error.message, 400);
  return (data ?? []).map((row) => ({
    id: row.id as string,
    label: (row.display_name as string | null) ?? "Resident",
    detail: (row.email as string | null) ?? null,
    propertyId: row.property_id as string | null,
    leaseId: row.lease_id as string | null
  }));
}

export async function canReadConversationMessageMedia(
  supabase: Db,
  actor: { organizationId: string; plane: ConversationSenderPlane; tenantAccountId: string | null },
  messageId: string | null
): Promise<boolean> {
  if (!messageId) return actor.plane === "staff" || actor.plane === "tenant";
  const { data: message } = await supabase
    .from("comms_conversation_messages")
    .select("id, conversation_id, organization_id")
    .eq("id", messageId)
    .eq("organization_id", actor.organizationId)
    .maybeSingle();
  if (!message) return false;
  try {
    const conversation = await loadConversation(
      supabase,
      actor.organizationId,
      message.conversation_id as string
    );
    await assertCanAccessConversation(conversation, actor);
    return true;
  } catch {
    return false;
  }
}
