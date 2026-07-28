"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Card } from "@mpa/ui";
import type { OffboardingSnapshot } from "../../lib/commercial/offboarding-types";
import type { CsMotionSnapshot } from "../../lib/commercial/cs-motions";
import type { RenewalAlertSnapshot } from "../../lib/commercial/renewal-alerts";

type Props = {
  organizationId: string;
  canManage: boolean;
};

const STAGE_LABEL: Record<string, string> = {
  none: "Active (no offboarding)",
  cancel_confirmed: "Cancel confirmed",
  retention_offer: "Retention offer",
  final_billing: "Final billing",
  export_window: "Export window",
  frozen: "Frozen",
  archive_scheduled: "Archive scheduled",
  archived: "Archived",
  recovered: "Recovered"
};

export function OrgOffboardingCard({ organizationId, canManage }: Props) {
  const [offboarding, setOffboarding] = useState<OffboardingSnapshot | null>(null);
  const [motions, setMotions] = useState<CsMotionSnapshot[]>([]);
  const [alerts, setAlerts] = useState<RenewalAlertSnapshot[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [offRes, csRes, renRes] = await Promise.all([
      fetch(`/api/organizations/${organizationId}/offboarding`, { cache: "no-store" }),
      fetch(`/api/organizations/${organizationId}/cs-motions`, { cache: "no-store" }),
      fetch(`/api/organizations/${organizationId}/renewal-alerts`, { cache: "no-store" })
    ]);
    const offPayload = (await offRes.json()) as {
      offboarding?: OffboardingSnapshot;
      message?: string;
      error?: string;
    };
    const csPayload = (await csRes.json()) as {
      motions?: CsMotionSnapshot[];
      message?: string;
    };
    const renPayload = (await renRes.json()) as {
      alerts?: RenewalAlertSnapshot[];
      message?: string;
    };
    setLoading(false);
    if (!offRes.ok) {
      setError(offPayload.message ?? offPayload.error ?? "Unable to load offboarding");
      return;
    }
    setOffboarding(offPayload.offboarding ?? null);
    setMotions(csPayload.motions ?? []);
    setAlerts(renPayload.alerts ?? []);
  }, [organizationId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function runAction(action: string, extra?: Record<string, unknown>) {
    setLoading(true);
    setNotice(null);
    setError(null);
    const response = await fetch(`/api/organizations/${organizationId}/offboarding`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...extra })
    });
    const payload = (await response.json()) as {
      offboarding?: OffboardingSnapshot;
      message?: string;
      error?: string;
    };
    setLoading(false);
    if (!response.ok) {
      setError(payload.message ?? payload.error ?? "Action failed");
      return;
    }
    setOffboarding(payload.offboarding ?? null);
    setNotice(`Updated: ${payload.offboarding?.stage ?? action}`);
    await load();
  }

  const inventory = offboarding?.exportInventory as
    | { properties?: number; units?: number; tenants?: number; leases?: number }
    | undefined;

  return (
    <Card className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-[var(--mpa-color-text-primary)]">
            Offboarding & success
          </h2>
          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
            Cancel / export / freeze status, CS 30/90 motions, and renewal reminders (COM-001 Slice
            D). Cancel never immediately deletes data.
          </p>
        </div>
        <Button type="button" variant="secondary" disabled={loading} onClick={() => void load()}>
          Refresh
        </Button>
      </div>

      {error ? (
        <p className="text-sm text-[var(--mpa-color-feedback-error)]">{error}</p>
      ) : null}
      {notice ? (
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">{notice}</p>
      ) : null}

      {offboarding ? (
        <div className="space-y-2 text-sm text-[var(--mpa-color-text-secondary)]">
          <p className="text-[var(--mpa-color-text-primary)]">
            Stage:{" "}
            <span className="font-medium">
              {STAGE_LABEL[offboarding.stage] ?? offboarding.stage}
            </span>
          </p>
          <p>
            Purge allowed: {offboarding.purgeAllowed ? "yes" : "no"} · Legal hold:{" "}
            {offboarding.legalHold ? "yes" : "no"}
          </p>
          {offboarding.exportWindowEndsAt ? (
            <p>Export window ends: {new Date(offboarding.exportWindowEndsAt).toLocaleString()}</p>
          ) : null}
          {offboarding.exportReadyAt && inventory ? (
            <p>
              Export inventory — properties {inventory.properties ?? 0}, units {inventory.units ?? 0},
              tenants {inventory.tenants ?? 0}, leases {inventory.leases ?? 0}
            </p>
          ) : null}
          {offboarding.mutationsBlocked ? <p>Mutations blocked (frozen / archive path).</p> : null}
        </div>
      ) : null}

      {canManage && offboarding && offboarding.stage === "none" ? (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={loading}
            onClick={() => void runAction("confirm_cancel", { skipRetentionOffer: false })}
          >
            Start cancellation
          </Button>
        </div>
      ) : null}

      {canManage && offboarding?.stage === "retention_offer" ? (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={loading}
            onClick={() => void runAction("retention_offer", { status: "declined" })}
          >
            Decline retention → billing
          </Button>
          <Button
            type="button"
            disabled={loading}
            onClick={() => void runAction("retention_offer", { status: "accepted" })}
          >
            Accept retention (win-back)
          </Button>
        </div>
      ) : null}

      {canManage &&
      offboarding &&
      (offboarding.stage === "final_billing" || offboarding.stage === "retention_offer") ? (
        <Button
          type="button"
          variant="secondary"
          disabled={loading}
          onClick={() => void runAction("coordinate_billing")}
        >
          Coordinate final billing + open export
        </Button>
      ) : null}

      {canManage && offboarding?.stage === "export_window" ? (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={loading}
            onClick={() => void runAction("refresh_export")}
          >
            Refresh export inventory
          </Button>
          <Button type="button" disabled={loading} onClick={() => void runAction("freeze")}>
            Freeze account
          </Button>
        </div>
      ) : null}

      {canManage && offboarding?.canWinBack ? (
        <Button
          type="button"
          variant="secondary"
          disabled={loading}
          onClick={() => void runAction("recover")}
        >
          Recover (win-back)
        </Button>
      ) : null}

      <div className="space-y-2 border-t border-[var(--mpa-color-border-default)] pt-3">
        <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">CS 30/90 motions</p>
        {motions.length === 0 ? (
          <p className="text-sm text-[var(--mpa-color-text-muted)]">No motions scheduled yet.</p>
        ) : (
          <ul className="space-y-1 text-sm text-[var(--mpa-color-text-secondary)]">
            {motions.map((m) => (
              <li key={m.motionKey}>
                {m.motionKey}: {m.status}
                {m.dueAt ? ` · due ${new Date(m.dueAt).toLocaleDateString()}` : ""}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-2 border-t border-[var(--mpa-color-border-default)] pt-3">
        <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">Renewal alerts</p>
        {alerts.length === 0 ? (
          <p className="text-sm text-[var(--mpa-color-text-muted)]">
            No renewal milestones (subscription period end required).
          </p>
        ) : (
          <ul className="space-y-1 text-sm text-[var(--mpa-color-text-secondary)]">
            {alerts.map((a) => (
              <li key={`${a.milestoneKey}-${a.periodEndAt}`}>
                {a.milestoneKey.toUpperCase()}: {a.status}
                {` · due ${new Date(a.dueAt).toLocaleDateString()}`}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
