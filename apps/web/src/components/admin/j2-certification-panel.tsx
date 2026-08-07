"use client";

import { useState } from "react";
import { Badge, Button, Input } from "@mpa/ui";

type J2Report = {
  organizationId: string;
  checks: Record<string, boolean>;
  assistantRecommendation: string;
  emailNote?: string;
  invitations: Array<{ id: string; email: string; status: string; email_status: string | null; roles: string[] }>;
  memberships: Array<{ id: string; user_id: string; roles: string[] }>;
  timelineEvents: Array<{ id: string; event_type: string; created_at: string }>;
  auditEvents: Array<{ id: string; action: string; created_at: string }>;
};

export function J2CertificationPanel() {
  const [organizationId, setOrganizationId] = useState("");
  const [report, setReport] = useState<J2Report | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      const response = await fetch(
        `/api/admin/launch/j2?organizationId=${encodeURIComponent(organizationId.trim())}`
      );
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to load J2 evidence");
      }
      setReport(payload as J2Report);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load J2 evidence");
    } finally {
      setLoading(false);
    }
  }

  const corePass =
    report &&
    report.checks["invitationCreated"] &&
    report.checks["invitationAccepted"] &&
    report.checks["roleAssigned"] &&
    report.checks["teamReady"] &&
    report.checks["timelineEvent"] &&
    report.checks["auditEvent"] &&
    report.assistantRecommendation === "Add your first resident.";

  return (
    <section className="max-w-3xl space-y-4 rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-4">
      <div>
        <h2 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">
          LAUNCH-001 · J2 certification
        </h2>
        <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
          Verify invitation sent/accepted, role assignment, timeline, audit, and Mission Control
          progression to “Add your first resident.”
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
          {loading ? "Loading…" : "Load J2 evidence"}
        </Button>
      </div>
      {error ? <p className="text-sm text-[var(--mpa-color-status-danger)]">{error}</p> : null}
      {report ? (
        <div className="space-y-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={corePass ? "success" : "danger"}>
              {corePass ? "J2 evidence Pass" : "J2 evidence incomplete"}
            </Badge>
            <span className="text-[var(--mpa-color-text-secondary)]">
              Assistant: {report.assistantRecommendation}
            </span>
          </div>
          {report.emailNote ? (
            <p className="text-xs text-[var(--mpa-color-text-secondary)]">{report.emailNote}</p>
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
            <h3 className="font-medium">Invitations</h3>
            <ul className="mt-1 space-y-1 text-[var(--mpa-color-text-secondary)]">
              {report.invitations.map((invitation) => (
                <li key={invitation.id}>
                  {invitation.email} · {invitation.status} · email {invitation.email_status ?? "n/a"} ·{" "}
                  {invitation.roles.join(", ")}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-medium">Memberships</h3>
            <ul className="mt-1 space-y-1 text-[var(--mpa-color-text-secondary)]">
              {report.memberships.map((membership) => (
                <li key={membership.id}>
                  {membership.user_id} · {membership.roles.join(", ")}
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
