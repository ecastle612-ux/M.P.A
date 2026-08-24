"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FACILITY_ASSET_STATUS_LABELS,
  FACILITY_ASSET_STATUSES,
  FACILITY_ASSET_TYPE_LABELS,
  FACILITY_ASSET_TYPES,
  ownerEmptyStateCopy,
  type FacilityAssetStatus,
  type FacilityAssetType
} from "@mpa/shared";
import { Alert, Badge, Button, EmptyState, Input, Select, Skeleton } from "@mpa/ui";
import { ErrorRetry } from "../shell/error-retry";
import { FoDocumentsStrip, FoPageChrome, FoQuickActions, documentsHref } from "../shell/fo-workspace";

type AssetRow = {
  id: string;
  name: string;
  asset_code: string;
  asset_type: FacilityAssetType;
  custom_type_label: string | null;
  status: FacilityAssetStatus;
  floor_label: string | null;
  room_label: string | null;
  building_label: string | null;
  department_label?: string | null;
  serial_number?: string | null;
  property_properties?: { id: string; name: string } | null;
  vendor_vendors?: { id: string; name: string } | null;
};

type PropertyRow = { id: string; name: string };
type VendorRow = { id: string; name: string };

function statusVariant(status: FacilityAssetStatus) {
  if (status === "active") return "success" as const;
  if (status === "maintenance") return "warning" as const;
  return "neutral" as const;
}

export function FacilityAssetsWorkspace() {
  const searchParams = useSearchParams();
  const siteFromUrl = searchParams.get("site") ?? "";
  const startCreate = searchParams.get("new") === "1";
  const [assets, setAssets] = useState<AssetRow[]>([]);
  const [properties, setProperties] = useState<PropertyRow[]>([]);
  const [vendors, setVendors] = useState<VendorRow[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const [siteFilter, setSiteFilter] = useState(siteFromUrl);
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [query, setQuery] = useState("");
  const [name, setName] = useState("");
  const [assetCode, setAssetCode] = useState("");
  const [assetType, setAssetType] = useState<FacilityAssetType>("hvac");
  const [customTypeLabel, setCustomTypeLabel] = useState("");
  const [propertyPropertyId, setPropertyPropertyId] = useState(siteFromUrl);
  const [buildingLabel, setBuildingLabel] = useState("");
  const [floorLabel, setFloorLabel] = useState("");
  const [departmentLabel, setDepartmentLabel] = useState("");
  const [roomLabel, setRoomLabel] = useState("");
  const [scanCode, setScanCode] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [model, setModel] = useState("");
  const [serialNumber, setSerialNumber] = useState("");

  const refresh = useCallback(async () => {
    const response = await fetch("/api/facility/assets");
    const body = (await response.json()) as {
      assets?: AssetRow[];
      properties?: PropertyRow[];
      vendors?: VendorRow[];
      canManage?: boolean;
      error?: string;
    };
    if (!response.ok) {
      throw new Error(body.error ?? "Failed to load assets");
    }
    setAssets(body.assets ?? []);
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
          setError(err instanceof Error ? err.message : "Failed to load assets");
          setLoading(false);
        }
      }
    })();
    return () => controller.abort();
  }, [refresh, reloadToken]);

  useEffect(() => {
    if (!startCreate || loading) return;
    document.getElementById("create-asset")?.scrollIntoView({ block: "start" });
    document.querySelector<HTMLInputElement>("[data-testid='fo-asset-name']")?.focus();
  }, [loading, startCreate]);

  const filtered = useMemo(() => {
    return assets.filter((asset) => {
      if (siteFilter && asset.property_properties?.id !== siteFilter) return false;
      if (typeFilter && asset.asset_type !== typeFilter) return false;
      if (statusFilter && asset.status !== statusFilter) return false;
      if (query.trim()) {
        const haystack = [
          asset.name,
          asset.asset_code,
          asset.serial_number,
          asset.department_label,
          asset.building_label,
          asset.floor_label,
          asset.room_label,
          asset.property_properties?.name
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(query.trim().toLowerCase())) return false;
      }
      return true;
    });
  }, [assets, siteFilter, typeFilter, statusFilter, query]);

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
        { label: "Assets" }
      ]}
      eyebrow="Facility Operations"
      title="Facility assets"
      description="Register equipment, open work from the asset, and print an on-demand QR that uses the existing public request intake."
    >
      <FoQuickActions
        actions={[
          { href: "/facility/operations", label: "Create facility work", primary: true },
          { href: "/facility/settings/request-forms", label: "Request Forms" },
          { href: "/facility/reports", label: "Reports" },
          { href: documentsHref(undefined, "manual warranty"), label: "Documents" }
        ]}
      />

      {error ? (
        <ErrorRetry
          title="Unable to load assets"
          description={error}
          onRetry={() => {
            setLoading(true);
            setError(null);
            setReloadToken((value) => value + 1);
          }}
        />
      ) : null}
      {notice ? <Alert variant="success">{notice}</Alert> : null}

      {canManage ? (
        <form
          id="create-asset"
          className="grid max-w-3xl gap-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4 md:grid-cols-2"
          data-testid="fo-add-asset-form"
          onSubmit={(event) => {
            event.preventDefault();
            void (async () => {
              setBusy(true);
              setNotice(null);
              setError(null);
              try {
                const response = await fetch("/api/facility/assets", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    name: name.trim(),
                    assetCode: assetCode.trim() || undefined,
                    assetType,
                    customTypeLabel: assetType === "other" ? customTypeLabel.trim() : undefined,
                    propertyPropertyId,
                    buildingLabel: buildingLabel.trim() || undefined,
                    floorLabel: floorLabel.trim() || undefined,
                    departmentLabel: departmentLabel.trim() || undefined,
                    roomLabel: roomLabel.trim() || undefined,
                    scanCode: scanCode.trim() || undefined,
                    purchaseDate: purchaseDate || undefined,
                    vendorId: vendorId || undefined,
                    manufacturer: manufacturer.trim() || undefined,
                    model: model.trim() || undefined,
                    serialNumber: serialNumber.trim() || undefined
                  })
                });
                const body = (await response.json()) as { error?: string };
                if (!response.ok) {
                  throw new Error(body.error ?? "Failed to create asset");
                }
                setName("");
                setAssetCode("");
                setCustomTypeLabel("");
                setBuildingLabel("");
                setFloorLabel("");
                setDepartmentLabel("");
                setRoomLabel("");
                setScanCode("");
                setPurchaseDate("");
                setVendorId("");
                setManufacturer("");
                setModel("");
                setSerialNumber("");
                setNotice("Asset registered.");
                setReloadToken((value) => value + 1);
              } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to create asset");
              } finally {
                setBusy(false);
              }
            })();
          }}
        >
          <h2 className="text-sm font-semibold md:col-span-2">Register asset</h2>
          <label className="space-y-1 text-xs">
            <span className="font-medium">Name</span>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              minLength={2}
              placeholder="Rooftop AHU-2"
              data-testid="fo-asset-name"
            />
          </label>
          <label className="space-y-1 text-xs">
            <span className="font-medium">Asset tag</span>
            <Input
              value={assetCode}
              onChange={(event) => setAssetCode(event.target.value)}
              placeholder="Leave blank for AST-000123"
              data-testid="fo-asset-code"
            />
          </label>
          <label className="space-y-1 text-xs">
            <span className="font-medium">Type</span>
            <Select
              value={assetType}
              onChange={(event) => setAssetType(event.target.value as FacilityAssetType)}
            >
              {FACILITY_ASSET_TYPES.map((value) => (
                <option key={value} value={value}>
                  {FACILITY_ASSET_TYPE_LABELS[value]}
                </option>
              ))}
            </Select>
          </label>
          {assetType === "other" ? (
            <label className="space-y-1 text-xs">
              <span className="font-medium">Custom type</span>
              <Input
                value={customTypeLabel}
                onChange={(event) => setCustomTypeLabel(event.target.value)}
                required
                placeholder="Lab freezer"
              />
            </label>
          ) : null}
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
          <label className="space-y-1 text-xs">
            <span className="font-medium">Building label</span>
            <Input
              value={buildingLabel}
              onChange={(event) => setBuildingLabel(event.target.value)}
              placeholder="Building A"
            />
          </label>
          <label className="space-y-1 text-xs">
            <span className="font-medium">Floor</span>
            <Input
              value={floorLabel}
              onChange={(event) => setFloorLabel(event.target.value)}
              placeholder="2"
            />
          </label>
          <label className="space-y-1 text-xs">
            <span className="font-medium">Department / area</span>
            <Input
              value={departmentLabel}
              onChange={(event) => setDepartmentLabel(event.target.value)}
              placeholder="Cardiology"
            />
          </label>
          <label className="space-y-1 text-xs">
            <span className="font-medium">Room / location</span>
            <Input
              value={roomLabel}
              onChange={(event) => setRoomLabel(event.target.value)}
              placeholder="Mechanical penthouse"
            />
          </label>
          <label className="space-y-1 text-xs">
            <span className="font-medium">Vendor</span>
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
            <span className="font-medium">Purchase date</span>
            <Input type="date" value={purchaseDate} onChange={(event) => setPurchaseDate(event.target.value)} />
          </label>
          <label className="space-y-1 text-xs">
            <span className="font-medium">Manufacturer</span>
            <Input value={manufacturer} onChange={(event) => setManufacturer(event.target.value)} />
          </label>
          <label className="space-y-1 text-xs">
            <span className="font-medium">Model</span>
            <Input value={model} onChange={(event) => setModel(event.target.value)} />
          </label>
          <label className="space-y-1 text-xs">
            <span className="font-medium">Serial</span>
            <Input value={serialNumber} onChange={(event) => setSerialNumber(event.target.value)} />
          </label>
          <label className="space-y-1 text-xs">
            <span className="font-medium">Optional staff scan aid</span>
            <Input
              value={scanCode}
              onChange={(event) => setScanCode(event.target.value)}
              placeholder="Not a public QR. Public QR is created on the asset."
            />
          </label>
          <div className="md:col-span-2">
            <Button type="submit" disabled={busy || properties.length === 0}>
              {busy ? "Saving…" : "Register asset"}
            </Button>
          </div>
        </form>
      ) : (
        <p className="rounded-md border border-[var(--mpa-color-border-default)] bg-white px-3 py-2 text-sm text-[var(--mpa-color-text-secondary)]">
          Assigned work only. You can open assets that appear on your facility work orders.
        </p>
      )}

      <section className="space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <h2 className="text-sm font-semibold">Asset registry</h2>
          <label className="space-y-1 text-xs">
            <span className="font-medium">Search</span>
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Name, AST tag, serial, location"
              aria-label="Search assets"
            />
          </label>
          <label className="space-y-1 text-xs">
            <span className="font-medium">Site</span>
            <Select value={siteFilter} onChange={(event) => setSiteFilter(event.target.value)}>
              <option value="">All</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </Select>
          </label>
          <label className="space-y-1 text-xs">
            <span className="font-medium">Type</span>
            <Select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
              <option value="">All</option>
              {FACILITY_ASSET_TYPES.map((value) => (
                <option key={value} value={value}>
                  {FACILITY_ASSET_TYPE_LABELS[value]}
                </option>
              ))}
            </Select>
          </label>
          <label className="space-y-1 text-xs">
            <span className="font-medium">Status</span>
            <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="">All</option>
              {FACILITY_ASSET_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {FACILITY_ASSET_STATUS_LABELS[value]}
                </option>
              ))}
            </Select>
          </label>
        </div>
        {filtered.length === 0 ? (
          <EmptyState
            title={ownerEmptyStateCopy("fo_assets").title}
            description={ownerEmptyStateCopy("fo_assets").description}
          />
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {filtered.map((asset) => (
              <li
                key={asset.id}
                className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-[var(--mpa-color-text-primary)]">{asset.name}</h3>
                    <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">
                      {asset.asset_code} · {FACILITY_ASSET_TYPE_LABELS[asset.asset_type]}
                      {asset.custom_type_label ? ` (${asset.custom_type_label})` : ""}
                    </p>
                    <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">
                      {asset.property_properties?.name ?? "Unmapped site"}
                      {asset.building_label ? ` · ${asset.building_label}` : ""}
                      {asset.floor_label ? ` · Floor ${asset.floor_label}` : ""}
                      {asset.department_label ? ` · ${asset.department_label}` : ""}
                      {asset.room_label ? ` · ${asset.room_label}` : ""}
                    </p>
                  </div>
                  <Badge variant={statusVariant(asset.status)}>
                    {FACILITY_ASSET_STATUS_LABELS[asset.status]}
                  </Badge>
                </div>
                <p className="mt-3 text-sm">
                  <Link
                    href={`/facility/assets/${asset.id}`}
                    className="text-[var(--mpa-color-brand-primary)] underline"
                  >
                    Open asset
                  </Link>
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <FoDocumentsStrip
        title="Equipment manuals & warranties"
        detail="PDF manuals and warranty files belong in Documents. Photos attach on the asset."
        query="manual warranty asset"
      />
    </FoPageChrome>
  );
}
