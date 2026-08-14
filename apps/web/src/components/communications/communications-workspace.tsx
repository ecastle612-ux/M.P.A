"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import type { CommsMessageRecord, UnifiedNotificationRecord } from "@mpa/shared";
import { Badge, Button, EmptyState, Input, Skeleton } from "@mpa/ui";
import { StaffConversationsDesk } from "./staff-conversations-desk";

type Target = { id: string; label: string; detail: string | null };

export function CommunicationsWorkspace() {
  const [messages, setMessages] = useState<CommsMessageRecord[]>([]);
  const [notifications, setNotifications] = useState<UnifiedNotificationRecord[]>([]);
  const [targets, setTargets] = useState<Record<string, Target[]>>({});
  const [audienceFilter, setAudienceFilter] = useState<"all" | "resident" | "owner" | "vendor">(
    "all"
  );
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [audienceType, setAudienceType] = useState<"resident" | "owner" | "vendor">("resident");
  const [targetId, setTargetId] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [channel, setChannel] = useState<"in_app" | "email" | "both">("in_app");
  const [sending, setSending] = useState(false);
  const [desk, setDesk] = useState<"notices" | "conversations">("notices");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (audienceFilter !== "all") {
          params.set("audienceType", audienceFilter);
        }
        if (query.trim()) {
          params.set("q", query.trim());
        }
        const [historyRes, inboxRes] = await Promise.all([
          fetch(`/api/shared/communications?${params.toString()}`),
          fetch("/api/shared/communications/notifications")
        ]);
        const historyBody = await historyRes.json();
        const inboxBody = await inboxRes.json();
        if (!historyRes.ok) {
          throw new Error(historyBody.error ?? "Failed to load history");
        }
        if (!inboxRes.ok) {
          throw new Error(inboxBody.error ?? "Failed to load notifications");
        }
        if (!cancelled) {
          setMessages(historyBody.messages as CommsMessageRecord[]);
          setNotifications(inboxBody.notifications as UnifiedNotificationRecord[]);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load communications");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [audienceFilter, query, reloadKey]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const response = await fetch("/api/shared/communications/targets");
      const payload = await response.json();
      if (!cancelled && response.ok) {
        setTargets(payload.targets as Record<string, Target[]>);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const audienceTargets = useMemo(() => targets[audienceType] ?? [], [targets, audienceType]);
  const resolvedTargetId = audienceTargets.some((item) => item.id === targetId)
    ? targetId
    : (audienceTargets[0]?.id ?? "");

  async function sendMessage() {
    setSending(true);
    setError(null);
    try {
      const payload: Record<string, string> = {
        audienceType,
        subject,
        body,
        channel
      };
      if (audienceType === "resident") {
        payload["residentId"] = resolvedTargetId;
      } else if (audienceType === "vendor") {
        payload["vendorId"] = resolvedTargetId;
      } else {
        payload["ownerUserId"] = resolvedTargetId;
      }
      const response = await fetch("/api/shared/communications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error ?? "Send failed");
      }
      setSubject("");
      setBody("");
      setReloadKey((value) => value + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Send failed");
    } finally {
      setSending(false);
    }
  }

  async function markRead(notificationId: string) {
    await fetch("/api/shared/communications/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationId })
    });
    setReloadKey((value) => value + 1);
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          Shared Platform · Communications
        </p>
        <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
          Messages & notifications
        </h1>
        <p className="max-w-3xl text-sm text-[var(--mpa-color-text-secondary)]">
          Send one-way operational notices, or open a two-way tenant conversation. Notifications stay
          in one inbox.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={desk === "notices" ? "primary" : "secondary"}
            onClick={() => setDesk("notices")}
          >
            Notices
          </Button>
          <Button
            type="button"
            variant={desk === "conversations" ? "primary" : "secondary"}
            onClick={() => setDesk("conversations")}
          >
            Conversations
          </Button>
        </div>
      </header>

      {desk === "conversations" ? (
        <Suspense fallback={<Skeleton className="h-40 w-full" />}>
          <StaffConversationsDesk />
        </Suspense>
      ) : null}

      {desk === "notices" && error ? <p className="text-sm text-[#C0392B]">{error}</p> : null}
      {desk === "notices" ? (
      <>
      <div className="grid gap-4 xl:grid-cols-2">
        <section
          aria-label="Compose message"
          className="space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4"
        >
          <h2 className="text-sm font-semibold">Send message</h2>
          <label className="block space-y-1 text-sm">
            <span className="text-xs text-[var(--mpa-color-text-secondary)]">Audience</span>
            <select
              className="w-full rounded-md border border-[var(--mpa-color-border-default)] px-3 py-2"
              value={audienceType}
              onChange={(event) => {
                setAudienceType(event.target.value as "resident" | "owner" | "vendor");
                setTargetId("");
              }}
            >
              <option value="resident">Resident</option>
              <option value="owner">Owner</option>
              <option value="vendor">Vendor</option>
            </select>
          </label>
          <label className="block space-y-1 text-sm">
            <span className="text-xs text-[var(--mpa-color-text-secondary)]">Recipient</span>
            <select
              className="w-full rounded-md border border-[var(--mpa-color-border-default)] px-3 py-2"
              value={resolvedTargetId}
              onChange={(event) => setTargetId(event.target.value)}
            >
              {audienceTargets.map((target) => (
                <option key={target.id} value={target.id}>
                  {target.label}
                  {target.detail ? ` · ${target.detail}` : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1 text-sm">
            <span className="text-xs text-[var(--mpa-color-text-secondary)]">Channel</span>
            <select
              className="w-full rounded-md border border-[var(--mpa-color-border-default)] px-3 py-2"
              value={channel}
              onChange={(event) =>
                setChannel(event.target.value as "in_app" | "email" | "both")
              }
            >
              <option value="in_app">In-app</option>
              <option value="email">Email (when configured)</option>
              <option value="both">In-app + email</option>
            </select>
          </label>
          <label className="block space-y-1 text-sm">
            <span className="text-xs text-[var(--mpa-color-text-secondary)]">Subject</span>
            <Input value={subject} onChange={(event) => setSubject(event.target.value)} />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="text-xs text-[var(--mpa-color-text-secondary)]">Message</span>
            <textarea
              className="min-h-[110px] w-full rounded-md border border-[var(--mpa-color-border-default)] px-3 py-2"
              value={body}
              onChange={(event) => setBody(event.target.value)}
            />
          </label>
          <Button
            type="button"
            disabled={sending || !resolvedTargetId || !subject.trim() || !body.trim()}
            onClick={() => void sendMessage()}
          >
            {sending ? "Sending…" : "Send message"}
          </Button>
        </section>

        <section
          aria-label="System notifications"
          className="space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4"
        >
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">Notification inbox</h2>
            <Badge variant="info">
              {notifications.filter((item) => !item.readAt).length} unread
            </Badge>
          </div>
          {loading ? (
            <Skeleton className="h-32 w-full" />
          ) : notifications.length === 0 ? (
            <EmptyState
              title="No notifications yet"
              description="Finance, maintenance, and message notices appear here."
            />
          ) : (
            <ul className="max-h-96 space-y-2 overflow-auto">
              {notifications.map((item) => (
                <li
                  key={item.id}
                  className="rounded-md border border-[var(--mpa-color-border-default)] p-3 text-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{item.title}</span>
                    <Badge variant={item.readAt ? "neutral" : "success"}>{item.source}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">{item.body}</p>
                  {!item.readAt ? (
                    <button
                      type="button"
                      className="mt-2 text-xs text-[var(--mpa-color-brand-primary)] underline"
                      onClick={() => void markRead(item.id)}
                    >
                      Mark read
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="space-y-3" aria-label="Communication history">
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <h2 className="text-sm font-semibold">Communication history</h2>
            <p className="text-xs text-[var(--mpa-color-text-secondary)]">
              Sent resident, owner, and vendor messages
            </p>
          </div>
          <label className="space-y-1 text-sm">
            <span className="text-xs text-[var(--mpa-color-text-secondary)]">Audience</span>
            <select
              className="block rounded-md border border-[var(--mpa-color-border-default)] px-3 py-2"
              value={audienceFilter}
              onChange={(event) =>
                setAudienceFilter(event.target.value as typeof audienceFilter)
              }
            >
              <option value="all">All</option>
              <option value="resident">Resident</option>
              <option value="owner">Owner</option>
              <option value="vendor">Vendor</option>
            </select>
          </label>
          <label className="min-w-[200px] flex-1 space-y-1 text-sm">
            <span className="text-xs text-[var(--mpa-color-text-secondary)]">Search</span>
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search subject or body"
            />
          </label>
        </div>
        {loading ? (
          <Skeleton className="h-28 w-full" />
        ) : messages.length === 0 ? (
          <EmptyState title="No messages yet" description="Send your first operational message above." />
        ) : (
          <ul className="space-y-2">
            {messages.map((message) => (
              <li
                key={message.id}
                className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-[var(--mpa-color-text-primary)]">{message.subject}</p>
                  <div className="flex gap-1">
                    <Badge variant="info">{message.audienceType}</Badge>
                    <Badge variant="neutral">{message.deliveryStatus}</Badge>
                  </div>
                </div>
                <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">
                  To {message.audienceLabel ?? message.audienceType} · {message.channel}
                </p>
                <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">{message.body}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
      </>
      ) : null}
    </div>
  );
}
