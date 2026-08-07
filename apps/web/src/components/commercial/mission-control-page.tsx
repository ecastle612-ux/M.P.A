"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatMoney } from "@mpa/shared";
import {
  Badge,
  EmptyState,
  OperationsConsoleShell,
  PageHeader,
  Skeleton,
  StatusBanner,
  TimelineView
} from "@mpa/ui";
import { useCommercialContext } from "../shell/commercial-context";
import { useOrganizationContext } from "../shell/organization-context";
import { Breadcrumbs } from "../shell/breadcrumbs";

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

function AttentionList({
  title,
  items,
  empty
}: {
  title: string;
  items: AttentionItem[];
  empty: string;
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
        {title}
      </h3>
      {items.length === 0 ? (
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">{empty}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className="block rounded-md border border-[var(--mpa-color-border-subtle)] px-3 py-2 text-sm hover:bg-[var(--mpa-color-bg-subtle)]"
              >
                <span className="font-medium text-[var(--mpa-color-text-primary)]">{item.title}</span>
                <span className="mt-0.5 block text-xs text-[var(--mpa-color-text-secondary)]">
                  {item.detail} · {item.domain}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function MissionControlPage() {
  const { activeOrganization } = useOrganizationContext();
  const { productLabel, setupComplete } = useCommercialContext();
  const [state, setState] = useState<MissionControlState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
  }, [activeOrganization?.id]);

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

  return (
    <main className="flex-1 space-y-4 bg-[var(--mpa-color-bg-app)] p-4 md:p-6">
      <Breadcrumbs
        items={[
          { href: "/dashboard", label: "Home" },
          { label: "Mission Control" }
        ]}
      />

      <PageHeader
        eyebrow={`${productLabel ?? "Property Manager"} · Daily operations`}
        title="Mission Control"
        description={
          loading
            ? "Loading your attention home…"
            : (daily?.greeting ?? "Your attention home — start the day here.")
        }
        meta={
          <div className="flex flex-wrap gap-2 text-sm text-[var(--mpa-color-text-secondary)]">
            <span>{activeOrganization?.name ?? "Organization"}</span>
            <span>·</span>
            <span>{loading ? "…" : `${state?.propertyCount ?? 0} properties`}</span>
            {state?.dailyOpsReady ? <Badge variant="success">Daily ops ready</Badge> : null}
            {state?.ownerPortfolioReady ? (
              <Badge variant="success">Customer promise complete</Badge>
            ) : null}
          </div>
        }
      />

      {error ? <StatusBanner variant="danger">{error}</StatusBanner> : null}

      <section
        aria-label="M.P.A. Assistant briefing"
        className="max-w-4xl space-y-2 rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-5"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          M.P.A. Assistant
        </p>
        {loading ? (
          <Skeleton className="h-16 w-full" />
        ) : (
          <>
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
            {state?.ownerPortfolioReady ? (
              <p className="text-sm text-[var(--mpa-color-status-success)]">
                I can confidently monitor my investment portfolio using M.P.A.
              </p>
            ) : state?.dailyOpsReady ? (
              <p className="text-sm text-[var(--mpa-color-status-success)]">
                I can run my property management business from this dashboard.
              </p>
            ) : null}
          </>
        )}
      </section>

      {nextAction ? (
        <section
          aria-label="Today's mission"
          className="max-w-4xl space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-5"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
            Today&apos;s mission
          </p>
          <h2 className="text-xl font-semibold text-[var(--mpa-color-text-primary)]">
            {nextAction.title}
          </h2>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">{nextAction.detail}</p>
          <Link
            href={nextAction.href}
            className="inline-flex h-9 items-center justify-center rounded-md bg-[var(--mpa-color-brand-primary)] px-4 text-sm font-medium text-white hover:bg-[#0C5A48]"
          >
            {nextAction.title}
          </Link>
        </section>
      ) : null}

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : showDailyOps && daily ? (
        <OperationsConsoleShell
          context={
            <div className="flex flex-wrap gap-2 text-sm">
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
                  Existing platform signals — not a second dashboard.
                </p>
              </div>
              <AttentionList
                title="Immediate attention"
                items={daily.immediateAttention}
                empty="Nothing urgent right now."
              />
              <AttentionList
                title="Waiting on me"
                items={daily.waitingOnMe}
                empty="Nothing waiting on you."
              />
              <AttentionList
                title="Waiting on others"
                items={daily.waitingOnOthers}
                empty="Nothing waiting on others."
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
                        <Link href={item.href} className="underline">
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
            <div className="space-y-6 p-4">
              <div>
                <h2 className="text-sm font-semibold">Recommended actions</h2>
                {daily.recommendedActions.length === 0 ? (
                  <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">
                    Portfolio looks clear — use Quick Actions to continue.
                  </p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {daily.recommendedActions.map((item, index) => (
                      <li key={item.id}>
                        <Link
                          href={item.href}
                          className="flex items-center justify-between gap-2 rounded-md border border-[var(--mpa-color-border-default)] px-3 py-2 text-sm"
                        >
                          <span>
                            {index + 1}. {item.title}
                          </span>
                          <span className="text-xs text-[var(--mpa-color-text-secondary)]">
                            {item.domain}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <h2 className="text-sm font-semibold">Quick actions</h2>
                <p className="mt-0.5 text-xs text-[var(--mpa-color-text-secondary)]">
                  Launch existing workflows only.
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {daily.quickActions.map((action) => (
                    <Link
                      key={action.id}
                      href={action.href}
                      className="rounded-md border border-[var(--mpa-color-brand-primary)] bg-[var(--mpa-color-bg-surface)] px-3 py-1.5 text-sm font-medium"
                    >
                      {action.label}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div>
                  <h2 className="text-sm font-semibold">Property financial snapshot</h2>
                  {daily.financialSnapshot ? (
                    <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <dt className="text-xs text-[var(--mpa-color-text-secondary)]">Collected</dt>
                        <dd>{formatMoney(daily.financialSnapshot.rentCollectedThisMonth)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-[var(--mpa-color-text-secondary)]">Outstanding</dt>
                        <dd>{formatMoney(daily.financialSnapshot.outstandingRent)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-[var(--mpa-color-text-secondary)]">Delinquent</dt>
                        <dd>{daily.financialSnapshot.delinquencyCount}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-[var(--mpa-color-text-secondary)]">Vendor approvals</dt>
                        <dd>{daily.financialSnapshot.vendorInvoicesAwaitingApproval}</dd>
                      </div>
                    </dl>
                  ) : (
                    <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">
                      Open{" "}
                      <Link href="/pm/financial-operations" className="underline">
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

                <div>
                  <h2 className="text-sm font-semibold">Open maintenance</h2>
                  {daily.openMaintenance.length === 0 ? (
                    <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">No open work orders.</p>
                  ) : (
                    <ul className="mt-2 space-y-1 text-sm">
                      {daily.openMaintenance.map((row) => (
                        <li key={row.id}>
                          <Link href={row.href} className="underline">
                            {row.title}
                          </Link>{" "}
                          <span className="text-xs text-[var(--mpa-color-text-secondary)]">
                            · {row.status} · {row.priority}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <h2 className="text-sm font-semibold">Upcoming leases</h2>
                  {daily.upcomingLeases.length === 0 ? (
                    <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">
                      No leases awaiting signature/activation.
                    </p>
                  ) : (
                    <ul className="mt-2 space-y-1 text-sm">
                      {daily.upcomingLeases.map((lease) => (
                        <li key={lease.id}>
                          <Link href={lease.href} className="underline">
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

                <div>
                  <h2 className="text-sm font-semibold">Resident & vendor alerts</h2>
                  <ul className="mt-2 space-y-1 text-sm">
                    {daily.residentAlerts.map((item) => (
                      <li key={item.id}>
                        <Link href={item.href} className="underline">
                          {item.title}
                        </Link>{" "}
                        <span className="text-xs text-[var(--mpa-color-text-secondary)]">
                          · {item.detail}
                        </span>
                      </li>
                    ))}
                    {daily.vendorAlerts.map((item) => (
                      <li key={item.id}>
                        <Link href={item.href} className="underline">
                          {item.title}
                        </Link>{" "}
                        <span className="text-xs text-[var(--mpa-color-text-secondary)]">
                          · {item.detail}
                        </span>
                      </li>
                    ))}
                    {daily.residentAlerts.length === 0 && daily.vendorAlerts.length === 0 ? (
                      <li className="text-[var(--mpa-color-text-secondary)]">No resident/vendor alerts.</li>
                    ) : null}
                  </ul>
                </div>
              </div>

              <div>
                <h2 className="text-sm font-semibold">Recent activity</h2>
                {daily.recentActivity.length === 0 ? (
                  <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">No recent finance activity.</p>
                ) : (
                  <ul className="mt-2 space-y-2 text-sm">
                    {daily.recentActivity.map((item) => (
                      <li key={item.id} className="border-b border-[var(--mpa-color-border-subtle)] py-1">
                        <Link href={item.href} className="font-medium underline">
                          {item.title}
                        </Link>
                        <span className="mt-0.5 block text-xs text-[var(--mpa-color-text-secondary)]">
                          {item.detail}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <h2 className="text-sm font-semibold">Timeline</h2>
                <div className="mt-2">
                  <TimelineView
                    items={daily.timeline.map((item) => ({
                      id: item.id,
                      title: item.title,
                      detail: item.detail,
                      occurredAtLabel: item.occurredAt
                    }))}
                    empty={
                      <p className="text-sm text-[var(--mpa-color-text-secondary)]">No recent timeline events.</p>
                    }
                  />
                </div>
              </div>
            </div>
          }
        />
      ) : (
        <EmptyState
          title="Complete earlier journeys to unlock daily operations"
          description="Add a property, team, resident, lease, rent, and maintenance — then Mission Control becomes your daily attention home."
        />
      )}

      {state && state.properties.length > 0 ? (
        <section className="max-w-4xl space-y-3">
          <h2 className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">
            Your properties
          </h2>
          <ul className="grid gap-2 md:grid-cols-2">
            {state.properties.map((property) => (
              <li key={property.id}>
                <Link
                  href={`/pm/properties/${property.id}`}
                  className="flex items-center justify-between rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-4 py-3 text-sm hover:bg-[var(--mpa-color-bg-subtle)]"
                >
                  <span className="font-medium text-[var(--mpa-color-text-primary)]">
                    {property.name}
                  </span>
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
