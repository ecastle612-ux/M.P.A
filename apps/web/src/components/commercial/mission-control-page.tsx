"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { formatMoney, ownerDay1ChecklistForSku } from "@mpa/shared";
import { resolveWorkOrderPriorityVariant, buttonClassName, Button, Alert, Badge, EmptyState, MetricCard, OperationsConsoleShell, Skeleton, TimelineView } from "@mpa/ui";
import { useCommercialContext } from "../shell/commercial-context";
import { useOrganizationContext } from "../shell/organization-context";
import { Breadcrumbs } from "../shell/breadcrumbs";
import { OwnerDay1ChecklistCard } from "./owner-day1-checklist";

type NextAction = {
  id: string;
  title: string;
  detail: string;
  href: string;
  assistantRecommendation: string;
};

type AttentionItem = {
  id: string;
  domain: string;
  title: string;
  detail: string;
  href: string;
  urgency: string;
};

type MissionControlState = {
  propertyCount: number;
  properties: Array<{ id: string; name: string; status: string; unitCount: number }>;
  nextAction: NextAction;
  assistantRecommendation: string;
  setupComplete: boolean;
  dailyOpsReady?: boolean;
  ownerPortfolioReady?: boolean;
  maintenanceReady?: boolean;
  dailyOperations?: {
    greeting: string;
    briefing: {
      summary: string;
      immediateCount: number;
      waitingOnMeCount: number;
      waitingOnOthersCount: number;
      firstTask: string;
      changedSinceLastLogin: string;
    };
    successCopy: string;
    immediateAttention: AttentionItem[];
    waitingOnMe: AttentionItem[];
    waitingOnOthers: AttentionItem[];
    recommendedActions: AttentionItem[];
    quickActions: Array<{ id: string; label: string; href: string }>;
    financialSnapshot: {
      expectedRentThisMonth: number;
      rentCollectedThisMonth: number;
      outstandingRent: number;
      delinquencyCount: number;
      vendorInvoicesAwaitingApproval: number;
    } | null;
    financeAlerts: string[];
    openMaintenance: Array<{ id: string; title: string; status: string; priority: string; href: string }>;
    upcomingLeases: Array<{
      id: string;
      status: string;
      residentName: string;
      propertyName: string;
      href: string;
    }>;
    residentAlerts: Array<{ id: string; title: string; detail: string; href: string }>;
    vendorAlerts: Array<{ id: string; title: string; detail: string; href: string }>;
    recentActivity: Array<{ id: string; title: string; detail: string; href: string; occurredAt: string }>;
    timeline: Array<{ id: string; title: string; detail: string; occurredAt: string }>;
    notifications: Array<{ id: string; title: string; detail: string; href: string }>;
  } | null;
};

const linkFocus =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-border-focus,#0F6B56)] focus-visible:ring-offset-2";

function urgencyEdge(urgency: string): string {
  if (urgency === "immediate") return "border-l-[3px] border-l-[var(--mpa-color-status-danger,#C0392B)]";
  if (urgency === "waiting_on_me") return "border-l-[3px] border-l-[var(--mpa-color-status-warning,#B45309)]";
  return "border-l-[3px] border-l-[var(--mpa-color-border-default)]";
}

function UrgencyBadge({ urgency }: { urgency: string }) {
  if (urgency === "immediate") return <Badge variant="danger">Immediate</Badge>;
  if (urgency === "waiting_on_me") return <Badge variant="warning">Waiting on me</Badge>;
  return <Badge variant="neutral">Waiting on others</Badge>;
}

function AttentionList({
  title,
  items,
  empty,
  defaultUrgency
}: {
  title: string;
  items: AttentionItem[];
  empty: string;
  defaultUrgency: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          {title}
        </h3>
        <span className="text-xs tabular-nums text-[var(--mpa-color-text-muted)]">{items.length}</span>
      </div>
      {items.length === 0 ? (
        <p className="rounded-md border border-dashed border-[var(--mpa-color-border-subtle)] bg-white px-3 py-3 text-sm text-[var(--mpa-color-text-secondary)]">
          {empty}
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => {
            const urgency = item.urgency || defaultUrgency;
            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className={`mpa-lift block rounded-md border border-[var(--mpa-color-border-subtle)] bg-white px-3 py-2.5 text-sm ${urgencyEdge(urgency)} ${linkFocus}`}
                >
                  <span className="flex flex-wrap items-start justify-between gap-2">
                    <span className="font-medium text-[var(--mpa-color-text-primary)]">{item.title}</span>
                    <UrgencyBadge urgency={urgency} />
                  </span>
                  <span className="mt-0.5 block text-xs text-[var(--mpa-color-text-secondary)]">
                    {item.detail} · {item.domain}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function WorkSection({
  title,
  description,
  children
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div>
        <h2 className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">{title}</h2>
        {description ? (
          <p className="mt-0.5 text-xs text-[var(--mpa-color-text-secondary)]">{description}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function healthFromDaily(daily: NonNullable<MissionControlState["dailyOperations"]>): {
  label: string;
  detail: string;
  variant: "success" | "warning" | "danger";
} {
  const immediate = daily.briefing.immediateCount;
  const waiting = daily.briefing.waitingOnMeCount;
  const delinquent = daily.financialSnapshot?.delinquencyCount ?? 0;
  if (immediate > 0 || delinquent > 2) {
    return {
      label: "Needs attention",
      detail: immediate > 0 ? `${immediate} immediate item${immediate === 1 ? "" : "s"}` : "Financial risk signals",
      variant: "danger"
    };
  }
  if (waiting > 0 || delinquent > 0) {
    return {
      label: "Watch",
      detail: waiting > 0 ? `${waiting} waiting on you` : "Outstanding rent to review",
      variant: "warning"
    };
  }
  return {
    label: "Healthy",
    detail: "No immediate blockers in your attention queues",
    variant: "success"
  };
}

export function MissionControlPage() {
  const { activeOrganization } = useOrganizationContext();
  const { productLabel, setupComplete } = useCommercialContext();
  const [state, setState] = useState<MissionControlState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    setReloadKey((value) => value + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/pm/mission-control");
        const body = await response.json();
        if (!response.ok) {
          throw new Error(body.error ?? "Failed to load Mission Control");
        }
        if (!cancelled) {
          setError(null);
          setState(body as MissionControlState);
        }
      } catch (err) {
        if (!cancelled) {
          setState(null);
          setError(err instanceof Error ? err.message : "Failed to load Mission Control");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeOrganization?.id, reloadKey]);

  const nextAction =
    state?.nextAction ??
    (error
      ? null
      : !setupComplete
        ? {
            id: "complete_setup",
            title: "Finish Guided Setup",
            detail: "Complete setup before daily operations begin.",
            href: "/setup",
            assistantRecommendation: "Finish Guided Setup."
          }
        : {
            id: "add_first_property",
            title: "Add your first property",
            detail: "Create and activate a property to begin managing your portfolio.",
            href: "/pm/properties?new=1",
            assistantRecommendation: "Add your first property."
          });

  const daily = state?.dailyOperations;
  const showDailyOps = Boolean(daily);
  const isFirstRun =
    Boolean(setupComplete || state?.setupComplete) && (state?.propertyCount ?? 0) === 0 && !showDailyOps;
  const eyebrow =
    isFirstRun || (!setupComplete && !showDailyOps)
      ? "Getting started"
      : "Daily operations";
  const health = daily ? healthFromDaily(daily) : null;

  return (
    <main className="flex-1 space-y-4 bg-[var(--mpa-color-bg-app)] p-4 md:p-6">
      <Breadcrumbs
        items={[
          { href: "/dashboard", label: "Home" },
          { label: "Mission Control" }
        ]}
      />

      <header className="max-w-4xl space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          {productLabel ?? "Property Manager"} · {eyebrow}
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-[var(--mpa-color-text-primary)]">
          Mission Control
        </h1>
        <p className="max-w-2xl text-base leading-7 text-[var(--mpa-color-text-secondary)]">
          {loading
            ? "Loading your attention home…"
            : isFirstRun
              ? "Your attention home after Guided Setup — start with one clear next step."
              : (daily?.greeting ?? "Your operational command center — start and end the day here.")}
        </p>
        <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--mpa-color-text-secondary)]">
          <span>{activeOrganization?.name ?? "Organization"}</span>
          <span aria-hidden>·</span>
          <span>{loading ? "…" : `${state?.propertyCount ?? 0} properties`}</span>
          {health ? <Badge variant={health.variant}>{health.label}</Badge> : null}
          {state?.dailyOpsReady ? <Badge variant="success">Daily ops ready</Badge> : null}
          {state?.ownerPortfolioReady ? (
            <Badge variant="success">Customer promise complete</Badge>
          ) : null}
        </div>
      </header>

      {isFirstRun ? (
        <section
          aria-label="Welcome"
          className="max-w-4xl space-y-2 rounded-md border border-[var(--mpa-color-brand-primary)]/30 bg-[var(--mpa-color-brand-primary-subtle,#E6F4EF)] p-5"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-brand-primary)]">
            Welcome
          </p>
          <p className="text-base font-semibold text-[var(--mpa-color-text-primary)]">
            Congratulations. Your organization is now operational.
          </p>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            Guided Setup is complete. You are the Organization Admin for this Property Manager
            organization. Begin with one clear task: add your first property. After that, Mission
            Control will guide inviting your team, residents, leasing, and daily operations.
          </p>
        </section>
      ) : null}

      {isFirstRun ? (
        <OwnerDay1ChecklistCard
          checklist={ownerDay1ChecklistForSku("mpa_property_manager")}
          showOwnerClarity
        />
      ) : null}

      {error ? (
        <Alert
          variant="danger"
          className="max-w-4xl"
          action={
            <Button type="button" variant="secondary" size="sm" onClick={reload}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      ) : null}

      {loading ? (
        <div className="max-w-5xl space-y-3" aria-busy="true" aria-label="Loading Mission Control">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : null}

      {!loading && showDailyOps && daily ? (
        <section aria-label="At a glance" className="max-w-5xl space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-brand-primary)]">
              At a glance
            </p>
            {health ? (
              <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                Organization: <span className="font-medium text-[var(--mpa-color-text-primary)]">{health.label}</span>
                {" — "}
                {health.detail}
              </p>
            ) : null}
          </div>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <li>
              <MetricCard
                label="Immediate attention"
                value={daily.briefing.immediateCount}
                hint={daily.immediateAttention[0]?.title ?? "Nothing urgent"}
                tone="danger"
              />
            </li>
            <li>
              <MetricCard
                label="Can wait"
                value={daily.briefing.waitingOnOthersCount}
                hint={`Waiting on others · ${daily.briefing.waitingOnMeCount} on you`}
                tone="warning"
              />
            </li>
            <li className="sm:col-span-2 xl:col-span-1">
              <MetricCard
                label="Changed today"
                value={daily.briefing.changedSinceLastLogin}
                tone="neutral"
                size="copy"
              />
            </li>
            <li className="sm:col-span-2 xl:col-span-1">
              <MetricCard
                label="Do next"
                value={daily.briefing.firstTask}
                tone="brand"
                size="copy"
              />
            </li>
            <li>
              <MetricCard
                label="Health"
                value={health?.label ?? "—"}
                hint={health?.detail}
                tone={health?.variant ?? "neutral"}
              />
            </li>
          </ul>
        </section>
      ) : null}

      {!loading ? (
        <section
          aria-label="M.P.A. Assistant briefing"
          className="max-w-4xl space-y-2 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4 md:p-5"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
            M.P.A. Assistant
          </p>
          <p className="text-base font-semibold text-[var(--mpa-color-text-primary)]">
            {state?.assistantRecommendation ??
              nextAction?.assistantRecommendation ??
              (error
                ? "Mission Control could not load recommendations for this organization."
                : "Review your workspace.")}
          </p>
          {daily ? (
            <p className="text-sm text-[var(--mpa-color-text-secondary)]">{daily.briefing.summary}</p>
          ) : null}
          {daily?.successCopy ? (
            <p className="text-sm text-[var(--mpa-color-status-success,#0F6B56)]">{daily.successCopy}</p>
          ) : null}
          {state?.ownerPortfolioReady ? (
            <p className="text-sm text-[var(--mpa-color-status-success,#0F6B56)]">
              I can confidently monitor my investment portfolio using M.P.A.
            </p>
          ) : state?.dailyOpsReady ? (
            <p className="text-sm text-[var(--mpa-color-status-success,#0F6B56)]">
              I can run my property management business from this dashboard.
            </p>
          ) : null}
        </section>
      ) : null}

      {!loading && nextAction ? (
        <section
          aria-label="Today's mission"
          className="max-w-4xl space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4 md:p-5"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
            {isFirstRun ? "Where to begin" : "What should I work on next"}
          </p>
          <h2 className="font-display text-xl font-semibold text-[var(--mpa-color-text-primary)]">
            {nextAction.title}
          </h2>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">{nextAction.detail}</p>
          <Link
            href={nextAction.href}
            className={buttonClassName()}
          >
            {nextAction.title}
          </Link>
        </section>
      ) : null}

      {!loading && showDailyOps && daily ? (
        <OperationsConsoleShell
          context={
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-muted)]">
                Attention bands
              </span>
              <Badge variant="danger">{daily.briefing.immediateCount} immediate</Badge>
              <Badge variant="warning">{daily.briefing.waitingOnMeCount} waiting on me</Badge>
              <Badge variant="neutral">{daily.briefing.waitingOnOthersCount} waiting on others</Badge>
            </div>
          }
          queue={
            <div className="space-y-5 p-4">
              <div>
                <h2 className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">
                  Attention queue
                </h2>
                <p className="mt-0.5 text-xs text-[var(--mpa-color-text-secondary)]">
                  Prioritized platform signals — act from here.
                </p>
              </div>
              <AttentionList
                title="Immediate attention"
                items={daily.immediateAttention}
                empty="Everything's handled. No immediate items need your attention."
                defaultUrgency="immediate"
              />
              <AttentionList
                title="Waiting on me"
                items={daily.waitingOnMe}
                empty="Nothing waiting on you."
                defaultUrgency="waiting_on_me"
              />
              <AttentionList
                title="Waiting on others"
                items={daily.waitingOnOthers}
                empty="Nothing waiting on others."
                defaultUrgency="waiting_on_others"
              />
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
                  Notifications
                </h3>
                {daily.notifications.length === 0 ? (
                  <p className="text-sm text-[var(--mpa-color-text-secondary)]">No active alerts.</p>
                ) : (
                  <ul className="space-y-1 text-sm">
                    {daily.notifications.map((item) => (
                      <li key={item.id}>
                        <Link href={item.href} className={`underline ${linkFocus}`}>
                          {item.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          }
          workPlane={
            <div className="space-y-8 p-4">
              <WorkSection
                title="Do next"
                description="Recommended actions and shortcuts into existing workflows."
              >
                {daily.recommendedActions.length === 0 ? (
                  <p className="text-sm text-[var(--mpa-color-text-secondary)]">
                    Portfolio looks clear — use Quick Actions to continue.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {daily.recommendedActions.map((item, index) => (
                      <li key={item.id}>
                        <Link
                          href={item.href}
                          className={`flex items-center justify-between gap-2 rounded-md border border-[var(--mpa-color-border-default)] px-3 py-2 text-sm hover:bg-[var(--mpa-color-bg-subtle,#f7faf9)] ${linkFocus}`}
                        >
                          <span>
                            <span className="tabular-nums text-[var(--mpa-color-text-muted)]">
                              {index + 1}.
                            </span>{" "}
                            {item.title}
                          </span>
                          <span className="text-xs text-[var(--mpa-color-text-secondary)]">
                            {item.domain}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-muted)]">
                    Quick actions
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {daily.quickActions.map((action) => (
                      <Link
                        key={action.id}
                        href={action.href}
                        className={`rounded-md border border-[var(--mpa-color-brand-primary)] bg-white px-3 py-1.5 text-sm font-medium text-[var(--mpa-color-text-primary)] hover:bg-[var(--mpa-color-brand-primary-subtle,#E6F4EF)] ${linkFocus}`}
                      >
                        {action.label}
                      </Link>
                    ))}
                    <Link
                      href="/shared/documents"
                      className={`rounded-md border border-[var(--mpa-color-border-default)] bg-white px-3 py-1.5 text-sm font-medium text-[var(--mpa-color-text-primary)] hover:border-[var(--mpa-color-brand-primary)] ${linkFocus}`}
                    >
                      Documents
                    </Link>
                    <Link
                      href="/shared/reports"
                      className={`rounded-md border border-[var(--mpa-color-border-default)] bg-white px-3 py-1.5 text-sm font-medium text-[var(--mpa-color-text-primary)] hover:border-[var(--mpa-color-brand-primary)] ${linkFocus}`}
                    >
                      Reporting
                    </Link>
                  </div>
                </div>
              </WorkSection>

              <WorkSection
                title="Portfolio signals"
                description="Healthy vs at-risk signals from finance, maintenance, leases, and people."
              >
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-md border border-[var(--mpa-color-border-subtle)] p-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
                      Financial snapshot
                    </h3>
                    {daily.financialSnapshot ? (
                      <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <dt className="text-xs text-[var(--mpa-color-text-secondary)]">Collected</dt>
                          <dd className="font-medium">
                            {formatMoney(daily.financialSnapshot.rentCollectedThisMonth)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs text-[var(--mpa-color-text-secondary)]">Outstanding</dt>
                          <dd
                            className={
                              daily.financialSnapshot.outstandingRent > 0
                                ? "font-medium text-[#B45309]"
                                : "font-medium"
                            }
                          >
                            {formatMoney(daily.financialSnapshot.outstandingRent)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs text-[var(--mpa-color-text-secondary)]">Delinquent</dt>
                          <dd
                            className={
                              daily.financialSnapshot.delinquencyCount > 0
                                ? "font-medium text-[#C0392B]"
                                : "font-medium"
                            }
                          >
                            {daily.financialSnapshot.delinquencyCount}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs text-[var(--mpa-color-text-secondary)]">Vendor approvals</dt>
                          <dd className="font-medium">
                            {daily.financialSnapshot.vendorInvoicesAwaitingApproval}
                          </dd>
                        </div>
                      </dl>
                    ) : (
                      <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">
                        Open{" "}
                        <Link href="/pm/financial-operations" className={`underline ${linkFocus}`}>
                          Financial Operations
                        </Link>{" "}
                        for money detail.
                      </p>
                    )}
                    {daily.financeAlerts.length > 0 ? (
                      <ul className="mt-2 space-y-1 text-xs text-[var(--mpa-color-text-secondary)]">
                        {daily.financeAlerts.slice(0, 3).map((alert) => (
                          <li key={alert}>• {alert}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>

                  <div className="rounded-md border border-[var(--mpa-color-border-subtle)] p-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
                      Open maintenance
                    </h3>
                    {daily.openMaintenance.length === 0 ? (
                      <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">
                        No open work orders — maintenance looks healthy.
                      </p>
                    ) : (
                      <ul className="mt-2 space-y-2 text-sm">
                        {daily.openMaintenance.map((row) => (
                          <li key={row.id} className="flex flex-wrap items-center justify-between gap-2">
                            <Link href={row.href} className={`font-medium underline ${linkFocus}`}>
                              {row.title}
                            </Link>
                            <span className="flex flex-wrap gap-1">
                              <Badge variant="neutral">{row.status}</Badge>
                              <Badge variant={resolveWorkOrderPriorityVariant(row.priority)}>{row.priority}</Badge>
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="rounded-md border border-[var(--mpa-color-border-subtle)] p-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
                      Upcoming leases
                    </h3>
                    {daily.upcomingLeases.length === 0 ? (
                      <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">
                        No leases awaiting signature/activation.
                      </p>
                    ) : (
                      <ul className="mt-2 space-y-1 text-sm">
                        {daily.upcomingLeases.map((lease) => (
                          <li key={lease.id}>
                            <Link href={lease.href} className={`underline ${linkFocus}`}>
                              {lease.residentName}
                            </Link>{" "}
                            <span className="text-xs text-[var(--mpa-color-text-secondary)]">
                              · {lease.propertyName} · {lease.status}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="rounded-md border border-[var(--mpa-color-border-subtle)] p-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
                      Resident & vendor alerts
                    </h3>
                    <ul className="mt-2 space-y-1 text-sm">
                      {daily.residentAlerts.map((item) => (
                        <li key={item.id}>
                          <Link href={item.href} className={`underline ${linkFocus}`}>
                            {item.title}
                          </Link>{" "}
                          <span className="text-xs text-[var(--mpa-color-text-secondary)]">
                            · {item.detail}
                          </span>
                        </li>
                      ))}
                      {daily.vendorAlerts.map((item) => (
                        <li key={item.id}>
                          <Link href={item.href} className={`underline ${linkFocus}`}>
                            {item.title}
                          </Link>{" "}
                          <span className="text-xs text-[var(--mpa-color-text-secondary)]">
                            · {item.detail}
                          </span>
                        </li>
                      ))}
                      {daily.residentAlerts.length === 0 && daily.vendorAlerts.length === 0 ? (
                        <li className="text-[var(--mpa-color-text-secondary)]">
                          No resident/vendor alerts.
                        </li>
                      ) : null}
                    </ul>
                  </div>
                </div>
              </WorkSection>

              <WorkSection title="Recent activity" description="What moved recently across your portfolio.">
                {daily.recentActivity.length === 0 ? (
                  <p className="text-sm text-[var(--mpa-color-text-secondary)]">No recent finance activity.</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {daily.recentActivity.map((item) => (
                      <li key={item.id} className="border-b border-[var(--mpa-color-border-subtle)] py-1">
                        <Link href={item.href} className={`font-medium underline ${linkFocus}`}>
                          {item.title}
                        </Link>
                        <span className="mt-0.5 block text-xs text-[var(--mpa-color-text-secondary)]">
                          {item.detail}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
                    Timeline
                  </h3>
                  <div className="mt-2">
                    <TimelineView
                      items={daily.timeline.map((item) => ({
                        id: item.id,
                        title: item.title,
                        detail: item.detail,
                        occurredAtLabel: item.occurredAt
                      }))}
                      empty={
                        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
                          No recent timeline events.
                        </p>
                      }
                    />
                  </div>
                </div>
              </WorkSection>
            </div>
          }
        />
      ) : null}

      {!loading && !showDailyOps ? (
        isFirstRun ? (
          <EmptyState
            title="Add your first property to unlock daily operations"
            description="Mission Control becomes your daily attention home after you create a property. Use the button above to begin — name and units are enough."
          />
        ) : (
          <EmptyState
            title="Daily operations unlock as you configure your portfolio"
            description="When you have a property (and continue setup), Mission Control shows attention queues, financial snapshots, and recommended actions."
          />
        )
      ) : null}

      {state && state.properties.length > 0 ? (
        <section className="max-w-4xl space-y-3">
          <h2 className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">Your properties</h2>
          <ul className="grid gap-2 md:grid-cols-2">
            {state.properties.map((property) => (
              <li key={property.id}>
                <Link
                  href={`/pm/properties/${property.id}`}
                  className={`flex items-center justify-between rounded-md border border-[var(--mpa-color-border-default)] bg-white px-4 py-3 text-sm hover:bg-[var(--mpa-color-bg-subtle,#f7faf9)] ${linkFocus}`}
                >
                  <span className="font-medium text-[var(--mpa-color-text-primary)]">{property.name}</span>
                  <span className="text-xs text-[var(--mpa-color-text-secondary)]">
                    {property.status} · {property.unitCount} units
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
