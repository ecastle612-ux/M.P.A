"use client";

import { useEffect, useState } from "react";

export function PartnerPropertyQrPrintPage({ linkId }: { linkId: string }) {
  const [portal, setPortal] = useState<{
    publicName: string;
    companyName?: string;
    qrSvg: string | null;
    displayUrl: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const [portalResponse, dashboardResponse] = await Promise.all([
        fetch(`/api/partners/property-portals/${linkId}`),
        fetch("/api/partners/dashboard")
      ]);
      const payload = (await portalResponse.json()) as {
        portal?: { publicName: string; qrSvg: string | null; displayUrl: string };
        error?: string;
      };
      const dashboard = (await dashboardResponse.json()) as { partner?: { companyName?: string } };
      if (!portalResponse.ok || !payload.portal) {
        setError(payload.error ?? "This printable QR is not available.");
        return;
      }
      setPortal({
        ...payload.portal,
        companyName: dashboard.partner?.companyName
      });
    })();
  }, [linkId]);

  if (error) {
    return <main className="p-8 text-sm">{error}</main>;
  }
  if (!portal) {
    return <main className="p-8 text-sm">Loading printable QR…</main>;
  }

  return (
    <main className="mx-auto max-w-md space-y-6 bg-white p-8 text-center print:max-w-none">
      <p className="text-xs font-semibold uppercase tracking-wide">{portal.companyName ?? "Service Partner"}</p>
      <h1 className="font-display text-3xl font-semibold">{portal.publicName}</h1>
      {portal.qrSvg ? (
        <div
          className="mx-auto max-w-[280px]"
          aria-label="Property service request QR code"
          dangerouslySetInnerHTML={{ __html: portal.qrSvg }}
        />
      ) : null}
      <p className="text-xl font-semibold">Scan to Submit a Service Request</p>
      <p className="break-all text-xs text-[var(--mpa-color-text-muted)]">{portal.displayUrl}</p>
      <p className="text-xs">Powered by M.P.A.</p>
      <button
        type="button"
        className="min-h-11 rounded-md border border-[var(--mpa-color-border-default)] px-4 text-sm print:hidden"
        onClick={() => window.print()}
      >
        Print
      </button>
    </main>
  );
}
