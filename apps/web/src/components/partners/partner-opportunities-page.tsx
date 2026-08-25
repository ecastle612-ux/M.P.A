"use client";

import { useEffect, useState } from "react";
import {
  PARTNER_OPPORTUNITY_DECLINE_LABELS,
  PARTNER_OPPORTUNITY_DECLINE_REASONS,
  PARTNER_OPPORTUNITY_INTEREST_COPY,
  PARTNER_REQUEST_URGENCY_LABELS
} from "@mpa/shared";
import { Button, MetricCard, Select } from "@mpa/ui";
import { PartnerCommandCenterShell } from "./partner-command-center-shell";

type Item = {
  route: { id: string; opportunityId: string; response: string | null; selected: boolean };
  privacy: {
    area: string;
    propertyType: string;
    categoryLabel: string;
    urgency: "normal" | "soon" | "urgent";
    summary: string;
    preferredTiming: string | null;
  };
  status: string;
  routedAt: string;
};

export function PartnerOpportunitiesPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [metrics, setMetrics] = useState({
    received: 0,
    interested: 0,
    declined: 0,
    selected: 0,
    responseRate: null as number | null
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<{
    allowsResponse: boolean;
    interestCopy: string;
    privacy: Item["privacy"];
    status: string;
  } | null>(null);
  const [declineReason, setDeclineReason] = useState("outside_service_area");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const response = await fetch("/api/partners/opportunities");
    const payload = (await response.json()) as {
      items?: Item[];
      metrics?: typeof metrics;
      error?: string;
    };
    if (!response.ok) {
      setError(payload.error ?? "Could not load opportunities.");
      return;
    }
    setItems(payload.items ?? []);
    if (payload.metrics) setMetrics(payload.metrics);
  }

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      const response = await fetch("/api/partners/opportunities", { signal: controller.signal });
      const payload = (await response.json()) as {
        items?: Item[];
        metrics?: typeof metrics;
        error?: string;
      };
      if (controller.signal.aborted) return;
      if (!response.ok) {
        setError(payload.error ?? "Could not load opportunities.");
        return;
      }
      setItems(payload.items ?? []);
      if (payload.metrics) setMetrics(payload.metrics);
    })().catch(() => undefined);
    return () => controller.abort();
  }, []);

  async function openDetail(opportunityId: string) {
    setSelectedId(opportunityId);
    const response = await fetch(`/api/partners/opportunities/${opportunityId}`);
    const payload = (await response.json()) as typeof detail & { error?: string };
    if (!response.ok) {
      setError(payload.error ?? "Could not load opportunity.");
      return;
    }
    setDetail(payload);
  }

  async function respond(opportunityId: string, response: "interested" | "declined") {
    setBusy(true);
    setError(null);
    const result = await fetch(`/api/partners/opportunities/${opportunityId}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ response, declineReason: response === "declined" ? declineReason : undefined })
    });
    const payload = (await result.json()) as { error?: string };
    setBusy(false);
    if (!result.ok) {
      setError(payload.error ?? "Could not record response.");
      return;
    }
    setNotice(response === "interested" ? PARTNER_OPPORTUNITY_INTEREST_COPY : "Decline recorded.");
    await load();
    await openDetail(opportunityId);
  }

  return (
    <PartnerCommandCenterShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-semibold">Opportunities</h1>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            Service opportunities routed to your Partner record. Interest is not an assignment, contract, or
            payment.
          </p>
        </div>
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard label="Opportunities received" value={metrics.received} />
          <MetricCard label="Interested" value={metrics.interested} />
          <MetricCard label="Declined" value={metrics.declined} />
          <MetricCard label="Selected" value={metrics.selected} />
          <MetricCard label="Response rate" value={metrics.responseRate == null ? "—" : `${metrics.responseRate}%`} />
        </section>
        {error ? <p className="text-sm text-[var(--mpa-color-text-danger,#B42318)]">{error}</p> : null}
        {notice ? <p className="text-sm text-[var(--mpa-color-text-secondary)]">{notice}</p> : null}
        <div className="grid gap-4 lg:grid-cols-2">
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.route.id}>
                <button
                  type="button"
                  className="w-full rounded-md border border-[var(--mpa-color-border-default)] bg-white p-3 text-left"
                  onClick={() => void openDetail(item.route.opportunityId)}
                >
                  <strong>{item.privacy.categoryLabel}</strong>
                  <span className="block text-sm text-[var(--mpa-color-text-secondary)]">
                    {item.privacy.area || "Service area"} · {PARTNER_REQUEST_URGENCY_LABELS[item.privacy.urgency]} ·{" "}
                    {item.status}
                  </span>
                </button>
              </li>
            ))}
            {items.length === 0 ? (
              <li className="text-sm text-[var(--mpa-color-text-secondary)]">No opportunities routed yet.</li>
            ) : null}
          </ul>
          {detail && selectedId ? (
            <article className="space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
              <h2 className="font-display text-xl font-semibold">{detail.privacy.categoryLabel}</h2>
              <p className="text-sm">{detail.privacy.summary}</p>
              <p className="text-sm text-[var(--mpa-color-text-secondary)]">
                {detail.privacy.area} · {detail.privacy.propertyType} ·{" "}
                {PARTNER_REQUEST_URGENCY_LABELS[detail.privacy.urgency]}
              </p>
              {detail.privacy.preferredTiming ? (
                <p className="text-sm">Preferred timing: {detail.privacy.preferredTiming}</p>
              ) : null}
              <p className="text-sm">{PARTNER_OPPORTUNITY_INTEREST_COPY}</p>
              {detail.allowsResponse ? (
                <div className="flex flex-wrap items-end gap-2">
                  <Button disabled={busy} onClick={() => void respond(selectedId, "interested")}>
                    I&apos;m Interested
                  </Button>
                  <Select value={declineReason} onChange={(event) => setDeclineReason(event.target.value)}>
                    {PARTNER_OPPORTUNITY_DECLINE_REASONS.map((reason) => (
                      <option key={reason} value={reason}>
                        {PARTNER_OPPORTUNITY_DECLINE_LABELS[reason]}
                      </option>
                    ))}
                  </Select>
                  <Button disabled={busy} onClick={() => void respond(selectedId, "declined")}>
                    Decline
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-[var(--mpa-color-text-secondary)]">Responses are closed.</p>
              )}
            </article>
          ) : null}
        </div>
      </div>
    </PartnerCommandCenterShell>
  );
}
