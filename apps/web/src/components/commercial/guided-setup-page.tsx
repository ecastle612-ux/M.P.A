"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Select } from "@mpa/ui";
import { PRODUCT_SKUS, SKU_SUMMARIES, type ProductSku } from "@mpa/shared";
import { useOrganizationContext } from "../shell/organization-context";
import { useCommercialContext } from "../shell/commercial-context";
import { Breadcrumbs } from "../shell/breadcrumbs";

function homeForSku(sku: ProductSku): string {
  if (sku === "mpa_facility_operations") {
    return "/facility/mission-control";
  }
  if (sku === "mpa_complete_platform") {
    return "/launcher";
  }
  return "/pm/mission-control";
}

export function GuidedSetupPage() {
  const router = useRouter();
  const { activeOrganization, organizations, refreshOrganizations } = useOrganizationContext();
  const { productSku, productLabel, setupComplete } = useCommercialContext();
  const [organizationName, setOrganizationName] = useState("");
  const [selectedSku, setSelectedSku] = useState<ProductSku>("mpa_property_manager");
  const [billingAcknowledged, setBillingAcknowledged] = useState(false);
  const [homeSelected, setHomeSelected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

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
    })();
  }, [activeOrganization]);

  const hasOrg = organizations.length > 0;
  const hasProduct = Boolean(productSku);
  const destination = productSku ? homeForSku(productSku) : null;

  const checklist = useMemo(
    () => [
      {
        id: "organization",
        label: "Organization active",
        done: hasOrg,
        detail: hasOrg ? `Active: ${activeOrganization?.name ?? "selected"}` : "Create your organization."
      },
      {
        id: "product",
        label: "Purchased product confirmed",
        done: hasProduct,
        detail: hasProduct
          ? `Purchased: ${productLabel} (read-only — contact platform commercial ops to change)`
          : "Select your purchased product when creating the organization."
      },
      {
        id: "billing",
        label: "Billing complete — inclusions reviewed",
        done: billingAcknowledged,
        detail: "Open Billing & Plan and confirm what is included vs Complete Platform."
      },
      {
        id: "home",
        label: "Home workspace selected",
        done: homeSelected,
        detail: destination ? `Home: ${destination}` : "Available after product confirmation."
      }
    ],
    [activeOrganization?.name, billingAcknowledged, destination, hasOrg, hasProduct, homeSelected, productLabel]
  );

  const canFinish = hasOrg && hasProduct && billingAcknowledged && homeSelected;

  async function handleCreateOrganization(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);

    const response = await fetch("/api/organizations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: organizationName,
        productSku: selectedSku
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
    setNotice(`Organization created. Purchased product locked to ${SKU_SUMMARIES[selectedSku].label}.`);
    router.refresh();
  }

  async function persistChecklist(next: { billing?: boolean; home?: boolean; complete?: boolean }) {
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
    await refreshOrganizations();
    router.refresh();
  }

  async function finishSetup() {
    if (!canFinish || !destination || !productSku) {
      setError("Complete every setup step before entering your product.");
      return;
    }
    await persistChecklist({ complete: true, billing: true, home: true });
    setNotice("Setup complete. Entering your purchased product…");
    router.push(destination);
  }

  return (
    <main className="flex-1 space-y-6 bg-[var(--mpa-color-bg-app)] p-4 md:p-6">
      <Breadcrumbs items={[{ href: "/launcher", label: "Launcher" }, { label: "Guided Setup" }]} />
      <section>
        <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
          Guided Setup
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-[var(--mpa-color-text-secondary)]">
          Setup ends in your purchased product. Subscriptions cannot be changed here after purchase — only platform
          commercial operations may change plans.
        </p>
        {setupComplete ? (
          <p className="mt-2 text-sm text-[#0F6B56]">Setup already completed for this organization.</p>
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
                Create organization with purchased product
              </h2>
              <Input
                placeholder="Organization name"
                required
                value={organizationName}
                onChange={(event) => setOrganizationName(event.target.value)}
              />
              <label className="block text-sm text-[var(--mpa-color-text-secondary)]">
                Purchased commercial product
                <Select
                  className="mt-1"
                  value={selectedSku}
                  onChange={(event) => setSelectedSku(event.target.value as ProductSku)}
                >
                  {PRODUCT_SKUS.map((sku) => (
                    <option key={sku} value={sku}>
                      {SKU_SUMMARIES[sku].label}
                    </option>
                  ))}
                </Select>
              </label>
              <p className="text-xs text-[var(--mpa-color-text-secondary)]">{SKU_SUMMARIES[selectedSku].description}</p>
              <Button disabled={loading} type="submit">
                Create organization
              </Button>
            </form>
          ) : (
            <div className="space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
              <h2 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">Purchased product</h2>
              <p className="text-sm text-[var(--mpa-color-text-primary)]">
                {productLabel ?? "No product assigned — contact platform commercial operations."}
              </p>
              <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                Plan changes are operator-only. Customers cannot modify subscriptions.
              </p>
            </div>
          )}

          <div className="space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
            <h2 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">Billing acknowledgment</h2>
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
              I reviewed what is included in my plan and what requires Complete Platform / the other product.
            </label>
          </div>

          <div className="space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
            <h2 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">Home workspace</h2>
            <p className="text-sm text-[var(--mpa-color-text-secondary)]">
              {destination
                ? `Your product home is ${destination}.`
                : "Confirm a purchased product to select your home workspace."}
            </p>
            <Button
              type="button"
              variant="secondary"
              disabled={!hasProduct || !billingAcknowledged || loading}
              onClick={() => void persistChecklist({ home: true })}
            >
              Confirm home workspace
            </Button>
            <Button type="button" disabled={!canFinish || loading} onClick={() => void finishSetup()}>
              Finish setup and enter product
            </Button>
          </div>
        </div>
      </section>

      {error ? <p className="text-sm text-[#C0392B]">{error}</p> : null}
      {notice ? <p className="text-sm text-[#0F6B56]">{notice}</p> : null}
    </main>
  );
}
