"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge, Button, Card, Textarea } from "@mpa/ui";
import type { ThreadListItem } from "../../lib/messaging/server";

export function TenantMessagesInbox({ initialItems }: { initialItems: ThreadListItem[] }) {
  const [items] = useState(initialItems);
  const [selectedId, setSelectedId] = useState(items[0]?.id ?? null);
  const [body, setBody] = useState("");
  const [messages, setMessages] = useState<Array<{ id: string; body: string; createdAt: string; senderId: string }>>([]);
  const [submitting, setSubmitting] = useState(false);

  const selected = useMemo(() => items.find((item) => item.id === selectedId) ?? null, [items, selectedId]);

  async function loadMessages(threadId: string) {
    const response = await fetch(`/api/messaging/threads/${threadId}/messages`, { cache: "no-store" });
    if (!response.ok) return;
    const payload = (await response.json()) as {
      items: Array<{ id: string; body: string; createdAt: string; senderId: string }>;
    };
    setMessages(payload.items ?? []);
    await fetch(`/api/messaging/threads/${threadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark_read" })
    });
  }

  async function selectThread(threadId: string) {
    setSelectedId(threadId);
    await loadMessages(threadId);
  }

  async function sendReply() {
    if (!selectedId || !body.trim()) return;
    setSubmitting(true);
    const response = await fetch(`/api/messaging/threads/${selectedId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: body.trim(), visibility: "resident" })
    });
    setSubmitting(false);
    if (response.ok) {
      setBody("");
      await loadMessages(selectedId);
    }
  }

  if (items.length === 0) {
    return (
      <Card className="space-y-2 p-4">
        <h1 className="text-lg font-semibold text-[var(--mpa-color-text-primary)]">Messages</h1>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          No unread messages. When property management or maintenance reaches out, conversations appear here.
        </p>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[16rem_minmax(0,1fr)]">
      <Card className="space-y-2 p-3">
        <h2 className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">Your conversations</h2>
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => void selectThread(item.id)}
                className={[
                  "w-full rounded-md px-2 py-2 text-left text-sm",
                  selectedId === item.id ? "bg-[var(--mpa-color-brand-primary)]/10" : "hover:bg-[var(--mpa-color-interactive-row-hover)]"
                ].join(" ")}
              >
                <span className="font-medium">{item.subject}</span>
                {item.unreadCount > 0 ? (
                  <Badge variant="warning" className="ml-2">
                    {item.unreadCount}
                  </Badge>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="space-y-4 p-4">
        {selected ? (
          <>
            <div className="flex items-center justify-between gap-2">
              <h1 className="text-lg font-semibold text-[var(--mpa-color-text-primary)]">{selected.subject}</h1>
              <Link href={`/communications/threads/${selected.id}`} className="text-sm text-[var(--mpa-color-brand-primary)] hover:underline">
                Open full view
              </Link>
            </div>
            <ul className="max-h-96 space-y-2 overflow-y-auto">
              {messages.map((message) => (
                <li key={message.id} className="rounded-md border border-[var(--mpa-color-border-subtle)] p-3 text-sm">
                  <p className="text-xs text-[var(--mpa-color-text-muted)]">{new Date(message.createdAt).toLocaleString()}</p>
                  <p className="mt-1 whitespace-pre-wrap">{message.body}</p>
                </li>
              ))}
            </ul>
            <div className="space-y-2 border-t border-[var(--mpa-color-border-subtle)] pt-3">
              <Textarea rows={3} placeholder="Reply to property management…" value={body} onChange={(event) => setBody(event.target.value)} />
              <Button onClick={() => void sendReply()} disabled={submitting || !body.trim()}>
                Send reply
              </Button>
            </div>
          </>
        ) : (
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">Select a conversation to read and reply.</p>
        )}
      </Card>
    </div>
  );
}
