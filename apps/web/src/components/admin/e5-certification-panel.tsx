"use client";

import { useState } from "react";
import { Badge, Button, Input } from "@mpa/ui";

type E5Report = {
  organizationId: string;
  partCount: number;
  locationCount: number;
  stockLineCount: number;
  movementCount: number;
  receiveCount: number;
  issueCount: number;
  adjustCount: number;
  returnCount: number;
  stockoutCount: number;
  parts: Array<{ id: string; sku: string; name: string; critical_part: boolean }>;
  locations: Array<{ id: string; name: string; site_id: string }>;
  stock: Array<{ id: string; quantity_on_hand: number; reorder_threshold: number }>;
  movements: Array<{
    id: string;
    movement_type: string;
    work_order_id: string | null;
    quantity_delta: number;
  }>;
  timelineEvents: Array<{ id: string; event_type: string; created_at: string }>;
  auditEvents: Array<{ id: string; action: string; created_at: string }>;
  checks: Record<string, boolean>;
  assistantRecommendation: string;
};

export function E5CertificationPanel() {
  const [organizationId, setOrganizationId] = useState("");
  const [report, setReport] = useState<E5Report | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      const response = await fetch(
        `/api/admin/facility/e5?organizationId=${encodeURIComponent(organizationId.trim())}`
      );
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to load E.5 evidence");
      }
      setReport(payload as E5Report);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load E.5 evidence");
    } finally {
      setLoading(false);
    }
  }

  const allPass =
    report &&
    Object.values(report.checks).every(Boolean) &&
    report.partCount > 0 &&
    report.locationCount > 0 &&
    report.receiveCount > 0 &&
    report.issueCount > 0 &&
    report.adjustCount > 0;

  return (
    <section className="max-w-3xl space-y-4 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
      <div>
        <h2 className="text-base font-semibold">FAC-OPS-001 · Phase E.5 certification</h2>
        <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
          Verify parts catalog, storeroom locations, receive/issue/adjust/return movements, WO-required
          issue policy, stockout Mission Control, search, timeline, audit, and Assistant.
        </p>
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <label className="min-w-[240px] flex-1 space-y-1 text-sm">
          <span className="text-[var(--mpa-color-text-secondary)]">Organization id</span>
          <Input
            value={organizationId}
            onChange={(event) => setOrganizationId(event.target.value)}
            placeholder="uuid"
          />
        </label>
        <Button
          type="button"
          disabled={loading || organizationId.trim().length < 32}
          onClick={() => void load()}
        >
          {loading ? "Loading…" : "Load E.5 evidence"}
        </Button>
      </div>
      {error ? <p className="text-sm text-[#C0392B]">{error}</p> : null}
      {report ? (
        <div className="space-y-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={allPass ? "success" : "danger"}>
              {allPass ? "E.5 evidence Pass" : "E.5 evidence incomplete"}
            </Badge>
            <span className="text-[var(--mpa-color-text-secondary)]">
              {report.partCount} parts · {report.locationCount} locations ·{" "}
              {report.movementCount} movements · {report.stockoutCount} stockouts · Assistant:{" "}
              {report.assistantRecommendation}
            </span>
          </div>
          <ul className="space-y-1">
            {Object.entries(report.checks).map(([key, value]) => (
              <li
                key={key}
                className="flex justify-between gap-3 border-b border-[var(--mpa-color-border-default)] py-1"
              >
                <span>{key}</span>
                <Badge variant={value ? "success" : "danger"}>{value ? "yes" : "no"}</Badge>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
