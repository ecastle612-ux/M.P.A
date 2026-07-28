"use client";

import { useState, type FormEvent } from "react";
import { Button, Card, Input } from "@mpa/ui";

type Notice = { kind: "error" | "ok"; text: string };

export function AuthRecoveryPanel() {
  const [organizationId, setOrganizationId] = useState("");
  const [targetIdentifier, setTargetIdentifier] = useState("");
  const [newOwnerIdentifier, setNewOwnerIdentifier] = useState("");
  const [reason, setReason] = useState("");
  const [identityVerified, setIdentityVerified] = useState(false);
  const [secondaryContactConfirmed, setSecondaryContactConfirmed] = useState(false);
  const [disablePreviousOwner, setDisablePreviousOwner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [auditPreview, setAuditPreview] = useState<
    Array<{ id: string; action: string; occurredAt: string; reason: string | null }>
  >([]);

  async function runOrgAdminRecovery(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setNotice(null);
    const response = await fetch("/api/master-admin/recovery/org-admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organizationId,
        targetIdentifier,
        reason,
        identityVerified,
        secondaryContactConfirmed
      })
    });
    const payload = (await response.json()) as { message?: string; error?: string; auditId?: string };
    setLoading(false);
    if (!response.ok) {
      setNotice({ kind: "error", text: payload.message ?? payload.error ?? "Recovery failed" });
      return;
    }
    setNotice({
      kind: "ok",
      text: `Org Admin recovery completed. Audit ${payload.auditId ?? ""}`.trim()
    });
  }

  async function runOwnershipRestore(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setNotice(null);
    const response = await fetch("/api/master-admin/recovery/ownership", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organizationId,
        newOwnerIdentifier,
        reason,
        identityVerified,
        secondaryContactConfirmed,
        disablePreviousOwner
      })
    });
    const payload = (await response.json()) as { message?: string; error?: string; auditId?: string };
    setLoading(false);
    if (!response.ok) {
      setNotice({ kind: "error", text: payload.message ?? payload.error ?? "Ownership restore failed" });
      return;
    }
    setNotice({
      kind: "ok",
      text: `Ownership restore completed. Audit ${payload.auditId ?? ""}`.trim()
    });
  }

  async function openEscalation() {
    setLoading(true);
    setNotice(null);
    const response = await fetch("/api/master-admin/recovery/escalations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "open",
        organizationId,
        issueClass: "org_admin_lockout",
        reason: reason || "Org Admin lockout support case"
      })
    });
    const payload = (await response.json()) as {
      message?: string;
      error?: string;
      escalation?: { id: string; level: string };
    };
    setLoading(false);
    if (!response.ok) {
      setNotice({ kind: "error", text: payload.message ?? payload.error ?? "Escalation failed" });
      return;
    }
    setNotice({
      kind: "ok",
      text: `Escalation opened at ${payload.escalation?.level ?? "L2"} (${payload.escalation?.id ?? ""})`
    });
  }

  async function loadAudit() {
    if (!organizationId.trim()) return;
    setLoading(true);
    setNotice(null);
    const response = await fetch(
      `/api/master-admin/recovery/audit?organizationId=${encodeURIComponent(organizationId)}`
    );
    const payload = (await response.json()) as {
      message?: string;
      records?: Array<{ id: string; action: string; occurredAt: string; reason: string | null }>;
    };
    setLoading(false);
    if (!response.ok) {
      setNotice({ kind: "error", text: payload.message ?? "Unable to load audit" });
      return;
    }
    setAuditPreview(payload.records ?? []);
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-xl font-semibold text-[var(--mpa-color-text-primary)]">
          Auth recovery
        </h1>
        <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
          Level-3 Organization Administrator recovery, ownership restore, and privileged audit. Temporary
          credentials are emailed only — never shown here.
        </p>
      </div>

      <Card className="space-y-3">
        <h2 className="text-base font-semibold">Organization context</h2>
        <Input
          aria-label="Organization id"
          placeholder="Organization UUID"
          value={organizationId}
          onChange={(event) => setOrganizationId(event.target.value)}
        />
        <Input
          aria-label="Recovery reason"
          placeholder="Verification reason / case notes"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />
        <label className="flex items-center gap-2 text-sm text-[var(--mpa-color-text-secondary)]">
          <input
            type="checkbox"
            checked={identityVerified}
            onChange={(event) => setIdentityVerified(event.target.checked)}
          />
          Identity verification completed
        </label>
        <label className="flex items-center gap-2 text-sm text-[var(--mpa-color-text-secondary)]">
          <input
            type="checkbox"
            checked={secondaryContactConfirmed}
            onChange={(event) => setSecondaryContactConfirmed(event.target.checked)}
          />
          Secondary recovery contact confirmed
        </label>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="space-y-3">
          <h2 className="text-base font-semibold">Org Admin L3 recovery</h2>
          <form className="space-y-3" onSubmit={(event) => void runOrgAdminRecovery(event)}>
            <Input
              aria-label="Target username or contact email"
              placeholder="Username or contact email"
              value={targetIdentifier}
              onChange={(event) => setTargetIdentifier(event.target.value)}
              required
            />
            <Button type="submit" disabled={loading}>
              Recover Org Admin
            </Button>
          </form>
        </Card>

        <Card className="space-y-3">
          <h2 className="text-base font-semibold">Ownership restore</h2>
          <form className="space-y-3" onSubmit={(event) => void runOwnershipRestore(event)}>
            <Input
              aria-label="New owner identifier"
              placeholder="New owner user id, username, or email"
              value={newOwnerIdentifier}
              onChange={(event) => setNewOwnerIdentifier(event.target.value)}
              required
            />
            <label className="flex items-center gap-2 text-sm text-[var(--mpa-color-text-secondary)]">
              <input
                type="checkbox"
                checked={disablePreviousOwner}
                onChange={(event) => setDisablePreviousOwner(event.target.checked)}
              />
              Disable previous owner after transfer
            </label>
            <Button type="submit" disabled={loading}>
              Restore ownership
            </Button>
          </form>
        </Card>
      </div>

      <Card className="space-y-3">
        <h2 className="text-base font-semibold">Support escalation & audit</h2>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" disabled={loading} onClick={() => void openEscalation()}>
            Open Org Admin lockout escalation
          </Button>
          <Button type="button" variant="secondary" disabled={loading} onClick={() => void loadAudit()}>
            Load privileged audit
          </Button>
        </div>
        {auditPreview.length > 0 ? (
          <ul className="space-y-2 text-sm">
            {auditPreview.slice(0, 12).map((row) => (
              <li
                key={row.id}
                className="rounded-md border border-[var(--mpa-color-border-default)] px-3 py-2"
              >
                <p className="font-medium text-[var(--mpa-color-text-primary)]">{row.action}</p>
                <p className="text-[var(--mpa-color-text-secondary)]">
                  {new Date(row.occurredAt).toLocaleString()}
                  {row.reason ? ` · ${row.reason}` : ""}
                </p>
              </li>
            ))}
          </ul>
        ) : null}
      </Card>

      {notice ? (
        <p
          className={
            notice.kind === "error"
              ? "text-sm text-[var(--mpa-color-feedback-error)]"
              : "text-sm text-[var(--mpa-color-brand-primary)]"
          }
        >
          {notice.text}
        </p>
      ) : null}
    </div>
  );
}
