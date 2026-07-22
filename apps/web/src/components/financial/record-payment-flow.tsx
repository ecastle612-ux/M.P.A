"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button, Card, Input, Select } from "@mpa/ui";
import { formatCurrency, type RentChargeRecord } from "../../lib/financial/contracts";
import type { RentChargeListItem } from "../../lib/financial/server";
import { RecordPaymentForm } from "./record-payment-form";

type ChargeOption = RentChargeListItem &
  Pick<RentChargeRecord, "outstandingBalance" | "status" | "chargeNumber">;

export function RecordPaymentFlow({
  charges,
  initialChargeId,
  initialTenantId
}: {
  charges: ChargeOption[];
  initialChargeId?: string | null;
  initialTenantId?: string | null;
}) {
  const unpaid = useMemo(() => {
    const open = charges
      .filter(
        (charge) =>
          charge.deletedAt === null &&
          charge.outstandingBalance > 0 &&
          charge.status !== "paid" &&
          charge.status !== "waived" &&
          charge.status !== "cancelled"
      )
      .sort((left, right) => left.dueDate.localeCompare(right.dueDate));
    if (!initialTenantId) return open;
    const scoped = open.filter((charge) => charge.tenantId === initialTenantId);
    return scoped.length > 0 ? scoped : open;
  }, [charges, initialTenantId]);

  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(() => {
    if (initialChargeId && unpaid.some((charge) => charge.id === initialChargeId)) {
      return initialChargeId;
    }
    if (initialTenantId) {
      const tenantFirst = unpaid.find((charge) => charge.tenantId === initialTenantId);
      if (tenantFirst) return tenantFirst.id;
    }
    return unpaid[0]?.id ?? "";
  });

  const filtered = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return unpaid;
    return unpaid.filter((charge) => {
      return (
        charge.chargeNumber.toLowerCase().includes(trimmed) ||
        charge.description.toLowerCase().includes(trimmed) ||
        (charge.tenantName ?? "").toLowerCase().includes(trimmed) ||
        (charge.propertyName ?? "").toLowerCase().includes(trimmed) ||
        (charge.unitNumber ?? "").toLowerCase().includes(trimmed)
      );
    });
  }, [unpaid, query]);

  const selected = unpaid.find((charge) => charge.id === selectedId) ?? null;

  if (unpaid.length === 0) {
    return (
      <Card>
        <h1 className="text-xl font-semibold text-[var(--mpa-color-text-primary)]">Record payment</h1>
        <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">
          There are no open balances to collect. Create a rent charge first, or review the charges list.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/financials/charges/new">
            <Button size="sm">Create charge</Button>
          </Link>
          <Link href="/financials/charges">
            <Button size="sm" variant="secondary">
              View charges
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <Card>
        <h1 className="text-xl font-semibold text-[var(--mpa-color-text-primary)]">Record payment</h1>
        <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
          Choose the open charge, then enter amount and method — one screen, no charge-list detour.
        </p>

        <div className="mt-4 space-y-3">
          <Input
            aria-label="Search resident or charge"
            placeholder="Search resident, unit, or charge #"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />

          <Select
            aria-label="Open charge"
            value={selectedId}
            onChange={(event) => setSelectedId(event.target.value)}
          >
            {(filtered.length > 0 ? filtered : unpaid).map((charge) => (
              <option key={charge.id} value={charge.id}>
                {[
                  charge.tenantName ?? "Resident",
                  charge.unitNumber ? `Unit ${charge.unitNumber}` : null,
                  charge.chargeNumber,
                  formatCurrency(charge.outstandingBalance)
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </option>
            ))}
          </Select>

          {filtered.length === 0 ? (
            <p className="text-sm text-[var(--mpa-color-text-secondary)]" role="status">
              No charges match that search. Showing all open balances in the list above.
            </p>
          ) : null}

          {selected ? (
            <div className="rounded-lg border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-app)]/50 p-3 text-sm">
              <p className="font-medium text-[var(--mpa-color-text-primary)]">
                {selected.tenantName ?? "Resident"}
                {selected.unitNumber ? ` · Unit ${selected.unitNumber}` : ""}
              </p>
              <p className="mt-1 text-[var(--mpa-color-text-secondary)]">
                {selected.description} · Due {selected.dueDate}
              </p>
              <p className="mt-1 font-semibold tabular-nums text-[var(--mpa-color-text-primary)]">
                Outstanding {formatCurrency(selected.outstandingBalance)}
              </p>
            </div>
          ) : null}
        </div>
      </Card>

      {selected ? <RecordPaymentForm charge={selected} /> : null}
    </div>
  );
}
