"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import QRCode from "qrcode";
import { Button, Card, Input } from "@mpa/ui";

function subscribeOrigin() {
  return () => undefined;
}

function getClientOrigin() {
  return window.location.origin;
}

function getServerOrigin() {
  return "";
}

type ActiveMeta = {
  tokenId: string;
  prefix: string;
  createdAt: string;
  hasActiveToken: boolean;
} | null;

export function VendorJobSharePanel({
  workOrderId,
  workOrderNumber,
  propertyLabel,
  canManage
}: {
  workOrderId: string;
  workOrderNumber: string;
  propertyLabel: string;
  canManage: boolean;
}) {
  const origin = useSyncExternalStore(subscribeOrigin, getClientOrigin, getServerOrigin);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [active, setActive] = useState<ActiveMeta>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch(`/api/maintenance/${workOrderId}/vendor-token`)
      .then(async (response) => {
        if (!response.ok) return;
        const body = (await response.json()) as { active: ActiveMeta };
        if (!cancelled) setActive(body.active);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [workOrderId]);

  useEffect(() => {
    if (!shareUrl) {
      setQrDataUrl(null);
      return;
    }
    let cancelled = false;
    void QRCode.toDataURL(shareUrl, {
      margin: 1,
      width: 220,
      color: { dark: "#1a1a1a", light: "#ffffff" }
    }).then((dataUrl) => {
      if (!cancelled) setQrDataUrl(dataUrl);
    });
    return () => {
      cancelled = true;
    };
  }, [shareUrl]);

  async function mintLink() {
    if (!canManage) return;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/maintenance/${workOrderId}/vendor-token`, { method: "POST" });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        setMessage(body?.error ?? "Unable to generate vendor link.");
        return;
      }
      const body = (await response.json()) as {
        url: string;
        tokenId: string;
        prefix: string;
      };
      setShareUrl(body.url);
      setActive({
        tokenId: body.tokenId,
        prefix: body.prefix,
        createdAt: new Date().toISOString(),
        hasActiveToken: true
      });
      setMessage("Vendor job link ready. Share SMS, email, QR, or copy the link.");
    } catch {
      setMessage("Unable to generate vendor link.");
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setMessage("Link copied.");
    } catch {
      setMessage("Unable to copy link.");
    }
  }

  const smsBody = shareUrl
    ? `Work order ${workOrderNumber} at ${propertyLabel}. Open to start the job (no login): ${shareUrl}`
    : "";
  const emailSubject = encodeURIComponent(`Work order ${workOrderNumber}`);
  const emailBody = encodeURIComponent(smsBody);

  return (
    <Card variant="elevated" className="space-y-4" id="vendor-share">
      <div>
        <h2 className="mpa-section-title">Vendor job link / QR</h2>
        <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
          Share a one-job link. Vendors open it in a browser — no login, no app download.
        </p>
      </div>

      {active?.hasActiveToken && !shareUrl ? (
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          An active link exists (prefix {active.prefix}). Generate again to reveal a new shareable URL and QR — prior
          links are revoked.
        </p>
      ) : null}

      {canManage ? (
        <Button type="button" variant="secondary" size="sm" disabled={busy} onClick={() => void mintLink()}>
          {busy ? "Generating…" : shareUrl ? "Regenerate link" : "Generate vendor link"}
        </Button>
      ) : (
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">You need update access to generate links.</p>
      )}

      {shareUrl ? (
        <div className="flex flex-wrap items-start gap-6">
          {qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- QR data URL is generated client-side
            <img
              src={qrDataUrl}
              alt={`QR code for work order ${workOrderNumber}`}
              className="rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-2"
              width={220}
              height={220}
            />
          ) : (
            <div className="flex h-[220px] w-[220px] items-center justify-center rounded-md border border-dashed text-sm text-[var(--mpa-color-text-secondary)]">
              Generating QR…
            </div>
          )}

          <div className="min-w-[240px] flex-1 space-y-3">
            <Input aria-label="Vendor job link" readOnly value={shareUrl || `${origin}/v/…`} />
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="secondary" onClick={() => void copyLink()}>
                Copy link
              </Button>
              <a
                href={`sms:?&body=${encodeURIComponent(smsBody)}`}
                className="inline-flex h-8 items-center justify-center rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-3 text-xs font-medium text-[var(--mpa-color-text-primary)] shadow-[var(--mpa-shadow-xs)]"
              >
                SMS
              </a>
              <a
                href={`mailto:?subject=${emailSubject}&body=${emailBody}`}
                className="inline-flex h-8 items-center justify-center rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-3 text-xs font-medium text-[var(--mpa-color-text-primary)] shadow-[var(--mpa-shadow-xs)]"
              >
                Email
              </a>
              {qrDataUrl ? (
                <a
                  href={qrDataUrl}
                  download={`${workOrderNumber}-vendor-qr.png`}
                  className="inline-flex h-8 items-center justify-center rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-3 text-xs font-medium text-[var(--mpa-color-text-primary)] shadow-[var(--mpa-shadow-xs)]"
                >
                  Download QR
                </a>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {message ? <p className="text-xs text-[var(--mpa-color-text-secondary)]">{message}</p> : null}
    </Card>
  );
}
