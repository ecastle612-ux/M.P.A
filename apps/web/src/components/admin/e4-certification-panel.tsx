"use client";

import { useState } from "react";
import { Badge, Button, Input } from "@mpa/ui";

type E4Report = {
  organizationId: string;
  scheduleCount: number;
  activeCount: number;
  overdueCount: number;
  runCount: number;
  preventiveWorkCount: number;
  schedules: Array<{ id: string; name: string; status: string; next_due_on: string | null }>;
  runs: Array<{ id: string; due_on: string; status: string; work_order_id: string | null }>;
  timelineEvents: Array<{ id: string; event_type: string; created_at: string }>;
  auditEvents: Array<{ id: string; action: string; created_at: string }>;
  checks: Record<string, boolean>;
  assistantRecommendation: string;
};

export function E4CertificationPanel() {
  const [organizationId, setOrganizationId] = useState("");
  const [report, setReport] = useState<E4Report | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      const response = await fetch(
        `/api/admin/facility/e4?organizationId=${encodeURIComponent(organizationId.trim())}`
      );
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to load E.4 evidence");
      }
      setReport(payload as E4Report);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load E.4 evidence");
    } finally {
      setLoading(false);
    }
  }

  const allPass =
    report &&
    Object.values(report.checks).every(Boolean) &&
    report.scheduleCount > 0 &&
    report.preventiveWorkCount > 0;

  return (
    <section className="max-w-3xl space-y-4 rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-4">
      <div>
        <h2 className="text-base font-semibold">FAC-OPS-001 · Phase E.4 certification</h2>
        <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
          Verify PM program creation, due generation into shared facility work orders, assignments,
          acknowledge/advance, search, timeline, audit, Assistant, and Mission Control signals.
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
          {loading ? "Loading…" : "Load E.4 evidence"}
        </Button>
      </div>
      {error ? <p className="text-sm text-[var(--mpa-color-status-danger)]">{error}</p> : null}
      {report ? (
        <div className="space-y-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={allPass ? "success" : "danger"}>
              {allPass ? "E.4 evidence Pass" : "E.4 evidence incomplete"}
            </Badge>
            <span className="text-[var(--mpa-color-text-secondary)]">
              {report.scheduleCount} programs · {report.preventiveWorkCount} generated WOs ·
              Assistant: {report.assistantRecommendation}
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
