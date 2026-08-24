"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, FormField, Input, Select } from "@mpa/ui";

type QueueTab = "new" | "accepted" | "converted" | "declined";

type RequestRow = {
  id: string;
  publicRef: string;
  requesterName: string;
  propertyAddress: string;
  unitLabel: string | null;
  categoryLabel: string;
  urgencyLabel: string;
  statusLabel: string;
  queue: QueueTab;
  createdAt: string;
  convertedWorkOrderId: string | null;
  convertedWorkSurface: string | null;
};

type RequestDetail = {
  id: string;
  publicRef: string;
  requesterName: string;
  requesterEmail: string | null;
  requesterPhone: string | null;
  propertyAddress: string;
  unitLabel: string | null;
  categoryLabel: string;
  description: string;
  urgencyLabel: string;
  status: string;
  statusLabel: string;
  createdAt: string;
  convertedWorkOrderId: string | null;
  convertedWorkSurface: string | null;
  declinedReason: string | null;
};

type EventRow = { id: string; action: string; createdAt: string };
type MediaRow = { id: string; fileType: string; mimeType: string; downloadUrl: string | null };
type PropertyRow = { id: string; name: string; label: string };

export function PartnerServicesPage() {
  const [tab, setTab] = useState<QueueTab>("new");
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<RequestDetail | null>(null);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [media, setMedia] = useState<MediaRow[]>([]);
  const [properties, setProperties] = useState<PropertyRow[]>([]);
  const [propertyId, setPropertyId] = useState("");
  const [portal, setPortal] = useState<{
    live: boolean;
    displayUrl: string | null;
    portalUrl: string | null;
    qrSvg: string | null;
    companyName: string | null;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadQueue() {
    const response = await fetch(`/api/partners/requests?tab=${tab}&q=${encodeURIComponent(query)}`);
    const payload = (await response.json()) as { requests?: RequestRow[]; error?: string };
    if (!response.ok) {
      setError(payload.error ?? "Could not load requests.");
      return;
    }
    setRows(payload.requests ?? []);
  }

  async function loadPortal() {
    const response = await fetch("/api/partners/portal");
    const payload = (await response.json()) as {
      live?: boolean;
      displayUrl?: string | null;
      portalUrl?: string | null;
      qrSvg?: string | null;
      companyName?: string | null;
      error?: string;
    };
    if (!response.ok) return;
    setPortal({
      live: Boolean(payload.live),
      displayUrl: payload.displayUrl ?? null,
      portalUrl: payload.portalUrl ?? null,
      qrSvg: payload.qrSvg ?? null,
      companyName: payload.companyName ?? null
    });
  }

  async function openDetail(id: string) {
    setSelectedId(id);
    setError(null);
    const [detailResponse, propertyResponse] = await Promise.all([
      fetch(`/api/partners/requests/${id}`),
      fetch("/api/partners/properties")
    ]);
    const payload = (await detailResponse.json()) as {
      request?: RequestDetail;
      events?: EventRow[];
      media?: MediaRow[];
      error?: string;
    };
    if (!detailResponse.ok || !payload.request) {
      setError(payload.error ?? "Request not found.");
      return;
    }
    setDetail(payload.request);
    setEvents(payload.events ?? []);
    setMedia(payload.media ?? []);
    const props = (await propertyResponse.json()) as { properties?: PropertyRow[] };
    setProperties(props.properties ?? []);
  }

  async function act(action: "accept" | "decline" | "convert") {
    if (!selectedId) return;
    setLoading(true);
    setError(null);
    setNotice(null);
    const response = await fetch(`/api/partners/requests/${selectedId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        propertyId: action === "convert" ? propertyId : undefined
      })
    });
    const payload = (await response.json()) as { error?: string };
    setLoading(false);
    if (!response.ok) {
      setError(payload.error ?? "Action failed.");
      return;
    }
    setNotice(action === "convert" ? "Converted to a work order." : "Updated.");
    await Promise.all([loadQueue(), openDetail(selectedId)]);
  }

  useEffect(() => {
    void loadPortal();
  }, []);

  useEffect(() => {
    void loadQueue();
  }, [tab]);

  const tabs = useMemo(
    () =>
      [
        ["new", "New Requests"],
        ["accepted", "Accepted"],
        ["converted", "Converted"],
        ["declined", "Declined"]
      ] as const,
    []
  );

  return (
    <main className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Partner Services</h1>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          Review customer service requests before they become work orders.
        </p>
      </div>

      {portal ? (
        <section className="space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
          <h2 className="font-display text-xl font-semibold">Your Service Portal</h2>
          {portal.live && portal.displayUrl ? (
            <>
              <p className="break-all text-sm">{portal.displayUrl}</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  onClick={() => {
                    if (portal.portalUrl) {
                      void navigator.clipboard.writeText(portal.portalUrl);
                      setNotice("Service request link copied.");
                    }
                  }}
                >
                  Copy Link
                </Button>
                {portal.qrSvg ? (
                  <a
                    className="inline-flex min-h-10 items-center rounded-md border border-[var(--mpa-color-border-default)] px-3 text-sm"
                    href={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(portal.qrSvg)}`}
                    download={`${portal.companyName ?? "service-portal"}-qr.svg`}
                  >
                    Download QR
                  </a>
                ) : null}
              </div>
              {portal.qrSvg ? (
                <div
                  className="max-w-[220px] rounded-md border border-[var(--mpa-color-border-subtle)] bg-white p-3"
                  aria-label="Service portal QR code"
                  dangerouslySetInnerHTML={{ __html: portal.qrSvg }}
                />
              ) : null}
              <p className="text-xs text-[var(--mpa-color-text-muted)]">
                Suitable for business cards, invoices, stickers, and property signage.
              </p>
            </>
          ) : (
            <p className="text-sm text-[var(--mpa-color-text-secondary)]">
              A public service portal is not enabled for this workspace yet.
            </p>
          )}
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold">Incoming Requests</h2>
        <div className="flex flex-wrap gap-2">
          {tabs.map(([id, label]) => (
            <Button key={id} type="button" variant={tab === id ? "primary" : "secondary"} onClick={() => setTab(id)}>
              {label}
            </Button>
          ))}
        </div>
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void loadQueue();
          }}
        >
          <Input
            aria-label="Search requests"
            placeholder="Search requester, address, or reference"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>
        {error ? <p className="text-sm text-[var(--mpa-color-text-danger,#B42318)]">{error}</p> : null}
        {notice ? <p className="text-sm text-[var(--mpa-color-text-secondary)]">{notice}</p> : null}
        <div className="overflow-x-auto rounded-md border border-[var(--mpa-color-border-default)]">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[var(--mpa-color-bg-subtle,#F7F8FA)]">
              <tr>
                <th className="px-3 py-2 font-medium">Requester</th>
                <th className="px-3 py-2 font-medium">Property</th>
                <th className="px-3 py-2 font-medium">Category</th>
                <th className="px-3 py-2 font-medium">Urgency</th>
                <th className="px-3 py-2 font-medium">Submitted</th>
                <th className="px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-[var(--mpa-color-border-subtle)]">
                  <td className="px-3 py-2">
                    <button type="button" className="font-medium underline" onClick={() => void openDetail(row.id)}>
                      {row.requesterName}
                    </button>
                    <div className="text-xs text-[var(--mpa-color-text-muted)]">{row.publicRef}</div>
                  </td>
                  <td className="px-3 py-2">
                    {row.propertyAddress}
                    {row.unitLabel ? ` · ${row.unitLabel}` : ""}
                  </td>
                  <td className="px-3 py-2">{row.categoryLabel}</td>
                  <td className="px-3 py-2">{row.urgencyLabel}</td>
                  <td className="px-3 py-2">{new Date(row.createdAt).toLocaleString()}</td>
                  <td className="px-3 py-2">{row.statusLabel}</td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td className="px-3 py-4 text-[var(--mpa-color-text-muted)]" colSpan={6}>
                    No requests in this list.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      {detail ? (
        <section className="space-y-4 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
          <h2 className="font-display text-xl font-semibold">{detail.publicRef}</h2>
          <p className="text-sm">{detail.statusLabel}</p>
          <dl className="grid gap-2 text-sm md:grid-cols-2">
            <div>
              <dt className="font-medium">Requester</dt>
              <dd>{detail.requesterName}</dd>
            </div>
            <div>
              <dt className="font-medium">Contact</dt>
              <dd>{[detail.requesterEmail, detail.requesterPhone].filter(Boolean).join(" · ") || "—"}</dd>
            </div>
            <div>
              <dt className="font-medium">Address</dt>
              <dd>
                {detail.propertyAddress}
                {detail.unitLabel ? ` · ${detail.unitLabel}` : ""}
              </dd>
            </div>
            <div>
              <dt className="font-medium">Category / urgency</dt>
              <dd>
                {detail.categoryLabel} · {detail.urgencyLabel}
              </dd>
            </div>
          </dl>
          <p className="whitespace-pre-wrap text-sm">{detail.description}</p>
          {media.length > 0 ? (
            <div>
              <h3 className="font-semibold">Media</h3>
              <ul className="mt-2 space-y-1 text-sm">
                {media.map((item) => (
                  <li key={item.id}>
                    {item.downloadUrl ? (
                      <a className="underline" href={item.downloadUrl} target="_blank" rel="noreferrer">
                        {item.fileType} attachment
                      </a>
                    ) : (
                      <span>{item.fileType} attachment</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-[var(--mpa-color-text-muted)]">No media attached.</p>
          )}
          <div className="grid gap-3 md:grid-cols-2">
            <FormField id="convert-property" label="Property for work order">
              <Select id="convert-property" value={propertyId} onChange={(event) => setPropertyId(event.target.value)}>
                <option value="">Select a property</option>
                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.label}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" disabled={loading} onClick={() => void act("accept")}>
              Accept
            </Button>
            <Button type="button" disabled={loading} variant="secondary" onClick={() => void act("decline")}>
              Decline
            </Button>
            <Button type="button" disabled={loading} onClick={() => void act("convert")}>
              Convert to Work Order
            </Button>
          </div>
          {detail.convertedWorkOrderId ? (
            <p className="text-sm">
              Linked work order {detail.convertedWorkOrderId}
              {detail.convertedWorkSurface ? ` · ${detail.convertedWorkSurface}` : ""}
            </p>
          ) : null}
          <div>
            <h3 className="font-semibold">History</h3>
            <ul className="mt-2 space-y-1 text-xs text-[var(--mpa-color-text-secondary)]">
              {events.map((event) => (
                <li key={event.id}>
                  {event.createdAt}: {event.action}
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </main>
  );
}
