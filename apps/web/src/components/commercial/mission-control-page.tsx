"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCommercialContext } from "../shell/commercial-context";
import { useOrganizationContext } from "../shell/organization-context";
import { Breadcrumbs } from "../shell/breadcrumbs";
import { Skeleton } from "@mpa/ui";

type NextAction = {
  id: string;
  title: string;
  detail: string;
  href: string;
  assistantRecommendation: string;
};

type MissionControlState = {
  propertyCount: number;
  properties: Array<{ id: string; name: string; status: string; unitCount: number }>;
  nextAction: NextAction;
  assistantRecommendation: string;
  setupComplete: boolean;
};

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
          setState(body as MissionControlState);
        }
      } catch (err) {
        if (!cancelled) {
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
  }, []);

  const nextAction =
    state?.nextAction ??
    (!setupComplete
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

  return (
    <main className="flex-1 space-y-6 bg-[var(--mpa-color-bg-app)] p-4 md:p-6">
      <Breadcrumbs
        items={[
          { href: "/dashboard", label: "Home" },
          { label: "Mission Control" }
        ]}
      />

      <header className="max-w-2xl space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          {productLabel ?? "Property Manager"}
        </p>
        <h1 className="font-display text-3xl font-semibold text-[var(--mpa-color-text-primary)]">
          Mission Control
        </h1>
        <p className="text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
          Your attention home — not an analytics dashboard. One clear next action at a time.
        </p>
      </header>

      <section className="max-w-2xl space-y-4 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-5">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-[var(--mpa-color-text-secondary)]">Organization</dt>
            <dd className="mt-1 font-medium text-[var(--mpa-color-text-primary)]">
              {activeOrganization?.name ?? "No organization selected"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-[var(--mpa-color-text-secondary)]">Plan</dt>
            <dd className="mt-1 font-medium text-[var(--mpa-color-text-primary)]">
              {productLabel ?? "Property Manager"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-[var(--mpa-color-text-secondary)]">Properties</dt>
            <dd className="mt-1 font-medium text-[var(--mpa-color-text-primary)]">
              {loading ? "…" : (state?.propertyCount ?? 0)}
            </dd>
          </div>
        </dl>

        <div className="space-y-3 border-t border-[var(--mpa-color-border-default)] pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
            Next action
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
        </div>
      </section>

      <section
        aria-label="M.P.A. Assistant"
        className="max-w-2xl space-y-2 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-5"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          M.P.A. Assistant
        </p>
        {loading ? (
          <Skeleton className="h-6 w-64" />
        ) : (
          <p className="text-base font-semibold text-[var(--mpa-color-text-primary)]">
            {state?.assistantRecommendation ?? nextAction.assistantRecommendation}
          </p>
        )}
        {error ? <p className="text-sm text-[#C0392B]">{error}</p> : null}
      </section>

      {state && state.properties.length > 0 ? (
        <section className="max-w-2xl space-y-3">
          <h2 className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">
            Your properties
          </h2>
          <ul className="space-y-2">
            {state.properties.map((property) => (
              <li key={property.id}>
                <Link
                  href={`/pm/properties/${property.id}`}
                  className="flex items-center justify-between rounded-md border border-[var(--mpa-color-border-default)] bg-white px-4 py-3 text-sm hover:bg-gray-50"
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
