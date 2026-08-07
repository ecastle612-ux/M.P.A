"use client";

import { useState } from "react";
import { Badge, Button, Input } from "@mpa/ui";

type E6Report = {
  organizationId: string;
  programCount: number;
  runCount: number;
  failedRunCount: number;
  incidentCount: number;
  highSafetyCount: number;
  obligationCount: number;
  overdueCount: number;
  satisfiedCount: number;
  inspectionWorkCount: number;
  safetyWorkCount: number;
  documentCount: number;
  checks: Record<string, boolean>;
  assistantRecommendation: string;
};

export function E6CertificationPanel() {
  const [organizationId, setOrganizationId] = useState("");
  const [report, setReport] = useState<E6Report | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      const response = await fetch(
        `/api/admin/facility/e6?organizationId=${encodeURIComponent(organizationId.trim())}`
      );
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to load E.6 evidence");
      }
      setReport(payload as E6Report);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load E.6 evidence");
    } finally {
      setLoading(false);
    }
  }

  const allPass =
    report &&
    Object.values(report.checks).every(Boolean) &&
    report.programCount > 0 &&
    report.incidentCount > 0 &&
    report.obligationCount > 0 &&
    (report.failedRunCount === 0 || report.inspectionWorkCount > 0);

  return (
    <section className="max-w-3xl space-y-4 rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-4">
      <div>
        <h2 className="text-base font-semibold">FAC-OPS-001 · Phase E.6 certification</h2>
        <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
          Verify inspection programs/runs/findings, safety incidents, compliance obligations,
          spawned shared work orders, documents evidence, search, timeline, audit, Assistant, and
          Mission Control signals.
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
          {loading ? "Loading…" : "Load E.6 evidence"}
        </Button>
      </div>
      {error ? <p className="text-sm text-[var(--mpa-color-status-danger)]">{error}</p> : null}
      {report ? (
        <div className="space-y-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={allPass ? "success" : "danger"}>
              {allPass ? "E.6 evidence Pass" : "E.6 evidence incomplete"}
            </Badge>
            <span className="text-[var(--mpa-color-text-secondary)]">
              {report.programCount} programs · {report.incidentCount} incidents ·{" "}
              {report.obligationCount} obligations · {report.inspectionWorkCount + report.safetyWorkCount}{" "}
              spawned WOs · Assistant: {report.assistantRecommendation}
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
