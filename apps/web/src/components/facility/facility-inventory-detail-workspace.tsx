"use client";

import { useCallback, useEffect, useState } from "react";
import {
  FACILITY_STOCK_CATEGORY_LABELS,
  type FacilityStockCategory,
  type FacilityStockMovementType,
  type FacilityStockUnit
} from "@mpa/shared";
import { Alert, Badge, Button, EmptyState, Input, Select, Skeleton } from "@mpa/ui";
import { ErrorRetry } from "../shell/error-retry";
import { FoPageChrome, FoQuickActions } from "../shell/fo-workspace";

type StockItem = {
  id: string;
  name: string;
  category: FacilityStockCategory;
  quantity_on_hand: number;
  unit_of_measure: FacilityStockUnit;
  storage_location_label: string;
  min_threshold: number | null;
  reorder_level: number | null;
  low_stock: boolean;
  suggested_reorder_quantity: number;
  sku_code: string | null;
  property_properties?: { id: string; name: string } | null;
  vendor_vendors?: { id: string; name: string } | null;
};

type Movement = {
  id: string;
  movement_type: FacilityStockMovementType;
  quantity: number;
  quantity_after: number;
  reason: string | null;
  work_order_id: string | null;
  created_at: string;
};

export function FacilityInventoryDetailWorkspace({ itemId }: { itemId: string }) {
  const [item, setItem] = useState<StockItem | null>(null);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [movementType, setMovementType] = useState<FacilityStockMovementType>("receive");
  const [quantity, setQuantity] = useState("1");
  const [reason, setReason] = useState("");
  const [workOrderId, setWorkOrderId] = useState("");

  const refresh = useCallback(async () => {
    const response = await fetch(`/api/facility/inventory/${itemId}`);
    const body = (await response.json()) as {
      item?: StockItem;
      movements?: Movement[];
      error?: string;
    };
    if (!response.ok) throw new Error(body.error ?? "Failed to load stock item");
    if (!body.item) throw new Error("Stock item not found");
    setItem(body.item);
    setMovements(body.movements ?? []);
  }, [itemId]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await refresh();
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load stock item");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  if (loading) {
    return (
      <main className="flex-1 space-y-4 bg-[var(--mpa-color-bg-app)] p-4 md:p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </main>
    );
  }

  if (!item) {
    return (
      <FoPageChrome
        crumbs={[
          { href: "/facility/mission-control", label: "Facility Mission Control" },
          { href: "/facility/inventory", label: "Inventory" },
          { label: "Item" }
        ]}
        eyebrow="Facility Operations"
        title="Stock item"
        description="This item is not available."
      >
        {error ? (
          <ErrorRetry title="Unable to load item" description={error} onRetry={() => void refresh()} />
        ) : (
          <EmptyState title="Stock item not found" description="Managers can open the stock ledger." />
        )}
      </FoPageChrome>
    );
  }

  return (
    <FoPageChrome
      crumbs={[
        { href: "/facility/mission-control", label: "Facility Mission Control" },
        { href: "/facility/inventory", label: "Inventory" },
        { label: item.name }
      ]}
      eyebrow="Facility Operations"
      title={item.name}
      description={`${FACILITY_STOCK_CATEGORY_LABELS[item.category]} · ${item.storage_location_label}`}
      actions={
        <Badge variant={item.low_stock ? "warning" : "success"}>
          {item.quantity_on_hand} {item.unit_of_measure}
        </Badge>
      }
    >
      <FoQuickActions
        actions={[
          { href: "/facility/inventory", label: "All inventory" },
          { href: "/facility/operations", label: "Operations", primary: true },
          { href: "/facility/reports", label: "Reports" }
        ]}
      />

      {error ? <Alert variant="danger">{error}</Alert> : null}
      {notice ? <Alert variant="success">{notice}</Alert> : null}

      <section className="grid gap-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4 md:grid-cols-2">
        <p className="text-sm">Site: {item.property_properties?.name ?? "—"}</p>
        <p className="text-sm">Supplier: {item.vendor_vendors?.name ?? "—"}</p>
        <p className="text-sm">Supplier SKU: {item.sku_code ?? "—"}</p>
        <p className="text-sm">Reorder level: {item.reorder_level ?? "—"}</p>
        <p className="text-sm">Min threshold: {item.min_threshold ?? "—"}</p>
        <p className="text-sm">Suggested reorder: {item.suggested_reorder_quantity}</p>
      </section>

      <form
        className="grid max-w-xl gap-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4"
        data-testid="fo-stock-movement-form"
        onSubmit={(event) => {
          event.preventDefault();
          void (async () => {
            setBusy(true);
            setError(null);
            setNotice(null);
            try {
              const response = await fetch(`/api/facility/inventory/${item.id}/movements`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  movementType,
                  quantity: Number(quantity),
                  reason: reason.trim() || undefined,
                  workOrderId: movementType === "usage" ? workOrderId : undefined
                })
              });
              const body = (await response.json()) as { error?: string };
              if (!response.ok) throw new Error(body.error ?? "Failed to apply movement");
              setQuantity("1");
              setReason("");
              setWorkOrderId("");
              setNotice("Stock movement recorded.");
              await refresh();
            } catch (err) {
              setError(err instanceof Error ? err.message : "Failed to apply movement");
            } finally {
              setBusy(false);
            }
          })();
        }}
      >
        <h2 className="text-sm font-semibold">Record movement</h2>
        <label className="space-y-1 text-xs">
          <span className="font-medium">Action</span>
          <Select
            value={movementType}
            onChange={(event) => setMovementType(event.target.value as FacilityStockMovementType)}
          >
            <option value="receive">Add stock</option>
            <option value="issue">Remove stock</option>
            <option value="adjust">Adjust quantity</option>
            <option value="usage">Record usage on work order</option>
          </Select>
        </label>
        <label className="space-y-1 text-xs">
          <span className="font-medium">
            {movementType === "adjust" ? "Signed quantity (+ receive / − remove)" : "Quantity"}
          </span>
          <Input
            type="number"
            step="0.01"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            required
          />
        </label>
        {movementType === "adjust" ? (
          <label className="space-y-1 text-xs">
            <span className="font-medium">Reason (required)</span>
            <Input value={reason} onChange={(event) => setReason(event.target.value)} required />
          </label>
        ) : (
          <label className="space-y-1 text-xs">
            <span className="font-medium">Note</span>
            <Input value={reason} onChange={(event) => setReason(event.target.value)} />
          </label>
        )}
        {movementType === "usage" ? (
          <label className="space-y-1 text-xs">
            <span className="font-medium">Work order id</span>
            <Input
              value={workOrderId}
              onChange={(event) => setWorkOrderId(event.target.value)}
              required
              placeholder="Facility work order UUID"
            />
          </label>
        ) : null}
        <Button type="submit" disabled={busy}>
          Apply movement
        </Button>
      </form>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Usage and movement history</h2>
        {movements.length === 0 ? (
          <EmptyState
            title="No movements yet"
            description="Receive, issue, adjust, and usage rows stay append-only."
          />
        ) : (
          <ul className="space-y-2">
            {movements.map((row) => (
              <li
                key={row.id}
                className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-3 text-sm"
              >
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="font-medium capitalize">{row.movement_type}</span>
                  <span>
                    {row.quantity} → {row.quantity_after} {item.unit_of_measure}
                  </span>
                </div>
                <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">
                  {row.created_at}
                  {row.reason ? ` · ${row.reason}` : ""}
                  {row.work_order_id ? ` · WO ${row.work_order_id}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </FoPageChrome>
  );
}
