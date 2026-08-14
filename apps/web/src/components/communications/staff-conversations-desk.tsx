"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { ConversationInboxItem } from "@mpa/shared";
import { Badge, Button, EmptyState, Input, Skeleton } from "@mpa/ui";
import { MediaAttachmentField } from "../media/media-attachment-field";
import { ConversationThread } from "./conversation-thread";

type Target = { id: string; label: string; detail: string | null; propertyId: string | null; leaseId: string | null };

export function StaffConversationsDesk() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("conversationId");
  const prefillResident = searchParams.get("residentId");
  const prefillWorkOrder = searchParams.get("workOrderId");
  const prefillLease = searchParams.get("leaseId");
  const prefillProperty = searchParams.get("propertyId");

  const [conversations, setConversations] = useState<ConversationInboxItem[]>([]);
  const [targets, setTargets] = useState<Target[]>([]);
  const [query, setQuery] = useState("");
  const [tenantAccountId, setTenantAccountId] = useState(prefillResident ?? "");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [mediaIds, setMediaIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startIdempotencyKeyRef = useRef<string | null>(null);

  async function reload() {
    const [listRes, targetRes] = await Promise.all([
      fetch("/api/shared/communications/conversations"),
      fetch("/api/shared/communications/conversations?targets=1")
    ]);
    if (listRes.status === 403) {
      setForbidden(true);
      setConversations([]);
      return;
    }
    const listBody = await listRes.json();
    const targetBody = await targetRes.json();
    if (!listRes.ok) throw new Error(listBody.error ?? "Failed to load conversations");
    setConversations(listBody.conversations as ConversationInboxItem[]);
    if (targetRes.ok) setTargets(targetBody.targets as Target[]);
  }

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        await reload();
        if (!cancelled) setError(null);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = [...conversations].sort((a, b) => Number(b.unread) - Number(a.unread));
    if (!q) return rows;
    return rows.filter((row) =>
      `${row.subject} ${row.tenantDisplayName ?? ""} ${row.propertyName ?? ""}`.toLowerCase().includes(q)
    );
  }, [conversations, query]);

  const resolvedTenant = targets.some((item) => item.id === tenantAccountId)
    ? tenantAccountId
    : (targets[0]?.id ?? "");

  async function start() {
    setSending(true);
    setError(null);
    if (!startIdempotencyKeyRef.current) {
      startIdempotencyKeyRef.current = crypto.randomUUID();
    }
    try {
      const payload: {
        tenantAccountId: string;
        body: string;
        mediaIds: string[];
        subject: string;
        idempotencyKey: string;
        linkedEntityType?: string;
        linkedEntityId?: string;
      } = {
        tenantAccountId: resolvedTenant,
        body,
        mediaIds,
        subject,
        idempotencyKey: startIdempotencyKeyRef.current
      };
      if (prefillWorkOrder) {
        payload.linkedEntityType = "work_order";
        payload.linkedEntityId = prefillWorkOrder;
      } else if (prefillLease) {
        payload.linkedEntityType = "lease";
        payload.linkedEntityId = prefillLease;
      } else if (prefillProperty) {
        payload.linkedEntityType = "property";
        payload.linkedEntityId = prefillProperty;
      }
      const response = await fetch("/api/shared/communications/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Failed to start conversation");
      startIdempotencyKeyRef.current = null;
      setBody("");
      setSubject("");
      setMediaIds([]);
      await reload();
      router.push(`/shared/communications/conversations/${result.conversation.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start conversation");
    } finally {
      setSending(false);
    }
  }

  if (forbidden) {
    return (
      <EmptyState
        title="Tenant conversations are not on this plan"
        description="Facility Operations does not include a tenant inbox. Use Property Manager or Complete Platform."
      />
    );
  }

  if (selectedId) {
    return (
      <ConversationThread
        plane="staff"
        conversationId={selectedId}
        apiBase="/api/shared/communications/conversations"
        onCloseThread={() => void reload()}
      />
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <section className="space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
        <h2 className="text-sm font-semibold">Start conversation</h2>
        {error ? <p className="text-sm text-[#C0392B]">{error}</p> : null}
        <label className="block space-y-1 text-sm">
          <span className="text-xs text-[var(--mpa-color-text-secondary)]">Tenant</span>
          <select
            className="w-full rounded-md border border-[var(--mpa-color-border-default)] px-3 py-2"
            value={resolvedTenant}
            onChange={(event) => setTenantAccountId(event.target.value)}
          >
            {targets.map((target) => (
              <option key={target.id} value={target.id}>
                {target.label}
                {target.detail ? ` · ${target.detail}` : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-xs text-[var(--mpa-color-text-secondary)]">Subject (optional)</span>
          <Input value={subject} onChange={(event) => setSubject(event.target.value)} />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-xs text-[var(--mpa-color-text-secondary)]">Message</span>
          <textarea
            className="min-h-[90px] w-full rounded-md border border-[var(--mpa-color-border-default)] px-3 py-2"
            value={body}
            onChange={(event) => setBody(event.target.value)}
          />
        </label>
        <MediaAttachmentField
          relatedEntityType="conversation_message"
          tenantAccountId={resolvedTenant || null}
          value={mediaIds}
          onChange={setMediaIds}
        />
        <Button
          type="button"
          disabled={sending || !resolvedTenant || (!body.trim() && mediaIds.length === 0)}
          onClick={() => void start()}
        >
          {sending ? "Starting…" : "Message tenant"}
        </Button>
      </section>

      <section className="space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">Inbox</h2>
          <Badge variant="info">{conversations.filter((item) => item.unread).length} unread</Badge>
        </div>
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tenant or subject" />
        {loading ? (
          <Skeleton className="h-32 w-full" />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No conversations yet"
            description="Start a thread with a tenant who has an active lease and portal access."
          />
        ) : (
          <ul className="max-h-[28rem] space-y-2 overflow-auto">
            {filtered.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="w-full rounded-md border border-[var(--mpa-color-border-default)] p-3 text-left"
                  onClick={() => router.push(`/shared/communications/conversations/${item.id}`)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{item.subject}</span>
                    {item.unread ? <Badge variant="success">Unread</Badge> : null}
                  </div>
                  <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">
                    {item.tenantDisplayName ?? "Tenant"} · {item.propertyName ?? "Property"}
                    {item.linkedEntityLabel ? ` · ${item.linkedEntityLabel}` : ""}
                  </p>
                  <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
                    {item.lastMessagePreview ?? "No messages yet"}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
