"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Skeleton } from "@mpa/ui";
import {
  ACQUISITION_SKU_COOKIE,
  SKU_SUMMARIES,
  parseAcquisitionSku,
  type ProductSku
} from "@mpa/shared";
import { useOrganizationContext } from "../shell/organization-context";
import { useCommercialContext } from "../shell/commercial-context";
import { Breadcrumbs } from "../shell/breadcrumbs";

const PROPERTY_MANAGER_HOME = "/pm/mission-control";

function readAcquisitionSkuCookie(): ProductSku | null {
  if (typeof document === "undefined") {
    return null;
  }
  const match = document.cookie
    .split("; ")
    .find((part) => part.startsWith(`${ACQUISITION_SKU_COOKIE}=`));
  if (!match) {
    return null;
  }
  return parseAcquisitionSku(decodeURIComponent(match.split("=").slice(1).join("=")));
}

export function GuidedSetupPage() {
  const router = useRouter();
  const { activeOrganization, organizations, refreshOrganizations } = useOrganizationContext();
  const { productSku, productLabel, setupComplete } = useCommercialContext();
  const [organizationName, setOrganizationName] = useState("");
  const [billingAcknowledged, setBillingAcknowledged] = useState(false);
  const [homeSelected, setHomeSelected] = useState(false);
  const [nextStepAcknowledged, setNextStepAcknowledged] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hydrating, setHydrating] = useState(Boolean(activeOrganization));
  const [hydrateError, setHydrateError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [acquisitionSku] = useState<ProductSku | null>(() => readAcquisitionSkuCookie());

  useEffect(() => {
    if (!activeOrganization) {
      return;
    }
    let cancelled = false;
    void (async () => {
      setHydrating(true);
      setHydrateError(null);
      const response = await fetch(`/api/organizations/${activeOrganization.id}/setup`);
      if (!response.ok) {
        if (!cancelled) {
          setHydrateError("We could not load your setup progress. You can still continue below.");
          setHydrating(false);
        }
        return;
      }
      const payload = (await response.json()) as {
        setup?: { checklist?: Record<string, boolean>; completed_at?: string | null };
      };
      const checklist = payload.setup?.checklist ?? {};
      if (!cancelled) {
        setBillingAcknowledged(Boolean(checklist["billing_acknowledged"]));
        setHomeSelected(Boolean(checklist["home_selected"]));
        setNextStepAcknowledged(Boolean(checklist["next_step_acknowledged"]));
        setHydrating(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeOrganization]);

  const showHydrating = Boolean(activeOrganization) && hydrating;

  const hasOrg = organizations.length > 0;
  const hasProduct = Boolean(productSku);
  const lockedLabel = productLabel ?? SKU_SUMMARIES.mpa_property_manager.label;

  const checklist = useMemo(
    () => [
      {
        id: "organization",
        label: "Organization ready",
        done: hasOrg,
        detail: hasOrg
          ? `Active: ${activeOrganization?.name ?? "selected"}`
          : "Create your organization to begin with Property Manager access."
      },
      {
        id: "product",
        label: "Property Manager confirmed",
        done: hasProduct,
        detail: hasProduct
          ? `Plan confirmed: ${lockedLabel}`
          : "Create the organization to confirm Property Manager for setup."
      },
      {
        id: "billing",
        label: "Billing inclusions reviewed",
        done: billingAcknowledged,
        detail: "Open Billing & Plan, review inclusions, then return here to confirm."
      },
      {
        id: "home",
        label: "Mission Control is your home",
        done: homeSelected,
        detail: "After setup you land in Mission Control — your daily operations home."
      },
      {
        id: "next",
        label: "Next action understood",
        done: nextStepAcknowledged,
        detail: "Mission Control will ask you to add your first property."
      }
    ],
    [
      activeOrganization?.name,
      billingAcknowledged,
      hasOrg,
      hasProduct,
      homeSelected,
      lockedLabel,
      nextStepAcknowledged
    ]
  );

  const doneCount = checklist.filter((item) => item.done).length;
  const totalSteps = checklist.length;
  const canFinish =
    hasOrg && hasProduct && billingAcknowledged && homeSelected && nextStepAcknowledged;

  const nextHint = !hasOrg
    ? "Create your organization to continue."
    : !hasProduct
      ? "Confirm your purchased product appears above, then continue."
      : !billingAcknowledged
        ? "Review Billing & Plan, then check the billing acknowledgment."
        : !homeSelected
          ? "Confirm Mission Control as your home."
          : !nextStepAcknowledged
            ? "Confirm you understand the first Mission Control action."
            : "Finish setup to enter Mission Control.";

  async function handleCreateOrganization(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);

    const response = await fetch("/api/organizations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: organizationName
      })
    });
    const payload = (await response.json()) as { error?: string };
    setLoading(false);

    if (!response.ok) {
      setError(payload.error ?? "Organization creation failed. Please try again.");
      return;
    }

    setOrganizationName("");
    await refreshOrganizations();
    setNotice("Organization created. Complete the remaining checklist, then finish setup.");
    router.refresh();
  }

  async function persistChecklist(next: {
    billing?: boolean;
    home?: boolean;
    nextStep?: boolean;
    complete?: boolean;
  }) {
    if (!activeOrganization || !productSku) {
      return;
    }
    setLoading(true);
    setError(null);
    const response = await fetch(`/api/organizations/${activeOrganization.id}/setup`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        checklist: {
          product_selected: true,
          billing_acknowledged: next.billing ?? billingAcknowledged,
          home_selected: next.home ?? homeSelected,
          next_step_acknowledged: next.nextStep ?? nextStepAcknowledged,
          modules_reviewed: next.billing ?? billingAcknowledged
        },
        complete: Boolean(next.complete)
      })
    });
    const payload = (await response.json()) as { error?: string };
    setLoading(false);
    if (!response.ok) {
      setError(payload.error ?? "Failed to save setup progress. Please try again.");
      return;
    }
    if (next.billing !== undefined) {
      setBillingAcknowledged(next.billing);
    }
    if (next.home !== undefined) {
      setHomeSelected(next.home);
    }
    if (next.nextStep !== undefined) {
      setNextStepAcknowledged(next.nextStep);
    }
    await refreshOrganizations();
    router.refresh();
  }

  async function finishSetup() {
    if (!canFinish || !productSku) {
      setError("Complete every setup step before entering Mission Control.");
      return;
    }
    await persistChecklist({
      complete: true,
      billing: true,
      home: true,
      nextStep: true
    });
    setNotice("Congratulations — your organization is ready. Opening Mission Control…");
    router.push(PROPERTY_MANAGER_HOME);
  }

  return (
    <main className="flex-1 space-y-6 bg-[var(--mpa-color-bg-app)] p-4 md:p-6">
      <Breadcrumbs items={[{ href: "/dashboard", label: "Home" }, { label: "Guided Setup" }]} />

      <section className="max-w-3xl space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          You purchased Property Manager
        </p>
        <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)] md:text-3xl">
          Guided Setup
        </h1>
        <p className="text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
          Confirm your organization and plan, then enter Mission Control with one clear next step.
          Plan changes are handled with our commercial team — not from this screen.
        </p>
        {acquisitionSku ? (
          <p className="rounded-md border border-[var(--mpa-color-border-default)] bg-white px-3 py-2 text-sm text-[var(--mpa-color-text-secondary)]">
            Selected plan:{" "}
            <span className="font-semibold text-[var(--mpa-color-text-primary)]">
              {SKU_SUMMARIES[acquisitionSku].label}
            </span>
            . Your organization begins with Property Manager access. If you selected Facility
            Operations or Complete Platform, our team activates that plan during onboarding.
          </p>
        ) : null}
        {setupComplete ? (
          <p
            className="rounded-md border border-[var(--mpa-color-brand-primary)]/30 bg-[var(--mpa-color-brand-primary-subtle,#E6F4EF)] px-3 py-2 text-sm text-[var(--mpa-color-brand-primary)]"
            role="status"
          >
            Setup already completed for this organization. You can open Mission Control anytime.
          </p>
        ) : null}
      </section>

      {(error || notice || hydrateError) && (
        <div className="max-w-3xl space-y-2">
          {error ? (
            <p
              className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
              role="alert"
            >
              {error}
            </p>
          ) : null}
          {hydrateError ? (
            <p
              className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950"
              role="status"
            >
              {hydrateError}
            </p>
          ) : null}
          {notice ? (
            <p
              className="rounded-md border border-[var(--mpa-color-brand-primary)]/30 bg-[var(--mpa-color-brand-primary-subtle,#E6F4EF)] px-3 py-2 text-sm text-[var(--mpa-color-text-primary)]"
              role="status"
            >
              {notice}
            </p>
          ) : null}
        </div>
      )}

      <section
        aria-label="What to do next"
        className="max-w-3xl rounded-md border border-[var(--mpa-color-brand-primary)]/30 bg-white p-4"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-brand-primary)]">
            What to do next
          </p>
          <p className="text-xs text-[var(--mpa-color-text-muted)]">
            Step {Math.min(doneCount + (canFinish || setupComplete ? 0 : 1), totalSteps)} of{" "}
            {totalSteps}
            {canFinish || setupComplete ? " · ready to finish" : ""}
          </p>
        </div>
        <p className="mt-1 text-sm font-semibold text-[var(--mpa-color-text-primary)]">{nextHint}</p>
        <div
          className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--mpa-color-bg-subtle,#F7F8FA)]"
          role="progressbar"
          aria-valuenow={doneCount}
          aria-valuemin={0}
          aria-valuemax={totalSteps}
          aria-label="Guided Setup progress"
        >
          <div
            className="h-full rounded-full bg-[var(--mpa-color-brand-primary)] transition-[width] duration-300"
            style={{ width: `${(doneCount / totalSteps) * 100}%` }}
          />
        </div>
      </section>

      {showHydrating ? (
        <div className="max-w-3xl space-y-3" aria-busy="true" aria-label="Loading setup">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : (
        <section className="grid max-w-5xl gap-4 lg:grid-cols-2">
          <div className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
            <h2 className="font-display text-lg font-semibold text-[var(--mpa-color-text-primary)]">
              Required checklist
            </h2>
            <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">
              {doneCount} of {totalSteps} complete
            </p>
            <ul className="mt-3 space-y-3">
              {checklist.map((item) => (
                <li
                  key={item.id}
                  className={`rounded-md border px-3 py-2 text-sm ${
                    item.done
                      ? "border-[var(--mpa-color-brand-primary)]/25 bg-[var(--mpa-color-brand-primary-subtle,#E6F4EF)]"
                      : "border-[var(--mpa-color-border-subtle)]"
                  }`}
                >
                  <p className="font-medium text-[var(--mpa-color-text-primary)]">
                    <span aria-hidden>{item.done ? "✓ " : "○ "}</span>
                    {item.label}
                    <span className="sr-only">{item.done ? " complete" : " incomplete"}</span>
                  </p>
                  <p className="mt-0.5 text-[var(--mpa-color-text-secondary)]">{item.detail}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            {!hasOrg ? (
              <form
                className="space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4"
                onSubmit={handleCreateOrganization}
              >
                <h2 className="font-display text-lg font-semibold text-[var(--mpa-color-text-primary)]">
                  Create your organization
                </h2>
                <p className="text-sm text-[var(--mpa-color-text-secondary)]">
                  Starting product:{" "}
                  <span className="font-medium text-[var(--mpa-color-text-primary)]">
                    {SKU_SUMMARIES.mpa_property_manager.label}
                  </span>
                  . Facility Operations or Complete Platform activation, if selected, is completed
                  during onboarding.
                </p>
                <label className="block space-y-1 text-sm">
                  <span className="font-medium text-[var(--mpa-color-text-secondary)]">
                    Organization name <span className="text-[var(--mpa-color-text-muted)]">(required)</span>
                  </span>
                  <Input
                    placeholder="Acme Property Group"
                    required
                    value={organizationName}
                    onChange={(event) => setOrganizationName(event.target.value)}
                  />
                </label>
                <Button disabled={loading} aria-busy={loading} type="submit">
                  {loading ? "Creating…" : "Create organization"}
                </Button>
              </form>
            ) : (
              <div className="space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
                <h2 className="font-display text-lg font-semibold text-[var(--mpa-color-text-primary)]">
                  Purchased product
                </h2>
                <p className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">
                  {lockedLabel}
                </p>
                <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                  Plan changes are operator-only. Customers cannot modify subscriptions here.
                </p>
              </div>
            )}

            <div className="space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
              <h2 className="font-display text-lg font-semibold text-[var(--mpa-color-text-primary)]">
                Billing acknowledgment
              </h2>
              <p className="text-sm text-[var(--mpa-color-text-secondary)]">
                Optional review: open Billing & Plan, then return here and check the box to continue.
              </p>
              <Button
                type="button"
                variant="secondary"
                disabled={!hasProduct}
                onClick={() => router.push("/billing")}
              >
                Open Billing & Plan
              </Button>
              <label className="flex items-start gap-2 text-sm text-[var(--mpa-color-text-secondary)]">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={billingAcknowledged}
                  disabled={!hasProduct || loading}
                  onChange={(event) => {
                    void persistChecklist({ billing: event.target.checked });
                  }}
                />
                I reviewed what Property Manager includes.
              </label>
            </div>

            <div className="space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
              <h2 className="font-display text-lg font-semibold text-[var(--mpa-color-text-primary)]">
                You&apos;re almost in
              </h2>
              <p className="text-sm text-[var(--mpa-color-text-secondary)]">
                Your product home is Mission Control. The first action there is to add a property.
              </p>
              <label className="flex items-start gap-2 text-sm text-[var(--mpa-color-text-secondary)]">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={homeSelected}
                  disabled={!hasProduct || !billingAcknowledged || loading}
                  onChange={(event) => {
                    void persistChecklist({ home: event.target.checked });
                  }}
                />
                Confirm Mission Control as my home
              </label>
              <label className="flex items-start gap-2 text-sm text-[var(--mpa-color-text-secondary)]">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={nextStepAcknowledged}
                  disabled={!homeSelected || loading}
                  onChange={(event) => {
                    void persistChecklist({ nextStep: event.target.checked });
                  }}
                />
                I understand the next step is adding my first property
              </label>
              <Button
                type="button"
                disabled={!canFinish || loading}
                aria-busy={loading}
                onClick={() => void finishSetup()}
              >
                {loading ? "Saving…" : "Finish setup — go to Mission Control"}
              </Button>
              {setupComplete ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => router.push(PROPERTY_MANAGER_HOME)}
                >
                  Open Mission Control
                </Button>
              ) : null}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
