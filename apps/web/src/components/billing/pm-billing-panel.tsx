"use client";

import { useEffect, useState, useTransition } from "react";
import { Button, Card } from "@mpa/ui";
import type { CollectionsQueueItem } from "../../lib/billing/contracts";
import { formatCurrency } from "../../lib/financial/contracts";

export function PmBillingPanel({ tenantId }: { tenantId?: string }) {
  const [items, setItems] = useState<CollectionsQueueItem[]>([]);
  const [ledger, setLedger] = useState<
    Array<{ id: string; entryType: string; amount: number; summary: string; createdAt: string }>
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function load() {
    startTransition(async () => {
      try {
        const collectionsRes = await fetch("/api/billing?collections=1", { cache: "no-store" });
        const collectionsJson = (await collectionsRes.json()) as {
          items?: CollectionsQueueItem[];
          error?: { message?: string };
        };
        if (!collectionsRes.ok) throw new Error(collectionsJson.error?.message ?? "Failed");
        setItems(collectionsJson.items ?? []);

        if (tenantId) {
          const ledgerRes = await fetch(`/api/billing?ledger=1&tenantId=${tenantId}`, { cache: "no-store" });
          const ledgerJson = (await ledgerRes.json()) as {
            entries?: Array<{
              id: string;
              entryType: string;
              amount: number;
              summary: string;
              createdAt: string;
            }>;
          };
          if (ledgerRes.ok) setLedger(ledgerJson.entries ?? []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      }
    });
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load on tenantId change only
  }, [tenantId]);

  async function runAction(action: string, extra: Record<string, unknown> = {}) {
    setError(null);
    setMessage(null);
    const res = await fetch("/api/billing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...extra })
    });
    const json = (await res.json()) as { error?: { message?: string } };
    if (!res.ok) {
      setError(json.error?.message ?? "Action failed");
      return;
    }
    setMessage(`${action} completed`);
    load();
  }

  return (
    <div className="space-y-4">
      <Card className="space-y-3 p-4">
        <h3 className="font-semibold">Billing operations</h3>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          Generate charges, assess late fees, reconcile — BillingService only.
        </p>
        {error ? <p className="text-sm text-[var(--mpa-color-danger)]">{error}</p> : null}
        {message ? <p className="text-sm text-[var(--mpa-color-success)]">{message}</p> : null}
        <div className="flex flex-wrap gap-2">
          <Button disabled={pending} onClick={() => void runAction("generate_charges")}>
            Generate recurring charges
          </Button>
          <Button variant="secondary" disabled={pending} onClick={() => void runAction("assess_late_fees")}>
            Assess late fees
          </Button>
          <Button variant="secondary" disabled={pending} onClick={() => void runAction("reconcile")}>
            Reconcile
          </Button>
        </div>
      </Card>

      <Card className="space-y-3 p-4">
        <h3 className="font-semibold">Collections queue</h3>
        {!items.length ? (
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">No collections items.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {items.map((item) => (
              <li key={item.tenantId} className="flex justify-between gap-2 border-b border-[var(--mpa-color-border)] pb-2">
                <div>
                  <div className="font-medium">{item.tenantName}</div>
                  <div className="text-[var(--mpa-color-text-secondary)]">
                    {item.status} · {item.overdueChargeCount} overdue · {item.failedAttemptCount} failed
                  </div>
                </div>
                <div className="font-semibold">{formatCurrency(item.outstandingBalance)}</div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {tenantId ? (
        <Card className="space-y-3 p-4">
          <h3 className="font-semibold">Resident ledger</h3>
          {!ledger.length ? (
            <p className="text-sm text-[var(--mpa-color-text-secondary)]">No ledger entries.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {ledger.map((entry) => (
                <li key={entry.id} className="flex justify-between gap-2">
                  <span>
                    {new Date(entry.createdAt).toLocaleString()} · {entry.entryType} · {entry.summary}
                  </span>
                  <span>{formatCurrency(entry.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      ) : null}
    </div>
  );
}
