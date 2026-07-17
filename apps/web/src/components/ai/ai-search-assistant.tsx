"use client";

import { useEffect, useRef, useState } from "react";
import { Badge, Button, Card, Textarea } from "@mpa/ui";
import type { PromptKey } from "../../lib/ai/contracts";
import { AI_ASSISTANT_DISCLAIMER } from "../../lib/ai/contracts";
import type { AiConversationDetail } from "../../lib/ai/server";

type AssistantMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  promptKey: string | null;
  createdAt: string;
};

export function AiSearchAssistant({
  conversationId,
  conversationTitle,
  initialMessages,
  canUse,
  pendingPromptKey,
  onConversationChange,
  onPromptComplete
}: {
  conversationId: string | null;
  conversationTitle?: string | null;
  initialMessages: AssistantMessage[];
  canUse: boolean;
  pendingPromptKey: PromptKey | null;
  onConversationChange: (conversation: AiConversationDetail) => void;
  onPromptComplete?: () => void;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (pendingPromptKey && canUse && !isRunning) {
      void runPrompt({ promptKey: pendingPromptKey, conversationId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingPromptKey]);

  useEffect(() => {
    transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isRunning]);

  async function runPrompt(input: { promptKey?: PromptKey; message?: string; conversationId?: string | null }) {
    if (!canUse) return;
    setIsRunning(true);
    setError(null);

    const userPreview = input.message ?? input.promptKey?.replaceAll("_", " ") ?? "Portfolio question";
    const optimisticId = `pending-${Date.now()}`;
    setMessages((current) => [
      ...current,
      {
        id: optimisticId,
        role: "user",
        content: userPreview,
        promptKey: input.promptKey ?? null,
        createdAt: new Date().toISOString()
      }
    ]);

    try {
      const response = await fetch("/api/ai/prompts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          promptKey: input.promptKey,
          message: input.message,
          conversationId: input.conversationId ?? undefined
        })
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(payload?.message ?? "Unable to run AI prompt");
      }
      const payload = (await response.json()) as { conversation: AiConversationDetail };
      setMessages(
        payload.conversation.messages.map((message) => ({
          id: message.id,
          role: message.role,
          content: message.content,
          promptKey: message.promptKey,
          createdAt: message.createdAt
        }))
      );
      onConversationChange(payload.conversation);
      onPromptComplete?.();
      setDraft("");
    } catch (runError) {
      setMessages((current) => current.filter((message) => message.id !== optimisticId));
      setError(runError instanceof Error ? runError.message : "Unable to run AI prompt");
    } finally {
      setIsRunning(false);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = draft.trim();
    if (!message || isRunning) return;
    void runPrompt({ message, conversationId });
  }

  return (
    <Card className="flex min-h-[28rem] flex-col space-y-3">
      <div className="space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">AI assistant</h2>
            <p className="mt-0.5 text-xs text-[var(--mpa-color-text-secondary)]">
              Ask portfolio questions or run curated prompts. You review every output.
            </p>
          </div>
          <Badge variant="warning">PM in control</Badge>
        </div>
        <div
          role="note"
          className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
        >
          {AI_ASSISTANT_DISCLAIMER}
        </div>
      </div>

      <div
        ref={transcriptRef}
        className="min-h-[16rem] flex-1 space-y-3 overflow-y-auto rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface-muted)] p-3"
        aria-live="polite"
        aria-label="Assistant conversation"
      >
        {messages.length === 0 ? (
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            {conversationId && conversationTitle
              ? `Continuing "${conversationTitle}". Send a follow-up question to resume this thread.`
              : "Select a prompt from the library or type a custom question below."}
          </p>
        ) : (
          messages.map((message) => (
            <article
              key={message.id}
              className={[
                "rounded-md border px-3 py-2",
                message.role === "user"
                  ? "ml-8 border-[var(--mpa-color-brand-primary)]/20 bg-white"
                  : "mr-8 border-[var(--mpa-color-border-default)] bg-white"
              ].join(" ")}
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
                {message.role === "user" ? "You" : "Assistant"}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--mpa-color-text-primary)]">
                {message.content}
              </p>
            </article>
          ))
        )}
        {isRunning ? (
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">Assistant is thinking…</p>
        ) : null}
      </div>

      {error ? <p className="text-sm text-[var(--mpa-color-danger,#C0392B)]">{error}</p> : null}

      <form onSubmit={handleSubmit} className="space-y-2">
        <Textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={canUse ? "Ask a custom portfolio question…" : "You need AI use permission to run prompts."}
          disabled={!canUse || isRunning}
          rows={3}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={!canUse || isRunning || draft.trim().length === 0}>
            {isRunning ? "Running…" : "Send question"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
