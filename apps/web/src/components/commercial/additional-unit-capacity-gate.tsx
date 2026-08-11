"use client";

import { Button, Modal } from "@mpa/ui";

export type CapacityGatePayload = {
  title: string;
  headline: string;
  supporting: string;
  currentUnits: number;
  currentCapacity: number;
  requiredCapacity: number;
  currentPriceLabel: string;
  newPriceLabel: string;
  additionalCapacityLabel: string;
  effectiveLabel: string;
  ctaLabel: string;
  trialNote?: string | null;
};

type AdditionalUnitCapacityGateProps = {
  open: boolean;
  gate: CapacityGatePayload | null;
  busy?: boolean;
  error?: string | null;
  onClose: () => void;
  onAuthorize: () => void;
};

/**
 * Additional Unit Capacity payment gate — not an upgrade tier.
 * Explicit authorization only; next-period billing.
 */
export function AdditionalUnitCapacityGate({
  open,
  gate,
  busy,
  error,
  onClose,
  onAuthorize
}: AdditionalUnitCapacityGateProps) {
  if (!gate) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={gate.title}
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="secondary" disabled={busy} onClick={onClose}>
            Not now
          </Button>
          <Button type="button" disabled={busy} onClick={onAuthorize}>
            {busy ? "Authorizing…" : gate.ctaLabel}
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        <p className="text-base font-medium text-[var(--mpa-color-text-primary)]">{gate.headline}</p>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">{gate.supporting}</p>
        <dl className="grid gap-2 rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-app)] p-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-[var(--mpa-color-text-muted)]">Current units</dt>
            <dd className="font-medium">{gate.currentUnits}</dd>
          </div>
          <div>
            <dt className="text-[var(--mpa-color-text-muted)]">Current capacity</dt>
            <dd className="font-medium">{gate.currentCapacity}</dd>
          </div>
          <div>
            <dt className="text-[var(--mpa-color-text-muted)]">Required capacity</dt>
            <dd className="font-medium">{gate.requiredCapacity}</dd>
          </div>
          <div>
            <dt className="text-[var(--mpa-color-text-muted)]">Current price</dt>
            <dd className="font-medium">{gate.currentPriceLabel}</dd>
          </div>
          <div>
            <dt className="text-[var(--mpa-color-text-muted)]">New price</dt>
            <dd className="font-medium">{gate.newPriceLabel}</dd>
          </div>
          <div>
            <dt className="text-[var(--mpa-color-text-muted)]">Additional Unit Capacity</dt>
            <dd className="font-medium">{gate.additionalCapacityLabel}</dd>
          </div>
        </dl>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">{gate.effectiveLabel}</p>
        {gate.trialNote ? (
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">{gate.trialNote}</p>
        ) : null}
        {error ? (
          <p className="text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
