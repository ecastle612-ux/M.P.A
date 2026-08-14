"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ConversationInboxItem, ConversationMessageRecord } from "@mpa/shared";
import { Badge, Button, EmptyState, Skeleton } from "@mpa/ui";
import { MediaAttachmentField } from "../media/media-attachment-field";

type Props = {
  plane: "staff" | "tenant";
  conversationId: string;
  apiBase: string;
  onCloseThread?: () => void;
};

function formatWhen(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(
      new Date(iso)
    );
  } catch {
    return iso;
  }
}

export function ConversationThread({ plane, conversationId, apiBase, onCloseThread }: Props) {
  const [conversation, setConversation] = useState<ConversationInboxItem | null>(null);
  const [messages, setMessages] = useState<ConversationMessageRecord[]>([]);
  const [body, setBody] = useState("");
  const [mediaIds, setMediaIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sendIdempotencyKeyRef = useRef<string | null>(null);

  const canSend = useMemo(() => body.trim().length > 0 || mediaIds.length > 0, [body, mediaIds]);

  async function loadThread(options?: { silent?: boolean }) {
    if (!options?.silent) setLoading(true);
    setError(null);
    const response = await fetch(`${apiBase}/${conversationId}`);
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error ?? "Failed to load thread");
    }
    setConversation(payload.conversation as ConversationInboxItem);
    setMessages(payload.messages as ConversationMessageRecord[]);
    await fetch(`${apiBase}/${conversationId}/read`, { method: "POST" });
    setLoading(false);
  }

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await loadThread();
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load thread");
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, apiBase]);

  async function send() {
    if (!canSend) return;
    setSending(true);
    setError(null);
    if (!sendIdempotencyKeyRef.current) {
      sendIdempotencyKeyRef.current = crypto.randomUUID();
    }
    try {
      const response = await fetch(`${apiBase}/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body,
          mediaIds,
          idempotencyKey: sendIdempotencyKeyRef.current
        })
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Send failed");
      }
      sendIdempotencyKeyRef.current = null;
      setBody("");
      setMediaIds([]);
      await loadThread({ silent: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Send failed");
    } finally {
      setSending(false);
    }
  }

  async function closeThread() {
    if (!onCloseThread) return;
    const response = await fetch(`${apiBase}/${conversationId}/close`, { method: "POST" });
    if (response.ok) {
      onCloseThread();
      await loadThread();
    }
  }

  if (loading && !conversation) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-xl font-semibold text-[var(--mpa-color-text-primary)]">
            {conversation?.subject ?? "Conversation"}
          </h2>
          <Badge variant={conversation?.status === "closed" ? "neutral" : "success"}>
            {conversation?.status ?? "open"}
          </Badge>
          {conversation?.unread ? <Badge variant="info">Unread</Badge> : null}
        </div>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          {[conversation?.propertyName, conversation?.unitLabel ? `Unit ${conversation.unitLabel}` : null]
            .filter(Boolean)
            .join(" · ")}
          {conversation?.tenantDisplayName && plane === "staff"
            ? ` · ${conversation.tenantDisplayName}`
            : plane === "tenant"
              ? " · Property team"
              : ""}
          {conversation?.linkedEntityLabel ? ` · ${conversation.linkedEntityLabel}` : ""}
        </p>
      </header>

      {error ? <p className="text-sm text-[#C0392B]">{error}</p> : null}

      <ol className="space-y-3" aria-label="Message history">
        {messages.length === 0 ? (
          <EmptyState title="No messages yet" description="History appears here." />
        ) : (
          messages.map((message) => (
            <li
              key={message.id}
              className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">
                  {message.senderDisplayName}
                  <span className="ml-2 text-xs font-normal text-[var(--mpa-color-text-secondary)]">
                    {message.senderPlane === "tenant" ? "Resident" : "Property team"}
                  </span>
                </p>
                <span className="text-xs text-[var(--mpa-color-text-secondary)]">
                  {formatWhen(message.createdAt)}
                  {message.readByCounterparty ? " · Read" : ""}
                </span>
              </div>
              {message.body ? <p className="mt-2 text-sm whitespace-pre-wrap">{message.body}</p> : null}
              {message.attachmentCount > 0 ? (
                <div className="mt-2">
                  <MediaAttachmentField
                    relatedEntityType="conversation_message"
                    relatedEntityId={message.id}
                    readOnly
                    label="Attachments"
                  />
                </div>
              ) : null}
            </li>
          ))
        )}
      </ol>

      <section className="space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4" aria-label="Reply">
        <label className="block space-y-1 text-sm">
          <span className="text-xs text-[var(--mpa-color-text-secondary)]">Reply</span>
          <textarea
            className="min-h-[90px] w-full rounded-md border border-[var(--mpa-color-border-default)] px-3 py-2"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            aria-label="Message body"
          />
        </label>
        <MediaAttachmentField
          relatedEntityType="conversation_message"
          conversationId={conversationId}
          value={mediaIds}
          onChange={setMediaIds}
          label="Photos & video"
        />
        <div className="flex flex-wrap gap-2">
          <Button type="button" disabled={sending || !canSend} onClick={() => void send()}>
            {sending ? "Sending…" : "Send"}
          </Button>
          {plane === "staff" && conversation?.status === "open" && onCloseThread ? (
            <Button type="button" variant="secondary" onClick={() => void closeThread()}>
              Close conversation
            </Button>
          ) : null}
        </div>
      </section>
    </div>
  );
}
