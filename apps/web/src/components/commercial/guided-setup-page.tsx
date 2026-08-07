"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@mpa/ui";
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
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [acquisitionSku] = useState<ProductSku | null>(() => readAcquisitionSkuCookie());

  useEffect(() => {
    if (!activeOrganization) {
      return;
    }
    void (async () => {
      const response = await fetch(`/api/organizations/${activeOrganization.id}/setup`);
      if (!response.ok) {
        return;
      }
      const payload = (await response.json()) as {
        setup?: { checklist?: Record<string, boolean>; completed_at?: string | null };
      };
      const checklist = payload.setup?.checklist ?? {};
      setBillingAcknowledged(Boolean(checklist["billing_acknowledged"]));
      setHomeSelected(Boolean(checklist["home_selected"]));
      setNextStepAcknowledged(Boolean(checklist["next_step_acknowledged"]));
    })();
  }, [activeOrganization]);

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
          : "Create your organization. Property Manager is assigned from your purchase."
      },
      {
        id: "product",
        label: "Property Manager confirmed",
        done: hasProduct,
        detail: hasProduct
          ? `Purchased: ${lockedLabel} — not a SKU shopping step`
          : "Create the organization to lock Property Manager."
      },
      {
        id: "billing",
        label: "Billing inclusions reviewed",
        done: billingAcknowledged,
        detail: "Open Billing & Plan and confirm what Property Manager includes."
      },
      {
        id: "home",
        label: "Mission Control is your home",
        done: homeSelected,
        detail: `After setup you land at ${PROPERTY_MANAGER_HOME}.`
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

  const canFinish =
    hasOrg && hasProduct && billingAcknowledged && homeSelected && nextStepAcknowledged;

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
        // Customers do not send a SKU — API assigns Property Manager.
      })
    });
    const payload = (await response.json()) as { error?: string };
    setLoading(false);

    if (!response.ok) {
      setError(payload.error ?? "Organization creation failed");
      return;
    }

    setOrganizationName("");
    await refreshOrganizations();
    setNotice("Organization created with Property Manager. Complete the checklist, then finish setup.");
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
      setError(payload.error ?? "Failed to save setup progress");
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
    setNotice("You're in. Opening Mission Control…");
    router.push(PROPERTY_MANAGER_HOME);
  }

  return (
    <main className="flex-1 space-y-6 bg-[var(--mpa-color-bg-app)] p-4 md:p-6">
      <Breadcrumbs items={[{ href: "/dashboard", label: "Home" }, { label: "Guided Setup" }]} />
      <section>
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          You purchased Property Manager
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
          Guided Setup
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-[var(--mpa-color-text-secondary)]">
          Confirm your organization and plan, then enter Mission Control with one clear next step.
          You do not shop SKUs here — Property Manager is already assigned.
        </p>
        {acquisitionSku ? (
          <p className="mt-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white px-3 py-2 text-sm text-[var(--mpa-color-text-secondary)]">
            Checkout preference:{" "}
            <span className="font-semibold text-[var(--mpa-color-text-primary)]">
              {SKU_SUMMARIES[acquisitionSku].label}
            </span>
            . Paid subscription confirmation remains with commercial operations; org create still
            provisions Property Manager until ops upgrades the SKU.
          </p>
        ) : null}
        {setupComplete ? (
          <p className="mt-2 text-sm text-[var(--mpa-color-status-success,#0F6B56)]">
            Setup already completed for this organization.
          </p>
        ) : null}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
          <h2 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">Required checklist</h2>
          <ul className="mt-3 space-y-3">
            {checklist.map((item) => (
              <li key={item.id} className="text-sm">
                <p className="font-medium text-[var(--mpa-color-text-primary)]">
                  {item.done ? "✓" : "○"} {item.label}
                </p>
                <p className="text-[var(--mpa-color-text-secondary)]">{item.detail}</p>
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
              <h2 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">
                Create your organization
              </h2>
              <p className="text-sm text-[var(--mpa-color-text-secondary)]">
                Product:{" "}
                <span className="font-medium text-[var(--mpa-color-text-primary)]">
                  {SKU_SUMMARIES.mpa_property_manager.label}
                </span>{" "}
                — assigned from purchase.
              </p>
              <Input
                placeholder="Organization name"
                required
                value={organizationName}
                onChange={(event) => setOrganizationName(event.target.value)}
              />
              <Button disabled={loading} type="submit">
                Create organization
              </Button>
            </form>
          ) : (
            <div className="space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
              <h2 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">
                Purchased product
              </h2>
              <p className="text-sm text-[var(--mpa-color-text-primary)]">
                {lockedLabel}
              </p>
              <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                Plan changes are operator-only. Customers cannot modify subscriptions here.
              </p>
            </div>
          )}

          <div className="space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
            <h2 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">
              Billing acknowledgment
            </h2>
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
            <h2 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">
              You&apos;re in
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
            <Button type="button" disabled={!canFinish || loading} onClick={() => void finishSetup()}>
              Finish setup — go to Mission Control
            </Button>
          </div>
        </div>
      </section>

      {error ? <p className="text-sm text-[#C0392B]">{error}</p> : null}
      {notice ? <p className="text-sm text-[#0F6B56]">{notice}</p> : null}
    </main>
  );
}
