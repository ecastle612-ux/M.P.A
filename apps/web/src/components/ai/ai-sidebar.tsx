"use client";

import { Badge, Card } from "@mpa/ui";
import type { AiConversationRecord, PromptDefinition, PromptKey } from "../../lib/ai/contracts";

export function AiSidebar({
  prompts,
  conversations,
  activeConversationId,
  canUse,
  onSelectPrompt,
  onSelectConversation
}: {
  prompts: PromptDefinition[];
  conversations: AiConversationRecord[];
  activeConversationId: string | null;
  canUse: boolean;
  onSelectPrompt: (promptKey: PromptKey) => void;
  onSelectConversation: (conversationId: string) => void;
}) {
  const suggested = prompts.filter((prompt) => prompt.suggested);
  const library = prompts.filter((prompt) => !prompt.suggested);

  return (
    <aside className="space-y-4" aria-label="AI assistant sidebar">
      <Card className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">Prompt library</h2>
          <p className="mt-0.5 text-xs text-[var(--mpa-color-text-secondary)]">
            Curated questions for portfolio operations. Results require your review.
          </p>
        </div>

        {suggested.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
              Suggested
            </p>
            <ul className="space-y-1">
              {suggested.map((prompt) => (
                <li key={prompt.key}>
                  <PromptButton prompt={prompt} disabled={!canUse} onSelect={onSelectPrompt} />
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {library.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
              All prompts
            </p>
            <ul className="space-y-1">
              {library.map((prompt) => (
                <li key={prompt.key}>
                  <PromptButton prompt={prompt} disabled={!canUse} onSelect={onSelectPrompt} />
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </Card>

      <Card className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">Recent conversations</h2>
          <p className="mt-0.5 text-xs text-[var(--mpa-color-text-secondary)]">
            Resume a prior assistant session.
          </p>
        </div>
        {conversations.length === 0 ? (
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">Conversations appear after your first prompt.</p>
        ) : (
          <ul className="space-y-1">
            {conversations.map((conversation) => {
              const isActive = conversation.id === activeConversationId;
              return (
                <li key={conversation.id}>
                  <button
                    type="button"
                    disabled={!canUse}
                    onClick={() => onSelectConversation(conversation.id)}
                    className={[
                      "w-full rounded-md border px-3 py-2 text-left transition",
                      isActive
                        ? "border-[var(--mpa-color-brand-primary)] bg-[var(--mpa-color-bg-surface-muted)]"
                        : "border-[var(--mpa-color-border-default)] hover:bg-[var(--mpa-color-bg-surface-muted)]",
                      !canUse ? "cursor-not-allowed opacity-60" : ""
                    ].join(" ")}
                  >
                    <p className="truncate text-sm font-medium text-[var(--mpa-color-text-primary)]">
                      {conversation.title}
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--mpa-color-text-secondary)]">
                      {new Date(conversation.updatedAt).toLocaleString()}
                    </p>
                    {conversation.lastPromptKey ? (
                      <Badge className="mt-1" variant="neutral">
                        {conversation.lastPromptKey.replaceAll("_", " ")}
                      </Badge>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </aside>
  );
}

function PromptButton({
  prompt,
  disabled,
  onSelect
}: {
  prompt: PromptDefinition;
  disabled: boolean;
  onSelect: (promptKey: PromptKey) => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect(prompt.key)}
      className={[
        "w-full rounded-md border border-[var(--mpa-color-border-default)] p-2 text-left transition hover:bg-[var(--mpa-color-bg-surface-muted)]",
        disabled ? "cursor-not-allowed opacity-60" : ""
      ].join(" ")}
    >
      <p className="text-sm font-medium text-[var(--mpa-color-brand-primary)]">{prompt.label}</p>
      <p className="mt-0.5 text-xs text-[var(--mpa-color-text-secondary)]">{prompt.description}</p>
    </button>
  );
}
