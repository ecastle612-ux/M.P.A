"use client";

import { useState } from "react";
import { Badge, Button, Input } from "@mpa/ui";

type J1Report = {
  organizationId: string;
  setupComplete: boolean;
  propertyCount: number;
  properties: Array<{ id: string; name: string; status: string; created_at: string }>;
  timelineEvents: Array<{ id: string; event_type: string; created_at: string }>;
  auditEvents: Array<{ id: string; action: string; created_at: string }>;
  checks: Record<string, boolean>;
  assistantRecommendation: string;
};

export function J1CertificationPanel() {
  const [organizationId, setOrganizationId] = useState("");
  const [report, setReport] = useState<J1Report | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      const response = await fetch(
        `/api/admin/launch/j1?organizationId=${encodeURIComponent(organizationId.trim())}`
      );
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to load J1 evidence");
      }
      setReport(payload as J1Report);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load J1 evidence");
    } finally {
      setLoading(false);
    }
  }

  const allPass =
    report &&
    Object.values(report.checks).every(Boolean) &&
    report.assistantRecommendation === "Invite your team.";

  return (
    <section className="max-w-3xl space-y-4 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
      <div>
        <h2 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">
          LAUNCH-001 · J1 certification
        </h2>
        <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
          Verify property creation, timeline, audit, Mission Control progression, and Assistant
          recommendation for a cert organization.
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
          {loading ? "Loading…" : "Load J1 evidence"}
        </Button>
      </div>
      {error ? <p className="text-sm text-[#C0392B]">{error}</p> : null}
      {report ? (
        <div className="space-y-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={allPass ? "success" : "danger"}>
              {allPass ? "J1 evidence Pass" : "J1 evidence incomplete"}
            </Badge>
            <span className="text-[var(--mpa-color-text-secondary)]">
              {report.propertyCount} properties · Assistant: {report.assistantRecommendation}
            </span>
          </div>
          <ul className="space-y-1">
            {Object.entries(report.checks).map(([key, value]) => (
              <li key={key} className="flex justify-between gap-3 border-b border-[var(--mpa-color-border-default)] py-1">
                <span>{key}</span>
                <Badge variant={value ? "success" : "danger"}>{value ? "yes" : "no"}</Badge>
              </li>
            ))}
          </ul>
          <div>
            <h3 className="font-medium">Properties</h3>
            <ul className="mt-1 space-y-1 text-[var(--mpa-color-text-secondary)]">
              {report.properties.map((property) => (
                <li key={property.id}>
                  {property.name} · {property.status} · {property.id}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-medium">Timeline events</h3>
            <ul className="mt-1 space-y-1 text-[var(--mpa-color-text-secondary)]">
              {report.timelineEvents.map((event) => (
                <li key={event.id}>
                  {event.event_type} · {event.created_at}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-medium">Audit events</h3>
            <ul className="mt-1 space-y-1 text-[var(--mpa-color-text-secondary)]">
              {report.auditEvents.map((event) => (
                <li key={event.id}>
                  {event.action} · {event.created_at}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </section>
  );
}
