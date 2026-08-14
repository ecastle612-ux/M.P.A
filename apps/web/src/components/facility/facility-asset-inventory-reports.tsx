"use client";

import { useState } from "react";
import {
  FACILITY_ASSET_REPORT_TYPES,
  FACILITY_INVENTORY_REPORT_TYPES,
  type FacilityAssetReportType,
  type FacilityInventoryReportType
} from "@mpa/shared";
import { Button, EmptyState } from "@mpa/ui";

const ASSET_LABELS: Record<FacilityAssetReportType, string> = {
  asset_list: "Asset list",
  asset_status: "Asset status",
  repair_history: "Repair history",
  repair_frequency: "Repair frequency"
};

const INVENTORY_LABELS: Record<FacilityInventoryReportType, string> = {
  current_stock: "Current stock",
  low_stock: "Low stock",
  usage: "Usage",
  reorder: "Reorder"
};

type ReportPayload = { title: string; rows: Array<Record<string, unknown>> };

function ReportTable({ report }: { report: ReportPayload }) {
  if (report.rows.length === 0) {
    return <EmptyState title={report.title} description="No rows for this report." />;
  }
  const headers = Object.keys(report.rows[0]!);
  return (
    <div className="overflow-x-auto rounded-md border border-[var(--mpa-color-border-default)]">
      <table className="min-w-full text-left text-sm">
        <caption className="sr-only">{report.title}</caption>
        <thead className="bg-[var(--mpa-color-bg-subtle,#f7faf9)]">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-3 py-2 font-semibold">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {report.rows.map((row, index) => (
            <tr key={`${report.title}-${index}`} className="border-t border-[var(--mpa-color-border-default)]">
              {headers.map((header) => (
                <td key={header} className="px-3 py-2">
                  {row[header] == null ? "" : String(row[header])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function FacilityAssetInventoryReports() {
  const [assetType, setAssetType] = useState<FacilityAssetReportType>("asset_list");
  const [inventoryType, setInventoryType] = useState<FacilityInventoryReportType>("current_stock");
  const [assetReport, setAssetReport] = useState<ReportPayload | null>(null);
  const [inventoryReport, setInventoryReport] = useState<ReportPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"asset" | "inventory" | null>(null);

  async function load(kind: "asset" | "inventory") {
    setBusy(kind);
    setError(null);
    try {
      const type = kind === "asset" ? assetType : inventoryType;
      const path =
        kind === "asset"
          ? `/api/facility/reports/assets?type=${type}`
          : `/api/facility/reports/inventory?type=${type}`;
      const response = await fetch(path);
      const body = (await response.json()) as { report?: ReportPayload; error?: string };
      if (!response.ok) throw new Error(body.error ?? "Failed to load report");
      if (kind === "asset") setAssetReport(body.report ?? null);
      else setInventoryReport(body.report ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load report");
    } finally {
      setBusy(null);
    }
  }

  function csvHref(kind: "asset" | "inventory") {
    const type = kind === "asset" ? assetType : inventoryType;
    return kind === "asset"
      ? `/api/facility/reports/assets?type=${type}&format=csv`
      : `/api/facility/reports/inventory?type=${type}&format=csv`;
  }

  return (
    <div className="space-y-6" data-testid="fo-asset-inventory-reports">
      <section className="space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
        <h2 className="font-display text-lg font-semibold">Asset reports</h2>
        <div className="flex flex-wrap items-end gap-3">
          <label className="space-y-1 text-sm">
            <span className="text-[var(--mpa-color-text-secondary)]">Type</span>
            <select
              className="w-full rounded-md border border-[var(--mpa-color-border-default)] bg-white px-3 py-2"
              value={assetType}
              onChange={(event) => setAssetType(event.target.value as FacilityAssetReportType)}
            >
              {FACILITY_ASSET_REPORT_TYPES.map((value) => (
                <option key={value} value={value}>
                  {ASSET_LABELS[value]}
                </option>
              ))}
            </select>
          </label>
          <Button type="button" disabled={busy === "asset"} onClick={() => void load("asset")}>
            {busy === "asset" ? "Loading…" : "Run report"}
          </Button>
          <a className="text-sm text-[var(--mpa-color-brand-primary)] underline" href={csvHref("asset")}>
            Download CSV
          </a>
        </div>
        {assetReport ? <ReportTable report={assetReport} /> : null}
      </section>

      <section className="space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
        <h2 className="font-display text-lg font-semibold">Inventory reports</h2>
        <div className="flex flex-wrap items-end gap-3">
          <label className="space-y-1 text-sm">
            <span className="text-[var(--mpa-color-text-secondary)]">Type</span>
            <select
              className="w-full rounded-md border border-[var(--mpa-color-border-default)] bg-white px-3 py-2"
              value={inventoryType}
              onChange={(event) =>
                setInventoryType(event.target.value as FacilityInventoryReportType)
              }
            >
              {FACILITY_INVENTORY_REPORT_TYPES.map((value) => (
                <option key={value} value={value}>
                  {INVENTORY_LABELS[value]}
                </option>
              ))}
            </select>
          </label>
          <Button
            type="button"
            disabled={busy === "inventory"}
            onClick={() => void load("inventory")}
          >
            {busy === "inventory" ? "Loading…" : "Run report"}
          </Button>
          <a
            className="text-sm text-[var(--mpa-color-brand-primary)] underline"
            href={csvHref("inventory")}
          >
            Download CSV
          </a>
        </div>
        {inventoryReport ? <ReportTable report={inventoryReport} /> : null}
      </section>
      {error ? (
        <p className="text-sm text-[var(--mpa-color-status-danger)]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
