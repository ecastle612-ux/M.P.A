"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  FACILITY_ASSET_STATUS_LABELS,
  FACILITY_ASSET_STATUSES,
  FACILITY_ASSET_TYPE_LABELS,
  type FacilityAssetStatus
} from "@mpa/shared";
import { Alert, Badge, Button, EmptyState, Input, Select, Skeleton } from "@mpa/ui";
import { ErrorRetry } from "../shell/error-retry";
import { FoPageChrome, FoQuickActions } from "../shell/fo-workspace";
import { MediaAttachmentField } from "../media/media-attachment-field";

type AssetDetail = {
  id: string;
  name: string;
  asset_code: string;
  asset_type: string;
  status: FacilityAssetStatus;
  building_label: string | null;
  floor_label: string | null;
  room_label: string | null;
  location_note: string | null;
  manufacturer: string | null;
  model: string | null;
  serial_number: string | null;
  purchase_date: string | null;
  scan_code: string | null;
  notes: string | null;
  property_property_id: string | null;
  property_properties?: { id: string; name: string } | null;
  vendor_vendors?: { id: string; name: string } | null;
};

type HistoryRow = {
  id: string;
  title: string;
  status: string;
  priority: string;
  facility_asset_label: string | null;
  created_at: string;
  completed_at: string | null;
};

export function FacilityAssetDetailWorkspace({ assetId }: { assetId: string }) {
  const [asset, setAsset] = useState<AssetDetail | null>(null);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<FacilityAssetStatus>("active");
  const [floorLabel, setFloorLabel] = useState("");
  const [roomLabel, setRoomLabel] = useState("");
  const [buildingLabel, setBuildingLabel] = useState("");
  const [scanCode, setScanCode] = useState("");
  const [workTitle, setWorkTitle] = useState("");
  const [workDescription, setWorkDescription] = useState("");

  const refresh = useCallback(async () => {
    const response = await fetch(`/api/facility/assets/${assetId}`);
    const body = (await response.json()) as {
      asset?: AssetDetail;
      history?: HistoryRow[];
      canManage?: boolean;
      error?: string;
    };
    if (!response.ok) {
      throw new Error(body.error ?? "Failed to load asset");
    }
    if (!body.asset) throw new Error("Asset not found");
    setAsset(body.asset);
    setHistory(body.history ?? []);
    setCanManage(Boolean(body.canManage));
    setStatus(body.asset.status);
    setFloorLabel(body.asset.floor_label ?? "");
    setRoomLabel(body.asset.room_label ?? "");
    setBuildingLabel(body.asset.building_label ?? "");
    setScanCode(body.asset.scan_code ?? "");
  }, [assetId]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await refresh();
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load asset");
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

  if (!asset) {
    return (
      <FoPageChrome
        crumbs={[
          { href: "/facility/mission-control", label: "Facility Mission Control" },
          { href: "/facility/assets", label: "Assets" },
          { label: "Asset" }
        ]}
        eyebrow="Facility Operations"
        title="Asset"
        description="This asset is not available."
      >
        {error ? (
          <ErrorRetry title="Unable to load asset" description={error} onRetry={() => void refresh()} />
        ) : (
          <EmptyState title="Asset not found" description="It may be outside your assigned work." />
        )}
      </FoPageChrome>
    );
  }

  return (
    <FoPageChrome
      crumbs={[
        { href: "/facility/mission-control", label: "Facility Mission Control" },
        { href: "/facility/assets", label: "Assets" },
        { label: asset.name }
      ]}
      eyebrow="Facility Operations"
      title={asset.name}
      description={`${asset.asset_code} · ${FACILITY_ASSET_TYPE_LABELS[asset.asset_type as keyof typeof FACILITY_ASSET_TYPE_LABELS] ?? asset.asset_type}`}
      actions={<Badge variant={asset.status === "active" ? "success" : "warning"}>{FACILITY_ASSET_STATUS_LABELS[asset.status]}</Badge>}
    >
      <FoQuickActions
        actions={[
          { href: "/facility/assets", label: "All assets" },
          { href: "/facility/operations", label: "Operations", primary: true },
          { href: "/facility/reports", label: "Reports" }
        ]}
      />

      {error ? <Alert variant="danger">{error}</Alert> : null}
      {notice ? <Alert variant="success">{notice}</Alert> : null}

      <section className="grid gap-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4 md:grid-cols-2">
        <p className="text-sm md:col-span-2">
          {asset.property_properties?.name ?? "Unmapped site"}
          {asset.building_label ? ` · ${asset.building_label}` : ""}
          {asset.floor_label ? ` · Floor ${asset.floor_label}` : ""}
          {asset.room_label ? ` · ${asset.room_label}` : ""}
        </p>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          Manufacturer: {asset.manufacturer || "—"}
        </p>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">Model: {asset.model || "—"}</p>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          Serial: {asset.serial_number || "—"}
        </p>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          Purchase date: {asset.purchase_date || "—"}
        </p>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          Vendor: {asset.vendor_vendors?.name || "—"}
        </p>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          Scan code: {asset.scan_code || "—"}
        </p>
      </section>

      <MediaAttachmentField
        relatedEntityType="facility_asset"
        relatedEntityId={asset.id}
        label="Asset photos"
        readOnly={!canManage}
      />

      {canManage ? (
        <form
          className="grid max-w-xl gap-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4"
          onSubmit={(event) => {
            event.preventDefault();
            void (async () => {
              setBusy(true);
              setError(null);
              setNotice(null);
              try {
                const response = await fetch(`/api/facility/assets/${asset.id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    status,
                    floorLabel: floorLabel.trim() || undefined,
                    roomLabel: roomLabel.trim() || undefined,
                    buildingLabel: buildingLabel.trim() || undefined,
                    scanCode: scanCode.trim() || undefined
                  })
                });
                const body = (await response.json()) as { error?: string };
                if (!response.ok) throw new Error(body.error ?? "Failed to update asset");
                setNotice("Asset updated.");
                await refresh();
              } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to update asset");
              } finally {
                setBusy(false);
              }
            })();
          }}
        >
          <h2 className="text-sm font-semibold">Update location and lifecycle</h2>
          <label className="space-y-1 text-xs">
            <span className="font-medium">Status</span>
            <Select
              value={status}
              onChange={(event) => setStatus(event.target.value as FacilityAssetStatus)}
            >
              {FACILITY_ASSET_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {FACILITY_ASSET_STATUS_LABELS[value]}
                </option>
              ))}
            </Select>
          </label>
          <label className="space-y-1 text-xs">
            <span className="font-medium">Building label</span>
            <Input value={buildingLabel} onChange={(event) => setBuildingLabel(event.target.value)} />
          </label>
          <label className="space-y-1 text-xs">
            <span className="font-medium">Floor</span>
            <Input value={floorLabel} onChange={(event) => setFloorLabel(event.target.value)} />
          </label>
          <label className="space-y-1 text-xs">
            <span className="font-medium">Room</span>
            <Input value={roomLabel} onChange={(event) => setRoomLabel(event.target.value)} />
          </label>
          <label className="space-y-1 text-xs">
            <span className="font-medium">Scan code</span>
            <Input value={scanCode} onChange={(event) => setScanCode(event.target.value)} />
          </label>
          <Button type="submit" disabled={busy}>
            Save asset
          </Button>
        </form>
      ) : null}

      {canManage && asset.property_property_id ? (
        <form
          className="grid max-w-xl gap-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4"
          onSubmit={(event) => {
            event.preventDefault();
            void (async () => {
              setBusy(true);
              setError(null);
              setNotice(null);
              try {
                const response = await fetch("/api/facility/operations", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    title: workTitle.trim(),
                    description: workDescription.trim(),
                    propertyId: asset.property_property_id,
                    facilityAssetId: asset.id,
                    facilityAssetLabel: asset.name
                  })
                });
                const body = (await response.json()) as { error?: string; workOrder?: { id: string } };
                if (!response.ok) throw new Error(body.error ?? "Failed to create work");
                setWorkTitle("");
                setWorkDescription("");
                setNotice("Facility work created for this asset.");
                if (body.workOrder?.id) {
                  window.location.href = `/facility/operations`;
                }
              } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to create work");
              } finally {
                setBusy(false);
              }
            })();
          }}
        >
          <h2 className="text-sm font-semibold">Create facility work</h2>
          <label className="space-y-1 text-xs">
            <span className="font-medium">Title</span>
            <Input
              value={workTitle}
              onChange={(event) => setWorkTitle(event.target.value)}
              required
              minLength={3}
              placeholder={`Repair ${asset.name}`}
            />
          </label>
          <label className="space-y-1 text-xs">
            <span className="font-medium">Description</span>
            <Input
              value={workDescription}
              onChange={(event) => setWorkDescription(event.target.value)}
              required
              minLength={3}
            />
          </label>
          <Button type="submit" disabled={busy}>
            Create work order
          </Button>
        </form>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Work history</h2>
        {history.length === 0 ? (
          <EmptyState
            title="No completed work yet"
            description="Completed, closed, or cancelled facility work linked to this asset appears here."
          />
        ) : (
          <ul className="space-y-2">
            {history.map((row) => (
              <li
                key={row.id}
                className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link
                    href="/facility/operations"
                    className="font-medium text-[var(--mpa-color-brand-primary)] underline"
                  >
                    {row.title}
                  </Link>
                  <Badge variant="neutral">{row.status}</Badge>
                </div>
                <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">
                  {row.facility_asset_label ? `${row.facility_asset_label} · ` : ""}
                  {row.completed_at ?? row.created_at}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </FoPageChrome>
  );
}
