"use client";

import { useState } from "react";
import { Badge, Button, Input } from "@mpa/ui";

type J8Report = {
  organizationId: string;
  checks: Record<string, boolean>;
  assistantRecommendation: string;
  note?: string;
  nextAction?: { id: string; title: string; href: string };
  timelineEvents: Array<{ id: string; event_type: string; created_at: string }>;
  auditEvents: Array<{ id: string; action: string; created_at: string }>;
};

export function J8CertificationPanel() {
  const [organizationId, setOrganizationId] = useState("");
  const [report, setReport] = useState<J8Report | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      const response = await fetch(
        `/api/admin/launch/j8?organizationId=${encodeURIComponent(organizationId.trim())}`
      );
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to load J8 evidence");
      }
      setReport(payload as J8Report);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load J8 evidence");
    } finally {
      setLoading(false);
    }
  }

  const corePass =
    report &&
    report.checks["ownerPortfolioReviewed"] &&
    report.checks["timelineEvent"] &&
    report.checks["auditEvent"] &&
    report.checks["customerPromiseComplete"] &&
    report.assistantRecommendation ===
      "I can confidently monitor my investment portfolio using M.P.A.";

  return (
    <section className="max-w-3xl space-y-4 rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-4">
      <div>
        <h2 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">
          LAUNCH-001 · J8 certification
        </h2>
        <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
          Verify Owner Portfolio Home, property drill-down, financial/maintenance summaries,
          timeline/audit, and customer promise completion.
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
        <Button type="button" disabled={loading || organizationId.trim().length < 32} onClick={() => void load()}>
          {loading ? "Loading…" : "Load J8 evidence"}
        </Button>
      </div>
      {error ? <p className="text-sm text-[var(--mpa-color-status-danger)]">{error}</p> : null}
      {report ? (
        <div className="space-y-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={corePass ? "success" : "danger"}>
              {corePass ? "J8 evidence Pass" : "J8 evidence incomplete"}
            </Badge>
            <span className="text-[var(--mpa-color-text-secondary)]">
              Assistant: {report.assistantRecommendation}
            </span>
          </div>
          {report.note ? (
            <p className="text-xs text-[var(--mpa-color-text-secondary)]">{report.note}</p>
          ) : null}
          {report.nextAction ? (
            <p className="text-xs text-[var(--mpa-color-text-secondary)]">
              Next action: {report.nextAction.id} → {report.nextAction.href}
            </p>
          ) : null}
          <ul className="space-y-1">
            {Object.entries(report.checks).map(([key, value]) => (
              <li key={key} className="flex justify-between gap-3 border-b border-[var(--mpa-color-border-default)] py-1">
                <span>{key}</span>
                <Badge variant={value ? "success" : "danger"}>{value ? "yes" : "no"}</Badge>
              </li>
            ))}
          </ul>
          <div>
            <h3 className="font-medium">Timeline / audit</h3>
            <ul className="mt-1 space-y-1 text-[var(--mpa-color-text-secondary)]">
              {report.timelineEvents.map((event) => (
                <li key={event.id}>
                  {event.event_type} · {event.created_at}
                </li>
              ))}
              {report.auditEvents.map((event) => (
                <li key={`a-${event.id}`}>
                  audit {event.action} · {event.created_at}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </section>
  );
}
