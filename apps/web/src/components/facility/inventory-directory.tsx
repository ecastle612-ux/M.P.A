"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { Badge, Button, EmptyState, Input, Select, Skeleton, Textarea } from "@mpa/ui";
import { Breadcrumbs } from "../shell/breadcrumbs";

type Location = { id: string; name: string; site_id: string; facility_sites?: { name: string } | null };
type Part = { id: string; sku: string; name: string; uom: string };
type WorkOrder = { id: string; title: string; status: string };
type Stock = {
  id: string;
  part_id: string;
  inventory_location_id: string;
  quantity_on_hand: number;
  reorder_threshold: number;
  minimum_stock: number;
  health: "in_stock" | "low" | "stockout";
  facility_parts?: { sku: string; name: string; uom: string; critical_part: boolean } | null;
  facility_inventory_locations?: { name: string; site_id: string } | null;
};
type Movement = {
  id: string;
  movement_type: string;
  quantity_delta: number;
  reason: string;
  work_order_id: string | null;
  created_at: string;
  part_id: string;
};

export function InventoryDirectory() {
  const searchParams = useSearchParams();
  const preferredStockId = searchParams.get("stockId") ?? "";
  const preferredLocationId = searchParams.get("locationId") ?? "";

  const [locations, setLocations] = useState<Location[]>([]);
  const [stock, setStock] = useState<Stock[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [sites, setSites] = useState<Array<{ id: string; name: string; status: string }>>([]);
  const [assistantRecommendation, setAssistantRecommendation] = useState("");
  const [summary, setSummary] = useState({ stockoutCount: 0, lowCount: 0, stockLineCount: 0 });
  const [selectedStockId, setSelectedStockId] = useState("");
  const [filter, setFilter] = useState<"all" | "stockout" | "low">("all");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [creatingLocation, setCreatingLocation] = useState(false);

  const [siteId, setSiteId] = useState("");
  const [locationName, setLocationName] = useState("");
  const [partId, setPartId] = useState("");
  const [inventoryLocationId, setInventoryLocationId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [adjustDelta, setAdjustDelta] = useState(0);
  const [reason, setReason] = useState("");
  const [workOrderId, setWorkOrderId] = useState("");
  const [action, setAction] = useState<"receive" | "issue" | "adjust" | "return">("receive");
  const [reorderThreshold, setReorderThreshold] = useState(0);
  const [minimumStock, setMinimumStock] = useState(0);

  const selected = useMemo(
    () => stock.find((row) => row.id === selectedStockId) ?? null,
    [stock, selectedStockId]
  );

  const filtered = useMemo(() => {
    if (filter === "stockout") {
      return stock.filter((row) => row.health === "stockout");
    }
    if (filter === "low") {
      return stock.filter((row) => row.health === "low" || row.health === "stockout");
    }
    return stock;
  }, [filter, stock]);

  async function refresh(preferred?: string) {
    const [inventoryResponse, sitesResponse] = await Promise.all([
      fetch("/api/facility/inventory"),
      fetch("/api/facility/sites")
    ]);
    const body = await inventoryResponse.json();
    if (!inventoryResponse.ok) {
      throw new Error(body.error ?? "Failed to load inventory");
    }
    const stockRows = (body.stock ?? []) as Stock[];
    setLocations(body.locations ?? []);
    setStock(stockRows);
    setParts(body.parts ?? []);
    setWorkOrders(body.workOrders ?? []);
    setMovements(body.movements ?? []);
    setSummary(body.summary ?? { stockoutCount: 0, lowCount: 0, stockLineCount: 0 });
    setAssistantRecommendation(body.assistantRecommendation ?? "");
    if (sitesResponse.ok) {
      const sitesBody = await sitesResponse.json();
      const active = (sitesBody.sites ?? []).filter(
        (site: { status: string }) => site.status === "active"
      );
      setSites(active);
      if (active[0] && !siteId) {
        setSiteId(active[0].id);
      }
    }
    if ((body.locations ?? [])[0] && !inventoryLocationId) {
      setInventoryLocationId((body.locations as Location[])[0]!.id);
    }
    if ((body.parts ?? [])[0] && !partId) {
      setPartId((body.parts as Part[])[0]!.id);
    }
    const nextId =
      preferred ||
      preferredStockId ||
      selectedStockId ||
      stockRows.find((row) => row.inventory_location_id === preferredLocationId)?.id ||
      stockRows[0]?.id ||
      "";
    setSelectedStockId(nextId);
    const selectedRow = stockRows.find((row) => row.id === nextId) ?? null;
    if (selectedRow) {
      setReorderThreshold(Number(selectedRow.reorder_threshold));
      setMinimumStock(Number(selectedRow.minimum_stock));
      setPartId(selectedRow.part_id);
      setInventoryLocationId(selectedRow.inventory_location_id);
    }
  }

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await refresh(preferredStockId || undefined);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runMovement(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const endpoint =
        action === "receive"
          ? "/api/facility/inventory/receive"
          : action === "issue"
            ? "/api/facility/inventory/issue"
            : action === "return"
              ? "/api/facility/inventory/return"
              : "/api/facility/inventory/adjust";
      const payload =
        action === "adjust"
          ? {
              partId,
              inventoryLocationId,
              quantityDelta: adjustDelta,
              reason: reason.trim()
            }
          : action === "issue"
            ? {
                partId,
                inventoryLocationId,
                quantity,
                workOrderId,
                reason: reason.trim() || "Issued to work order"
              }
            : action === "return"
              ? {
                  partId,
                  inventoryLocationId,
                  quantity,
                  workOrderId: workOrderId || null,
                  reason: reason.trim() || "Returned unused inventory"
                }
              : {
                  partId,
                  inventoryLocationId,
                  quantity,
                  reason: reason.trim() || "Received shipment"
                };
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error ?? "Movement failed");
      }
      setNotice(`${action} recorded.`);
      setReason("");
      await refresh(body.stock?.id as string | undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Movement failed");
    } finally {
      setBusy(false);
    }
  }

  async function saveThresholds(event: FormEvent) {
    event.preventDefault();
    if (!selectedStockId) {
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch("/api/facility/inventory/thresholds", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stockId: selectedStockId,
          reorderThreshold,
          minimumStock
        })
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error ?? "Failed to update thresholds");
      }
      setNotice("Reorder and minimum thresholds updated.");
      await refresh(selectedStockId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update thresholds");
    } finally {
      setBusy(false);
    }
  }

  async function createLocation(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/facility/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId, name: locationName.trim() })
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error ?? "Failed to create location");
      }
      setCreatingLocation(false);
      setLocationName("");
      setNotice("Storeroom created.");
      await refresh();
      setInventoryLocationId(body.location.id as string);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create location");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <main className="flex-1 space-y-4 p-4 md:p-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full max-w-3xl" />
      </main>
    );
  }

  return (
    <main className="flex-1 space-y-4 bg-[var(--mpa-color-bg-app)] p-4 md:p-6">
      <Breadcrumbs
        items={[
          { href: "/facility/mission-control", label: "Facility Mission Control" },
          { label: "Inventory" }
        ]}
      />
      <header className="flex max-w-5xl flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="font-display text-3xl font-semibold">Inventory</h1>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            Storerooms, stock quantities, and movements. Issue only to shared facility work orders.
          </p>
        </div>
        <Button type="button" variant="secondary" onClick={() => setCreatingLocation(true)}>
          Add storeroom
        </Button>
      </header>

      <section className="flex flex-wrap gap-2">
        <Badge variant={summary.stockoutCount > 0 ? "danger" : "neutral"}>
          {summary.stockoutCount} stockout
        </Badge>
        <Badge variant={summary.lowCount > 0 ? "warning" : "neutral"}>
          {summary.lowCount} low
        </Badge>
        <Badge variant="neutral">{summary.stockLineCount} stock lines</Badge>
      </section>

      <section className="max-w-3xl rounded-md border border-[var(--mpa-color-border-default)] bg-white px-4 py-3 text-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          Assistant recommendation
        </p>
        <p className="mt-1">{assistantRecommendation}</p>
      </section>

      {error ? <p className="text-sm text-[#C0392B]">{error}</p> : null}
      {notice ? <p className="text-sm text-emerald-800">{notice}</p> : null}

      {creatingLocation ? (
        <form
          onSubmit={(event) => void createLocation(event)}
          className="max-w-xl space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4"
        >
          <h2 className="text-base font-semibold">Create storeroom location</h2>
          <label className="block space-y-1 text-sm">
            <span>Site</span>
            <Select value={siteId} onChange={(e) => setSiteId(e.target.value)} required>
              {sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </Select>
          </label>
          <label className="block space-y-1 text-sm">
            <span>Name</span>
            <Input
              required
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="Main storeroom"
            />
          </label>
          <div className="flex gap-2">
            <Button type="submit" disabled={busy}>
              Create
            </Button>
            <Button type="button" variant="secondary" onClick={() => setCreatingLocation(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}

      <form
        onSubmit={(event) => void runMovement(event)}
        className="max-w-3xl space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4"
      >
        <h2 className="text-base font-semibold">Record movement</h2>
        <div className="flex flex-wrap gap-2">
          {(["receive", "issue", "adjust", "return"] as const).map((value) => (
            <Button
              key={value}
              type="button"
              size="sm"
              variant={action === value ? "primary" : "secondary"}
              onClick={() => setAction(value)}
            >
              {value}
            </Button>
          ))}
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span>Part</span>
            <Select value={partId} onChange={(e) => setPartId(e.target.value)} required>
              {parts.map((part) => (
                <option key={part.id} value={part.id}>
                  {part.sku} · {part.name}
                </option>
              ))}
            </Select>
          </label>
          <label className="space-y-1 text-sm">
            <span>Storeroom</span>
            <Select
              value={inventoryLocationId}
              onChange={(e) => setInventoryLocationId(e.target.value)}
              required
            >
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                  {location.facility_sites?.name ? ` · ${location.facility_sites.name}` : ""}
                </option>
              ))}
            </Select>
          </label>
        </div>
        {action === "adjust" ? (
          <label className="block space-y-1 text-sm">
            <span>Quantity delta (+/-)</span>
            <Input
              type="number"
              value={adjustDelta}
              onChange={(e) => setAdjustDelta(Number(e.target.value))}
              required
            />
          </label>
        ) : (
          <label className="block space-y-1 text-sm">
            <span>Quantity</span>
            <Input
              type="number"
              min={0.001}
              step="any"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value) || 0)}
              required
            />
          </label>
        )}
        {(action === "issue" || action === "return") && (
          <label className="block space-y-1 text-sm">
            <span>
              Facility work order{action === "issue" ? " (required)" : " (optional)"}
            </span>
            <Select
              value={workOrderId}
              onChange={(e) => setWorkOrderId(e.target.value)}
              required={action === "issue"}
            >
              <option value="">{action === "issue" ? "Select work order" : "None"}</option>
              {workOrders.map((wo) => (
                <option key={wo.id} value={wo.id}>
                  {wo.title} · {wo.status}
                </option>
              ))}
            </Select>
          </label>
        )}
        <label className="block space-y-1 text-sm">
          <span>Reason</span>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} />
        </label>
        <Button type="submit" disabled={busy || parts.length === 0 || locations.length === 0}>
          {busy ? "Saving…" : `Post ${action}`}
        </Button>
        {parts.length === 0 ? (
          <p className="text-xs text-[var(--mpa-color-text-secondary)]">
            Create a part in the{" "}
            <Link href="/facility/parts?new=1" className="underline">
              Parts catalog
            </Link>{" "}
            first.
          </p>
        ) : null}
      </form>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <section className="space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["all", "All stock"],
                ["stockout", "Stockout"],
                ["low", "Low / stockout"]
              ] as const
            ).map(([value, label]) => (
              <Button
                key={value}
                type="button"
                size="sm"
                variant={filter === value ? "primary" : "secondary"}
                onClick={() => setFilter(value)}
              >
                {label}
              </Button>
            ))}
          </div>
          {filtered.length === 0 ? (
            <EmptyState
              title="No stock lines"
              description="Receive parts into a storeroom to establish on-hand quantities."
            />
          ) : (
            <ul className="divide-y divide-[var(--mpa-color-border-default)]">
              {filtered.map((row) => (
                <li key={row.id}>
                  <button
                    type="button"
                    className={`w-full px-1 py-3 text-left ${
                      selectedStockId === row.id ? "bg-[var(--mpa-color-bg-subtle)]" : ""
                    }`}
                    onClick={() => {
                      setSelectedStockId(row.id);
                      setReorderThreshold(Number(row.reorder_threshold));
                      setMinimumStock(Number(row.minimum_stock));
                      setPartId(row.part_id);
                      setInventoryLocationId(row.inventory_location_id);
                    }}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">
                        {row.facility_parts?.sku} · {row.facility_parts?.name}
                      </span>
                      <Badge
                        variant={
                          row.health === "stockout"
                            ? "danger"
                            : row.health === "low"
                              ? "warning"
                              : "success"
                        }
                      >
                        {row.health}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">
                      {row.facility_inventory_locations?.name} · on hand {row.quantity_on_hand}{" "}
                      {row.facility_parts?.uom}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
          {!selected ? (
            <EmptyState title="Select a stock line" description="Review thresholds and history." />
          ) : (
            <>
              <h2 className="text-lg font-semibold">
                {selected.facility_parts?.sku} · {selected.facility_parts?.name}
              </h2>
              <dl className="grid gap-2 text-sm md:grid-cols-2">
                <div>
                  <dt className="text-[var(--mpa-color-text-secondary)]">Location</dt>
                  <dd>{selected.facility_inventory_locations?.name}</dd>
                </div>
                <div>
                  <dt className="text-[var(--mpa-color-text-secondary)]">On hand</dt>
                  <dd>
                    {selected.quantity_on_hand} {selected.facility_parts?.uom}
                  </dd>
                </div>
                <div>
                  <dt className="text-[var(--mpa-color-text-secondary)]">Health</dt>
                  <dd>{selected.health}</dd>
                </div>
              </dl>
              <form
                onSubmit={(event) => void saveThresholds(event)}
                className="space-y-3 rounded-md border border-[var(--mpa-color-border-default)] p-3"
              >
                <h3 className="text-sm font-semibold">Reorder thresholds</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="space-y-1 text-sm">
                    <span>Reorder threshold</span>
                    <Input
                      type="number"
                      min={0}
                      step="any"
                      value={reorderThreshold}
                      onChange={(e) => setReorderThreshold(Number(e.target.value) || 0)}
                      required
                    />
                  </label>
                  <label className="space-y-1 text-sm">
                    <span>Minimum stock</span>
                    <Input
                      type="number"
                      min={0}
                      step="any"
                      value={minimumStock}
                      onChange={(e) => setMinimumStock(Number(e.target.value) || 0)}
                      required
                    />
                  </label>
                </div>
                <Button type="submit" size="sm" disabled={busy}>
                  Save thresholds
                </Button>
              </form>
              <div>
                <h3 className="text-sm font-semibold">Recent movements</h3>
                <ul className="mt-2 space-y-2 text-sm">
                  {movements
                    .filter(
                      (movement) =>
                        movement.part_id === selected.part_id &&
                        // location filter soft — show part history
                        true
                    )
                    .slice(0, 12)
                    .map((movement) => (
                      <li key={movement.id}>
                        {movement.movement_type} {movement.quantity_delta > 0 ? "+" : ""}
                        {movement.quantity_delta} · {movement.reason}
                        <span className="block text-xs text-[var(--mpa-color-text-secondary)]">
                          {new Date(movement.created_at).toLocaleString()}
                          {movement.work_order_id ? (
                            <>
                              {" "}
                              ·{" "}
                              <Link
                                href={`/facility/operations?workOrderId=${movement.work_order_id}`}
                                className="underline"
                              >
                                Work order
                              </Link>
                            </>
                          ) : null}
                        </span>
                      </li>
                    ))}
                </ul>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
