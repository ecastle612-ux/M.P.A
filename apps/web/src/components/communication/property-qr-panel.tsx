"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import QRCode from "qrcode";
import { Button, Card, Input } from "@mpa/ui";
import type { BuildingQrCodeRecord } from "../../lib/communication/contracts";

function subscribeOrigin() {
  return () => undefined;
}

function getClientOrigin() {
  return window.location.origin;
}

function getServerOrigin() {
  return "";
}

export function PropertyQrPanel({
  propertyId,
  propertyName,
  qrCode
}: {
  propertyId: string;
  propertyName: string;
  qrCode: BuildingQrCodeRecord | null;
}) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const origin = useSyncExternalStore(subscribeOrigin, getClientOrigin, getServerOrigin);
  const joinUrl = qrCode?.qrToken && origin ? `${origin}/join/${qrCode.qrToken}` : "";

  useEffect(() => {
    if (!joinUrl) return;
    let cancelled = false;
    void QRCode.toDataURL(joinUrl, {
      margin: 1,
      width: 220,
      color: {
        dark: "#1a1a1a",
        light: "#ffffff"
      }
    }).then((dataUrl) => {
      if (!cancelled) setQrDataUrl(dataUrl);
    });
    return () => {
      cancelled = true;
    };
  }, [joinUrl]);

  async function copyJoinUrl() {
    if (!joinUrl) return;
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopyMessage("Enrollment link copied.");
    } catch {
      setCopyMessage("Unable to copy link.");
    }
  }

  if (!qrCode) {
    return (
      <Card className="space-y-3">
        <h2 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">Resident enrollment QR</h2>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          No active QR code is available for {propertyName}. QR codes are auto-provisioned when properties are created.
        </p>
      </Card>
    );
  }

  return (
    <Card className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">Resident enrollment QR</h2>
        <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
          Residents scan this code to join {propertyName} and enable digital announcements.
        </p>
      </div>

      <div className="flex flex-wrap items-start gap-6">
        {joinUrl && qrDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- QR data URL is generated client-side
          <img
            src={qrDataUrl}
            alt={`QR code for ${propertyName} enrollment`}
            className="rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-2"
            width={220}
            height={220}
          />
        ) : (
          <div
            aria-busy="true"
            className="flex h-[220px] w-[220px] items-center justify-center rounded-md border border-dashed border-[var(--mpa-color-border-default)] text-sm text-[var(--mpa-color-text-secondary)]"
          >
            Generating QR…
          </div>
        )}

        <div className="min-w-[240px] flex-1 space-y-3">
          <div>
            <p className="text-xs text-[var(--mpa-color-text-secondary)]">Label</p>
            <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">{qrCode.label}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--mpa-color-text-secondary)]">Enrollments</p>
            <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">{qrCode.enrollmentCount}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--mpa-color-text-secondary)]">Last scanned</p>
            <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">
              {qrCode.lastScannedAt ? new Date(qrCode.lastScannedAt).toLocaleString() : "Never"}
            </p>
          </div>
          <div>
            <p className="text-xs text-[var(--mpa-color-text-secondary)]">Property ID</p>
            <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">{propertyId}</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Input aria-label="Enrollment link" readOnly value={joinUrl} />
        <Button type="button" variant="secondary" size="sm" onClick={copyJoinUrl} disabled={!joinUrl}>
          Copy enrollment link
        </Button>
        {copyMessage ? <p className="text-xs text-[var(--mpa-color-text-secondary)]">{copyMessage}</p> : null}
      </div>
    </Card>
  );
}
