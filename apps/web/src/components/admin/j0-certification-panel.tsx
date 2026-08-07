"use client";

import { useState } from "react";
import { Badge, Button, Input } from "@mpa/ui";

type J0Report = {
  organizationId: string;
  checks: Record<string, boolean>;
  assistantRecommendation: string;
  note?: string;
  membershipCount: number;
  subscription: { sku_code: string; status: string } | null;
  setup: { completed_at: string | null } | null;
};

export function J0CertificationPanel() {
  const [organizationId, setOrganizationId] = useState("");
  const [report, setReport] = useState<J0Report | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      const response = await fetch(
        `/api/admin/launch/j0?organizationId=${encodeURIComponent(organizationId.trim())}`
      );
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to load J0 evidence");
      }
      setReport(payload as J0Report);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load J0 evidence");
    } finally {
      setLoading(false);
    }
  }

  const corePass =
    report &&
    report.checks["organizationCreated"] &&
    report.checks["propertyManagerSkuAssigned"] &&
    report.checks["setupComplete"] &&
    report.checks["trustedHomeReady"] &&
    report.assistantRecommendation === "Add your first property.";

  return (
    <section className="max-w-3xl space-y-4 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
      <div>
        <h2 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">
          LAUNCH-001 · J0 certification
        </h2>
        <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
          Verify organization, Property Manager SKU, Guided Setup complete, and trusted home next
          action (Add your first property).
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
          {loading ? "Loading…" : "Load J0 evidence"}
        </Button>
      </div>
      {error ? <p className="text-sm text-[#C0392B]">{error}</p> : null}
      {report ? (
        <div className="space-y-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={corePass ? "success" : "danger"}>
              {corePass ? "J0 evidence Pass" : "J0 evidence incomplete"}
            </Badge>
            <span className="text-[var(--mpa-color-text-secondary)]">
              SKU {report.subscription?.sku_code ?? "none"} · members {report.membershipCount} ·
              Assistant: {report.assistantRecommendation}
            </span>
          </div>
          {report.note ? (
            <p className="text-xs text-[var(--mpa-color-text-secondary)]">{report.note}</p>
          ) : null}
          <ul className="space-y-1">
            {Object.entries(report.checks).map(([key, value]) => (
              <li key={key} className="flex justify-between gap-3 border-b border-[var(--mpa-color-border-default)] py-1">
                <span>{key}</span>
                <Badge variant={value ? "success" : "danger"}>{value ? "yes" : "no"}</Badge>
              </li>
            ))}
          </ul>
          <p className="text-xs text-[var(--mpa-color-text-secondary)]">
            Setup completed_at: {report.setup?.completed_at ?? "not complete"}
          </p>
        </div>
      ) : null}
    </section>
  );
}
