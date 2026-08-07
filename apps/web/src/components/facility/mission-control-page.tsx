"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge, EmptyState, Skeleton, TimelineView } from "@mpa/ui";
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
  severity: string;
  priority: number;
  title: string;
  detail: string;
  href: string;
};

type FacilityMissionControlState = {
  siteCount: number;
  activeSiteCount: number;
  draftSiteCount: number;
  sites: Array<{
    id: string;
    name: string;
    status: string;
    timezone: string;
    locationCount: number;
    propertyName: string | null;
  }>;
  attention: AttentionItem[];
  nextAction: NextAction;
  assistantRecommendation: string;
  setupComplete: boolean;
  timeline: Array<{ id: string; title: string; detail: string; occurredAt: string; href: string }>;
  deferredSignals: string[];
};

export function FacilityMissionControlPage() {
  const { activeOrganization } = useOrganizationContext();
  const { productLabel, setupComplete } = useCommercialContext();
  const [state, setState] = useState<FacilityMissionControlState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/facility/mission-control");
        const body = await response.json();
        if (!response.ok) {
          throw new Error(body.error ?? "Failed to load Facility Mission Control");
        }
        if (!cancelled) {
          setError(null);
          setState(body as FacilityMissionControlState);
        }
      } catch (err) {
        if (!cancelled) {
          setState(null);
          setError(err instanceof Error ? err.message : "Failed to load Facility Mission Control");
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
    (!setupComplete
      ? {
          id: "complete_setup",
          title: "Finish Guided Setup",
          detail: "Complete setup before daily facility operations begin.",
          href: "/setup",
          assistantRecommendation: "Finish Guided Setup."
        }
      : {
          id: "add_first_site",
          title: "Add your first facility site",
          detail: "Create a site profile with timezone and a root location.",
          href: "/facility/sites?new=1",
          assistantRecommendation: "Add your first facility site."
        });

  return (
    <main className="flex-1 space-y-4 bg-[var(--mpa-color-bg-app)] p-4 md:p-6">
      <Breadcrumbs
        items={[
          { href: "/launcher", label: "Home" },
          { label: "Facility Mission Control" }
        ]}
      />

      <header className="max-w-3xl space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          {productLabel ?? "Facility Operations"} · Attention home
        </p>
        <h1 className="font-display text-3xl font-semibold text-[var(--mpa-color-text-primary)]">
          Facility Mission Control
        </h1>
        <p className="text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
          {loading
            ? "Loading facility attention…"
            : "Ranked operational attention for Facility Operations — not an analytics dashboard."}
        </p>
        <div className="flex flex-wrap gap-2 text-sm text-[var(--mpa-color-text-secondary)]">
          <span>{activeOrganization?.name ?? "Organization"}</span>
          <span>·</span>
          <span>
            {loading
              ? "…"
              : `${state?.activeSiteCount ?? 0} active sites · ${state?.siteCount ?? 0} total`}
          </span>
        </div>
      </header>

      {error ? <EmptyState title="Unable to load Mission Control" description={error} /> : null}

      {loading ? (
        <div className="max-w-3xl space-y-3">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : null}

      {!loading && !error ? (
        <>
          <section
            aria-label="M.P.A. Assistant"
            className="max-w-3xl space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-5"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
              M.P.A. Assistant
            </p>
            <p className="text-base font-medium text-[var(--mpa-color-text-primary)]">
              {state?.assistantRecommendation ?? nextAction.assistantRecommendation}
            </p>
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-[var(--mpa-color-text-primary)]">
                Today&apos;s mission
              </h2>
              <p className="text-sm text-[var(--mpa-color-text-secondary)]">{nextAction.detail}</p>
            </div>
            <Link
              href={nextAction.href}
              className="inline-flex rounded-md bg-[var(--mpa-color-action-primary,#1F4D3A)] px-4 py-2 text-sm font-medium text-white"
            >
              {nextAction.title}
            </Link>
          </section>

          <section className="max-w-3xl space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
              Attention
            </h2>
            {(state?.attention ?? []).length === 0 ? (
              <p className="text-sm text-[var(--mpa-color-text-secondary)]">
                No open facility attention. Site identity is established for Phase E.1.
              </p>
            ) : (
              <ul className="space-y-2">
                {(state?.attention ?? []).map((item) => (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className="block rounded-md border border-[var(--mpa-color-border-subtle)] bg-white px-3 py-2 text-sm hover:bg-[var(--mpa-color-bg-subtle,#f7faf9)]"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-[var(--mpa-color-text-primary)]">
                          {item.title}
                        </span>
                        <Badge variant="warning">{item.severity}</Badge>
                      </div>
                      <span className="mt-0.5 block text-xs text-[var(--mpa-color-text-secondary)]">
                        {item.detail}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-xs text-[var(--mpa-color-text-secondary)]">
              Later-slice signals reserved: {(state?.deferredSignals ?? []).join(", ")}.
            </p>
          </section>

          <section className="max-w-3xl space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
                Sites
              </h2>
              <Link href="/facility/overview" className="text-sm text-[var(--mpa-color-text-secondary)] underline">
                Facility Overview
              </Link>
            </div>
            {(state?.sites ?? []).length === 0 ? (
              <EmptyState
                title="No facility sites yet"
                description="Create a site profile to establish Facility Operations identity."
              />
            ) : (
              <ul className="space-y-2">
                {(state?.sites ?? []).map((site) => (
                  <li key={site.id}>
                    <Link
                      href={`/facility/sites/${site.id}`}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-[var(--mpa-color-border-subtle)] bg-white px-3 py-2 text-sm"
                    >
                      <span className="font-medium text-[var(--mpa-color-text-primary)]">{site.name}</span>
                      <span className="text-xs text-[var(--mpa-color-text-secondary)]">
                        {site.status} · {site.timezone} · {site.locationCount} locations
                        {site.propertyName ? ` · ${site.propertyName}` : ""}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {(state?.timeline ?? []).length > 0 ? (
            <section className="max-w-3xl space-y-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
                Recent timeline
              </h2>
              <TimelineView
                items={(state?.timeline ?? []).map((item) => ({
                  id: item.id,
                  title: item.title,
                  detail: item.detail,
                  occurredAtLabel: item.occurredAt
                }))}
              />
            </section>
          ) : null}
        </>
      ) : null}
    </main>
  );
}
