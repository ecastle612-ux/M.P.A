"use client";

import { useEffect, useState } from "react";
import {
  PARTNER_QR_PLACEMENT_GUIDANCE,
  PARTNER_REFERRAL_LINK_PURPOSE,
  PARTNER_SERVICE_REQUEST_LINK_PURPOSE
} from "@mpa/shared";
import { Button } from "@mpa/ui";
import { PartnerCommandCenterShell } from "./partner-command-center-shell";

export function PartnerPortalPage() {
  const [portal, setPortal] = useState<{
    live: boolean;
    displayUrl: string | null;
    portalUrl: string | null;
    qrSvg: string | null;
    companyName: string | null;
  } | null>(null);
  const [referralUrl, setReferralUrl] = useState<string | null>(null);
  const [referralDisplay, setReferralDisplay] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      const [portalResponse, dashboardResponse] = await Promise.all([
        fetch("/api/partners/portal", { signal: controller.signal }),
        fetch("/api/partners/dashboard", { signal: controller.signal })
      ]);
      const payload = (await portalResponse.json()) as {
        live?: boolean;
        displayUrl?: string | null;
        portalUrl?: string | null;
        qrSvg?: string | null;
        companyName?: string | null;
        error?: string;
      };
      const dashboard = (await dashboardResponse.json()) as {
        partner?: { referralAbsoluteUrl?: string | null; referralDisplayUrl?: string | null };
      };
      if (controller.signal.aborted) return;
      if (!portalResponse.ok) {
        setError(payload.error ?? "Could not load the service portal.");
        return;
      }
      setPortal({
        live: Boolean(payload.live),
        displayUrl: payload.displayUrl ?? null,
        portalUrl: payload.portalUrl ?? null,
        qrSvg: payload.qrSvg ?? null,
        companyName: payload.companyName ?? null
      });
      setReferralUrl(dashboard.partner?.referralAbsoluteUrl ?? null);
      setReferralDisplay(dashboard.partner?.referralDisplayUrl ?? null);
    })().catch(() => undefined);
    return () => controller.abort();
  }, []);

  return (
    <PartnerCommandCenterShell title="Service Portal" subtitle="Your customer service-request link, QR code, and portal preview.">
      {error ? <p className="text-sm text-[var(--mpa-color-text-danger,#B42318)]">{error}</p> : null}
      {notice ? <p className="text-sm text-[var(--mpa-color-text-secondary)]">{notice}</p> : null}
      <section className="space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
        <h2 className="font-display text-xl font-semibold">Your Service Portal</h2>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">{PARTNER_SERVICE_REQUEST_LINK_PURPOSE}</p>
        <p className="text-sm">{portal?.live ? "Active" : "Disabled"}</p>
        <p className="break-all text-sm">{portal?.displayUrl ?? "Not available yet"}</p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={!portal?.portalUrl}
            onClick={() => {
              if (!portal?.portalUrl) return;
              void navigator.clipboard.writeText(portal.portalUrl);
              setNotice("Service request link copied.");
            }}
          >
            Copy Link
          </Button>
          {portal?.portalUrl ? (
            <a
              className="inline-flex min-h-10 items-center rounded-md border border-[var(--mpa-color-border-default)] px-3 text-sm"
              href={portal.portalUrl}
              target="_blank"
              rel="noreferrer"
            >
              View Portal
            </a>
          ) : null}
          {portal?.portalUrl ? (
            <a
              className="inline-flex min-h-10 items-center rounded-md border border-[var(--mpa-color-border-default)] px-3 text-sm"
              href={portal.portalUrl}
              target="_blank"
              rel="noreferrer"
            >
              View My Service Portal
            </a>
          ) : null}
        </div>
        <p className="text-xs text-[var(--mpa-color-text-muted)]">Powered by M.P.A.</p>
      </section>

      <section className="space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
        <h2 className="font-display text-xl font-semibold">QR Center</h2>
        {portal?.qrSvg ? (
          <>
            <div
              className="max-w-[240px] rounded-md border border-[var(--mpa-color-border-subtle)] bg-white p-3 print:max-w-[320px]"
              aria-label="Service portal QR code"
              dangerouslySetInnerHTML={{ __html: portal.qrSvg }}
            />
            <p className="break-all text-sm">{portal.portalUrl}</p>
            <div className="flex flex-wrap gap-2">
              <a
                className="inline-flex min-h-10 items-center rounded-md border border-[var(--mpa-color-border-default)] px-3 text-sm"
                href={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(portal.qrSvg)}`}
                download={`${portal.companyName ?? "service-portal"}-qr.svg`}
              >
                Download QR
              </a>
              <Button type="button" variant="secondary" onClick={() => window.print()}>
                Print
              </Button>
            </div>
          </>
        ) : (
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            A QR code is available after Master Admin enables the public service portal.
          </p>
        )}
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">{PARTNER_QR_PLACEMENT_GUIDANCE}</p>
      </section>

      <section className="space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
        <h2 className="font-display text-xl font-semibold">M.P.A. Referral Link</h2>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">{PARTNER_REFERRAL_LINK_PURPOSE}</p>
        <p className="break-all text-sm">{referralDisplay ?? "Not available yet"}</p>
        {referralUrl ? (
          <a
            className="inline-flex min-h-10 items-center rounded-md border border-[var(--mpa-color-border-default)] px-3 text-sm"
            href={referralUrl}
            target="_blank"
            rel="noreferrer"
          >
            Open Referral Link
          </a>
        ) : null}
      </section>
    </PartnerCommandCenterShell>
  );
}
