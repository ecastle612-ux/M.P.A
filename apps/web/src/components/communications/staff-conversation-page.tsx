"use client";

import Link from "next/link";
import { ConversationThread } from "./conversation-thread";

export function StaffConversationPage({ conversationId }: { conversationId: string }) {
  return (
    <div className="space-y-4">
      <Link
        href="/shared/communications"
        className="inline-flex min-h-11 items-center text-sm font-medium text-[var(--mpa-color-brand-primary)] underline"
      >
        Back to conversations
      </Link>
      <ConversationThread
        plane="staff"
        conversationId={conversationId}
        apiBase="/api/shared/communications/conversations"
        onCloseThread={() => undefined}
      />
    </div>
  );
}
