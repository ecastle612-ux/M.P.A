"use client";

import Link from "next/link";
import { memo, useCallback, useEffect, useId, useRef, useState } from "react";
import { Button, Textarea } from "@mpa/ui";
import { evaluateCapability } from "@mpa/shared";
import type { PromptKey } from "../../lib/ai/contracts";
import type { AiConversationDetail } from "../../lib/ai/server";
import { shellTrace } from "../../lib/debug/shell-runtime-trace";
import { useSessionPermissions } from "../shell/use-session-permissions";
import { useAiPageContext } from "./ai-page-context";

type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
};

/**
 * UX-009 / SH-002 floating operational copilot.
 * Subscribes to AI page context via external store — must not re-render the shell.
 */
export const FloatingAiCopilot = memo(function FloatingAiCopilot() {
  const panelId = useId();
  const context = useAiPageContext();
  const { permissions, loaded } = useSessionPermissions();
  const canRead = evaluateCapability(permissions, "ai:read");
  const canUse = evaluateCapability(permissions, "ai:use");
  const [open, setOpen] = useState(false);
  const mountCounted = useRef(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (mountCounted.current) return;
    mountCounted.current = true;
    shellTrace("ai-copilot-mount", {
      entityType: context.entityType,
      canRead,
      loaded
    });
  }, [canRead, context.entityType, loaded]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    // Do not lock body scroll — OS assistant must not freeze the page under the panel.
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        launcherRef.current?.focus();
        shellTrace("ai-copilot-close", { reason: "escape" });
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isRunning, open]);

  const runPrompt = useCallback(
    async (input: { promptKey?: PromptKey; message?: string }) => {
      if (!canUse || isRunning) return;
      setIsRunning(true);
      setError(null);
      const userPreview = input.message ?? input.promptKey?.replaceAll("_", " ") ?? "Ask M.P.A.";
      const optimisticId = `pending-${Date.now()}`;
      setMessages((current) => [
        ...current,
        { id: optimisticId, role: "user", content: userPreview }
      ]);

      try {
        const response = await fetch("/api/ai/prompts", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            promptKey: input.promptKey,
            message: input.message,
            conversationId: conversationId ?? undefined,
            context: {
              entityType: context.entityType,
              entityId: context.entityId ?? undefined,
              entityLabel: context.entityLabel ?? undefined
            }
          })
        });
        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { message?: string } | null;
          throw new Error(payload?.message ?? "Unable to run assistant");
        }
        const payload = (await response.json()) as { conversation: AiConversationDetail };
        setConversationId(payload.conversation.id);
        setMessages(
          payload.conversation.messages.map((message) => ({
            id: message.id,
            role: message.role,
            content: message.content
          }))
        );
        setDraft("");
      } catch (runError) {
        setMessages((current) => current.filter((message) => message.id !== optimisticId));
        setError(runError instanceof Error ? runError.message : "Unable to run assistant");
      } finally {
        setIsRunning(false);
      }
    },
    [canUse, conversationId, context.entityId, context.entityLabel, context.entityType, isRunning]
  );

  const launcherEnabled = loaded && canRead;

  return (
    <div
      // AI-001: z-[60] sits above keepMounted Drawer/Modal (z-50) so the launcher stays tappable.
      className="pointer-events-none fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-4 z-[60] flex flex-col items-end gap-3 md:bottom-[calc(1.5rem+env(safe-area-inset-bottom))]"
      data-mpa-ai-copilot="true"
    >
      {open && launcherEnabled ? (
        <section
          id={panelId}
          role="dialog"
          aria-modal="true"
          aria-label={context.launcherLabel}
          className="pointer-events-auto flex max-h-[min(32rem,75vh)] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-[var(--mpa-radius-xl)] border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] shadow-[var(--mpa-shadow-lg)]"
        >
          <header className="flex items-start justify-between gap-2 border-b border-[var(--mpa-color-border-subtle)] px-4 py-3">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--mpa-color-text-muted)]">
                Operational copilot
              </p>
              <h2 className="mt-0.5 truncate text-sm font-semibold text-[var(--mpa-color-text-primary)]">
                {context.launcherLabel}
              </h2>
            </div>
            <button
              type="button"
              className="rounded-[var(--mpa-radius-md)] px-2 py-1 text-sm text-[var(--mpa-color-text-secondary)] hover:bg-[var(--mpa-color-interactive-row-hover)]"
              onClick={() => {
                setOpen(false);
                launcherRef.current?.focus();
                shellTrace("ai-copilot-close", { reason: "button" });
              }}
            >
              Close
            </button>
          </header>

          <div className="flex flex-wrap gap-1.5 border-b border-[var(--mpa-color-border-subtle)] px-3 py-2">
            {context.suggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                type="button"
                disabled={!canUse || isRunning}
                onClick={() =>
                  void runPrompt({
                    ...(suggestion.promptKey ? { promptKey: suggestion.promptKey } : {}),
                    message: suggestion.message ?? suggestion.label
                  })
                }
                className="rounded-full border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-app)] px-2.5 py-1 text-xs font-medium text-[var(--mpa-color-text-primary)] hover:border-[var(--mpa-color-brand-primary)] disabled:opacity-50"
              >
                {suggestion.label}
              </button>
            ))}
          </div>

          <div
            ref={transcriptRef}
            className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-3"
            aria-live="polite"
          >
            {messages.length === 0 ? (
              <p className="text-sm text-[var(--mpa-color-text-secondary)]">
                Context is already set for this screen. Pick a suggestion or ask a question — no need to explain where
                you are.
              </p>
            ) : (
              messages.map((message) => (
                <article
                  key={message.id}
                  className={
                    message.role === "user"
                      ? "ml-6 rounded-[var(--mpa-radius-md)] bg-[var(--mpa-color-brand-primary-subtle)] px-3 py-2 text-sm"
                      : "mr-6 rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-subtle)] px-3 py-2 text-sm"
                  }
                >
                  <p className="whitespace-pre-wrap text-[var(--mpa-color-text-primary)]">{message.content}</p>
                </article>
              ))
            )}
            {error ? <p className="text-sm text-[var(--mpa-color-status-danger)]">{error}</p> : null}
          </div>

          <form
            className="space-y-2 border-t border-[var(--mpa-color-border-subtle)] px-3 py-3"
            onSubmit={(event) => {
              event.preventDefault();
              const message = draft.trim();
              if (!message) return;
              void runPrompt({ message });
            }}
          >
            <Textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={canUse ? "Ask in plain language…" : "AI use permission required"}
              disabled={!canUse || isRunning}
              rows={2}
              className="min-h-[4rem] resize-none text-sm"
            />
            <div className="flex items-center justify-between gap-2">
              <Link
                href="/ai-operations"
                className="text-xs font-medium text-[var(--mpa-color-text-link)] hover:underline"
              >
                Open AI Ops
              </Link>
              <Button type="submit" size="sm" disabled={!canUse || isRunning || !draft.trim()}>
                {isRunning ? "Thinking…" : "Ask"}
              </Button>
            </div>
          </form>
        </section>
      ) : null}

      <button
        ref={launcherRef}
        type="button"
        disabled={!launcherEnabled}
        className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] text-sm font-semibold text-[var(--mpa-color-brand-primary)] shadow-[var(--mpa-shadow-md)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--mpa-color-brand-primary)] disabled:cursor-not-allowed disabled:opacity-40"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={
          !loaded
            ? "AI assistant loading"
            : canRead
              ? context.launcherLabel
              : "AI assistant unavailable"
        }
        onClick={() => {
          if (!launcherEnabled) {
            shellTrace("ai-copilot-tap-blocked", { loaded, canRead });
            return;
          }
          setOpen((value) => {
            const next = !value;
            shellTrace(next ? "ai-copilot-open" : "ai-copilot-close", {
              entityType: context.entityType,
              entityId: context.entityId ?? null
            });
            return next;
          });
        }}
      >
        AI
      </button>
    </div>
  );
});
