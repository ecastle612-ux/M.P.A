"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Badge, Button, Card, Input, Select } from "@mpa/ui";
import type { FacilityAssetListItem } from "../../lib/facility/asset-contracts";
import {
  FACILITY_ASSET_TYPES,
  formatAssetStatusLabel,
  formatAssetTypeLabel,
  formatLocationScopeLabel
} from "../../lib/facility/asset-contracts";

type UnitOption = { id: string; unitNumber: string };

export function AssetsPanel({
  propertyId,
  unitId,
  assets: initialAssets,
  units = [],
  canCreate = false,
  title = "Assets",
  description = "Permanent equipment and building systems. Repair history accumulates under each asset."
}: {
  propertyId: string;
  unitId?: string;
  assets: FacilityAssetListItem[];
  units?: UnitOption[];
  canCreate?: boolean;
  title?: string;
  description?: string;
}) {
  const router = useRouter();
  const [assets, setAssets] = useState(initialAssets);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [assetType, setAssetType] = useState("water_heater");
  const [customTypeLabel, setCustomTypeLabel] = useState("");
  const [assetCode, setAssetCode] = useState("");
  const [locationScope, setLocationScope] = useState<"property" | "unit" | "common_area">(
    unitId ? "unit" : "property"
  );
  const [selectedUnitId, setSelectedUnitId] = useState(unitId ?? "");
  const [installDate, setInstallDate] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [model, setModel] = useState("");
  const [serialNumber, setSerialNumber] = useState("");

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch("/api/facility/assets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        propertyId,
        unitId: locationScope === "unit" ? selectedUnitId || unitId || null : null,
        locationScope: unitId ? "unit" : locationScope,
        name,
        assetType,
        customTypeLabel: assetType === "custom" ? customTypeLabel : null,
        assetCode: assetCode.trim() || undefined,
        installDate: installDate || null,
        manufacturer: manufacturer || null,
        model: model || null,
        serialNumber: serialNumber || null
      })
    });
    const payload = (await response.json()) as { asset?: FacilityAssetListItem; error?: string };
    setLoading(false);

    if (!response.ok || !payload.asset) {
      setError(payload.error ?? "Unable to create asset");
      return;
    }

    setAssets((current) => [payload.asset!, ...current]);
    setOpen(false);
    setName("");
    setAssetCode("");
    setCustomTypeLabel("");
    setInstallDate("");
    setManufacturer("");
    setModel("");
    setSerialNumber("");
    router.refresh();
  }

  return (
    <Card id="assets" className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="mpa-section-title">{title}</h2>
          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">{description}</p>
        </div>
        {canCreate ? (
          <Button type="button" variant="secondary" onClick={() => setOpen((value) => !value)}>
            {open ? "Cancel" : "Register asset"}
          </Button>
        ) : null}
      </div>

      {open ? (
        <form className="grid gap-3 rounded-md border border-[var(--mpa-color-border-default)] p-3 md:grid-cols-2" onSubmit={(event) => void handleCreate(event)}>
          <label className="space-y-1 text-sm md:col-span-2">
            <span className="text-[var(--mpa-color-text-secondary)]">Asset name</span>
            <Input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Unit 203 water heater" />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-[var(--mpa-color-text-secondary)]">Type</span>
            <Select value={assetType} onChange={(event) => setAssetType(event.target.value)}>
              {FACILITY_ASSET_TYPES.map((type) => (
                <option key={type} value={type}>
                  {formatAssetTypeLabel(type)}
                </option>
              ))}
            </Select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-[var(--mpa-color-text-secondary)]">Asset code (optional)</span>
            <Input value={assetCode} onChange={(event) => setAssetCode(event.target.value)} placeholder="WH-203" />
          </label>
          {assetType === "custom" ? (
            <label className="space-y-1 text-sm md:col-span-2">
              <span className="text-[var(--mpa-color-text-secondary)]">Custom type label</span>
              <Input required value={customTypeLabel} onChange={(event) => setCustomTypeLabel(event.target.value)} />
            </label>
          ) : null}
          {!unitId ? (
            <label className="space-y-1 text-sm">
              <span className="text-[var(--mpa-color-text-secondary)]">Location</span>
              <Select
                value={locationScope}
                onChange={(event) => setLocationScope(event.target.value as "property" | "unit" | "common_area")}
              >
                <option value="property">Property</option>
                <option value="common_area">Common area</option>
                <option value="unit">Unit</option>
              </Select>
            </label>
          ) : null}
          {!unitId && locationScope === "unit" ? (
            <label className="space-y-1 text-sm">
              <span className="text-[var(--mpa-color-text-secondary)]">Unit</span>
              <Select required value={selectedUnitId} onChange={(event) => setSelectedUnitId(event.target.value)}>
                <option value="">Select unit</option>
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    Unit {unit.unitNumber}
                  </option>
                ))}
              </Select>
            </label>
          ) : null}
          <label className="space-y-1 text-sm">
            <span className="text-[var(--mpa-color-text-secondary)]">Install date</span>
            <Input type="date" value={installDate} onChange={(event) => setInstallDate(event.target.value)} />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-[var(--mpa-color-text-secondary)]">Manufacturer</span>
            <Input value={manufacturer} onChange={(event) => setManufacturer(event.target.value)} />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-[var(--mpa-color-text-secondary)]">Model</span>
            <Input value={model} onChange={(event) => setModel(event.target.value)} />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-[var(--mpa-color-text-secondary)]">Serial number</span>
            <Input value={serialNumber} onChange={(event) => setSerialNumber(event.target.value)} />
          </label>
          <div className="md:col-span-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving…" : "Create asset"}
            </Button>
            {error ? <p className="mt-2 text-sm text-[var(--mpa-color-feedback-error)]">{error}</p> : null}
          </div>
        </form>
      ) : null}

      {assets.length === 0 ? (
        <p className="rounded-lg border border-dashed border-[var(--mpa-color-border-default)] p-4 text-sm text-[var(--mpa-color-text-secondary)]">
          No assets registered yet. Register HVAC, water heaters, roofs, and other systems so repairs accumulate under a
          permanent identity.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.08em] text-[var(--mpa-color-text-tertiary)]">
              <tr>
                <th className="px-2 py-2 font-medium">Asset</th>
                <th className="px-2 py-2 font-medium">Status</th>
                <th className="px-2 py-2 font-medium">Last repair</th>
                <th className="px-2 py-2 font-medium">Repairs</th>
                <th className="px-2 py-2 font-medium">Install</th>
                <th className="px-2 py-2 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--mpa-color-border-default)]">
              {assets.map((asset) => (
                <tr key={asset.id}>
                  <td className="px-2 py-2.5">
                    <p className="font-medium text-[var(--mpa-color-text-primary)]">
                      {asset.assetCode} · {asset.name}
                    </p>
                    <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                      {formatAssetTypeLabel(asset.assetType, asset.customTypeLabel)}
                      {asset.unitNumber
                        ? ` · Unit ${asset.unitNumber}`
                        : ` · ${formatLocationScopeLabel(asset.locationScope)}`}
                    </p>
                  </td>
                  <td className="px-2 py-2.5">
                    <Badge>{formatAssetStatusLabel(asset.status)}</Badge>
                  </td>
                  <td className="px-2 py-2.5 text-[var(--mpa-color-text-secondary)]">
                    {asset.lastRepairAt
                      ? `${new Date(asset.lastRepairAt).toLocaleDateString()} · ${asset.lastRepairIssue ?? "Repair"}`
                      : "—"}
                  </td>
                  <td className="px-2 py-2.5">{asset.repairCount}</td>
                  <td className="px-2 py-2.5 text-[var(--mpa-color-text-secondary)]">
                    {asset.installDate ? new Date(asset.installDate).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-2 py-2.5 text-right">
                    <Link
                      href={`/facility/assets/${asset.id}`}
                      className="text-sm font-medium text-[var(--mpa-color-brand-primary)] underline-offset-2 hover:underline"
                    >
                      Quick view
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
