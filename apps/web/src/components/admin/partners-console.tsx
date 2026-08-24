"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, FormField, Input, Select } from "@mpa/ui";
import { PARTNER_TYPE_LABELS, bpsToPercent, partnerReferralPath, type PartnerType } from "@mpa/shared";

type PartnerRow = {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  serviceArea: string;
  companyServiceType: string;
  servicesOffered: string;
  partnerType: PartnerType;
  partnerTypeLabel: string;
  status: string;
  publicSlug: string | null;
  organizationId: string | null;
  publicPortalEnabled: boolean;
  portalDescription: string | null;
  portalLive: boolean;
  portalPath: string | null;
  requestCount: number;
  commissionBps: number;
  commissionPercent: number;
  createdAt: string;
};

type ReferralRow = {
  id: string;
  partnerId: string;
  organizationId: string;
  slugSnapshot: string;
  flaggedReason: string | null;
  createdAt: string;
};

type CommissionRow = {
  id: string;
  partnerId: string;
  organizationId: string;
  eligibleRevenueCents: number;
  commissionBps: number;
  commissionCents: number;
  qualifyingMonthIndex: number;
  status: string;
  offsetRequired: boolean;
  createdAt: string;
};

type EventRow = {
  id: string;
  partnerId: string | null;
  action: string;
  createdAt: string;
};

export function PartnersConsole() {
  const [partners, setPartners] = useState<PartnerRow[] | null>(null);
  const [referrals, setReferrals] = useState<ReferralRow[]>([]);
  const [commissions, setCommissions] = useState<CommissionRow[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [slug, setSlug] = useState("");
  const [partnerType, setPartnerType] = useState<PartnerType>("referral");
  const [commissionPercent, setCommissionPercent] = useState("20");
  const [organizationId, setOrganizationId] = useState("");
  const [portalEnabled, setPortalEnabled] = useState(false);
  const [portalDescription, setPortalDescription] = useState("");
  const [qrSvg, setQrSvg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    const response = await fetch("/api/admin/partners");
    const payload = (await response.json()) as {
      partners?: PartnerRow[];
      referrals?: ReferralRow[];
      commissions?: CommissionRow[];
      events?: EventRow[];
      error?: string;
    };
    setLoading(false);
    if (!response.ok) {
      setError(payload.error ?? "Failed to load partners");
      return;
    }
    const nextPartners = payload.partners ?? [];
    setPartners(nextPartners);
    setReferrals(payload.referrals ?? []);
    setCommissions(payload.commissions ?? []);
    setEvents(payload.events ?? []);
    const current = nextPartners.find((row) => row.id === selectedId);
    if (current) {
      setSlug(current.publicSlug ?? "");
      setPartnerType(current.partnerType);
      setCommissionPercent(String(current.commissionPercent));
      setOrganizationId(current.organizationId ?? "");
      setPortalEnabled(current.publicPortalEnabled);
      setPortalDescription(current.portalDescription ?? "");
      setQrSvg(null);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      const response = await fetch("/api/admin/partners", { signal: controller.signal });
      const payload = (await response.json()) as {
        partners?: PartnerRow[];
        referrals?: ReferralRow[];
        commissions?: CommissionRow[];
        events?: EventRow[];
        error?: string;
      };
      if (controller.signal.aborted) return;
      if (!response.ok) {
        setError(payload.error ?? "Failed to load partners");
        return;
      }
      setPartners(payload.partners ?? []);
      setReferrals(payload.referrals ?? []);
      setCommissions(payload.commissions ?? []);
      setEvents(payload.events ?? []);
    })().catch(() => {
      if (!controller.signal.aborted) {
        setError("Failed to load partners");
      }
    });
    return () => controller.abort();
  }, []);

  const selected = useMemo(
    () => partners?.find((row) => row.id === selectedId) ?? null,
    [partners, selectedId]
  );

  function selectPartner(row: PartnerRow) {
    setSelectedId(row.id);
    setSlug(row.publicSlug ?? "");
    setPartnerType(row.partnerType);
    setCommissionPercent(String(row.commissionPercent));
    setOrganizationId(row.organizationId ?? "");
    setPortalEnabled(row.publicPortalEnabled);
    setPortalDescription(row.portalDescription ?? "");
    setQrSvg(null);
  }

  async function act(
    action: string,
    extra: Record<string, unknown> = {},
    partnerId = selected?.id
  ) {
    if (!partnerId) return;
    setLoading(true);
    setError(null);
    setNotice(null);
    const response = await fetch("/api/admin/partners", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ partnerId, action, ...extra })
    });
    const payload = (await response.json()) as { error?: string };
    setLoading(false);
    if (!response.ok) {
      setError(payload.error ?? "Action failed");
      return;
    }
    setNotice("Updated.");
    await load();
  }

  return (
    <main className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Partners</h1>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          Review applications, assign partner type, reserve public slugs, and track commissions.
          Payouts stay manual. This is platform administration only.
        </p>
      </div>

      {error ? (
        <p className="text-sm text-[var(--mpa-color-text-danger,#B42318)]" role="alert">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p className="text-sm text-[var(--mpa-color-text-secondary)]" role="status">
          {notice}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-md border border-[var(--mpa-color-border-default)]">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[var(--mpa-color-bg-subtle,#F7F8FA)]">
            <tr>
              <th className="px-3 py-2 font-medium">Company</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Type</th>
              <th className="px-3 py-2 font-medium">Slug</th>
              <th className="px-3 py-2 font-medium">Portal</th>
              <th className="px-3 py-2 font-medium">Requests</th>
              <th className="px-3 py-2 font-medium">Rate</th>
            </tr>
          </thead>
          <tbody>
            {(partners ?? []).map((row) => (
              <tr key={row.id} className="border-t border-[var(--mpa-color-border-subtle)]">
                <td className="px-3 py-2">
                  <button
                    type="button"
                    className="text-left font-medium underline"
                    onClick={() => selectPartner(row)}
                  >
                    {row.companyName}
                  </button>
                  <div className="text-xs text-[var(--mpa-color-text-muted)]">{row.email}</div>
                </td>
                <td className="px-3 py-2 capitalize">{row.status}</td>
                <td className="px-3 py-2">{row.partnerTypeLabel}</td>
                <td className="px-3 py-2">{row.publicSlug ?? "—"}</td>
                <td className="px-3 py-2">{row.portalLive ? "Live" : row.publicPortalEnabled ? "Off" : "Disabled"}</td>
                <td className="px-3 py-2">{row.requestCount}</td>
                <td className="px-3 py-2">{row.commissionPercent}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected ? (
        <section className="space-y-4 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
          <h2 className="font-display text-xl font-semibold">{selected.companyName}</h2>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            {selected.contactName} · {selected.phone} · {selected.city}, {selected.state}
          </p>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            {selected.companyServiceType}. {selected.servicesOffered}. Service area:{" "}
            {selected.serviceArea}.
          </p>
          {selected.publicSlug ? (
            <p className="text-sm">
              Referral path: <code>{partnerReferralPath(selected.publicSlug)}</code>
            </p>
          ) : null}
          {selected.portalPath ? (
            <p className="text-sm">
              Portal URL: <code>{selected.portalPath}</code>
              {selected.portalLive ? " · live" : " · not live"}
            </p>
          ) : null}
          <p className="text-sm">Request count: {selected.requestCount}</p>

          <div className="grid gap-3 md:grid-cols-3">
            <FormField id="partner-slug" label="Public slug">
              <Input id="partner-slug" value={slug} onChange={(event) => setSlug(event.target.value)} />
            </FormField>
            <FormField id="partner-type" label="Partner type">
              <Select
                id="partner-type"
                value={partnerType}
                onChange={(event) => setPartnerType(event.target.value as PartnerType)}
              >
                {(Object.keys(PARTNER_TYPE_LABELS) as PartnerType[]).map((type) => (
                  <option key={type} value={type}>
                    {PARTNER_TYPE_LABELS[type]}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField id="partner-rate" label="Commission %">
              <Input
                id="partner-rate"
                value={commissionPercent}
                onChange={(event) => setCommissionPercent(event.target.value)}
              />
            </FormField>
            <FormField id="partner-org" label="Receiving organization ID">
              <Input
                id="partner-org"
                value={organizationId}
                onChange={(event) => setOrganizationId(event.target.value)}
              />
            </FormField>
            <FormField id="partner-portal-description" label="Public portal description">
              <Input
                id="partner-portal-description"
                value={portalDescription}
                onChange={(event) => setPortalDescription(event.target.value)}
              />
            </FormField>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={portalEnabled}
                onChange={(event) => setPortalEnabled(event.target.checked)}
              />
              Public Service Portal Enabled
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={loading}
              onClick={() =>
                void act("update", {
                  publicSlug: slug,
                  partnerType,
                  commissionPercent: Number(commissionPercent),
                  organizationId: organizationId || null,
                  publicPortalEnabled: portalEnabled,
                  portalDescription: portalDescription || null
                })
              }
            >
              Save slug / type / rate
            </Button>
            <Button type="button" disabled={loading} onClick={() => void act("approve", { publicSlug: slug, partnerType })}>
              Approve
            </Button>
            <Button type="button" disabled={loading} onClick={() => void act("activate")}>
              Activate
            </Button>
            <Button type="button" disabled={loading} variant="secondary" onClick={() => void act("suspend")}>
              Suspend
            </Button>
            <Button type="button" disabled={loading} variant="secondary" onClick={() => void act("reject")}>
              Reject
            </Button>
            <Button
              type="button"
              disabled={loading || !selected.id}
              variant="secondary"
              onClick={() => {
                void (async () => {
                  const response = await fetch(`/api/admin/partners/qr?partnerId=${selected.id}`);
                  const payload = (await response.json()) as { qrSvg?: string; error?: string };
                  if (!response.ok || !payload.qrSvg) {
                    setError(payload.error ?? "QR is unavailable.");
                    return;
                  }
                  setQrSvg(payload.qrSvg);
                })();
              }}
            >
              Show portal QR
            </Button>
          </div>
          {qrSvg ? (
            <div
              className="max-w-[220px] rounded-md border border-[var(--mpa-color-border-subtle)] bg-white p-3"
              aria-label="Partner portal QR code"
              dangerouslySetInnerHTML={{ __html: qrSvg }}
            />
          ) : null}

          <div>
            <h3 className="font-semibold">Referred organizations</h3>
            <ul className="mt-2 space-y-1 text-sm">
              {referrals
                .filter((row) => row.partnerId === selected.id)
                .map((row) => (
                  <li key={row.id}>
                    {row.organizationId}
                    {row.flaggedReason ? ` · flagged: ${row.flaggedReason}` : ""}
                  </li>
                ))}
              {referrals.filter((row) => row.partnerId === selected.id).length === 0 ? (
                <li className="text-[var(--mpa-color-text-muted)]">None yet.</li>
              ) : null}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold">Commission ledger</h3>
            <ul className="mt-2 space-y-2 text-sm">
              {commissions
                .filter((row) => row.partnerId === selected.id)
                .map((row) => (
                  <li key={row.id} className="flex flex-wrap items-center gap-2">
                    <span>
                      {(row.commissionCents / 100).toFixed(2)} at {bpsToPercent(row.commissionBps)}% · month{" "}
                      {row.qualifyingMonthIndex} · {row.status}
                      {row.offsetRequired ? " · offset required" : ""}
                    </span>
                    {row.status === "earned" ? (
                      <Button
                        type="button"
                        size="sm"
                        disabled={loading}
                        onClick={() => void act("mark_paid", { commissionId: row.id })}
                      >
                        Mark paid
                      </Button>
                    ) : null}
                    {row.status === "pending" ? (
                      <Button
                        type="button"
                        size="sm"
                        disabled={loading}
                        onClick={() => void act("clear_flag", { commissionId: row.id })}
                      >
                        Clear review
                      </Button>
                    ) : null}
                  </li>
                ))}
              {commissions.filter((row) => row.partnerId === selected.id).length === 0 ? (
                <li className="text-[var(--mpa-color-text-muted)]">No accruals yet.</li>
              ) : null}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold">Audit</h3>
            <ul className="mt-2 space-y-1 text-xs text-[var(--mpa-color-text-secondary)]">
              {events
                .filter((row) => row.partnerId === selected.id)
                .slice(0, 12)
                .map((row) => (
                  <li key={row.id}>
                    {row.createdAt}: {row.action}
                  </li>
                ))}
            </ul>
          </div>
        </section>
      ) : null}
    </main>
  );
}
