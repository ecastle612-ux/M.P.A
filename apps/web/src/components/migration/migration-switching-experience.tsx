"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button, Card, useToast } from "@mpa/ui";
import type { CustomerSwitchingSnapshot } from "../../lib/migration/switching";
import { readApiError } from "../../lib/api/client-error";

function formatEta(minutes: number | null): string {
  if (minutes === null) return "—";
  if (minutes === 0) return "Ready now";
  if (minutes < 60) return `About ${minutes} minutes`;
  const hours = Math.round(minutes / 60);
  return hours === 1 ? "About 1 hour" : `About ${hours} hours`;
}

function statusLabel(status: CustomerSwitchingSnapshot["goLiveStatus"]): string {
  if (status === "ready") return "Ready to go live";
  if (status === "blocked") return "Needs attention before go-live";
  if (status === "in_progress") return "Migration in progress";
  return "Not started";
}

export function MigrationSwitchingExperience({
  initial,
  canCreate,
  canUpdate
}: {
  initial: CustomerSwitchingSnapshot;
  canCreate: boolean;
  canUpdate: boolean;
}) {
  const { notify } = useToast();
  const [snapshot, setSnapshot] = useState(initial);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    const response = await fetch("/api/migration/switching", { cache: "no-store" });
    if (!response.ok) return;
    const json = (await response.json()) as { switching?: CustomerSwitchingSnapshot };
    if (json.switching) setSnapshot(json.switching);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => void refresh(), 45000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  async function bulkSkipReview() {
    if (!canUpdate) return;
    setLoading(true);
    try {
      const response = await fetch("/api/migration/switching", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "bulk_skip_review" })
      });
      const json = await response.json();
      if (!response.ok) throw new Error(readApiError(json, "Could not skip review items"));
      notify({
        title: "Exceptions cleared",
        description: `Skipped ${json.result?.skipped ?? 0} review items. You can still re-import later if needed.`,
        variant: "success"
      });
      await refresh();
    } catch (error) {
      notify({
        title: "Could not clear exceptions",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "danger"
      });
    } finally {
      setLoading(false);
    }
  }

  const entityRows = [
    { label: "Properties imported", imported: snapshot.imported.properties, live: snapshot.portfolio.properties },
    { label: "Units imported", imported: snapshot.imported.units, live: snapshot.portfolio.units },
    { label: "Residents imported", imported: snapshot.imported.residents, live: snapshot.portfolio.residents },
    { label: "Applicants imported", imported: snapshot.imported.applicants, live: snapshot.portfolio.applicants },
    { label: "Leases imported", imported: snapshot.imported.leases, live: snapshot.portfolio.leases },
    { label: "Documents imported", imported: snapshot.imported.documents, live: snapshot.portfolio.documents },
    { label: "Vendors imported", imported: snapshot.imported.vendors, live: snapshot.portfolio.vendors },
    { label: "Owners imported", imported: snapshot.imported.owners, live: snapshot.portfolio.owners }
  ];

  return (
    <div className="space-y-6">
      <Card className="space-y-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="mpa-section-label text-[var(--mpa-color-brand-primary)]">Customer switching</p>
            <h2 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
              Your path from old software to day-one operations
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-[var(--mpa-color-text-secondary)]">
              We’ll show progress, catch problems early, and celebrate when you’re ready to go live — without jargon.
            </p>
          </div>
          {canCreate ? (
            <Link href="/migration/new">
              <Button>Continue import</Button>
            </Link>
          ) : null}
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="font-medium text-[var(--mpa-color-text-primary)]">
              Overall completion · {snapshot.overallCompletionPct}%
            </span>
            <span className="text-[var(--mpa-color-text-secondary)]">
              {statusLabel(snapshot.goLiveStatus)} · ETA {formatEta(snapshot.estimatedMinutesRemaining)}
            </span>
          </div>
          <div
            className="h-3 overflow-hidden rounded-full bg-[var(--mpa-color-bg-surface-muted)]"
            role="progressbar"
            aria-valuenow={snapshot.overallCompletionPct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-[var(--mpa-color-brand-primary)] transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, snapshot.overallCompletionPct))}%` }}
            />
          </div>
          <p className="text-xs text-[var(--mpa-color-text-secondary)]">
            {snapshot.remainingTasks} remaining task{snapshot.remainingTasks === 1 ? "" : "s"} ·{" "}
            {snapshot.metrics.pendingReview} import exception{snapshot.metrics.pendingReview === 1 ? "" : "s"}
          </p>
        </div>
      </Card>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {entityRows.map((row) => (
          <Card key={row.label} className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
              {row.label}
            </p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-[var(--mpa-color-text-primary)]">
              {row.imported}
            </p>
            <p className="text-xs text-[var(--mpa-color-text-secondary)]">Live in portfolio: {row.live}</p>
          </Card>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-3 p-5">
          <h3 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">Migration checklist</h3>
          <ul className="space-y-2">
            {snapshot.checklist.map((item) => (
              <li
                key={item.id}
                className={`rounded-md border px-3 py-2 text-sm ${
                  item.complete
                    ? "border-[var(--mpa-color-border)]"
                    : "border-[var(--mpa-color-danger)]/30 bg-[var(--mpa-color-danger)]/5"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-[var(--mpa-color-text-primary)]">
                      {item.complete ? "✓" : "○"} {item.label}
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--mpa-color-text-secondary)]">{item.help}</p>
                  </div>
                  {!item.complete ? (
                    <Link href={item.href} className="shrink-0 text-xs font-semibold text-[var(--mpa-color-brand-primary)]">
                      Fix
                    </Link>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="space-y-3 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">Smart validation</h3>
            {canUpdate && snapshot.metrics.pendingReview > 0 ? (
              <Button size="sm" variant="secondary" disabled={loading} onClick={() => void bulkSkipReview()}>
                One-click skip exceptions
              </Button>
            ) : null}
          </div>
          {snapshot.validationIssues.length === 0 ? (
            <p className="text-sm text-[var(--mpa-color-text-secondary)]">
              No blocking data issues detected. Looking good.
            </p>
          ) : (
            <ul className="space-y-2">
              {snapshot.validationIssues.map((issue) => (
                <li
                  key={issue.id}
                  className={`rounded-md border px-3 py-2 text-sm ${
                    issue.severity === "error"
                      ? "border-[var(--mpa-color-danger)]/40 bg-[var(--mpa-color-danger)]/5"
                      : "border-[var(--mpa-color-border)]"
                  }`}
                >
                  <p className="font-medium text-[var(--mpa-color-text-primary)]">
                    {issue.title} · {issue.count}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--mpa-color-text-secondary)]">{issue.description}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Link href={issue.fixHref}>
                      <Button size="sm" variant="secondary">
                        {issue.fixLabel}
                      </Button>
                    </Link>
                    {issue.fixAction === "bulk_skip_review" && canUpdate ? (
                      <Button size="sm" disabled={loading} onClick={() => void bulkSkipReview()}>
                        Skip all exceptions
                      </Button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card id="go-live" className="space-y-4 p-5">
        {snapshot.goLiveReady ? (
          <>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--mpa-color-brand-primary)] text-2xl text-[var(--mpa-color-text-inverse)]">
              ✓
            </div>
            <div className="text-center">
              <h3 className="font-display text-xl font-semibold text-[var(--mpa-color-text-primary)]">
                You’re ready to go live
              </h3>
              <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
                Your portfolio is in M.P.A. Celebrate with your team — then run day one from Operations Center.
              </p>
            </div>
          </>
        ) : (
          <div>
            <h3 className="font-display text-xl font-semibold text-[var(--mpa-color-text-primary)]">
              Go-Live Assistant
            </h3>
            <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
              Finish the checklist and clear exceptions. When you hit 100%, we’ll unlock the full go-live celebration.
            </p>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          {snapshot.goLiveGroups.map((group) => (
            <div key={group.title} className="rounded-lg border border-[var(--mpa-color-border)] p-3">
              <p className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">{group.title}</p>
              <ul className="mt-2 space-y-1 text-xs text-[var(--mpa-color-text-secondary)]">
                {group.items.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div>
          <p className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">Recommended first actions</p>
          <ul className="mt-2 space-y-2">
            {snapshot.recommendedFirstActions.map((action) => (
              <li key={action.href + action.label}>
                <Link
                  href={action.href}
                  className="flex items-start justify-between gap-3 rounded-md border border-[var(--mpa-color-border)] px-3 py-2 hover:border-[var(--mpa-color-brand)]"
                >
                  <span>
                    <span className="block text-sm font-medium text-[var(--mpa-color-text-primary)]">{action.label}</span>
                    <span className="text-xs text-[var(--mpa-color-text-secondary)]">{action.why}</span>
                  </span>
                  <span className="text-xs font-semibold text-[var(--mpa-color-brand-primary)]">Open</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Card>
    </div>
  );
}
