"use client";

import { useState } from "react";
import { Badge, Button, Input } from "@mpa/ui";

type Report = {
  checks: Record<string, boolean>;
  note?: string;
  readiness: {
    messageCount: number;
    notificationCount: number;
    communicationsReady: boolean;
  };
  financeNotificationCount: number;
  maintenanceNotificationCount: number;
};

export function CommunicationsCertificationPanel() {
  const [organizationId, setOrganizationId] = useState("");
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      const response = await fetch(
        `/api/admin/launch/communications?organizationId=${encodeURIComponent(organizationId.trim())}`
      );
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to load Communications evidence");
      }
      setReport(payload as Report);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load Communications evidence");
    } finally {
      setLoading(false);
    }
  }

  const corePass =
    report &&
    report.checks["communicationsRoute"] &&
    report.checks["sendResidentOwnerVendor"] &&
    report.checks["unifiedInbox"] &&
    report.readiness.communicationsReady;

  return (
    <section className="max-w-3xl space-y-4 rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-4">
      <div>
        <h2 className="text-base font-semibold">LAUNCH-001 · Communications remediation</h2>
        <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
          Verify send paths, unified inbox, history, timeline/audit, and reuse of
          Financial Operations / maintenance notices.
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
          {loading ? "Loading…" : "Load Communications evidence"}
        </Button>
      </div>
      {error ? <p className="text-sm text-[var(--mpa-color-status-danger)]">{error}</p> : null}
      {report ? (
        <div className="space-y-3 text-sm">
          <Badge variant={corePass ? "success" : "danger"}>
            {corePass ? "Communications evidence Pass" : "Communications evidence incomplete"}
          </Badge>
          {report.note ? (
            <p className="text-xs text-[var(--mpa-color-text-secondary)]">{report.note}</p>
          ) : null}
          <p className="text-xs text-[var(--mpa-color-text-secondary)]">
            Messages: {report.readiness.messageCount} · Comms notices:{" "}
            {report.readiness.notificationCount} · Financial Operations notices:{" "}
            {report.financeNotificationCount} · Maintenance notices:{" "}
            {report.maintenanceNotificationCount}
          </p>
          <ul className="space-y-1">
            {Object.entries(report.checks).map(([key, value]) => (
              <li key={key} className="flex justify-between gap-3 border-b border-[var(--mpa-color-border-default)] py-1">
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
