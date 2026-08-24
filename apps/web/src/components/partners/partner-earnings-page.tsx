"use client";

import { useEffect, useState } from "react";
import { PARTNER_EARNINGS_TRACKING_EXPLAINER, centsToUsd } from "@mpa/shared";
import { MetricCard } from "@mpa/ui";
import { PartnerCommandCenterShell } from "./partner-command-center-shell";

type Summary = {
  pendingCents: number;
  earnedCents: number;
  paidCents: number;
  voidCents: number;
};

type Row = {
  id: string;
  organizationName: string;
  qualifyingMonth: number;
  eligibleRevenueCents: number;
  commissionPercent: number;
  commissionCents: number;
  status: string;
  earnedDate: string;
  paidDate: string | null;
};

export function PartnerEarningsPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [rateLabel, setRateLabel] = useState<string | null>(null);
  const [qualifyingCopy, setQualifyingCopy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      const [ledgerResponse, dashboardResponse] = await Promise.all([
        fetch("/api/partners/commissions", { signal: controller.signal }),
        fetch("/api/partners/dashboard", { signal: controller.signal })
      ]);
      const ledger = (await ledgerResponse.json()) as {
        summary?: Summary;
        commissions?: Row[];
        error?: string;
      };
      const dashboard = (await dashboardResponse.json()) as {
        partner?: { rate?: { label: string; qualifyingCopy: string } };
      };
      if (controller.signal.aborted) return;
      if (!ledgerResponse.ok) {
        setError(ledger.error ?? "Could not load tracked earnings.");
        return;
      }
      setSummary(ledger.summary ?? null);
      setRows(ledger.commissions ?? []);
      setRateLabel(dashboard.partner?.rate?.label ?? null);
      setQualifyingCopy(dashboard.partner?.rate?.qualifyingCopy ?? null);
    })().catch(() => undefined);
    return () => controller.abort();
  }, []);

  return (
    <PartnerCommandCenterShell
      title="Partner Earnings"
      subtitle="Tracked earnings from the Partner Program commission ledger."
    >
      {error ? <p className="text-sm text-[var(--mpa-color-text-danger,#B42318)]">{error}</p> : null}
      {rateLabel ? (
        <p className="text-sm">
          <strong>{rateLabel}</strong>
          {qualifyingCopy ? (
            <span className="block text-[var(--mpa-color-text-secondary)]">{qualifyingCopy}</span>
          ) : null}
        </p>
      ) : null}
      {summary ? (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Pending" value={centsToUsd(summary.pendingCents)} />
          <MetricCard label="Earned" value={centsToUsd(summary.earnedCents)} />
          <MetricCard label="Paid" value={centsToUsd(summary.paidCents)} />
          <MetricCard label="Voided / adjusted" value={centsToUsd(summary.voidCents)} />
        </section>
      ) : null}
      <p className="text-sm text-[var(--mpa-color-text-secondary)]">{PARTNER_EARNINGS_TRACKING_EXPLAINER}</p>
      <div className="grid gap-3 md:hidden">
        {rows.map((row) => (
          <article key={row.id} className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
            <p className="font-medium">{row.organizationName}</p>
            <p className="text-sm">
              Month {row.qualifyingMonth} · {row.commissionPercent}% · {centsToUsd(row.commissionCents)}
            </p>
            <p className="text-sm capitalize">{row.status}</p>
            <p className="text-xs text-[var(--mpa-color-text-muted)]">
              Eligible {centsToUsd(row.eligibleRevenueCents)} · {new Date(row.earnedDate).toLocaleDateString()}
              {row.paidDate ? ` · Paid ${new Date(row.paidDate).toLocaleDateString()}` : ""}
            </p>
          </article>
        ))}
      </div>
      <div className="hidden overflow-x-auto rounded-md border border-[var(--mpa-color-border-default)] md:block">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[var(--mpa-color-bg-subtle,#F7F8FA)]">
            <tr>
              <th className="px-3 py-2 font-medium">Customer</th>
              <th className="px-3 py-2 font-medium">Month</th>
              <th className="px-3 py-2 font-medium">Eligible</th>
              <th className="px-3 py-2 font-medium">Rate</th>
              <th className="px-3 py-2 font-medium">Commission</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Earned</th>
              <th className="px-3 py-2 font-medium">Paid</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-[var(--mpa-color-border-subtle)]">
                <td className="px-3 py-2">{row.organizationName}</td>
                <td className="px-3 py-2">{row.qualifyingMonth}</td>
                <td className="px-3 py-2">{centsToUsd(row.eligibleRevenueCents)}</td>
                <td className="px-3 py-2">{row.commissionPercent}%</td>
                <td className="px-3 py-2">{centsToUsd(row.commissionCents)}</td>
                <td className="px-3 py-2 capitalize">{row.status}</td>
                <td className="px-3 py-2">{new Date(row.earnedDate).toLocaleDateString()}</td>
                <td className="px-3 py-2">
                  {row.paidDate ? new Date(row.paidDate).toLocaleDateString() : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-[var(--mpa-color-text-muted)]">No tracked commissions yet.</p>
      ) : null}
    </PartnerCommandCenterShell>
  );
}
