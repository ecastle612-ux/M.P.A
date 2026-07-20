"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Badge, Button, Card } from "@mpa/ui";

type SignatureDetail = {
  package: {
    id: string;
    packageNumber: string;
    status: string;
    provider: string;
    documentType: string;
    vaultStatus: string;
    externalReference: string | null;
    leaseId: string | null;
    applicantId: string | null;
    residentActivatedAt: string | null;
    completedAt: string | null;
  };
  recipients: Array<{
    id: string;
    role: string;
    fullName: string;
    email: string | null;
    status: string;
    progressUrl: string | null;
    signingUrl: string | null;
    reminderCount: number;
  }>;
  documents: Array<{ id: string; title: string; isPreview: boolean; contentText: string | null }>;
  progress: Array<{ key: string; label: string; status: string }>;
  canSend?: boolean;
  canCancel?: boolean;
};

type Props = {
  leaseId?: string | null;
  applicantId?: string | null;
  canCreate: boolean;
  canSend: boolean;
};

export function SignaturePackagePanel({ leaseId, applicantId, canCreate, canSend }: Props) {
  const [items, setItems] = useState<Array<{ id: string; packageNumber: string; status: string }>>([]);
  const [detail, setDetail] = useState<SignatureDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (leaseId) params.set("leaseId", leaseId);
      if (applicantId) params.set("applicantId", applicantId);
      const listRes = await fetch(`/api/signatures?${params.toString()}`, { cache: "no-store" });
      const listJson = (await listRes.json()) as {
        items?: Array<{ id: string; requestNumber?: string; packageNumber?: string; status: string }>;
        error?: { message?: string };
      };
      if (!listRes.ok) throw new Error(listJson.error?.message ?? "Failed to load signatures");
      const nextItems = (listJson.items ?? []).map((item) => ({
        id: item.id,
        packageNumber: item.requestNumber ?? item.packageNumber ?? item.id,
        status: item.status
      }));
      setItems(nextItems);
      const active = nextItems[0];
      if (active) {
        const detailRes = await fetch(`/api/signatures/${active.id}`, { cache: "no-store" });
        const detailJson = (await detailRes.json()) as SignatureDetail & { error?: { message?: string } };
        if (!detailRes.ok) throw new Error(detailJson.error?.message ?? "Failed to load package");
        setDetail(detailJson);
      } else {
        setDetail(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load signatures");
    } finally {
      setLoading(false);
    }
  }, [applicantId, leaseId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function runAction(action: string, extra: Record<string, unknown> = {}) {
    if (!detail) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/signatures/${detail.package.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra })
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message ?? "Action failed");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  async function createPackage() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/signatures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leaseId, applicantId, documentType: "lease_agreement" })
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message ?? "Could not create package");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <Card className="space-y-2">
        <h3 className="text-base font-semibold">Electronic signatures</h3>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">Loading…</p>
      </Card>
    );
  }

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">Electronic signatures</h3>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            SignatureService → SignatureProvider → Dropbox Sign. Human signers only.
          </p>
        </div>
        {canCreate && items.length === 0 ? (
          <Button onClick={() => void createPackage()} disabled={busy}>
            Create signing package
          </Button>
        ) : null}
      </div>

      {error ? <p className="text-sm text-[var(--mpa-color-danger)]">{error}</p> : null}

      {!detail ? (
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">No signature packages yet.</p>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge>{detail.package.packageNumber}</Badge>
            <Badge>{detail.package.status}</Badge>
            <Badge>{detail.package.provider}</Badge>
            <Badge>vault: {detail.package.vaultStatus}</Badge>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {detail.progress.map((step) => (
              <div key={step.key} className="rounded-md border border-[var(--mpa-color-border)] p-2 text-sm">
                <div className="font-medium">{step.label}</div>
                <div className="text-[var(--mpa-color-text-secondary)]">{step.status}</div>
              </div>
            ))}
          </div>

          {detail.documents[0]?.contentText ? (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Document preview</h4>
              <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-md border border-[var(--mpa-color-border)] p-3 text-xs">
                {detail.documents[0].contentText}
              </pre>
            </div>
          ) : null}

          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Signers</h4>
            <ul className="space-y-2 text-sm">
              {detail.recipients.map((recipient) => (
                <li
                  key={recipient.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-[var(--mpa-color-border)] p-2"
                >
                  <span>
                    {recipient.fullName} · {recipient.role} · {recipient.status}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {recipient.progressUrl ? (
                      <Link className="text-[var(--mpa-color-brand)] underline" href={recipient.progressUrl}>
                        Progress
                      </Link>
                    ) : null}
                    {canSend && ["invited", "viewed"].includes(recipient.status) ? (
                      <Button
                        variant="secondary"
                        onClick={() => void runAction("remind", { recipientId: recipient.id })}
                        disabled={busy}
                      >
                        Remind
                      </Button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-wrap gap-2">
            {canSend && ["draft", "ready_to_send", "failed"].includes(detail.package.status) ? (
              <>
                <Button variant="secondary" onClick={() => void runAction("preview")} disabled={busy}>
                  Regenerate preview
                </Button>
                <Button onClick={() => void runAction("send")} disabled={busy}>
                  Send for signature
                </Button>
              </>
            ) : null}
            {canSend && ["sent", "in_progress", "partially_signed"].includes(detail.package.status) ? (
              <Button variant="secondary" onClick={() => void runAction("simulate_complete")} disabled={busy}>
                Simulate sandbox complete
              </Button>
            ) : null}
            {canSend && detail.package.status === "awaiting_vault_sync" ? (
              <Button onClick={() => void runAction("retry_vault")} disabled={busy}>
                Retry vault sync
              </Button>
            ) : null}
            {canSend && !["completed", "cancelled", "voided"].includes(detail.package.status) ? (
              <Button variant="secondary" onClick={() => void runAction("cancel")} disabled={busy}>
                Cancel
              </Button>
            ) : null}
          </div>

          {detail.package.residentActivatedAt ? (
            <p className="text-sm text-[var(--mpa-color-text-secondary)]">
              Resident activated at {new Date(detail.package.residentActivatedAt).toLocaleString()}.
            </p>
          ) : null}

          <p className="text-xs text-[var(--mpa-color-text-secondary)]">
            AI never signs. Resident activation runs only after required signatures + vault + certificate.
          </p>
        </div>
      )}
    </Card>
  );
}
