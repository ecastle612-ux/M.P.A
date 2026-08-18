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
  department_label?: string | null;
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
  category?: string | null;
  request_number?: string | null;
  facility_asset_label: string | null;
  created_at: string;
  completed_at: string | null;
};

type RequestFormRow = { id: string; name: string; status: string };

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
  const [departmentLabel, setDepartmentLabel] = useState("");
  const [roomLabel, setRoomLabel] = useState("");
  const [buildingLabel, setBuildingLabel] = useState("");
  const [scanCode, setScanCode] = useState("");
  const [workTitle, setWorkTitle] = useState("");
  const [workDescription, setWorkDescription] = useState("");
  const [forms, setForms] = useState<RequestFormRow[]>([]);
  const [formId, setFormId] = useState("");
  const [qrSvg, setQrSvg] = useState<string | null>(null);
  const [labelSvg, setLabelSvg] = useState<string | null>(null);
  const [qrLink, setQrLink] = useState<string | null>(null);
  const [qrPrefix, setQrPrefix] = useState<string | null>(null);
  const [hasActiveQr, setHasActiveQr] = useState(false);

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
    setDepartmentLabel(body.asset.department_label ?? "");
    setRoomLabel(body.asset.room_label ?? "");
    setBuildingLabel(body.asset.building_label ?? "");
    setScanCode(body.asset.scan_code ?? "");
    if (body.canManage) {
      const [formsResponse, qrResponse] = await Promise.all([
        fetch("/api/facility/request-forms"),
        fetch(`/api/facility/assets/${assetId}/qr`)
      ]);
      const formsBody = (await formsResponse.json()) as { forms?: RequestFormRow[] };
      const published = (formsBody.forms ?? []).filter((form) => form.status === "active");
      setForms(published);
      setFormId((current) => current || published[0]?.id || "");
      if (qrResponse.ok) {
        const qrBody = (await qrResponse.json()) as {
          hasActiveQr?: boolean;
          intake?: { public_token_prefix?: string; form_id?: string } | null;
        };
        setHasActiveQr(Boolean(qrBody.hasActiveQr));
        setQrPrefix(qrBody.intake?.public_token_prefix ?? null);
        if (qrBody.intake?.form_id) setFormId(qrBody.intake.form_id);
      }
    }
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
          { href: "#create-work", label: "Create Work", primary: true },
          { href: "#asset-qr", label: "QR / Share" },
          { href: "#edit-asset", label: "Edit Asset" },
          { href: "/facility/operations", label: "Operations" }
        ]}
      />

      {error ? <Alert variant="danger">{error}</Alert> : null}
      {notice ? <Alert variant="success">{notice}</Alert> : null}

      <section className="grid gap-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4 md:grid-cols-2">
        <p className="text-sm md:col-span-2">
          {asset.property_properties?.name ?? "Unmapped site"}
          {asset.building_label ? ` · ${asset.building_label}` : ""}
          {asset.floor_label ? ` · Floor ${asset.floor_label}` : ""}
          {asset.department_label ? ` · ${asset.department_label}` : ""}
          {asset.room_label ? ` · Room ${asset.room_label}` : ""}
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
          id="edit-asset"
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
                    departmentLabel: departmentLabel.trim() || undefined,
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
            <span className="font-medium">Department / area</span>
            <Input value={departmentLabel} onChange={(event) => setDepartmentLabel(event.target.value)} />
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
          id="create-work"
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
                  window.location.href = `/facility/operations?workOrderId=${body.workOrder.id}&from=asset`;
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

      {canManage ? (
        <section
          id="asset-qr"
          className="grid max-w-xl gap-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4"
        >
          <h2 className="text-sm font-semibold">QR / Share</h2>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            Uses the existing public request intake. The QR encodes only `/request/{"{token}"}`.
          </p>
          {hasActiveQr ? (
            <p className="text-sm">
              Active intake{qrPrefix ? ` · ${qrPrefix}…` : ""}. Download a new printable label by
              replacing the QR. Deactivate to stop new public requests.
            </p>
          ) : (
            <p className="text-sm text-[var(--mpa-color-text-secondary)]">No active public QR yet.</p>
          )}
          <label className="space-y-1 text-xs">
            <span className="font-medium">Published request form</span>
            <Select value={formId} onChange={(event) => setFormId(event.target.value)}>
              <option value="">Select form</option>
              {forms.map((form) => (
                <option key={form.id} value={form.id}>
                  {form.name}
                </option>
              ))}
            </Select>
          </label>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={busy || !formId}
              onClick={() => {
                void (async () => {
                  setBusy(true);
                  setError(null);
                  try {
                    const response = await fetch(`/api/facility/assets/${asset.id}/qr`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ formId })
                    });
                    const body = (await response.json()) as {
                      error?: string;
                      qrSvg?: string;
                      labelSvg?: string;
                      linkUrl?: string;
                    };
                    if (!response.ok) throw new Error(body.error ?? "Failed to create QR");
                    setQrSvg(body.qrSvg ?? null);
                    setLabelSvg(body.labelSvg ?? null);
                    setQrLink(body.linkUrl ?? null);
                    setHasActiveQr(true);
                    setNotice("Asset QR created. Download or print the label before leaving this page.");
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Failed to create QR");
                  } finally {
                    setBusy(false);
                  }
                })();
              }}
            >
              Create QR
            </Button>
            <Button
              type="button"
              disabled={busy}
              onClick={() => {
                void (async () => {
                  setBusy(true);
                  try {
                    const response = await fetch(`/api/facility/assets/${asset.id}/qr`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ action: "revoke" })
                    });
                    const body = (await response.json()) as { error?: string };
                    if (!response.ok) throw new Error(body.error ?? "Failed to deactivate QR");
                    setQrSvg(null);
                    setLabelSvg(null);
                    setQrLink(null);
                    setQrPrefix(null);
                    setHasActiveQr(false);
                    setNotice("Public intake deactivated. Existing submissions remain.");
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Failed to deactivate QR");
                  } finally {
                    setBusy(false);
                  }
                })();
              }}
            >
              Deactivate intake
            </Button>
          </div>
          {qrLink ? (
            <p className="text-sm">
              <button
                type="button"
                className="min-h-11 text-[var(--mpa-color-brand-primary)] underline"
                onClick={() => void navigator.clipboard.writeText(qrLink)}
              >
                Copy request link
              </button>
            </p>
          ) : null}
          {qrSvg ? <div aria-label="Asset request QR" dangerouslySetInnerHTML={{ __html: qrSvg }} /> : null}
          {labelSvg ? (
            <a
              className="min-h-11 inline-flex items-center text-sm font-semibold text-[var(--mpa-color-brand-primary)] underline"
              href={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(labelSvg)}`}
              download={`${asset.asset_code}-qr-label.svg`}
            >
              Download / print QR label
            </a>
          ) : null}
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Work history</h2>
        {history.length === 0 ? (
          <EmptyState
            title="No work yet"
            description="Open and completed facility work linked to this asset appears here."
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
                    href={`/facility/operations?workOrderId=${row.id}&from=asset`}
                    className="min-h-11 font-medium text-[var(--mpa-color-brand-primary)] underline"
                  >
                    {row.title}
                  </Link>
                  <Badge variant="neutral">{row.status}</Badge>
                </div>
                <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">
                  {[row.request_number, row.priority, row.category, row.completed_at ?? row.created_at]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </FoPageChrome>
  );
}
