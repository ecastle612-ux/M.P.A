"use client";

import { useEffect, useState } from "react";
import { PARTNER_REFERRAL_EARNINGS_EXPLAINER, PARTNER_REFERRAL_LINK_PURPOSE } from "@mpa/shared";
import { Button } from "@mpa/ui";
import { PartnerCommandCenterShell } from "./partner-command-center-shell";

type Row = {
  id: string;
  organizationName: string;
  referralDate: string;
  status: string;
  qualifyingPaidMonths: number;
  commissionStatus: string;
};

export function PartnerReferralsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [referralUrl, setReferralUrl] = useState<string | null>(null);
  const [referralDisplay, setReferralDisplay] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      const [referralsResponse, dashboardResponse] = await Promise.all([
        fetch("/api/partners/referrals", { signal: controller.signal }),
        fetch("/api/partners/dashboard", { signal: controller.signal })
      ]);
      const referrals = (await referralsResponse.json()) as { referrals?: Row[]; error?: string };
      const dashboard = (await dashboardResponse.json()) as {
        partner?: { referralAbsoluteUrl?: string | null; referralDisplayUrl?: string | null };
      };
      if (controller.signal.aborted) return;
      if (!referralsResponse.ok) {
        setError(referrals.error ?? "Could not load referrals.");
        return;
      }
      setRows(referrals.referrals ?? []);
      setReferralUrl(dashboard.partner?.referralAbsoluteUrl ?? null);
      setReferralDisplay(dashboard.partner?.referralDisplayUrl ?? null);
    })().catch(() => undefined);
    return () => controller.abort();
  }, []);

  return (
    <PartnerCommandCenterShell title="Referrals" subtitle={PARTNER_REFERRAL_LINK_PURPOSE}>
      {error ? <p className="text-sm text-[var(--mpa-color-text-danger,#B42318)]">{error}</p> : null}
      {notice ? <p className="text-sm text-[var(--mpa-color-text-secondary)]">{notice}</p> : null}
      <section className="space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
        <h2 className="font-display text-xl font-semibold">M.P.A. Referral Link</h2>
        <p className="break-all text-sm">{referralDisplay ?? "Not available yet"}</p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={!referralUrl}
            onClick={() => {
              if (!referralUrl) return;
              void navigator.clipboard.writeText(referralUrl);
              setNotice("Referral link copied.");
            }}
          >
            Copy Referral Link
          </Button>
          {referralUrl ? (
            <a
              className="inline-flex min-h-10 items-center rounded-md border border-[var(--mpa-color-border-default)] px-3 text-sm"
              href={referralUrl}
              target="_blank"
              rel="noreferrer"
            >
              Open Link
            </a>
          ) : null}
        </div>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">{PARTNER_REFERRAL_EARNINGS_EXPLAINER}</p>
      </section>
      <div className="grid gap-3 md:hidden">
        {rows.map((row) => (
          <article key={row.id} className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
            <p className="font-medium">{row.organizationName}</p>
            <p className="text-sm">{row.status} · {row.commissionStatus}</p>
            <p className="text-sm text-[var(--mpa-color-text-secondary)]">
              {row.qualifyingPaidMonths} qualifying paid months
            </p>
            <p className="text-xs text-[var(--mpa-color-text-muted)]">
              {new Date(row.referralDate).toLocaleDateString()}
            </p>
          </article>
        ))}
      </div>
      <div className="hidden overflow-x-auto rounded-md border border-[var(--mpa-color-border-default)] md:block">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[var(--mpa-color-bg-subtle,#F7F8FA)]">
            <tr>
              <th className="px-3 py-2 font-medium">Organization</th>
              <th className="px-3 py-2 font-medium">Referral date</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Qualifying months</th>
              <th className="px-3 py-2 font-medium">Commission</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-[var(--mpa-color-border-subtle)]">
                <td className="px-3 py-2">{row.organizationName}</td>
                <td className="px-3 py-2">{new Date(row.referralDate).toLocaleDateString()}</td>
                <td className="px-3 py-2">{row.status}</td>
                <td className="px-3 py-2">{row.qualifyingPaidMonths}</td>
                <td className="px-3 py-2">{row.commissionStatus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-[var(--mpa-color-text-muted)]">No referred organizations yet.</p>
      ) : null}
    </PartnerCommandCenterShell>
  );
}
