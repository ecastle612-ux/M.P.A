"use client";

import { useState } from "react";
import { Badge, Button, Input } from "@mpa/ui";

type E3Report = {
  organizationId: string;
  facilityWorkCount: number;
  openCount: number;
  emergencyCount: number;
  workOrders: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    product_context: string;
    site_id: string | null;
    asset_id: string | null;
    system_id: string | null;
  }>;
  timelineEvents: Array<{ id: string; event_type: string; created_at: string }>;
  auditEvents: Array<{ id: string; action: string; created_at: string }>;
  notifications: Array<{ id: string; notification_key: string; title: string }>;
  checks: Record<string, boolean>;
  assistantRecommendation: string;
};

export function E3CertificationPanel() {
  const [organizationId, setOrganizationId] = useState("");
  const [report, setReport] = useState<E3Report | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      const response = await fetch(
        `/api/admin/facility/e3?organizationId=${encodeURIComponent(organizationId.trim())}`
      );
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to load E.3 evidence");
      }
      setReport(payload as E3Report);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load E.3 evidence");
    } finally {
      setLoading(false);
    }
  }

  const allPass =
    report &&
    Object.values(report.checks).every(Boolean) &&
    report.facilityWorkCount > 0;

  return (
    <section className="max-w-3xl space-y-4 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
      <div>
        <h2 className="text-base font-semibold">FAC-OPS-001 · Phase E.3 certification</h2>
        <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
          Verify facility corrective work creation, site/asset/system linkage, shared WO
          product_context, Maintenance handoff, search, timeline, audit, Assistant, and Mission
          Control signals.
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
          {loading ? "Loading…" : "Load E.3 evidence"}
        </Button>
      </div>
      {error ? <p className="text-sm text-[#C0392B]">{error}</p> : null}
      {report ? (
        <div className="space-y-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={allPass ? "success" : "danger"}>
              {allPass ? "E.3 evidence Pass" : "E.3 evidence incomplete"}
            </Badge>
            <span className="text-[var(--mpa-color-text-secondary)]">
              {report.facilityWorkCount} facility WOs · {report.openCount} open · Assistant:{" "}
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
