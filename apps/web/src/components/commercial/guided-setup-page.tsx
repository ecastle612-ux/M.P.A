"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Input, Skeleton } from "@mpa/ui";
import {
  ACQUISITION_SKU_COOKIE,
  COMPLIMENTARY_CONVERT_PATH,
  ORGANIZATION_ADMIN_CLARITY,
  SKU_SUMMARIES,
  complimentaryGrantNeedsExpiryNotice,
  guidedSetupNextActionCopy,
  parseAcquisitionSku,
  productDisplayLabel,
  productWorkspaceHomeLabel,
  resolveProductWorkspaceHome,
  type ProductSku
} from "@mpa/shared";
import { useOrganizationContext } from "../shell/organization-context";
import { useCommercialContext } from "../shell/commercial-context";
import { Breadcrumbs } from "../shell/breadcrumbs";

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
  const complimentaryAccess = Boolean(activeOrganization?.complimentaryAccess);
  const [organizationName, setOrganizationName] = useState("");
  const [billingAcknowledged, setBillingAcknowledged] = useState(false);
  const [homeSelected, setHomeSelected] = useState(false);
  const [nextStepAcknowledged, setNextStepAcknowledged] = useState(false);
  const [operatingModel, setOperatingModel] = useState<"self" | "delegated" | null>(null);
  const [loading, setLoading] = useState(false);
  const [hydrating, setHydrating] = useState(Boolean(activeOrganization));
  const [hydrateError, setHydrateError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [acquisitionSku] = useState<ProductSku | null>(() => readAcquisitionSkuCookie());

  const effectiveSku = productSku ?? acquisitionSku;
  const displayLabel = productLabel ?? productDisplayLabel(effectiveSku);
  const homeHref = effectiveSku ? resolveProductWorkspaceHome(effectiveSku) : "/setup";
  const homeLabel = effectiveSku ? productWorkspaceHomeLabel(effectiveSku) : "your workspace home";
  const nextAction = effectiveSku
    ? guidedSetupNextActionCopy(effectiveSku)
    : "complete setup for your purchased product";

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
        if (checklist["operating_model_chosen"]) {
          setOperatingModel(checklist["operating_model_assign_managers"] ? "delegated" : "self");
        }
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
  const commerceBackedSetup = Boolean(acquisitionSku);

  const checklist = useMemo(
    () => [
      {
        id: "organization",
        label: "Organization ready",
        done: hasOrg,
        detail: hasOrg
          ? `Active: ${activeOrganization?.name ?? "selected"}`
          : commerceBackedSetup
            ? "Your organization is created from Checkout. Check your email to claim it."
            : effectiveSku
              ? `Create your organization to begin with ${displayLabel} access.`
              : "Create your organization to begin setup for your purchased product."
      },
      {
        id: "product",
        label: effectiveSku ? `${displayLabel} confirmed` : "Product confirmed",
        done: hasProduct,
        detail: hasProduct
          ? `Plan confirmed: ${displayLabel}`
          : effectiveSku
            ? `Create the organization to confirm ${displayLabel} for setup.`
            : "Create the organization to confirm your purchased product for setup."
      },
      {
        id: "billing",
        label: "Billing inclusions reviewed",
        done: billingAcknowledged,
        detail: "Open Billing & Plan, review inclusions, then return here to confirm."
      },
      {
        id: "home",
        label: `${homeLabel} is your home`,
        done: homeSelected,
        detail:
          effectiveSku === "mpa_complete_platform"
            ? "After setup you land in the Complete Platform Launcher — one organization start-of-day home."
            : `After setup you land in ${homeLabel} — your daily operations home.`
      },
      {
        id: "next",
        label: "Next action understood",
        done: nextStepAcknowledged,
        detail: `Your next step is to ${nextAction}.`
      },
      ...(effectiveSku === "mpa_complete_platform"
        ? [
            {
              id: "operating_model",
              label: "Operating model chosen",
              done: operatingModel !== null,
              detail:
                operatingModel === "delegated"
                  ? "You will assign managers to each operation. You remain Organization Admin for both."
                  : operatingModel === "self"
                    ? "You will manage Property and Facility Operations yourself."
                    : "Choose how this Complete organization will operate."
            }
          ]
        : [])
    ],
    [
      activeOrganization?.name,
      billingAcknowledged,
      commerceBackedSetup,
      displayLabel,
      effectiveSku,
      hasOrg,
      hasProduct,
      homeLabel,
      homeSelected,
      nextAction,
      nextStepAcknowledged,
      operatingModel
    ]
  );

  const doneCount = checklist.filter((item) => item.done).length;
  const totalSteps = checklist.length;
  const operatingModelReady = effectiveSku !== "mpa_complete_platform" || operatingModel !== null;
  const canFinish =
    hasOrg &&
    hasProduct &&
    billingAcknowledged &&
    homeSelected &&
    nextStepAcknowledged &&
    operatingModelReady;

  const nextHint = !hasOrg
    ? commerceBackedSetup
      ? "Check your email to finish setting up your M.P.A. account. Your organization is created from Checkout."
      : "Create your organization to continue."
    : !hasProduct
      ? "Confirm your purchased product appears above, then continue."
      : !billingAcknowledged
        ? "Review Billing & Plan, then check the billing acknowledgment."
        : !homeSelected
          ? `Confirm ${homeLabel} as your home.`
          : !nextStepAcknowledged
            ? "Confirm you understand your first workspace action."
            : !operatingModelReady
              ? "Choose how you will manage Property and Facility Operations."
              : `Finish setup to enter ${homeLabel}.`;

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
    operatingModel?: "self" | "delegated" | null;
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
          modules_reviewed: next.billing ?? billingAcknowledged,
          operating_model_chosen: (next.operatingModel ?? operatingModel) !== null,
          operating_model_assign_managers: (next.operatingModel ?? operatingModel) === "delegated"
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
    if (next.operatingModel !== undefined) {
      setOperatingModel(next.operatingModel);
    }
    await refreshOrganizations();
    router.refresh();
  }

  async function finishSetup() {
    if (!canFinish || !productSku) {
      setError(`Complete every setup step before entering ${homeLabel}.`);
      return;
    }
    await persistChecklist({
      complete: true,
      billing: true,
      home: true,
      nextStep: true,
      operatingModel
    });
    setNotice(`Congratulations — your organization is ready. Opening ${homeLabel}…`);
    router.push(resolveProductWorkspaceHome(productSku));
  }

  return (
    <main className="flex-1 space-y-6 bg-[var(--mpa-color-bg-app)] p-4 md:p-6">
      <Breadcrumbs items={[{ href: "/dashboard", label: "Home" }, { label: "Guided Setup" }]} />

      <section className="max-w-3xl space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          {effectiveSku
            ? complimentaryAccess
              ? `You have complimentary access to ${displayLabel}`
              : `You purchased ${displayLabel}`
            : "Confirm your product"}
        </p>
        <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)] md:text-3xl">
          Guided Setup
        </h1>
        <p className="text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
          Confirm your organization and plan, then enter {homeLabel} with one clear next step. Plan
          changes are handled with our commercial team — not from this screen.
        </p>
        {complimentaryAccess &&
        complimentaryGrantNeedsExpiryNotice({
          status: "active",
          expiresAt: activeOrganization?.complimentaryExpiresAt ?? null,
          expiryNoticeSentAt: null,
          convertedAt: null
        }) ? (
          <p className="rounded-md border border-[var(--mpa-color-border-default)] bg-white px-3 py-2 text-sm">
            Complimentary access is ending soon.{" "}
            <a className="font-medium underline" href={COMPLIMENTARY_CONVERT_PATH}>
              Continue With M.P.A.
            </a>{" "}
            — you will not be charged automatically.
          </p>
        ) : null}
        {acquisitionSku ? (
          <p className="rounded-md border border-[var(--mpa-color-border-default)] bg-white px-3 py-2 text-sm text-[var(--mpa-color-text-secondary)]">
            Selected plan:{" "}
            <span className="font-semibold text-[var(--mpa-color-text-primary)]">
              {SKU_SUMMARIES[acquisitionSku].label}
            </span>
            . Your organization begins with {SKU_SUMMARIES[acquisitionSku].label} access once
            provisioning completes.
          </p>
        ) : null}
        {setupComplete ? (
          <p
            className="rounded-md border border-[var(--mpa-color-brand-primary)]/30 bg-[var(--mpa-color-brand-primary-subtle,#E6F4EF)] px-3 py-2 text-sm text-[var(--mpa-color-brand-primary)]"
            role="status"
          >
            Setup already completed for this organization. You can open {homeLabel} anytime.
          </p>
        ) : null}
      </section>

      <section
        className="max-w-3xl space-y-2 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4"
        data-testid="guided-setup-owner-clarity"
        aria-label="Organization Admin role"
      >
        <p className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">
          {ORGANIZATION_ADMIN_CLARITY.headline}
        </p>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          {ORGANIZATION_ADMIN_CLARITY.summary}
        </p>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
            You manage
          </p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-[var(--mpa-color-text-secondary)]">
            {ORGANIZATION_ADMIN_CLARITY.manages.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
            You are not
          </p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-[var(--mpa-color-text-secondary)]">
            {ORGANIZATION_ADMIN_CLARITY.notThese.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      {(error || notice || hydrateError) && (
        <div className="max-w-3xl space-y-2">
          {error ? (
            <Alert variant="danger">{error}</Alert>
          ) : null}
          {hydrateError ? (
            <Alert variant="warning">{hydrateError}</Alert>
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
            {!hasOrg && commerceBackedSetup ? (
              <div className="space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
                <h2 className="font-display text-lg font-semibold text-[var(--mpa-color-text-primary)]">
                  Organization from Checkout
                </h2>
                <p className="text-sm text-[var(--mpa-color-text-secondary)]">
                  Check your email to finish setting up your M.P.A. account. Your{" "}
                  <span className="font-medium text-[var(--mpa-color-text-primary)]">
                    {displayLabel}
                  </span>{" "}
                  organization is created from Checkout — do not create a new organization here.
                </p>
              </div>
            ) : !hasOrg ? (
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
                    {effectiveSku ? displayLabel : "Confirmed at Checkout"}
                  </span>
                  .{" "}
                  {complimentaryAccess
                    ? "Your complimentary product is already granted. Creating a second organization is not needed after claim."
                    : "Your purchased product is provisioned from Checkout."}
                </p>
                <label className="block space-y-1 text-sm">
                  <span className="font-medium text-[var(--mpa-color-text-secondary)]">
                    Organization name{" "}
                    <span className="text-[var(--mpa-color-text-muted)]">(required)</span>
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
                  {complimentaryAccess ? "Granted product" : "Purchased product"}
                </h2>
                <p className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">
                  {displayLabel}
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
                I reviewed what {displayLabel} includes.
              </label>
            </div>

            {effectiveSku === "mpa_complete_platform" ? (
              <div
                className="space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4"
                data-testid="guided-setup-operating-model"
              >
                <h2 className="font-display text-lg font-semibold text-[var(--mpa-color-text-primary)]">
                  How will you manage your operations?
                </h2>
                <p className="text-sm text-[var(--mpa-color-text-secondary)]">
                  Complete includes Property Operations and Facility Operations in one subscription.
                  You stay Organization Admin for both either way.
                </p>
                <label className="flex items-start gap-2 text-sm text-[var(--mpa-color-text-secondary)]">
                  <input
                    type="radio"
                    className="mt-1"
                    name="operating-model"
                    checked={operatingModel === "self"}
                    disabled={!hasProduct || loading}
                    onChange={() => {
                      void persistChecklist({ operatingModel: "self" });
                    }}
                  />
                  I manage Property &amp; Facility Operations
                </label>
                <label className="flex items-start gap-2 text-sm text-[var(--mpa-color-text-secondary)]">
                  <input
                    type="radio"
                    className="mt-1"
                    name="operating-model"
                    checked={operatingModel === "delegated"}
                    disabled={!hasProduct || loading}
                    onChange={() => {
                      void persistChecklist({ operatingModel: "delegated" });
                    }}
                  />
                  Assign managers to each operation
                </label>
                {operatingModel === "delegated" ? (
                  <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                    After setup, invite a Property Operations Manager and a Facility Operations
                    Manager from Team &amp; Access. Your admin access stays Both.
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
              <h2 className="font-display text-lg font-semibold text-[var(--mpa-color-text-primary)]">
                You&apos;re almost in
              </h2>
              <p className="text-sm text-[var(--mpa-color-text-secondary)]">
                Your product home is {homeLabel}. The first action there is to {nextAction}.
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
                Confirm {homeLabel} as my home
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
                I understand the next step is to {nextAction}
              </label>
              <Button
                type="button"
                disabled={!canFinish || loading}
                aria-busy={loading}
                onClick={() => void finishSetup()}
              >
                {loading ? "Saving…" : `Finish setup — go to ${homeLabel}`}
              </Button>
              {setupComplete ? (
                <Button type="button" variant="secondary" onClick={() => router.push(homeHref)}>
                  Open {homeLabel}
                </Button>
              ) : null}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
