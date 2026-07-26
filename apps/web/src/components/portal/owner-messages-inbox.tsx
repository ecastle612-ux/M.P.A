"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, EmptyState, Skeleton, Textarea } from "@mpa/ui";
import {
  formatOwnerActivityLabel,
  formatOwnerParticipantRole,
  type OwnerConversationListItem,
  type OwnerMessageViewItem
} from "../../lib/owner-portal/messaging-shared";

type ThreadApiPayload = {
  thread?: {
    id: string;
    subject: string;
    propertyId: string | null;
    propertyName: string | null;
    participants: Array<{ userId: string; participantRole: string }>;
    messages: Array<{
      id: string;
      body: string;
      createdAt: string;
      senderId: string;
      visibility?: string;
      metadata?: Record<string, unknown>;
    }>;
  };
};

function attachmentIdsFromMetadata(metadata: Record<string, unknown> | undefined): string[] {
  const raw = metadata?.["attachment_document_ids"];
  if (!Array.isArray(raw)) return [];
  return raw.filter((value): value is string => typeof value === "string" && value.trim().length > 0);
}

function toMessageViews(
  thread: NonNullable<ThreadApiPayload["thread"]>,
  currentUserId: string
): OwnerMessageViewItem[] {
  const roleByUserId = new Map(
    thread.participants.map((participant) => [participant.userId, participant.participantRole])
  );

  return thread.messages.map((message) => {
    const role = roleByUserId.get(message.senderId);
    const attachmentIds = attachmentIdsFromMetadata(message.metadata);
    let senderLabel = role ? formatOwnerParticipantRole(role) : "Participant";
    if (message.senderId === currentUserId) {
      senderLabel = "You";
    }

    return {
      id: message.id,
      body: message.body,
      createdAt: message.createdAt,
      createdAtLabel: formatOwnerActivityLabel(message.createdAt),
      senderId: message.senderId,
      senderLabel,
      attachmentCount: attachmentIds.length,
      attachmentIds
    };
  });
}

export function OwnerMessagesInbox({
  initialConversations,
  initialThreadId = null,
  canReply = false,
  canMarkRead = false,
  currentUserId,
  loadNotes = []
}: {
  initialConversations: OwnerConversationListItem[];
  initialThreadId?: string | null;
  canReply?: boolean;
  canMarkRead?: boolean;
  currentUserId: string;
  loadNotes?: string[];
}) {
  const preferredId =
    initialThreadId && initialConversations.some((item) => item.id === initialThreadId)
      ? initialThreadId
      : (initialConversations[0]?.id ?? null);

  const [items, setItems] = useState(initialConversations);
  const [selectedId, setSelectedId] = useState<string | null>(preferredId);
  const [messages, setMessages] = useState<OwnerMessageViewItem[]>([]);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadingThread, setLoadingThread] = useState(false);
  const [threadError, setThreadError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  const selected = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId]
  );

  async function loadThread(threadId: string) {
    if (!items.some((item) => item.id === threadId)) {
      setThreadError("You do not have access to this conversation.");
      setMessages([]);
      return;
    }

    setSelectedId(threadId);
    setLoadingThread(true);
    setThreadError(null);
    setSendError(null);

    const response = await fetch(`/api/messaging/threads/${threadId}`, { cache: "no-store" });
    setLoadingThread(false);

    if (!response.ok) {
      setMessages([]);
      setThreadError(
        response.status === 403 || response.status === 404
          ? "This conversation is unavailable."
          : "Unable to load this conversation right now."
      );
      return;
    }

    const payload = (await response.json()) as ThreadApiPayload;
    const thread = payload.thread;
    if (!thread) {
      setMessages([]);
      setThreadError("This conversation is unavailable.");
      return;
    }

    // Defense in depth: only render if still in the owner-authorized set.
    if (!items.some((item) => item.id === thread.id)) {
      setMessages([]);
      setThreadError("You do not have access to this conversation.");
      return;
    }

    setMessages(toMessageViews(thread, currentUserId));

    if (canMarkRead) {
      await fetch(`/api/messaging/threads/${threadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_read" })
      }).catch(() => undefined);

      setItems((current) =>
        current.map((item) =>
          item.id === threadId ? { ...item, unreadCount: 0, isUnread: false } : item
        )
      );
    }
  }

  useEffect(() => {
    if (!preferredId) return;
    let cancelled = false;
    void (async () => {
      if (cancelled) return;
      setSelectedId(preferredId);
      setLoadingThread(true);
      setThreadError(null);
      const response = await fetch(`/api/messaging/threads/${preferredId}`, { cache: "no-store" });
      if (cancelled) return;
      setLoadingThread(false);
      if (!response.ok) {
        setMessages([]);
        setThreadError("Unable to load this conversation right now.");
        return;
      }
      const payload = (await response.json()) as ThreadApiPayload;
      const thread = payload.thread;
      if (!thread || !initialConversations.some((item) => item.id === thread.id)) {
        setMessages([]);
        setThreadError("You do not have access to this conversation.");
        return;
      }
      setMessages(toMessageViews(thread, currentUserId));
      if (canMarkRead) {
        await fetch(`/api/messaging/threads/${preferredId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "mark_read" })
        }).catch(() => undefined);
        if (cancelled) return;
        setItems((current) =>
          current.map((item) =>
            item.id === preferredId ? { ...item, unreadCount: 0, isUnread: false } : item
          )
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [preferredId, initialConversations, currentUserId, canMarkRead]);

  async function sendReply() {
    if (!selectedId || !body.trim() || !canReply) return;
    if (!items.some((item) => item.id === selectedId)) {
      setSendError("You do not have access to this conversation.");
      return;
    }

    setSubmitting(true);
    setSendError(null);
    const response = await fetch(`/api/messaging/threads/${selectedId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Owner ↔ PM threads: internal visibility avoids resident fan-out (existing visibility model).
      body: JSON.stringify({ body: body.trim(), visibility: "internal" })
    });
    setSubmitting(false);

    if (!response.ok) {
      setSendError(
        response.status === 403
          ? "Replies are not enabled for this account."
          : "Unable to send reply right now."
      );
      return;
    }

    setBody("");
    await loadThread(selectedId);
  }

  if (items.length === 0) {
    return (
      <div className="space-y-3">
        {loadNotes.length > 0 ? (
          <ul className="space-y-1 text-xs text-[var(--mpa-color-text-secondary)]">
            {loadNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        ) : null}
        <EmptyState
          title="No messages yet"
          description="When your property manager messages you about your properties, conversations appear here."
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {loadNotes.length > 0 ? (
        <ul className="space-y-1 text-xs text-[var(--mpa-color-text-secondary)]">
          {loadNotes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <Card variant="elevated" className="space-y-2 p-3">
          <h2 className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">Conversations</h2>
          <ul className="mpa-list-stack max-h-[32rem] overflow-y-auto">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => void loadThread(item.id)}
                  className={[
                    "mpa-list-row mpa-chrome-control w-full rounded-[var(--mpa-radius-md)] px-3 py-3 text-left text-sm transition-colors",
                    selectedId === item.id
                      ? "bg-[var(--mpa-color-bg-muted)] text-[var(--mpa-color-text-primary)]"
                      : "text-[var(--mpa-color-text-secondary)] hover:bg-[var(--mpa-color-bg-muted)] hover:text-[var(--mpa-color-text-primary)]"
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium text-[var(--mpa-color-text-primary)]">
                      {item.subject}
                    </span>
                    {item.isUnread ? (
                      <Badge variant="warning">{item.unreadCount > 0 ? item.unreadCount : "Unread"}</Badge>
                    ) : (
                      <Badge variant="neutral">Read</Badge>
                    )}
                  </div>
                  {item.propertyName ? (
                    <p className="mt-1 truncate text-xs text-[var(--mpa-color-text-secondary)]">
                      {item.propertyName}
                    </p>
                  ) : null}
                  {item.lastMessagePreview ? (
                    <p className="mt-0.5 line-clamp-2 text-xs text-[var(--mpa-color-text-secondary)]">
                      {item.lastMessagePreview}
                    </p>
                  ) : null}
                  <p className="mt-1 text-[11px] text-[var(--mpa-color-text-secondary)]">
                    {item.lastActivityLabel}
                  </p>
                  {item.participantRoleLabels.length > 0 ? (
                    <p className="mt-1 text-[11px] text-[var(--mpa-color-text-secondary)]">
                      {item.participantRoleLabels.join(" · ")}
                    </p>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        </Card>

        <Card variant="elevated" className="space-y-4 p-4">
          {selected ? (
            <>
              <div className="space-y-2 border-b border-[var(--mpa-color-border-subtle)] pb-3">
                <h1 className="font-display text-lg font-semibold text-[var(--mpa-color-text-primary)]">
                  {selected.subject}
                </h1>
                {selected.propertyName && selected.propertyHref ? (
                  <p className="text-sm text-[var(--mpa-color-text-secondary)]">
                    Property:{" "}
                    <Link
                      href={selected.propertyHref}
                      className="font-medium text-[var(--mpa-color-text-link)]"
                    >
                      {selected.propertyName}
                    </Link>
                  </p>
                ) : selected.propertyName ? (
                  <p className="text-sm text-[var(--mpa-color-text-secondary)]">
                    Property: {selected.propertyName}
                  </p>
                ) : null}
                {selected.participantRoleLabels.length > 0 ? (
                  <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                    Participants: {selected.participantRoleLabels.join(" · ")}
                  </p>
                ) : null}
              </div>

              {loadingThread ? (
                <div className="space-y-2" role="status" aria-label="Loading messages">
                  <Skeleton className="h-16 w-full rounded-[var(--mpa-radius-md)]" />
                  <Skeleton className="h-16 w-full rounded-[var(--mpa-radius-md)]" />
                  <Skeleton className="h-16 w-3/4 rounded-[var(--mpa-radius-md)]" />
                </div>
              ) : threadError ? (
                <p className="text-sm text-[var(--mpa-color-status-danger)]">{threadError}</p>
              ) : messages.length === 0 ? (
                <p className="text-sm text-[var(--mpa-color-text-secondary)]">
                  No messages in this conversation yet.
                </p>
              ) : (
                <ul className="max-h-96 space-y-2 overflow-y-auto">
                  {messages.map((message) => (
                    <li
                      key={message.id}
                      className="rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-subtle)] p-3 text-sm"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs font-medium text-[var(--mpa-color-text-primary)]">
                          {message.senderLabel}
                        </p>
                        <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                          {message.createdAtLabel}
                        </p>
                      </div>
                      <p className="mt-1 whitespace-pre-wrap text-[var(--mpa-color-text-primary)]">
                        {message.body}
                      </p>
                      {message.attachmentCount > 0 ? (
                        <p className="mt-2 text-xs text-[var(--mpa-color-text-secondary)]">
                          {message.attachmentCount} attachment
                          {message.attachmentCount === 1 ? "" : "s"}
                          {" · "}
                          <Link href="/portal/owner/documents" className="text-[var(--mpa-color-text-link)]">
                            Open documents
                          </Link>
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}

              {canReply ? (
                <div className="space-y-2 border-t border-[var(--mpa-color-border-subtle)] pt-3">
                  <Textarea
                    rows={3}
                    placeholder="Reply to your property manager…"
                    value={body}
                    onChange={(event) => setBody(event.target.value)}
                  />
                  {sendError ? (
                    <p className="text-xs text-[var(--mpa-color-status-danger)]">{sendError}</p>
                  ) : null}
                  <Button onClick={() => void sendReply()} disabled={submitting || !body.trim()}>
                    Send reply
                  </Button>
                </div>
              ) : (
                <p className="border-t border-[var(--mpa-color-border-subtle)] pt-3 text-xs text-[var(--mpa-color-text-secondary)]">
                  Replies are unavailable for this account. Conversations remain read-only until your property
                  manager enables owner messaging permissions (`message:create`).
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-[var(--mpa-color-text-secondary)]">Select a conversation to read.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
