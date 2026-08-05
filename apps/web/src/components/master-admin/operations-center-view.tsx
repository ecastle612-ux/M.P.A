"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useState, useTransition } from "react";
import { Input, filledPillClassName } from "@mpa/ui";
import { UniversalDashboard } from "../dashboard-framework";
import type { OperationsCenterSnapshot } from "../../lib/master-admin/operations-center";
import { buildMasterAdminUniversalDashboardViewModel } from "../../lib/master-admin/ux016-view-model";
import {
  getMissionControlQuickActions,
  getMissionControlWorkspaces,
  type MasterAdminWorkspaceId
} from "../../lib/master-admin/workspace-catalog";
import { useSessionPermissions } from "../shell/use-session-permissions";

type SearchResult = {
  id: string;
  entity: string;
  title: string;
  subtitle: string | null;
  href: string;
};

function timeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function dateLabel(): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(new Date());
}

export function OperationsCenterView({ snapshot }: { snapshot: OperationsCenterSnapshot }) {
  const searchId = useId();
  const { masterAdminOnlyShell } = useSessionPermissions();
  const workspaces = getMissionControlWorkspaces(masterAdminOnlyShell);
  const quickActions = getMissionControlQuickActions(masterAdminOnlyShell);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [activeWorkspace, setActiveWorkspace] = useState<MasterAdminWorkspaceId>("platform");
  const [isPending, startTransition] = useTransition();

  const model = useMemo(
    () =>
      buildMasterAdminUniversalDashboardViewModel({
        snapshot,
        timeGreeting: timeGreeting(),
        dateLabel: dateLabel(),
        masterAdminOnlyShell
      }),
    [masterAdminOnlyShell, snapshot]
  );

  useEffect(() => {
    if (workspaces.some((item) => item.id === activeWorkspace)) return;
    setActiveWorkspace(workspaces[0]?.id ?? "platform");
  }, [activeWorkspace, workspaces]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearchError(null);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      startTransition(async () => {
        try {
          const response = await fetch(`/api/master-admin/search?q=${encodeURIComponent(q)}`, {
            signal: controller.signal,
            cache: "no-store"
          });
          const payload = (await response.json().catch(() => null)) as
            | { results?: SearchResult[]; message?: string }
            | null;
          if (!response.ok) {
            throw new Error(payload?.message ?? "Search failed.");
          }
          setResults(payload?.results ?? []);
          setSearchError(null);
        } catch (error) {
          if (controller.signal.aborted) return;
          setSearchError(error instanceof Error ? error.message : "Search failed.");
          setResults([]);
        }
      });
    }, 220);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  const workspace = workspaces.find((item) => item.id === activeWorkspace) ?? workspaces[0]!;

  return (
    <div className="space-y-8" data-ux016="mission-control">
      <div className="relative max-w-3xl">
        <label htmlFor={searchId} className="sr-only">
          Universal search
        </label>
        <Input
          id={searchId}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search organizations, managers, residents, owners, vendors, properties…"
          autoComplete="off"
        />
        {(results.length > 0 || searchError || (isPending && query.trim().length >= 2)) && (
          <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] shadow-[var(--mpa-shadow-sm)]">
            {searchError ? (
              <p className="px-3 py-2 text-sm text-[var(--mpa-color-status-danger)]">{searchError}</p>
            ) : results.length === 0 ? (
              <p className="px-3 py-2 text-sm text-[var(--mpa-color-text-secondary)]">
                {isPending ? "Searching…" : "No matches."}
              </p>
            ) : (
              <ul className="max-h-80 overflow-y-auto py-1">
                {results.map((result) => (
                  <li key={result.id}>
                    <Link
                      href={result.href}
                      className="flex items-start justify-between gap-3 px-3 py-2 text-sm hover:bg-[var(--mpa-color-interactive-row-hover)]"
                      onClick={() => setQuery("")}
                    >
                      <span>
                        <span className="font-medium text-[var(--mpa-color-text-primary)]">
                          {result.title}
                        </span>
                        {result.subtitle ? (
                          <span className="mt-0.5 block text-xs text-[var(--mpa-color-text-tertiary)]">
                            {result.subtitle}
                          </span>
                        ) : null}
                      </span>
                      <span className="shrink-0 text-xs uppercase tracking-wide text-[var(--mpa-color-text-tertiary)]">
                        {result.entity}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <UniversalDashboard model={model} />

      <section aria-labelledby="workspaces-heading" className="space-y-3">
        <div>
          <h2
            id="workspaces-heading"
            className="font-display text-lg font-semibold text-[var(--mpa-color-text-primary)]"
          >
            Operational Workspaces
          </h2>
          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
            Supportive catalog below the command center — everything still has a home.
          </p>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {workspaces.map((item) => {
            const active = item.id === activeWorkspace;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveWorkspace(item.id)}
                className={filledPillClassName(active)}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="rounded-md border border-[var(--mpa-color-border-default)] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--mpa-color-text-tertiary)]">
            {workspace.label}
          </p>
          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">{workspace.purpose}</p>
          <ul className="mt-4 divide-y divide-[var(--mpa-color-border-default)]">
            {workspace.items.map((item) => (
              <li key={item.href + item.label}>
                <Link
                  href={item.href}
                  className="flex items-start justify-between gap-3 py-3 transition hover:opacity-90"
                >
                  <span>
                    <span className="block text-sm font-medium text-[var(--mpa-color-text-primary)]">
                      {item.label}
                    </span>
                    <span className="mt-0.5 block text-xs text-[var(--mpa-color-text-secondary)]">
                      {item.description}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs text-[var(--mpa-color-brand-primary)]">Open →</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="more-quick-actions-heading" className="space-y-3">
        <h2
          id="more-quick-actions-heading"
          className="font-display text-lg font-semibold text-[var(--mpa-color-text-primary)]"
        >
          More Quick Actions
        </h2>
        <div className="flex flex-wrap gap-2">
          {quickActions.map((action) => (
            <Link
              key={action.href + action.label}
              href={action.href}
              className="rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-3 py-2 text-sm font-medium text-[var(--mpa-color-text-primary)] transition hover:border-[var(--mpa-color-brand-primary)] hover:text-[var(--mpa-color-brand-primary)]"
            >
              {action.label}
            </Link>
          ))}
          <Link
            href="/portal"
            className="rounded-md border border-[var(--mpa-color-brand-primary)] bg-[var(--mpa-color-brand-primary-subtle)] px-3 py-2 text-sm font-medium text-[var(--mpa-color-brand-primary)]"
          >
            Open Portal Launcher
          </Link>
        </div>
      </section>
    </div>
  );
}
