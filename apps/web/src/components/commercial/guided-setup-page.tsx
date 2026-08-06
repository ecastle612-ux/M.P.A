"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Select } from "@mpa/ui";
import { PRODUCT_SKUS, SKU_SUMMARIES, type ProductSku } from "@mpa/shared";
import { useOrganizationContext } from "../shell/organization-context";
import { useCommercialContext } from "../shell/commercial-context";
import { Breadcrumbs } from "../shell/breadcrumbs";

export function GuidedSetupPage() {
  const router = useRouter();
  const { activeOrganization, organizations, refreshOrganizations } = useOrganizationContext();
  const { productSku, productLabel } = useCommercialContext();
  const [organizationName, setOrganizationName] = useState("");
  const [selectedSku, setSelectedSku] = useState<ProductSku>(productSku ?? "mpa_property_manager");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const checklist = useMemo(() => {
    const hasOrg = organizations.length > 0;
    const hasProduct = Boolean(productSku);
    return [
      {
        id: "organization",
        label: "Create or select an organization",
        done: hasOrg,
        detail: hasOrg ? `Active: ${activeOrganization?.name ?? "selected"}` : "Create your company workspace."
      },
      {
        id: "product",
        label: "Confirm commercial product purchased",
        done: hasProduct,
        detail: hasProduct
          ? `Purchased: ${productLabel}`
          : "Choose Property Manager, Facility Operations, or Complete Platform."
      },
      {
        id: "understand_modules",
        label: "Review included modules on Billing & Plan",
        done: hasProduct,
        detail: "Customers must see what is included vs what requires Complete Platform."
      },
      {
        id: "open_home",
        label: "Open the correct product Mission Control / Launcher",
        done: hasProduct,
        detail:
          productSku === "mpa_facility_operations"
            ? "Facility Mission Control"
            : productSku === "mpa_complete_platform"
              ? "Workspace Launcher"
              : "Property Manager Mission Control"
      }
    ];
  }, [activeOrganization?.name, organizations.length, productLabel, productSku]);

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
    setNotice(`Organization created on ${SKU_SUMMARIES[selectedSku].label}.`);
    router.refresh();
  }

  async function handleAssignProduct() {
    if (!activeOrganization) {
      setError("Create or select an organization first.");
      return;
    }
    setLoading(true);
    setError(null);
    setNotice(null);

    const response = await fetch(`/api/organizations/${activeOrganization.id}/subscription`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productSku: selectedSku })
    });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setLoading(false);
      setError(payload.error ?? "Failed to assign product");
      return;
    }

    await fetch(`/api/organizations/${activeOrganization.id}/setup`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        checklist: {
          product_selected: true,
          modules_reviewed: true
        },
        complete: true
      })
    });

    await refreshOrganizations();
    setLoading(false);
    setNotice(`Product confirmed: ${SKU_SUMMARIES[selectedSku].label}.`);
    router.refresh();
  }

  return (
    <main className="flex-1 space-y-6 bg-[var(--mpa-color-bg-app)] p-4 md:p-6">
      <Breadcrumbs items={[{ href: "/launcher", label: "Launcher" }, { label: "Guided Setup" }]} />
      <section>
        <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
          Guided Setup
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-[var(--mpa-color-text-secondary)]">
          Organizations must clearly understand which commercial product(s) they purchased before using modules.
          Maintenance (Property Manager) is not Facility Operations.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
          <h2 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">Setup checklist</h2>
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
          <form
            className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4 space-y-3"
            onSubmit={handleCreateOrganization}
          >
            <h2 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">
              Create organization with product
            </h2>
            <Input
              placeholder="Organization name"
              required
              value={organizationName}
              onChange={(event) => setOrganizationName(event.target.value)}
            />
            <label className="block text-sm text-[var(--mpa-color-text-secondary)]">
              Commercial product purchased
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
            <p className="text-xs text-[var(--mpa-color-text-secondary)]">
              {SKU_SUMMARIES[selectedSku].description}
            </p>
            <Button disabled={loading} type="submit">
              Create organization
            </Button>
          </form>

          <div className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4 space-y-3">
            <h2 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">
              Confirm / change product for active organization
            </h2>
            <Select value={selectedSku} onChange={(event) => setSelectedSku(event.target.value as ProductSku)}>
              {PRODUCT_SKUS.map((sku) => (
                <option key={sku} value={sku}>
                  {SKU_SUMMARIES[sku].label}
                </option>
              ))}
            </Select>
            <Button disabled={loading || !activeOrganization} type="button" onClick={() => void handleAssignProduct()}>
              Confirm purchased product
            </Button>
          </div>
        </div>
      </section>

      {error ? <p className="text-sm text-[#C0392B]">{error}</p> : null}
      {notice ? <p className="text-sm text-[#0F6B56]">{notice}</p> : null}
    </main>
  );
}
