import type { User } from "@supabase/supabase-js";
import { evaluatePermission, resolveAuthorizationContext } from "../auth/authorization";
import type { createAuthServerComponentClient } from "../auth/server";
import { getThreadsForOrganization, type ThreadListItem } from "../messaging/server";
import {
  cappedOwnerPropertyIds,
  isPropertyInOwnerScope,
  resolveOwnerPropertyScope,
  type OwnerPropertyScope
} from "./access";
import {
  formatOwnerActivityLabel,
  formatOwnerParticipantRole,
  type OwnerConversationListItem
} from "./messaging-shared";

export type { OwnerConversationListItem, OwnerMessageViewItem } from "./messaging-shared";

type SupabaseClient = Awaited<ReturnType<typeof createAuthServerComponentClient>>;

export type OwnerMessagingExperienceModel = {
  scope: OwnerPropertyScope;
  conversations: OwnerConversationListItem[];
  canReply: boolean;
  canMarkRead: boolean;
  currentUserId: string;
  loadNotes: string[];
};

const OWNER_SAFE_THREAD_TYPES = new Set(["pm_owner"]);

async function safeLoad<T>(loader: () => Promise<T>): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    return { ok: true, data: await loader() };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unable to load data."
    };
  }
}

function isOwnerSafeThread(thread: ThreadListItem, scope: OwnerPropertyScope): boolean {
  if (!OWNER_SAFE_THREAD_TYPES.has(thread.threadType)) return false;
  if (!thread.propertyId) return false;
  return isPropertyInOwnerScope(thread.propertyId, scope);
}

/**
 * OWNER-001 Phase 6 — owner messaging list.
 * Property-scoped `pm_owner` threads only, and only when the user is a participant.
 */
export async function loadOwnerMessagingExperience(input: {
  user: User;
  organizationId: string;
  supabase: SupabaseClient;
}): Promise<OwnerMessagingExperienceModel> {
  const { user, organizationId, supabase } = input;
  const authorization = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authorization, "message:read")) {
    throw new Error("Message access is not enabled for this account.");
  }

  const scope = await resolveOwnerPropertyScope({ organizationId, user, supabase });
  const canReply = evaluatePermission(authorization, "message:create");
  const canMarkRead = evaluatePermission(authorization, "message:update");
  const loadNotes: string[] = [];

  if (scope.propertyIds.length === 0) {
    return {
      scope,
      conversations: [],
      canReply,
      canMarkRead,
      currentUserId: user.id,
      loadNotes: []
    };
  }

  const cappedIds = cappedOwnerPropertyIds(scope, 40);
  if (scope.propertyIds.length > cappedIds.length) {
    loadNotes.push(
      `Showing conversations for the first ${cappedIds.length} of ${scope.propertyIds.length} properties.`
    );
  }

  const threadBundles = await Promise.all(
    cappedIds.map(async (propertyId) => {
      const result = await safeLoad(() =>
        getThreadsForOrganization(
          organizationId,
          user.id,
          { propertyId, threadType: "pm_owner", limit: 30 },
          supabase
        )
      );
      return { propertyId, result };
    })
  );

  const candidateThreads: ThreadListItem[] = [];
  for (const { propertyId, result } of threadBundles) {
    if (!result.ok) {
      loadNotes.push("Some conversations could not be loaded.");
      continue;
    }
    for (const thread of result.data) {
      if (!isOwnerSafeThread(thread, scope)) continue;
      if (thread.propertyId !== propertyId) continue;
      candidateThreads.push(thread);
    }
  }

  if (candidateThreads.length === 0) {
    return {
      scope,
      conversations: [],
      canReply,
      canMarkRead,
      currentUserId: user.id,
      loadNotes: [...new Set(loadNotes)]
    };
  }

  const threadIds = [...new Set(candidateThreads.map((thread) => thread.id))];
  const { data: participantRows, error: participantError } = await supabase
    .from("conversation_participants")
    .select("thread_id, user_id, participant_role")
    .eq("organization_id", organizationId)
    .in("thread_id", threadIds);

  if (participantError) {
    throw new Error(participantError.message);
  }

  const rolesByThread = new Map<string, string[]>();
  const memberThreadIds = new Set<string>();
  for (const row of participantRows ?? []) {
    const threadId = row.thread_id as string;
    const userId = row.user_id as string;
    const role = row.participant_role as string;
    if (userId === user.id) {
      memberThreadIds.add(threadId);
    }
    const roles = rolesByThread.get(threadId) ?? [];
    if (!roles.includes(role)) roles.push(role);
    rolesByThread.set(threadId, roles);
  }

  const conversations: OwnerConversationListItem[] = candidateThreads
    .filter((thread) => memberThreadIds.has(thread.id))
    .map((thread) => {
      const roleLabels = (rolesByThread.get(thread.id) ?? [])
        .filter((role) => role !== "vendor" && role !== "applicant")
        .map(formatOwnerParticipantRole);
      return {
        id: thread.id,
        subject: thread.subject?.trim() || "Conversation",
        propertyId: thread.propertyId,
        propertyName: thread.propertyName,
        propertyHref: thread.propertyId ? `/portal/owner/properties/${thread.propertyId}` : null,
        lastMessagePreview: thread.lastMessagePreview,
        lastActivityAt: thread.lastMessageAt,
        lastActivityLabel: formatOwnerActivityLabel(thread.lastMessageAt),
        unreadCount: thread.unreadCount,
        isUnread: thread.unreadCount > 0,
        participantRoleLabels: roleLabels
      };
    })
    .sort((a, b) => {
      const aAt = a.lastActivityAt ?? "";
      const bAt = b.lastActivityAt ?? "";
      return aAt < bAt ? 1 : aAt > bAt ? -1 : 0;
    });

  return {
    scope,
    conversations,
    canReply,
    canMarkRead,
    currentUserId: user.id,
    loadNotes: [...new Set(loadNotes)]
  };
}

/** True when a thread id is in the owner-authorized conversation set. */
export function isOwnerAuthorizedConversationId(
  conversationId: string,
  conversations: readonly OwnerConversationListItem[]
): boolean {
  return conversations.some((item) => item.id === conversationId);
}
