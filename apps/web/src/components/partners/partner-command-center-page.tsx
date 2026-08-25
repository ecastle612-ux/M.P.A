"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  PARTNER_EARNINGS_TRACKING_EXPLAINER,
  PARTNER_REFERRAL_EARNINGS_EXPLAINER,
  PARTNER_REFERRAL_LINK_PURPOSE,
  PARTNER_SERVICE_REQUEST_LINK_PURPOSE,
  centsToUsd
} from "@mpa/shared";
import { Button, MetricCard } from "@mpa/ui";
import { PartnerCommandCenterShell } from "./partner-command-center-shell";
import { PartnerSetupCard, type PartnerSetupSnapshot } from "./partner-setup-card";

type Snapshot = {
  bound: boolean;
  partner: null | {
    companyName: string;
    partnerTypeLabel: string;
    displayStatus: { key: string; label: string };
    rate: { label: string; qualifyingCopy: string; founding: boolean; percent: number };
    portalLive: boolean;
    serviceRequestDisplayUrl: string | null;
    serviceRequestAbsoluteUrl: string | null;
    referralDisplayUrl: string | null;
    referralAbsoluteUrl: string | null;
  };
  requests: {
    newCount: number;
    acceptedCount: number;
    convertedCount: number;
    declinedCount: number;
    thisMonthCount: number;
    conversionRate: number | null;
    recent: Array<{
      id: string;
      publicRef: string;
      requesterName: string;
      propertyAddress: string;
      categoryLabel: string;
      urgencyLabel: string;
      statusLabel: string;
      createdAt: string;
    }>;
  };
  referrals: {
    totalAttributedOrganizations: number;
    activeQualifyingReferrals: number;
    qualifyingPaidMonths: number;
    totalTrackedCommissionsCents: number;
  };
  earnings: {
    pendingCents: number;
    earnedCents: number;
    paidCents: number;
    voidCents: number;
  };
  activity: Array<{ id: string; label: string; createdAt: string }>;
  onboarding: PartnerSetupSnapshot | null;
};

export function PartnerCommandCenterPage() {
  const [data, setData] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      const response = await fetch("/api/partners/dashboard", { signal: controller.signal });
      const payload = (await response.json()) as Snapshot & { error?: string };
      if (controller.signal.aborted) return;
      if (!response.ok) {
        setError(payload.error ?? "Could not load Partner Command Center.");
        return;
      }
      setData(payload);
    })().catch(() => undefined);
    return () => controller.abort();
  }, []);

  async function copy(value: string, label: string) {
    await navigator.clipboard.writeText(value);
    setNotice(`${label} copied.`);
  }

  return (
    <PartnerCommandCenterShell>
      {error ? <p className="text-sm text-[var(--mpa-color-text-danger,#B42318)]">{error}</p> : null}
      {notice ? <p className="text-sm text-[var(--mpa-color-text-secondary)]">{notice}</p> : null}
      {!data ? <p className="text-sm text-[var(--mpa-color-text-secondary)]">Loading…</p> : null}
      {data && !data.bound ? (
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          This workspace is not bound to a Partner Program account. Master Admin must bind a receiving
          organization before Partner Command Center can show partner data.
        </p>
      ) : null}
      {data?.partner ? (
        <div className="space-y-6">
          {data.onboarding && data.onboarding.onboardingStatus !== "complete" ? (
            <PartnerSetupCard
              onboarding={data.onboarding}
              referralUrl={data.partner.referralAbsoluteUrl}
              onAck={async (action) => {
                const response = await fetch("/api/partners/onboarding/ack", {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({ action })
                });
                const payload = (await response.json()) as { onboarding?: PartnerSetupSnapshot };
                if (response.ok && payload.onboarding) {
                  setData({ ...data, onboarding: payload.onboarding });
                }
              }}
            />
          ) : null}
          <section className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[var(--mpa-color-bg-subtle,#F7F8FA)] px-3 py-1 text-sm">
              {data.partner.displayStatus.label}
            </span>
            <span className="text-sm text-[var(--mpa-color-text-secondary)]">{data.partner.partnerTypeLabel}</span>
          </section>

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="New requests" value={data.requests.newCount} />
            <MetricCard label="Accepted" value={data.requests.acceptedCount} />
            <MetricCard label="Converted" value={data.requests.convertedCount} />
            <MetricCard label="Declined" value={data.requests.declinedCount} />
          </section>

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Referred organizations" value={data.referrals.totalAttributedOrganizations} />
            <MetricCard label="Active qualifying referrals" value={data.referrals.activeQualifyingReferrals} />
            <MetricCard label="Qualifying paid months" value={data.referrals.qualifyingPaidMonths} />
            <MetricCard
              label="Tracked commissions"
              value={centsToUsd(data.referrals.totalTrackedCommissionsCents)}
            />
          </section>

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Pending" value={centsToUsd(data.earnings.pendingCents)} />
            <MetricCard label="Earned" value={centsToUsd(data.earnings.earnedCents)} />
            <MetricCard label="Paid" value={centsToUsd(data.earnings.paidCents)} />
            <MetricCard label="Voided / adjusted" value={centsToUsd(data.earnings.voidCents)} />
          </section>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">{PARTNER_EARNINGS_TRACKING_EXPLAINER}</p>
          <p className="text-sm">
            <strong>{data.partner.rate.label}</strong>
            <span className="block text-[var(--mpa-color-text-secondary)]">{data.partner.rate.qualifyingCopy}</span>
          </p>

          <section className="grid gap-4 lg:grid-cols-2">
            <article className="space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
              <h2 className="font-display text-xl font-semibold">Service Request Link</h2>
              <p className="text-sm text-[var(--mpa-color-text-secondary)]">{PARTNER_SERVICE_REQUEST_LINK_PURPOSE}</p>
              <p className="break-all text-sm">{data.partner.serviceRequestDisplayUrl ?? "Not available yet"}</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  disabled={!data.partner.serviceRequestAbsoluteUrl}
                  onClick={() =>
                    data.partner?.serviceRequestAbsoluteUrl &&
                    void copy(data.partner.serviceRequestAbsoluteUrl, "Service request link")
                  }
                >
                  Copy Link
                </Button>
                {data.partner.serviceRequestAbsoluteUrl ? (
                  <a
                    className="inline-flex min-h-10 items-center rounded-md border border-[var(--mpa-color-border-default)] px-3 text-sm"
                    href={data.partner.serviceRequestAbsoluteUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View Portal
                  </a>
                ) : null}
              </div>
              <p className="text-xs text-[var(--mpa-color-text-muted)]">Powered by M.P.A.</p>
            </article>
            <article className="space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
              <h2 className="font-display text-xl font-semibold">M.P.A. Referral Link</h2>
              <p className="text-sm text-[var(--mpa-color-text-secondary)]">{PARTNER_REFERRAL_LINK_PURPOSE}</p>
              <p className="break-all text-sm">{data.partner.referralDisplayUrl ?? "Not available yet"}</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  disabled={!data.partner.referralAbsoluteUrl}
                  onClick={() =>
                    data.partner?.referralAbsoluteUrl &&
                    void copy(data.partner.referralAbsoluteUrl, "Referral link")
                  }
                >
                  Copy Referral Link
                </Button>
                {data.partner.referralAbsoluteUrl ? (
                  <a
                    className="inline-flex min-h-10 items-center rounded-md border border-[var(--mpa-color-border-default)] px-3 text-sm"
                    href={data.partner.referralAbsoluteUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open Link
                  </a>
                ) : null}
              </div>
              <p className="text-sm text-[var(--mpa-color-text-secondary)]">{PARTNER_REFERRAL_EARNINGS_EXPLAINER}</p>
            </article>
          </section>

          <section className="grid gap-3 sm:grid-cols-3">
            <MetricCard label="Requests this month" value={data.requests.thisMonthCount} />
            <MetricCard
              label="Conversion rate"
              value={data.requests.conversionRate == null ? "—" : `${data.requests.conversionRate}%`}
            />
            <MetricCard
              label="Service portal"
              value={data.partner.portalLive ? "Active" : "Disabled"}
            />
          </section>

          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-xl font-semibold">Recent service requests</h2>
              <Link className="text-sm underline" href="/partner/services">
                View All Requests
              </Link>
            </div>
            <div className="grid gap-3 md:hidden">
              {data.requests.recent.map((row) => (
                <article key={row.id} className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
                  <p className="font-medium">{row.requesterName}</p>
                  <p className="text-sm">{row.propertyAddress}</p>
                  <p className="text-sm text-[var(--mpa-color-text-secondary)]">
                    {row.categoryLabel} · {row.urgencyLabel} · {row.statusLabel}
                  </p>
                  <p className="text-xs text-[var(--mpa-color-text-muted)]">
                    {row.publicRef} · {new Date(row.createdAt).toLocaleString()}
                  </p>
                </article>
              ))}
            </div>
            <div className="hidden overflow-x-auto rounded-md border border-[var(--mpa-color-border-default)] md:block">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-[var(--mpa-color-bg-subtle,#F7F8FA)]">
                  <tr>
                    <th className="px-3 py-2 font-medium">Requester</th>
                    <th className="px-3 py-2 font-medium">Location</th>
                    <th className="px-3 py-2 font-medium">Category</th>
                    <th className="px-3 py-2 font-medium">Urgency</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium">Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {data.requests.recent.map((row) => (
                    <tr key={row.id} className="border-t border-[var(--mpa-color-border-subtle)]">
                      <td className="px-3 py-2">{row.requesterName}</td>
                      <td className="px-3 py-2">{row.propertyAddress}</td>
                      <td className="px-3 py-2">{row.categoryLabel}</td>
                      <td className="px-3 py-2">{row.urgencyLabel}</td>
                      <td className="px-3 py-2">{row.statusLabel}</td>
                      <td className="px-3 py-2">{new Date(row.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data.requests.recent.length === 0 ? (
              <p className="text-sm text-[var(--mpa-color-text-muted)]">No service requests yet.</p>
            ) : null}
          </section>

          {data.activity.length > 0 ? (
            <section>
              <h2 className="font-display text-xl font-semibold">Recent activity</h2>
              <ul className="mt-2 space-y-1 text-sm text-[var(--mpa-color-text-secondary)]">
                {data.activity.map((item) => (
                  <li key={item.id}>
                    {new Date(item.createdAt).toLocaleString()} — {item.label}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      ) : null}
    </PartnerCommandCenterShell>
  );
}
