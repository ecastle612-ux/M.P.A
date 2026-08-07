"use client";

import { useState } from "react";
import {
  Badge,
  Button,
  EmptyState,
  PageHeader,
  Select,
  Skeleton,
  StatusBanner
} from "@mpa/ui";
import { PRODUCT_SKUS, SKU_SUMMARIES, type ProductSku } from "@mpa/shared";

type AdminOrganization = {
  id: string;
  name: string;
  slug: string;
  productSku: ProductSku | null;
  productLabel: string | null;
  subscriptionStatus: string | null;
  setupComplete: boolean;
};

export function SubscriptionConsole() {
  const [organizations, setOrganizations] = useState<AdminOrganization[] | null>(null);
  const [draftSku, setDraftSku] = useState<Record<string, ProductSku>>({});
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    const response = await fetch("/api/admin/organizations");
    const payload = (await response.json()) as { organizations?: AdminOrganization[]; error?: string };
    setLoading(false);
    if (!response.ok) {
      setError(payload.error ?? "Failed to load organizations");
      return;
    }
    const rows = payload.organizations ?? [];
    setOrganizations(rows);
    const nextDraft: Record<string, ProductSku> = {};
    for (const organization of rows) {
      nextDraft[organization.id] = organization.productSku ?? "mpa_property_manager";
    }
    setDraftSku(nextDraft);
  }

  async function assign(organizationId: string) {
    const productSku = draftSku[organizationId];
    if (!productSku) {
      return;
    }
    setLoading(true);
    setError(null);
    setNotice(null);
    const response = await fetch(`/api/organizations/${organizationId}/subscription`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productSku })
    });
    const payload = (await response.json()) as { error?: string; productLabel?: string };
    setLoading(false);
    if (!response.ok) {
      setError(payload.error ?? "Failed to assign subscription");
      return;
    }
    setNotice(`Updated subscription → ${payload.productLabel}`);
    await load();
  }

  return (
    <main className="space-y-4 p-4 md:p-6">
      <PageHeader
        eyebrow="Commercial"
        title="Subscriptions"
        description="Assign and inspect organization SKUs and Guided Setup state. Customers cannot change subscriptions."
        actions={
          organizations === null ? (
            <Button type="button" onClick={() => void load()}>
              Load organizations
            </Button>
          ) : (
            <Button type="button" variant="secondary" disabled={loading} onClick={() => void load()}>
              Refresh
            </Button>
          )
        }
      />
      {loading && organizations === null ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : null}
      {error ? <StatusBanner variant="danger">{error}</StatusBanner> : null}
      {notice ? <StatusBanner variant="success">{notice}</StatusBanner> : null}
      {organizations && organizations.length === 0 ? (
        <EmptyState
          title="No organizations found"
          description="Create or invite an organization before assigning a commercial SKU."
        />
      ) : null}
      {organizations && organizations.length > 0 ? (
        <ul className="space-y-3">
          {organizations.map((organization) => (
            <li
              key={organization.id}
              className="rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-4 text-sm"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                  <p className="font-medium text-[var(--mpa-color-text-primary)]">{organization.name}</p>
                  <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                    {organization.slug}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="info">{organization.productLabel ?? "No SKU"}</Badge>
                    <Badge variant={organization.setupComplete ? "success" : "warning"}>
                      Setup {organization.setupComplete ? "complete" : "incomplete"}
                    </Badge>
                    {organization.subscriptionStatus ? (
                      <Badge variant="neutral">{organization.subscriptionStatus}</Badge>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    value={draftSku[organization.id] ?? "mpa_property_manager"}
                    onChange={(event) =>
                      setDraftSku((current) => ({
                        ...current,
                        [organization.id]: event.target.value as ProductSku
                      }))
                    }
                  >
                    {PRODUCT_SKUS.map((sku) => (
                      <option key={sku} value={sku}>
                        {SKU_SUMMARIES[sku].label}
                      </option>
                    ))}
                  </Select>
                  <Button type="button" disabled={loading} onClick={() => void assign(organization.id)}>
                    Assign SKU
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </main>
  );
}
