"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge, Button, Card, Textarea } from "@mpa/ui";
import { threadStatusLabel, threadTypeLabel } from "../../lib/messaging/contracts";
import type { ThreadDetail } from "../../lib/messaging/server";
import { ContextRail, ContextRailSection } from "../presentation/context-rail";

export function ConversationView({
  initialThread,
  currentUserId,
  canUpdate
}: {
  initialThread: ThreadDetail;
  currentUserId: string;
  canUpdate: boolean;
}) {
  const router = useRouter();
  const [thread, setThread] = useState(initialThread);
  const [body, setBody] = useState("");
  const [visibility, setVisibility] = useState<"resident" | "internal" | "vendor">("resident");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendMessage() {
    if (!body.trim()) return;
    setSubmitting(true);
    setError(null);
    const response = await fetch(`/api/messaging/threads/${thread.id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: body.trim(), visibility })
    });
    setSubmitting(false);
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      setError(payload?.message ?? "Unable to send message.");
      return;
    }
    const payload = (await response.json()) as { message: ThreadDetail["messages"][number] };
    setThread((current) => ({
      ...current,
      messages: [...current.messages, payload.message],
      lastMessagePreview: payload.message.body.slice(0, 120),
      lastMessageAt: payload.message.createdAt,
      status: "unread"
    }));
    setBody("");
    router.refresh();
  }

  async function markRead() {
    const response = await fetch(`/api/messaging/threads/${thread.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark_read" })
    });
    if (response.ok) {
      const payload = (await response.json()) as { thread: ThreadDetail };
      setThread(payload.thread);
    }
  }

  async function resolveThread() {
    const response = await fetch(`/api/messaging/threads/${thread.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "resolve" })
    });
    if (response.ok) {
      const payload = (await response.json()) as { thread: ThreadDetail };
      setThread(payload.thread);
    }
  }

  const sourceHref =
    thread.sourceEntityType === "maintenance" && thread.sourceEntityId
      ? `/maintenance/${thread.sourceEntityId}`
      : thread.sourceEntityType === "applicant" && thread.sourceEntityId
        ? `/applicants/${thread.sourceEntityId}`
        : null;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
      <div className="space-y-4">
        <Card className="space-y-4 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold text-[var(--mpa-color-text-primary)]">{thread.subject}</h1>
              <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
                {threadTypeLabel(thread.threadType)} · {threadStatusLabel(thread.status)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {canUpdate ? (
                <>
                  <Button variant="secondary" size="sm" onClick={() => void markRead()}>
                    Mark read
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => void resolveThread()}>
                    Resolve
                  </Button>
                </>
              ) : null}
              {sourceHref ? (
                <Link href={sourceHref}>
                  <Button variant="secondary" size="sm">
                    Open workflow
                  </Button>
                </Link>
              ) : null}
            </div>
          </div>

          <p className="rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface-muted)]/60 px-3 py-2 text-xs leading-relaxed text-[var(--mpa-color-text-secondary)]">
            Messages stay linked to the workflow record. Use internal notes when coordinating with staff; residents only see resident-visible messages.
          </p>

          <ul className="space-y-3">
            {thread.messages.length === 0 ? (
              <li className="rounded-lg border border-dashed border-[var(--mpa-color-border-subtle)] p-4 text-sm text-[var(--mpa-color-text-secondary)]">
                No messages yet. Send the first update to keep everyone aligned.
              </li>
            ) : (
              thread.messages.map((message) => (
                <li
                  key={message.id}
                  className={[
                    "rounded-lg border p-3",
                    message.senderId === currentUserId
                      ? "border-[var(--mpa-color-brand-primary)]/30 bg-[var(--mpa-color-brand-primary)]/5"
                      : "border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface-muted)]/30"
                  ].join(" ")}
                >
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <Badge variant={message.visibility === "internal" ? "warning" : "info"}>{message.visibility}</Badge>
                    <span className="text-xs text-[var(--mpa-color-text-muted)]">{new Date(message.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-[var(--mpa-color-text-primary)]">{message.body}</p>
                  {Array.isArray(message.metadata["attachment_document_ids"]) &&
                  (message.metadata["attachment_document_ids"] as string[]).length > 0 ? (
                    <p className="mt-2 text-xs text-[var(--mpa-color-text-secondary)]">
                      {(message.metadata["attachment_document_ids"] as string[]).length} vault attachment(s) linked
                    </p>
                  ) : null}
                </li>
              ))
            )}
          </ul>

          {thread.status !== "archived" && thread.status !== "resolved" ? (
            <div className="space-y-3 border-t border-[var(--mpa-color-border-subtle)] pt-4">
              <Textarea
                rows={4}
                placeholder="Write your reply…"
                value={body}
                onChange={(event) => setBody(event.target.value)}
              />
              <div className="flex flex-wrap items-center gap-3">
                <label className="text-sm text-[var(--mpa-color-text-secondary)]">
                  Visibility
                  <select
                    className="ml-2 rounded-md border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] px-2 py-1 text-sm"
                    value={visibility}
                    onChange={(event) => setVisibility(event.target.value as typeof visibility)}
                  >
                    <option value="resident">Resident</option>
                    <option value="internal">Internal</option>
                    <option value="vendor">Vendor</option>
                  </select>
                </label>
                <Button onClick={() => void sendMessage()} disabled={submitting || !body.trim()}>
                  {submitting ? "Sending…" : "Send message"}
                </Button>
              </div>
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
            </div>
          ) : (
            <p className="text-sm text-[var(--mpa-color-text-secondary)]">
              This conversation is closed. Reopen the linked workflow if you need to continue messaging.
            </p>
          )}
        </Card>
      </div>

      <ContextRail title="Conversation context">
        <ContextRailSection title="Workflow">
          <p>{threadTypeLabel(thread.threadType)}</p>
          {sourceHref ? (
            <Link href={sourceHref} className="text-sm font-semibold text-[var(--mpa-color-brand-primary)] hover:underline">
              View source record
            </Link>
          ) : (
            <p className="text-sm text-[var(--mpa-color-text-muted)]">General conversation</p>
          )}
        </ContextRailSection>
        <ContextRailSection title="Location">
          {[thread.propertyName, thread.unitNumber ? `Unit ${thread.unitNumber}` : null].filter(Boolean).join(" · ") ||
            "No property linked"}
        </ContextRailSection>
        <ContextRailSection title="Participants">
          <ul className="space-y-1">
            {thread.participants.map((participant) => (
              <li key={participant.id} className="text-sm">
                {participant.participantRole}
                {participant.userId === currentUserId ? " (you)" : ""}
              </li>
            ))}
          </ul>
        </ContextRailSection>
        <ContextRailSection title="Next step">
          {thread.unreadCount > 0
            ? "Review unread messages and reply to keep the workflow moving."
            : thread.status === "resolved"
              ? "Conversation resolved. No action needed unless the workflow reopens."
              : "Send an update or mark read when caught up."}
        </ContextRailSection>
      </ContextRail>
    </div>
  );
}
