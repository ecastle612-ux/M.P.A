"use client";

import { useEffect, useState } from "react";
import { Button, FormField, Input, Select } from "@mpa/ui";
import { PartnerCommandCenterShell } from "./partner-command-center-shell";

type PortalRow = {
  id: string;
  publicName: string;
  publicSlug: string;
  typeLabel: string;
  enabled: boolean;
  displayUrl: string;
  portalUrl: string;
  qrSvg: string | null;
  requestCount: number;
  address: string;
  metrics: {
    total: number;
    thisMonth: number;
    accepted: number;
    converted: number;
    declined: number;
    conversionRate: number | null;
  };
};

type EligibleProperty = { id: string; name: string; label: string };

export function PartnerPropertiesPage() {
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<PortalRow[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [eligible, setEligible] = useState<EligibleProperty[]>([]);
  const [propertyId, setPropertyId] = useState("");
  const [publicSlug, setPublicSlug] = useState("");
  const [publicDisplayName, setPublicDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<PortalRow | null>(null);

  async function load() {
    const response = await fetch(
      `/api/partners/property-portals?q=${encodeURIComponent(query)}&page=${page}&pageSize=25`
    );
    const payload = (await response.json()) as {
      items?: PortalRow[];
      totalPages?: number;
      total?: number;
      error?: string;
    };
    if (!response.ok) {
      setError(payload.error ?? "Could not load property portals.");
      return;
    }
    setRows(payload.items ?? []);
    setTotalPages(payload.totalPages ?? 1);
    setTotal(payload.total ?? 0);
  }

  async function createPortal() {
    setLoading(true);
    setError(null);
    setNotice(null);
    const response = await fetch("/api/partners/property-portals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        propertyId,
        ...(publicSlug.trim() ? { publicSlug } : {}),
        ...(publicDisplayName.trim() ? { publicDisplayName } : {})
      })
    });
    const payload = (await response.json()) as { error?: string };
    setLoading(false);
    if (!response.ok) {
      setError(payload.error ?? "Could not create the property portal.");
      return;
    }
    setNotice("Property portal created.");
    setPropertyId("");
    setPublicSlug("");
    setPublicDisplayName("");
    await load();
  }

  async function toggleEnabled(row: PortalRow) {
    const response = await fetch(`/api/partners/property-portals/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !row.enabled })
    });
    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setError(payload.error ?? "Could not update the property portal.");
      return;
    }
    await load();
  }

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      const response = await fetch("/api/partners/properties", { signal: controller.signal });
      const payload = (await response.json()) as { properties?: EligibleProperty[]; error?: string };
      if (controller.signal.aborted || !response.ok) return;
      setEligible(payload.properties ?? []);
    })().catch(() => undefined);
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      const response = await fetch(
        `/api/partners/property-portals?q=${encodeURIComponent(appliedQuery)}&page=${page}&pageSize=25`,
        { signal: controller.signal }
      );
      const payload = (await response.json()) as {
        items?: PortalRow[];
        totalPages?: number;
        total?: number;
        error?: string;
      };
      if (controller.signal.aborted) return;
      if (!response.ok) {
        setError(payload.error ?? "Could not load property portals.");
        return;
      }
      setRows(payload.items ?? []);
      setTotalPages(payload.totalPages ?? 1);
      setTotal(payload.total ?? 0);
    })().catch(() => undefined);
    return () => controller.abort();
  }, [page, appliedQuery]);

  return (
    <PartnerCommandCenterShell
      title="Properties"
      subtitle="Property-specific service portals and QR codes for locations you already service."
    >
      {error ? <p className="text-sm text-[var(--mpa-color-text-danger,#B42318)]">{error}</p> : null}
      {notice ? <p className="text-sm text-[var(--mpa-color-text-secondary)]">{notice}</p> : null}

      <section className="space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
        <h2 className="font-display text-xl font-semibold">Add Property Portal</h2>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          Only properties already authorized to this receiving organization can be linked. Public
          users never see resident rosters.
        </p>
        <div className="grid gap-3 md:grid-cols-3">
          <FormField id="eligible-property" label="Authorized property">
            <Select id="eligible-property" value={propertyId} onChange={(event) => setPropertyId(event.target.value)}>
              <option value="">Select a property</option>
              {eligible.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.label}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField id="property-slug" label="Public slug (optional)">
            <Input id="property-slug" value={publicSlug} onChange={(event) => setPublicSlug(event.target.value)} />
          </FormField>
          <FormField id="property-display-name" label="Public display name (optional)">
            <Input
              id="property-display-name"
              value={publicDisplayName}
              onChange={(event) => setPublicDisplayName(event.target.value)}
            />
          </FormField>
        </div>
        <Button type="button" disabled={loading || !propertyId} onClick={() => void createPortal()}>
          Create property portal
        </Button>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold">Linked Properties</h2>
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            setPage(1);
            setAppliedQuery(query);
          }}
        >
          <Input
            aria-label="Search linked properties"
            placeholder="Search name, slug, or address"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>
        <p className="text-xs text-[var(--mpa-color-text-muted)]">
          {total} linked {total === 1 ? "property" : "properties"}
        </p>
        <div className="grid gap-3 md:hidden">
          {rows.map((row) => (
            <button
              key={row.id}
              type="button"
              className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4 text-left"
              onClick={() => setSelected(row)}
            >
              <p className="font-medium">{row.publicName}</p>
              <p className="text-sm">{row.typeLabel} · {row.enabled ? "Enabled" : "Disabled"}</p>
              <p className="break-all text-xs text-[var(--mpa-color-text-muted)]">{row.displayUrl}</p>
              <p className="text-xs">{row.requestCount} requests</p>
            </button>
          ))}
        </div>
        <div className="hidden overflow-x-auto rounded-md border border-[var(--mpa-color-border-default)] md:block">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[var(--mpa-color-bg-subtle,#F7F8FA)]">
              <tr>
                <th className="px-3 py-2 font-medium">Property</th>
                <th className="px-3 py-2 font-medium">Type</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">URL</th>
                <th className="px-3 py-2 font-medium">Requests</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-[var(--mpa-color-border-subtle)]">
                  <td className="px-3 py-2">
                    <button type="button" className="font-medium underline" onClick={() => setSelected(row)}>
                      {row.publicName}
                    </button>
                    <div className="text-xs text-[var(--mpa-color-text-muted)]">{row.publicSlug}</div>
                  </td>
                  <td className="px-3 py-2">{row.typeLabel}</td>
                  <td className="px-3 py-2">{row.enabled ? "Enabled" : "Disabled"}</td>
                  <td className="px-3 py-2 break-all">{row.displayUrl}</td>
                  <td className="px-3 py-2">{row.requestCount}</td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td className="px-3 py-4 text-[var(--mpa-color-text-muted)]" colSpan={5}>
                    No linked properties yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        {totalPages > 1 ? (
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>
              Previous
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={page >= totalPages}
              onClick={() => setPage((value) => value + 1)}
            >
              Next
            </Button>
          </div>
        ) : null}
      </section>

      {selected ? (
        <section className="space-y-4 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
          <h2 className="font-display text-xl font-semibold">{selected.publicName}</h2>
          <p className="text-sm">
            {selected.typeLabel} · {selected.enabled ? "Enabled" : "Disabled"}
          </p>
          <p className="break-all text-sm">{selected.displayUrl}</p>
          {selected.qrSvg ? (
            <div
              className="max-w-[220px] rounded-md border border-[var(--mpa-color-border-subtle)] bg-white p-3"
              aria-label="Property portal QR code"
              dangerouslySetInnerHTML={{ __html: selected.qrSvg }}
            />
          ) : null}
          <dl className="grid gap-2 text-sm md:grid-cols-3">
            <div>
              <dt className="font-medium">Total</dt>
              <dd>{selected.metrics.total}</dd>
            </div>
            <div>
              <dt className="font-medium">This month</dt>
              <dd>{selected.metrics.thisMonth}</dd>
            </div>
            <div>
              <dt className="font-medium">Accepted</dt>
              <dd>{selected.metrics.accepted}</dd>
            </div>
            <div>
              <dt className="font-medium">Converted</dt>
              <dd>{selected.metrics.converted}</dd>
            </div>
            <div>
              <dt className="font-medium">Declined</dt>
              <dd>{selected.metrics.declined}</dd>
            </div>
            <div>
              <dt className="font-medium">Conversion rate</dt>
              <dd>{selected.metrics.conversionRate == null ? "—" : `${selected.metrics.conversionRate}%`}</dd>
            </div>
          </dl>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => {
                void navigator.clipboard.writeText(selected.portalUrl);
                setNotice("Property portal link copied.");
              }}
            >
              Copy Link
            </Button>
            {selected.qrSvg ? (
              <a
                className="inline-flex min-h-10 items-center rounded-md border border-[var(--mpa-color-border-default)] px-3 text-sm"
                href={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(selected.qrSvg)}`}
                download={`${selected.publicSlug}-qr.svg`}
                onClick={() => {
                  void fetch("/api/partners/onboarding/ack", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ action: "partner.qr_completed" })
                  });
                }}
              >
                Download QR
              </a>
            ) : null}
            <a
              className="inline-flex min-h-10 items-center rounded-md border border-[var(--mpa-color-border-default)] px-3 text-sm"
              href={`/partner/properties/${selected.id}/print`}
              target="_blank"
              rel="noreferrer"
              onClick={() => {
                void fetch("/api/partners/onboarding/ack", {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({ action: "partner.qr_completed" })
                });
              }}
            >
              Print QR
            </a>
            <Button type="button" variant="secondary" onClick={() => void toggleEnabled(selected)}>
              {selected.enabled ? "Disable intake" : "Enable intake"}
            </Button>
          </div>
        </section>
      ) : null}
    </PartnerCommandCenterShell>
  );
}
