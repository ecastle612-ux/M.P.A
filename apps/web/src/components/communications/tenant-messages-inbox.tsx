"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { ConversationInboxItem } from "@mpa/shared";
import { Badge, EmptyState, Skeleton } from "@mpa/ui";

export function TenantMessagesInbox() {
  const [conversations, setConversations] = useState<ConversationInboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/portal/tenant/conversations");
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "Failed to load messages");
        if (!cancelled) setConversations(payload.conversations as ConversationInboxItem[]);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load messages");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const rows = useMemo(
    () => [...conversations].sort((a, b) => Number(b.unread) - Number(a.unread)),
    [conversations]
  );

  if (loading) return <Skeleton className="h-40 w-full" />;
  if (error) return <p className="text-sm text-[#C0392B]">{error}</p>;
  if (rows.length === 0) {
    return (
      <EmptyState
        title="No messages yet"
        description="Your property manager will appear here."
      />
    );
  }

  return (
    <ul className="space-y-2">
      {rows.map((item) => (
        <li key={item.id}>
          <Link
            href={`/portal/tenant/messages/${item.id}`}
            className="block rounded-md border border-[var(--mpa-color-border-default)] bg-white p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-[var(--mpa-color-text-primary)]">{item.subject}</span>
              {item.unread ? (
                <Badge variant="success">
                  <span className="sr-only">Unread. </span>
                  New
                </Badge>
              ) : (
                <Badge variant="neutral">Read</Badge>
              )}
            </div>
            <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">
              {item.propertyName ?? "Your home"}
              {item.linkedEntityLabel ? ` · ${item.linkedEntityLabel}` : ""}
            </p>
            <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
              {item.lastMessagePreview ?? "Open to view history"}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
