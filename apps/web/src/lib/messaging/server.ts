import { assertThreadMessageable, nextThreadStatusAfterMessage } from "./events";
import { createAuthServerComponentClient } from "../auth/server";
import { createInAppNotification } from "../notifications/server";
import type { Json } from "@mpa/supabase";
import type {
  CommunicationMessageRecord,
  ConversationParticipantRecord,
  ConversationThreadRecord,
  CreateMessageInput,
  CreateThreadFromSourceInput,
  MessageVisibility,
  ParticipantRole,
  SourceEntityType,
  ThreadListOptions,
  ThreadMutationInput,
  ThreadStatus,
  ThreadType
} from "./contracts";

type ThreadRow = {
  id: string;
  organization_id: string;
  thread_type: ThreadType;
  source_entity_type: SourceEntityType;
  source_entity_id: string | null;
  property_id: string | null;
  unit_id: string | null;
  status: ThreadStatus;
  subject: string;
  last_message_at: string | null;
  metadata: Json | null;
  created_at: string;
  updated_at: string;
};

type MessageRow = {
  id: string;
  organization_id: string;
  thread_id: string;
  sender_id: string;
  body: string;
  visibility: CommunicationMessageRecord["visibility"];
  delivery_status: CommunicationMessageRecord["deliveryStatus"];
  metadata: Json | null;
  created_at: string;
  updated_at: string;
};

type SupabaseClientType = Awaited<ReturnType<typeof createAuthServerComponentClient>>;
type MessagingDbClient = {
  from: (table: string) => ReturnType<SupabaseClientType["from"]>;
};

function messagingDb(client: SupabaseClientType): MessagingDbClient {
  return client as unknown as MessagingDbClient;
}

const THREAD_SELECT =
  "id, organization_id, thread_type, source_entity_type, source_entity_id, property_id, unit_id, status, subject, last_message_at, metadata, created_at, updated_at";

const MESSAGE_SELECT =
  "id, organization_id, thread_id, sender_id, body, visibility, delivery_status, metadata, created_at, updated_at";

export type ThreadListItem = ConversationThreadRecord & {
  unreadCount: number;
  lastMessagePreview: string | null;
  propertyName: string | null;
  unitNumber: string | null;
  pinned: boolean;
  muted: boolean;
};

export type ThreadDetail = ThreadListItem & {
  participants: ConversationParticipantRecord[];
  messages: CommunicationMessageRecord[];
};

export type MessagingDashboardMetrics = {
  unreadMessages: number;
  awaitingResidentReply: number;
  vendorReplies: number;
  emergencyUnread: number;
  pendingConversations: number;
  recentThreads: Array<{
    id: string;
    subject: string;
    threadType: ThreadType;
    status: ThreadStatus;
    timestamp: string;
    href: string;
  }>;
};

function toThreadRecord(row: ThreadRow): ConversationThreadRecord {
  return {
    id: row.id,
    organizationId: row.organization_id,
    threadType: row.thread_type,
    sourceEntityType: row.source_entity_type,
    sourceEntityId: row.source_entity_id,
    propertyId: row.property_id,
    unitId: row.unit_id,
    status: row.status,
    subject: row.subject,
    lastMessageAt: row.last_message_at,
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function toMessageRecord(row: MessageRow): CommunicationMessageRecord {
  return {
    id: row.id,
    organizationId: row.organization_id,
    threadId: row.thread_id,
    senderId: row.sender_id,
    body: row.body,
    visibility: row.visibility,
    deliveryStatus: row.delivery_status,
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function toParticipantRecord(row: Record<string, unknown>): ConversationParticipantRecord {
  return {
    id: row["id"] as string,
    organizationId: row["organization_id"] as string,
    threadId: row["thread_id"] as string,
    userId: row["user_id"] as string,
    participantRole: row["participant_role"] as ParticipantRole,
    lastReadAt: (row["last_read_at"] as string | null) ?? null,
    muted: row["muted"] as boolean,
    pinned: row["pinned"] as boolean,
    createdAt: row["created_at"] as string,
    updatedAt: row["updated_at"] as string
  };
}

function buildMessageMetadata(input: { attachmentDocumentIds?: string[] }): Json {
  const metadata: Record<string, Json> = {};
  if (input.attachmentDocumentIds && input.attachmentDocumentIds.length > 0) {
    metadata["attachment_document_ids"] = input.attachmentDocumentIds;
  }
  return metadata;
}

function escapeLike(value: string): string {
  return value.replace(/[%_\\]/g, "\\$&");
}

async function resolveClient(client?: MessagingDbClient | SupabaseClientType): Promise<MessagingDbClient> {
  if (client && typeof client === "object" && "from" in client && !("auth" in client)) {
    return client as MessagingDbClient;
  }
  const supabase = (client as SupabaseClientType | undefined) ?? (await createAuthServerComponentClient());
  return messagingDb(supabase);
}

export async function getThreadBySourceEntity(
  organizationId: string,
  sourceEntityType: SourceEntityType,
  sourceEntityId: string,
  client?: MessagingDbClient | SupabaseClientType
): Promise<ConversationThreadRecord | null> {
  const db = await resolveClient(client);
  const { data, error } = await db
    .from("conversation_threads")
    .select(THREAD_SELECT)
    .eq("organization_id", organizationId)
    .eq("source_entity_type", sourceEntityType)
    .eq("source_entity_id", sourceEntityId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error || !data) return null;
  return toThreadRecord(data as ThreadRow);
}

export async function createThreadFromSource(
  organizationId: string,
  userId: string,
  input: CreateThreadFromSourceInput,
  client?: MessagingDbClient | SupabaseClientType
): Promise<ThreadDetail> {
  const db = await resolveClient(client);

  if (input.sourceEntityId) {
    const existing = await getThreadBySourceEntity(
      organizationId,
      input.sourceEntityType,
      input.sourceEntityId,
      db
    );
    if (existing) {
      const detail = await getThreadForOrganization(organizationId, existing.id, userId, db);
      if (detail) return detail;
    }
  }

  const { data: threadRow, error: threadError } = await db
    .from("conversation_threads")
    .insert({
      organization_id: organizationId,
      thread_type: input.threadType,
      source_entity_type: input.sourceEntityType,
      source_entity_id: input.sourceEntityId ?? null,
      property_id: input.propertyId ?? null,
      unit_id: input.unitId ?? null,
      status: "active",
      subject: input.subject,
      created_by: userId,
      updated_by: userId
    })
    .select(THREAD_SELECT)
    .single();

  if (threadError || !threadRow) {
    throw new Error(threadError?.message ?? "Thread creation failed");
  }

  const thread = toThreadRecord(threadRow as ThreadRow);
  const participantRows = input.participants.map((participant) => ({
    organization_id: organizationId,
    thread_id: thread.id,
    user_id: participant.userId,
    participant_role: participant.participantRole,
    created_by: userId,
    updated_by: userId
  }));

  const { error: participantError } = await db.from("conversation_participants").insert(participantRows);
  if (participantError) {
    throw new Error(participantError.message);
  }

  if (input.initialMessage) {
    await createMessageInThread(organizationId, thread.id, userId, input.initialMessage, db);
  }

  const detail = await getThreadForOrganization(organizationId, thread.id, userId, db);
  if (!detail) throw new Error("Thread detail unavailable after creation");
  return detail;
}

export async function getThreadsForOrganization(
  organizationId: string,
  userId: string,
  options: ThreadListOptions = {},
  client?: MessagingDbClient | SupabaseClientType
): Promise<ThreadListItem[]> {
  const db = await resolveClient(client);
  let query = db
    .from("conversation_threads")
    .select(THREAD_SELECT)
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .order("last_message_at", { ascending: false, nullsFirst: false });

  if (options.status && options.status !== "all") query = query.eq("status", options.status);
  if (options.threadType && options.threadType !== "all") query = query.eq("thread_type", options.threadType);
  if (options.propertyId) query = query.eq("property_id", options.propertyId);
  const search = options.search?.trim();
  if (search) {
    const escaped = escapeLike(search);
    query = query.or(`subject.ilike.%${escaped}%`);
  }
  if (options.limit) query = query.limit(options.limit);
  if (options.offset) query = query.range(options.offset, options.offset + (options.limit ?? 50) - 1);

  const { data: threadRows, error } = await query;
  if (error) throw new Error(error.message);

  const threads = (threadRows ?? []) as ThreadRow[];
  if (threads.length === 0) return [];

  const threadIds = threads.map((row) => row.id);
  const propertyIds = [...new Set(threads.map((row) => row.property_id).filter(Boolean))] as string[];
  const unitIds = [...new Set(threads.map((row) => row.unit_id).filter(Boolean))] as string[];

  const [{ data: participantRows }, { data: messageRows }, { data: propertyRows }, { data: unitRows }] =
    await Promise.all([
      db
        .from("conversation_participants")
        .select("id, organization_id, thread_id, user_id, participant_role, last_read_at, muted, pinned, created_at, updated_at")
        .eq("organization_id", organizationId)
        .in("thread_id", threadIds),
      db
        .from("communication_messages")
        .select(`${MESSAGE_SELECT}, thread_id`)
        .eq("organization_id", organizationId)
        .in("thread_id", threadIds)
        .is("deleted_at", null)
        .order("created_at", { ascending: false }),
      propertyIds.length > 0
        ? db.from("properties").select("id, name").eq("organization_id", organizationId).in("id", propertyIds)
        : Promise.resolve({ data: [] }),
      unitIds.length > 0
        ? db.from("units").select("id, unit_number").eq("organization_id", organizationId).in("id", unitIds)
        : Promise.resolve({ data: [] })
    ]);

  const propertyMap = new Map(
    ((propertyRows ?? []) as Array<{ id: string; name: string }>).map((row) => [row.id, row.name])
  );
  const unitMap = new Map(
    ((unitRows ?? []) as Array<{ id: string; unit_number: string }>).map((row) => [row.id, row.unit_number])
  );
  const participantsByThread = new Map<string, ConversationParticipantRecord[]>();
  for (const row of participantRows ?? []) {
    const participant = toParticipantRecord(row as Record<string, unknown>);
    const list = participantsByThread.get(participant.threadId) ?? [];
    list.push(participant);
    participantsByThread.set(participant.threadId, list);
  }

  const latestMessageByThread = new Map<string, CommunicationMessageRecord>();
  for (const row of (messageRows ?? []) as MessageRow[]) {
    if (!latestMessageByThread.has(row.thread_id)) {
      latestMessageByThread.set(row.thread_id, toMessageRecord(row));
    }
  }

  const userParticipantByThread = new Map(
    ((participantRows ?? []) as Array<{ thread_id: string; user_id: string; muted: boolean; pinned: boolean; last_read_at: string | null }>)
      .filter((row) => row.user_id === userId)
      .map((row) => [row.thread_id, row])
  );

  return threads.map((row) => {
    const thread = toThreadRecord(row);
    const latestMessage = latestMessageByThread.get(thread.id) ?? null;
    const selfParticipant = userParticipantByThread.get(thread.id);
    const lastReadAt = selfParticipant?.last_read_at ?? null;
    const unreadCount = ((messageRows ?? []) as Array<MessageRow & { thread_id: string }>).filter((messageRow) => {
      if (messageRow.thread_id !== thread.id) return false;
      if (messageRow.sender_id === userId) return false;
      if (!lastReadAt) return true;
      return messageRow.created_at > lastReadAt;
    }).length;

    return {
      ...thread,
      unreadCount,
      lastMessagePreview: latestMessage?.body.slice(0, 120) ?? null,
      propertyName: thread.propertyId ? (propertyMap.get(thread.propertyId) ?? null) : null,
      unitNumber: thread.unitId ? (unitMap.get(thread.unitId) ?? null) : null,
      pinned: selfParticipant?.pinned ?? false,
      muted: selfParticipant?.muted ?? false
    };
  });
}

export async function getThreadForOrganization(
  organizationId: string,
  threadId: string,
  userId: string,
  client?: MessagingDbClient | SupabaseClientType
): Promise<ThreadDetail | null> {
  const db = await resolveClient(client);
  const { data: threadRow, error } = await db
    .from("conversation_threads")
    .select(THREAD_SELECT)
    .eq("organization_id", organizationId)
    .eq("id", threadId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error || !threadRow) return null;

  const thread = toThreadRecord(threadRow as ThreadRow);
  const [{ data: participantRows }, { data: messageRows }, propertyResult, unitResult] = await Promise.all([
    db
      .from("conversation_participants")
      .select("id, organization_id, thread_id, user_id, participant_role, last_read_at, muted, pinned, created_at, updated_at")
      .eq("organization_id", organizationId)
      .eq("thread_id", threadId),
    db
      .from("communication_messages")
      .select(MESSAGE_SELECT)
      .eq("organization_id", organizationId)
      .eq("thread_id", threadId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true }),
    thread.propertyId
      ? db.from("properties").select("name").eq("organization_id", organizationId).eq("id", thread.propertyId).maybeSingle()
      : Promise.resolve({ data: null }),
    thread.unitId
      ? db.from("units").select("unit_number").eq("organization_id", organizationId).eq("id", thread.unitId).maybeSingle()
      : Promise.resolve({ data: null })
  ]);

  const participants = (participantRows ?? []).map((row: Record<string, unknown>) => toParticipantRecord(row));
  const messages = ((messageRows ?? []) as MessageRow[]).map(toMessageRecord);
  const selfParticipant = participants.find((participant: ConversationParticipantRecord) => participant.userId === userId);
  const unreadCount = messages.filter((message) => {
    if (message.senderId === userId) return false;
    if (!selfParticipant?.lastReadAt) return true;
    return message.createdAt > selfParticipant.lastReadAt;
  }).length;
  const latestMessage = messages.at(-1) ?? null;

  return {
    ...thread,
    unreadCount,
    lastMessagePreview: latestMessage?.body.slice(0, 120) ?? null,
    propertyName: (propertyResult.data as { name?: string } | null)?.name ?? null,
    unitNumber: (unitResult.data as { unit_number?: string } | null)?.unit_number ?? null,
    pinned: selfParticipant?.pinned ?? false,
    muted: selfParticipant?.muted ?? false,
    participants,
    messages
  };
}

export async function createMessageInThread(
  organizationId: string,
  threadId: string,
  userId: string,
  input: CreateMessageInput,
  client?: MessagingDbClient | SupabaseClientType
): Promise<CommunicationMessageRecord> {
  const db = await resolveClient(client);
  const { data: threadRow, error: threadError } = await db
    .from("conversation_threads")
    .select("id, status, subject")
    .eq("organization_id", organizationId)
    .eq("id", threadId)
    .is("deleted_at", null)
    .maybeSingle();
  if (threadError || !threadRow) throw new Error("Conversation thread not found");
  assertThreadMessageable((threadRow as { status: ThreadStatus }).status);

  const visibility: MessageVisibility = input.visibility ?? "resident";
  const now = new Date().toISOString();
  const { data: messageRow, error: messageError } = await db
    .from("communication_messages")
    .insert({
      organization_id: organizationId,
      thread_id: threadId,
      sender_id: userId,
      body: input.body,
      visibility,
      delivery_status: "sent",
      metadata: buildMessageMetadata(input),
      created_by: userId,
      updated_by: userId
    })
    .select(MESSAGE_SELECT)
    .single();
  if (messageError || !messageRow) throw new Error(messageError?.message ?? "Message creation failed");

  await db
    .from("conversation_threads")
    .update({
      status: nextThreadStatusAfterMessage((threadRow as { status: ThreadStatus }).status),
      last_message_at: now,
      updated_by: userId,
      updated_at: now
    })
    .eq("organization_id", organizationId)
    .eq("id", threadId);

  const { data: participants } = await db
    .from("conversation_participants")
    .select("user_id")
    .eq("organization_id", organizationId)
    .eq("thread_id", threadId)
    .neq("user_id", userId);

  await Promise.all(
    ((participants ?? []) as Array<{ user_id: string }>).map((participant) =>
      createInAppNotification(
        organizationId,
        userId,
        {
          userId: participant.user_id,
          category: "message",
          title: "New message",
          body: `${(threadRow as { subject: string }).subject}: ${input.body.slice(0, 120)}`,
          href: `/communications/threads/${threadId}`,
          sourceEntityType: "conversation_thread",
          sourceEntityId: threadId
        },
        db
      ).catch(() => undefined)
    )
  );

  return toMessageRecord(messageRow as MessageRow);
}

export async function mutateThread(
  organizationId: string,
  threadId: string,
  userId: string,
  input: ThreadMutationInput,
  client?: MessagingDbClient | SupabaseClientType
): Promise<ThreadDetail | null> {
  const db = await resolveClient(client);
  const now = new Date().toISOString();

  switch (input.action) {
    case "archive":
      await db
        .from("conversation_threads")
        .update({ status: "archived", archived_at: now, archived_by: userId, updated_by: userId, updated_at: now })
        .eq("organization_id", organizationId)
        .eq("id", threadId);
      break;
    case "resolve":
      await db
        .from("conversation_threads")
        .update({ status: "resolved", updated_by: userId, updated_at: now })
        .eq("organization_id", organizationId)
        .eq("id", threadId);
      break;
    case "mark_read":
      await db
        .from("conversation_participants")
        .update({ last_read_at: now, updated_by: userId, updated_at: now })
        .eq("organization_id", organizationId)
        .eq("thread_id", threadId)
        .eq("user_id", userId);
      await db
        .from("conversation_threads")
        .update({ status: "read", updated_by: userId, updated_at: now })
        .eq("organization_id", organizationId)
        .eq("id", threadId);
      break;
    case "pin":
      await db
        .from("conversation_participants")
        .update({ pinned: input.pinned, updated_by: userId, updated_at: now })
        .eq("organization_id", organizationId)
        .eq("thread_id", threadId)
        .eq("user_id", userId);
      break;
    case "mute":
      await db
        .from("conversation_participants")
        .update({ muted: input.muted, updated_by: userId, updated_at: now })
        .eq("organization_id", organizationId)
        .eq("thread_id", threadId)
        .eq("user_id", userId);
      break;
  }

  return getThreadForOrganization(organizationId, threadId, userId, db);
}

export async function ensureMaintenanceThread(
  organizationId: string,
  userId: string,
  workOrder: {
    id: string;
    workOrderNumber: string;
    title: string;
    propertyId: string;
    unitId: string | null;
    tenantId: string | null;
  },
  client?: MessagingDbClient | SupabaseClientType
): Promise<ConversationThreadRecord> {
  const db = await resolveClient(client);
  const existing = await getThreadBySourceEntity(organizationId, "maintenance", workOrder.id, db);
  if (existing) return existing;

  const participants: CreateThreadFromSourceInput["participants"] = [{ userId, participantRole: "pm" }];
  if (workOrder.tenantId) {
    const { data: tenantRow } = await db
      .from("tenants")
      .select("email")
      .eq("organization_id", organizationId)
      .eq("id", workOrder.tenantId)
      .maybeSingle();
    if (tenantRow?.email) {
      const { data: profileRow } = await db
        .from("user_profiles")
        .select("user_id")
        .eq("email", tenantRow.email)
        .maybeSingle();
      if (profileRow?.user_id) {
        participants.push({ userId: profileRow.user_id as string, participantRole: "resident" });
      }
    }
  }

  const detail = await createThreadFromSource(
    organizationId,
    userId,
    {
      threadType: "resident_maintenance",
      sourceEntityType: "maintenance",
      sourceEntityId: workOrder.id,
      propertyId: workOrder.propertyId,
      unitId: workOrder.unitId,
      subject: `${workOrder.workOrderNumber} · ${workOrder.title}`,
      participants,
      initialMessage: {
        body: `Work order ${workOrder.workOrderNumber} opened. Use this thread for resident updates and coordination.`,
        visibility: "resident"
      }
    },
    db
  );
  return detail;
}

export async function getMessagingDashboardMetrics(
  organizationId: string,
  userId: string,
  client?: MessagingDbClient | SupabaseClientType
): Promise<MessagingDashboardMetrics> {
  const threads = await getThreadsForOrganization(organizationId, userId, { limit: 100 }, client);
  const unreadMessages = threads.reduce((sum, thread) => sum + thread.unreadCount, 0);
  const awaitingResidentReply = threads.filter(
    (thread) =>
      thread.threadType === "resident_pm" ||
      (thread.threadType === "resident_maintenance" && thread.status === "unread")
  ).length;
  const vendorReplies = threads.filter((thread) => thread.threadType === "pm_vendor" && thread.unreadCount > 0).length;
  const emergencyUnread = threads.filter(
    (thread) => thread.sourceEntityType === "announcement_reply" && thread.unreadCount > 0
  ).length;
  const pendingConversations = threads.filter(
    (thread) => thread.status === "active" || thread.status === "unread"
  ).length;

  return {
    unreadMessages,
    awaitingResidentReply,
    vendorReplies,
    emergencyUnread,
    pendingConversations,
    recentThreads: threads.slice(0, 5).map((thread) => ({
      id: thread.id,
      subject: thread.subject,
      threadType: thread.threadType,
      status: thread.status,
      timestamp: thread.lastMessageAt ?? thread.updatedAt,
      href: `/communications/threads/${thread.id}`
    }))
  };
}

export async function searchThreadsAndMessages(
  organizationId: string,
  userId: string,
  query: string,
  limit = 12,
  client?: MessagingDbClient | SupabaseClientType
): Promise<ThreadListItem[]> {
  return getThreadsForOrganization(organizationId, userId, { search: query, limit }, client);
}
