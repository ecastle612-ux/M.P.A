"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import type { MpaAssistantViewModel } from "./types";

const PANEL =
  "rounded-[var(--mpa-radius-xl)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] shadow-[var(--mpa-shadow-xs)]";

const STORAGE_KEY = "mpa.ux016.assistant.collapsedAfterVisit";
const VISITED_KEY = "mpa.ux016.assistant.visited";

function readInitialExpanded(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const visited = window.localStorage.getItem(VISITED_KEY);
    // First visit: expanded. Later visits: collapsed unless user last left it expanded.
    if (!visited) return true;
    return window.localStorage.getItem(STORAGE_KEY) === "0";
  } catch {
    return true;
  }
}

function RelatedContextList({
  items
}: {
  items: NonNullable<MpaAssistantViewModel["highestPriority"]>["relatedContext"];
}) {
  if (!items?.length) return null;
  return (
    <ul className="mt-2 space-y-1 border-l-2 border-[var(--mpa-color-border-subtle)] pl-3 text-xs text-[var(--mpa-color-text-secondary)]">
      {items.map((item) => (
        <li key={`${item.label}-${item.value}`}>
          <span className="font-medium text-[var(--mpa-color-text-primary)]">{item.label}: </span>
          {item.href ? (
            <Link href={item.href} className="text-[var(--mpa-color-brand-primary)] hover:underline">
              {item.value}
            </Link>
          ) : (
            item.value
          )}
        </li>
      ))}
    </ul>
  );
}

export function MpaAssistant({ assistant }: { assistant: MpaAssistantViewModel }) {
  const panelId = useId();
  const [expanded, setExpanded] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setExpanded(readInitialExpanded());
    setHydrated(true);
    try {
      window.localStorage.setItem(VISITED_KEY, "1");
    } catch {
      // ignore
    }
  }, []);

  function toggle() {
    setExpanded((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? "0" : "1");
      } catch {
        // ignore
      }
      return next;
    });
  }

  return (
    <section
      className={`${PANEL} p-[var(--mpa-space-4)]`}
      aria-labelledby="ux016-assistant-heading"
      data-ux016="mpa-assistant"
      data-hydrated={hydrated ? "true" : "false"}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--mpa-color-text-tertiary)]">
            M.P.A. Assistant
          </p>
          <h2
            id="ux016-assistant-heading"
            className="mt-1 text-sm font-semibold text-[var(--mpa-color-text-primary)]"
          >
            {assistant.headline}
          </h2>
        </div>
        <button
          type="button"
          className="inline-flex h-11 min-h-11 min-w-11 items-center justify-center rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-default)] px-3 text-sm font-medium text-[var(--mpa-color-text-primary)] transition-[transform,opacity] duration-200 hover:bg-[var(--mpa-color-interactive-row-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-border-focus)] motion-reduce:transition-none md:hidden"
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={toggle}
        >
          {expanded ? "Collapse" : "Expand"}
        </button>
      </div>

      <div
        id={panelId}
        className={[
          "mt-[var(--mpa-space-3)] space-y-[var(--mpa-space-4)]",
          expanded ? "block" : "hidden md:block"
        ].join(" ")}
      >
        {assistant.caughtUp ? (
          <div className="rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface-muted)]/40 p-3">
            <p className="font-medium text-[var(--mpa-color-text-primary)]">You’re caught up.</p>
            <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
              No critical operational issues require attention today.
            </p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-tertiary)]">
              Suggested improvements
            </p>
            <ul className="mt-2 space-y-1">
              {assistant.caughtUpSuggestions.map((suggestion) => (
                <li key={suggestion.label}>
                  <Link
                    href={suggestion.href}
                    className="inline-flex min-h-11 items-center text-sm font-medium text-[var(--mpa-color-brand-primary)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-border-focus)]"
                  >
                    {suggestion.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <>
            {assistant.today.length > 0 ? (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-tertiary)]">
                  Today
                </h3>
                <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                  {assistant.today.map((row) => (
                    <li key={row.id}>
                      <Link
                        href={row.href}
                        className="flex min-h-11 items-center justify-between gap-3 rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-subtle)] px-3 py-2 text-sm transition-colors hover:bg-[var(--mpa-color-interactive-row-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-border-focus)]"
                      >
                        <span className="text-[var(--mpa-color-text-secondary)]">
                          {row.count} {row.label}
                        </span>
                        <span className="font-display text-lg font-semibold text-[var(--mpa-color-text-primary)]">
                          {row.count}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {assistant.highestPriority ? (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-tertiary)]">
                  Highest Priority
                </h3>
                <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-[var(--mpa-color-text-primary)]">
                      {assistant.highestPriority.title}
                    </p>
                    <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
                      {assistant.highestPriority.reason}
                    </p>
                    <RelatedContextList items={assistant.highestPriority.relatedContext} />
                  </div>
                  <Link
                    href={assistant.highestPriority.href}
                    className="inline-flex h-11 min-h-11 shrink-0 items-center justify-center rounded-[var(--mpa-radius-md)] bg-[var(--mpa-color-brand-primary)] px-4 text-sm font-semibold text-[var(--mpa-color-text-inverse)] hover:bg-[var(--mpa-color-brand-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-border-focus)]"
                  >
                    {assistant.highestPriority.actionLabel}
                  </Link>
                </div>
              </div>
            ) : null}

            {assistant.recommendedNextAction ? (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-tertiary)]">
                  Recommended Next Action
                </h3>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-[var(--mpa-color-text-primary)]">
                    {assistant.recommendedNextAction.label}
                  </p>
                  <Link
                    href={assistant.recommendedNextAction.href}
                    className="inline-flex h-11 min-h-11 items-center justify-center rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-default)] px-4 text-sm font-semibold text-[var(--mpa-color-text-primary)] hover:bg-[var(--mpa-color-interactive-row-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-border-focus)]"
                  >
                    {assistant.recommendedNextAction.actionLabel}
                  </Link>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}

export function WaitingSection({
  id,
  title,
  description,
  items
}: {
  id: string;
  title: string;
  description: string;
  items: MpaAssistantViewModel["waitingOnMe"];
}) {
  if (items.length === 0) return null;
  return (
    <section className={`${PANEL} p-[var(--mpa-space-4)]`} aria-labelledby={id}>
      <h2 id={id} className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">
        {title}
      </h2>
      <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">{description}</p>
      <ul className="mt-[var(--mpa-space-3)] divide-y divide-[var(--mpa-color-border-subtle)]">
        {items.map((item) => (
          <li key={item.id} className="flex flex-wrap items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-[var(--mpa-color-text-primary)]">{item.label}</p>
              <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">{item.detail}</p>
            </div>
            <Link
              href={item.href}
              className="inline-flex h-11 min-h-11 items-center justify-center rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-default)] px-4 text-sm font-medium text-[var(--mpa-color-text-primary)] hover:bg-[var(--mpa-color-interactive-row-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-border-focus)]"
            >
              Open
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function RecommendedAndQuickWins({ assistant }: { assistant: MpaAssistantViewModel }) {
  if (assistant.recommendedActions.length === 0 && assistant.quickWins.length === 0) {
    return null;
  }

  return (
    <div className="space-y-[var(--mpa-space-6)]">
      {assistant.recommendedActions.length > 0 ? (
        <section className={`${PANEL} p-[var(--mpa-space-4)]`} aria-labelledby="ux016-recommended-heading">
          <h2
            id="ux016-recommended-heading"
            className="text-sm font-semibold text-[var(--mpa-color-text-primary)]"
          >
            Recommended Actions
          </h2>
          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
            Highest-value next steps from today’s operational signals.
          </p>
          <ul className="mt-[var(--mpa-space-3)] divide-y divide-[var(--mpa-color-border-subtle)]">
            {assistant.recommendedActions.map((action) => (
              <li key={action.id} className="flex flex-wrap items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-[var(--mpa-color-text-primary)]">{action.label}</p>
                  <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">{action.reason}</p>
                  <RelatedContextList items={action.relatedContext} />
                </div>
                <Link
                  href={action.href}
                  className="inline-flex h-11 min-h-11 items-center justify-center rounded-[var(--mpa-radius-md)] bg-[var(--mpa-color-brand-primary)] px-4 text-sm font-semibold text-[var(--mpa-color-text-inverse)] hover:bg-[var(--mpa-color-brand-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-border-focus)]"
                >
                  {action.actionLabel}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {assistant.quickWins.length > 0 ? (
        <section className={`${PANEL} p-[var(--mpa-space-4)]`} aria-labelledby="ux016-quickwins-heading">
          <h2
            id="ux016-quickwins-heading"
            className="text-sm font-semibold text-[var(--mpa-color-text-primary)]"
          >
            Quick Wins
          </h2>
          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
            Actions that usually take less than two minutes.
          </p>
          <div className="mt-[var(--mpa-space-3)] flex flex-wrap gap-2">
            {assistant.quickWins.map((win) => (
              <Link
                key={win.id}
                href={win.href}
                title={win.reason}
                className="inline-flex h-11 min-h-11 items-center justify-center rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-4 text-sm font-medium text-[var(--mpa-color-text-primary)] shadow-[var(--mpa-shadow-xs)] hover:bg-[var(--mpa-color-interactive-row-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-border-focus)]"
              >
                {win.label}
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
