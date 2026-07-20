"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button, Card, useToast } from "@mpa/ui";
import type { TenantListItem } from "../../lib/tenant/server";
import { toLifecycleStatusLabel } from "../../lib/resident-lifecycle/contracts";
import { readApiError } from "../../lib/api/client-error";

export function BulkLifecyclePanel({ tenants }: { tenants: TenantListItem[] }) {
  const { notify } = useToast();
  const [selected, setSelected] = useState<string[]>([]);
  const [action, setAction] = useState<"invite" | "activate_portal" | "mark_awaiting_move_in" | "send_welcome">(
    "invite"
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const candidates = useMemo(
    () => tenants.filter((tenant) => tenant.lifecycleStatus !== "former"),
    [tenants]
  );

  function toggle(id: string) {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  async function run() {
    if (selected.length === 0) {
      setError("Select at least one resident.");
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/resident-lifecycle/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, tenantIds: selected })
      });
      const json = (await response.json()) as {
        result?: { processed: number; results: Array<{ ok: boolean; message: string }> };
      };
      if (!response.ok) throw new Error(readApiError(json, "Bulk action failed"));
      const failed = (json.result?.results ?? []).filter((row) => !row.ok).length;
      const processed = json.result?.processed ?? 0;
      setMessage(
        failed > 0
          ? `Processed ${processed} of ${selected.length}. ${failed} need attention.`
          : `Processed ${processed} of ${selected.length} residents.`
      );
      notify({
        title: "Bulk action finished",
        description: failed > 0 ? `${failed} could not be completed.` : "All selected residents updated.",
        variant: failed > 0 ? "warning" : "success"
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bulk action failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
          Bulk resident operations
        </h1>
        <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
          Invite, activate portal access, or queue move-ins. For file-based imports, use{" "}
          <Link href="/migration" className="text-[var(--mpa-color-brand-primary)]">
            Migration Center
          </Link>
          .
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["invite", "Bulk invites"],
            ["activate_portal", "Bulk portal activation"],
            ["send_welcome", "Bulk welcome"],
            ["mark_awaiting_move_in", "Bulk mark awaiting move-in"]
          ] as const
        ).map(([value, label]) => (
          <Button
            key={value}
            size="sm"
            variant={action === value ? "primary" : "secondary"}
            onClick={() => setAction(value)}
          >
            {label}
          </Button>
        ))}
      </div>

      <div className="max-h-96 space-y-2 overflow-y-auto rounded-lg border border-[var(--mpa-color-border)] p-3">
        {candidates.map((tenant) => (
          <label key={tenant.id} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={selected.includes(tenant.id)}
              onChange={() => toggle(tenant.id)}
            />
            <span>
              {tenant.firstName} {tenant.lastName} · {tenant.email} ·{" "}
              {toLifecycleStatusLabel(tenant.lifecycleStatus)}
            </span>
          </label>
        ))}
        {candidates.length === 0 ? (
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">No active residents available.</p>
        ) : null}
      </div>

      {error ? <p className="text-sm text-[var(--mpa-color-danger)]">{error}</p> : null}
      {message ? <p className="text-sm text-[var(--mpa-color-text-secondary)]">{message}</p> : null}

      <div className="flex flex-wrap gap-2">
        <Button disabled={loading} onClick={() => void run()}>
          {loading ? "Running…" : `Run for ${selected.length} selected`}
        </Button>
        <Link href="/residents/move-in">
          <Button variant="secondary">Move-in wizard</Button>
        </Link>
        <Link href="/residents/move-out">
          <Button variant="secondary">Move-out wizard</Button>
        </Link>
        <Link href="/migration">
          <Button variant="secondary">Migration Center</Button>
        </Link>
      </div>
    </Card>
  );
}
