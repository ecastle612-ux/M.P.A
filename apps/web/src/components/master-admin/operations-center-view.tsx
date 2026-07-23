"use client";

import Link from "next/link";
import { useEffect, useId, useState, useTransition } from "react";
import { Input, filledPillClassName } from "@mpa/ui";
import type { OperationsCenterSnapshot } from "../../lib/master-admin/operations-center";
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

function severityClass(severity: "critical" | "warning" | "info"): string {
  if (severity === "critical") {
    return "border-[var(--mpa-color-status-danger)]/40 bg-[var(--mpa-color-status-danger)]/8";
  }
  if (severity === "warning") {
    return "border-[var(--mpa-color-status-warning)]/40 bg-[var(--mpa-color-status-warning)]/8";
  }
  return "border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface-muted)]";
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
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--mpa-color-text-tertiary)]">
          Mission Control
        </p>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)] md:text-3xl">
              Operations Center
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-[var(--mpa-color-text-secondary)]">
              Good {greetingPeriod()}, {snapshot.greetingName}. Actionable reality first — then
              workspaces when you need them.
            </p>
          </div>
          <div className="rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface-muted)] px-3 py-2 text-xs text-[var(--mpa-color-text-secondary)]">
            Active org{" "}
            <span className="font-medium text-[var(--mpa-color-text-primary)]">
              {snapshot.activeOrganizationName}
            </span>
          </div>
        </div>

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
      </header>

      {/* 1. Immediate Attention */}
      <section aria-labelledby="immediate-attention-heading" className="space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2
            id="immediate-attention-heading"
            className="font-display text-lg font-semibold text-[var(--mpa-color-text-primary)]"
          >
            Immediate Attention
          </h2>
          <span className="text-xs text-[var(--mpa-color-text-tertiary)]">Critical first</span>
        </div>
        {snapshot.attention.length === 0 ? (
          <p className="rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface-muted)] px-4 py-3 text-sm text-[var(--mpa-color-text-secondary)]">
            All clear — nothing critical needs you right now.
          </p>
        ) : (
          <ul className="space-y-2">
            {snapshot.attention.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className={`flex flex-col gap-1 rounded-md border px-4 py-3 transition hover:opacity-95 sm:flex-row sm:items-center sm:justify-between ${severityClass(item.severity)}`}
                >
                  <span>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--mpa-color-text-tertiary)]">
                      {item.severity} · {item.category}
                    </span>
                    <span className="mt-0.5 block text-sm font-medium text-[var(--mpa-color-text-primary)]">
                      {item.title}
                    </span>
                    {item.context ? (
                      <span className="mt-0.5 block text-xs text-[var(--mpa-color-text-secondary)]">
                        {item.context}
                      </span>
                    ) : null}
                  </span>
                  <span className="text-xs font-medium text-[var(--mpa-color-brand-primary)]">
                    Open →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 2. Business Snapshot */}
      <section aria-labelledby="business-snapshot-heading" className="space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2
            id="business-snapshot-heading"
            className="font-display text-lg font-semibold text-[var(--mpa-color-text-primary)]"
          >
            Business Snapshot
          </h2>
          <span className="text-xs text-[var(--mpa-color-text-tertiary)]">
            Live · scoped labels
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-5">
          {snapshot.kpis.map((kpi) => (
            <Link
              key={kpi.id}
              href={kpi.href}
              className="rounded-md border border-[var(--mpa-color-border-default)] px-3 py-3 transition hover:bg-[var(--mpa-color-bg-surface-muted)]"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--mpa-color-text-tertiary)]">
                {kpi.label}
              </p>
              <p className="mt-1 font-display text-xl font-semibold text-[var(--mpa-color-text-primary)]">
                {kpi.available ? kpi.value : "—"}
              </p>
              <p className="mt-1 text-[10px] text-[var(--mpa-color-text-tertiary)]">
                {kpi.available
                  ? kpi.scope === "platform"
                    ? "Platform"
                    : "Active org"
                  : "Unavailable"}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Operational Workspaces */}
      <section aria-labelledby="workspaces-heading" className="space-y-3">
        <div>
          <h2
            id="workspaces-heading"
            className="font-display text-lg font-semibold text-[var(--mpa-color-text-primary)]"
          >
            Operational Workspaces
          </h2>
          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
            Everything has a home. No random cards.
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

      {/* 4. Quick Actions */}
      <section aria-labelledby="quick-actions-heading" className="space-y-3">
        <h2
          id="quick-actions-heading"
          className="font-display text-lg font-semibold text-[var(--mpa-color-text-primary)]"
        >
          Quick Actions
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
        </div>
      </section>
    </div>
  );
}

function greetingPeriod(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}
