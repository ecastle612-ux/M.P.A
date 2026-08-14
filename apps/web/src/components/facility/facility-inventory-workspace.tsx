"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  FACILITY_STOCK_CATEGORIES,
  FACILITY_STOCK_CATEGORY_LABELS,
  FACILITY_STOCK_UNITS,
  type FacilityStockCategory,
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
  low_stock: boolean;
  suggested_reorder_quantity: number;
  property_properties?: { id: string; name: string } | null;
  vendor_vendors?: { id: string; name: string } | null;
};

type PropertyRow = { id: string; name: string };
type VendorRow = { id: string; name: string };

export function FacilityInventoryWorkspace() {
  const [items, setItems] = useState<StockItem[]>([]);
  const [properties, setProperties] = useState<PropertyRow[]>([]);
  const [vendors, setVendors] = useState<VendorRow[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<FacilityStockCategory>("filters");
  const [unitOfMeasure, setUnitOfMeasure] = useState<FacilityStockUnit>("each");
  const [propertyPropertyId, setPropertyPropertyId] = useState("");
  const [storageLocationLabel, setStorageLocationLabel] = useState("");
  const [minThreshold, setMinThreshold] = useState("");
  const [reorderLevel, setReorderLevel] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [skuCode, setSkuCode] = useState("");

  const refresh = useCallback(async () => {
    const response = await fetch("/api/facility/inventory");
    const body = (await response.json()) as {
      items?: StockItem[];
      properties?: PropertyRow[];
      vendors?: VendorRow[];
      canManage?: boolean;
      error?: string;
    };
    if (!response.ok) {
      throw new Error(body.error ?? "Failed to load inventory");
    }
    setItems(body.items ?? []);
    setProperties(body.properties ?? []);
    setVendors(body.vendors ?? []);
    setCanManage(Boolean(body.canManage));
    if (!propertyPropertyId && (body.properties ?? []).length === 1) {
      setPropertyPropertyId(body.properties![0]!.id);
    }
  }, [propertyPropertyId]);

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      try {
        await refresh();
        if (!controller.signal.aborted) {
          setError(null);
          setLoading(false);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : "Failed to load inventory");
          setLoading(false);
        }
      }
    })();
    return () => controller.abort();
  }, [refresh, reloadToken]);

  if (loading) {
    return (
      <main className="flex-1 space-y-4 bg-[var(--mpa-color-bg-app)] p-4 md:p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </main>
    );
  }

  return (
    <FoPageChrome
      crumbs={[
        { href: "/facility/mission-control", label: "Facility Mission Control" },
        { label: "Inventory" }
      ]}
      eyebrow="Facility Operations"
      title="Facility inventory"
      description="Stock ledger for filters, supplies, and loose parts. Quantity changes only through receive, issue, adjust, or work-order usage."
    >
      <FoQuickActions
        actions={[
          { href: "/facility/assets", label: "Assets" },
          { href: "/facility/operations", label: "Operations", primary: true },
          { href: "/facility/reports", label: "Reports" }
        ]}
      />

      {error ? (
        <ErrorRetry
          title="Unable to load inventory"
          description={error}
          onRetry={() => {
            setLoading(true);
            setError(null);
            setReloadToken((value) => value + 1);
          }}
        />
      ) : null}
      {notice ? <Alert variant="success">{notice}</Alert> : null}

      {!canManage ? (
        <p className="rounded-md border border-[var(--mpa-color-border-default)] bg-white px-3 py-2 text-sm text-[var(--mpa-color-text-secondary)]">
          Inventory list is for facility managers. Technicians record usage from an assigned work
          order only.
        </p>
      ) : (
        <form
          className="grid max-w-3xl gap-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4 md:grid-cols-2"
          data-testid="fo-add-stock-form"
          onSubmit={(event) => {
            event.preventDefault();
            void (async () => {
              setBusy(true);
              setError(null);
              setNotice(null);
              try {
                const response = await fetch("/api/facility/inventory", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    name: name.trim(),
                    category,
                    unitOfMeasure,
                    propertyPropertyId,
                    storageLocationLabel: storageLocationLabel.trim(),
                    minThreshold: minThreshold ? Number(minThreshold) : undefined,
                    reorderLevel: reorderLevel ? Number(reorderLevel) : undefined,
                    vendorId: vendorId || undefined,
                    skuCode: skuCode.trim() || undefined
                  })
                });
                const body = (await response.json()) as { error?: string };
                if (!response.ok) throw new Error(body.error ?? "Failed to create stock item");
                setName("");
                setStorageLocationLabel("");
                setMinThreshold("");
                setReorderLevel("");
                setVendorId("");
                setSkuCode("");
                setNotice("Stock item created. Add stock from the item page.");
                setReloadToken((value) => value + 1);
              } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to create stock item");
              } finally {
                setBusy(false);
              }
            })();
          }}
        >
          <h2 className="text-sm font-semibold md:col-span-2">Add stock item</h2>
          <label className="space-y-1 text-xs">
            <span className="font-medium">Name</span>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              minLength={2}
              placeholder="MERV-13 filter 20x20"
              data-testid="fo-stock-name"
            />
          </label>
          <label className="space-y-1 text-xs">
            <span className="font-medium">Category</span>
            <Select
              value={category}
              onChange={(event) => setCategory(event.target.value as FacilityStockCategory)}
            >
              {FACILITY_STOCK_CATEGORIES.map((value) => (
                <option key={value} value={value}>
                  {FACILITY_STOCK_CATEGORY_LABELS[value]}
                </option>
              ))}
            </Select>
          </label>
          <label className="space-y-1 text-xs">
            <span className="font-medium">Unit</span>
            <Select
              value={unitOfMeasure}
              onChange={(event) => setUnitOfMeasure(event.target.value as FacilityStockUnit)}
            >
              {FACILITY_STOCK_UNITS.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </Select>
          </label>
          <label className="space-y-1 text-xs">
            <span className="font-medium">Site</span>
            <Select
              value={propertyPropertyId}
              onChange={(event) => setPropertyPropertyId(event.target.value)}
              required
            >
              <option value="">Select site</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </Select>
          </label>
          <label className="space-y-1 text-xs md:col-span-2">
            <span className="font-medium">Storage location</span>
            <Input
              value={storageLocationLabel}
              onChange={(event) => setStorageLocationLabel(event.target.value)}
              required
              placeholder="Boiler room cage"
            />
          </label>
          <label className="space-y-1 text-xs">
            <span className="font-medium">Min threshold</span>
            <Input
              type="number"
              min={0}
              value={minThreshold}
              onChange={(event) => setMinThreshold(event.target.value)}
            />
          </label>
          <label className="space-y-1 text-xs">
            <span className="font-medium">Reorder level</span>
            <Input
              type="number"
              min={0}
              value={reorderLevel}
              onChange={(event) => setReorderLevel(event.target.value)}
            />
          </label>
          <label className="space-y-1 text-xs">
            <span className="font-medium">Supplier</span>
            <Select value={vendorId} onChange={(event) => setVendorId(event.target.value)}>
              <option value="">None</option>
              {vendors.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.name}
                </option>
              ))}
            </Select>
          </label>
          <label className="space-y-1 text-xs">
            <span className="font-medium">Supplier SKU</span>
            <Input value={skuCode} onChange={(event) => setSkuCode(event.target.value)} />
          </label>
          <div className="md:col-span-2">
            <Button type="submit" disabled={busy || properties.length === 0}>
              {busy ? "Saving…" : "Add stock item"}
            </Button>
          </div>
        </form>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">On hand</h2>
        {items.length === 0 ? (
          <EmptyState
            title="No stock items yet"
            description="Add a catalog item, then receive quantity. This is not the serialized equipment table."
          />
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {items.map((item) => (
              <li
                key={item.id}
                className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">
                      {FACILITY_STOCK_CATEGORY_LABELS[item.category]} · {item.storage_location_label}
                    </p>
                    <p className="mt-1 text-sm">
                      {item.quantity_on_hand} {item.unit_of_measure}
                    </p>
                  </div>
                  <Badge variant={item.low_stock ? "warning" : "success"}>
                    {item.low_stock ? "Low stock" : "In stock"}
                  </Badge>
                </div>
                <p className="mt-3 text-sm">
                  <Link
                    href={`/facility/inventory/${item.id}`}
                    className="text-[var(--mpa-color-brand-primary)] underline"
                  >
                    Open item
                  </Link>
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </FoPageChrome>
  );
}
