"use client";

import { useState } from "react";
import { Badge, Button, Input } from "@mpa/ui";

type J6Report = {
  organizationId: string;
  checks: Record<string, boolean>;
  assistantRecommendation: string;
  vendorNote?: string;
  workOrders: Array<{
    id: string;
    title: string;
    status: string;
    assignee_type: string;
  }>;
  timelineEvents: Array<{ id: string; event_type: string; created_at: string }>;
  auditEvents: Array<{ id: string; action: string; created_at: string }>;
};

export function J6CertificationPanel() {
  const [organizationId, setOrganizationId] = useState("");
  const [report, setReport] = useState<J6Report | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      const response = await fetch(
        `/api/admin/launch/j6?organizationId=${encodeURIComponent(organizationId.trim())}`
      );
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to load J6 evidence");
      }
      setReport(payload as J6Report);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load J6 evidence");
    } finally {
      setLoading(false);
    }
  }

  const corePass =
    report &&
    report.checks["requestCreated"] &&
    report.checks["assignmentPresent"] &&
    report.checks["vendorPortalAccessProvisioned"] &&
    report.checks["completed"] &&
    report.checks["residentConfirmed"] &&
    report.checks["closed"] &&
    report.checks["timelineEvent"] &&
    report.checks["auditEvent"] &&
    report.checks["maintenanceReady"] &&
    report.assistantRecommendation === "Review your daily operations.";

  return (
    <section className="max-w-3xl space-y-4 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
      <div>
        <h2 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">
          LAUNCH-001 · J6 certification
        </h2>
        <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
          Verify resident request, prioritize, technician/vendor assignment, completion, resident
          confirmation, timeline, audit, and Mission Control → Review your daily operations.
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
          {loading ? "Loading…" : "Load J6 evidence"}
        </Button>
      </div>
      {error ? <p className="text-sm text-[#C0392B]">{error}</p> : null}
      {report ? (
        <div className="space-y-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={corePass ? "success" : "danger"}>
              {corePass ? "J6 evidence Pass" : "J6 evidence incomplete"}
            </Badge>
            <span className="text-[var(--mpa-color-text-secondary)]">
              Assistant: {report.assistantRecommendation}
            </span>
          </div>
          {report.vendorNote ? (
            <p className="text-xs text-[var(--mpa-color-text-secondary)]">{report.vendorNote}</p>
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
            <h3 className="font-medium">Work orders</h3>
            <ul className="mt-1 space-y-1 text-[var(--mpa-color-text-secondary)]">
              {report.workOrders.map((row) => (
                <li key={row.id}>
                  {row.id} · {row.title} · {row.status} · {row.assignee_type}
                </li>
              ))}
            </ul>
          </div>
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
